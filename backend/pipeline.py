"""Hybrid AI + rules.

1. The AI reads the message and gives its answer.
2. rules.py double-checks the parts that code can do better than an AI:
   dates, amounts, payment type, income vs expense, category keywords and scam red flags.
3. Where they disagree, the rules win (or the AI wins when the rules have no evidence),
   and the confidence goes down.

confidence:
  high   AI and rules agree on everything
  medium one thing had to be corrected
  low    two or more things disagreed, or the amount could not be confirmed
"""
import logging
import os
import re
from datetime import date, timedelta
from typing import List, Optional

import rules
from ai_client import AIError, ask_ai
from models import QuickEntryResult, SmsResult, Transaction
from prompts import quick_entry_prompt, sms_prompt

log = logging.getLogger("uvicorn.error")

# Set HYBRID_RULES=off only to measure the AI on its own (tests/run_eval.py). Normal use: leave it unset.
RULES_ON = os.getenv("HYBRID_RULES", "on").lower() != "off"

# How many different strong red flags are needed to skip the AI and answer "scam" straight away.
FAST_SCAM_MIN_FLAGS = 2

_CLAUSE_SPLIT = re.compile(r"\b(?:aur|and|phir|then|plus)\b|[,;،.\n]|اور", re.I)


def _confidence(disagreements: int, amount_ok: bool = True) -> str:
    if not amount_ok or disagreements >= 2:
        return "low"
    return "medium" if disagreements == 1 else "high"


# ======================================================================= /parse-sms
def parse_sms(text: str, lang: str, today: str) -> SmsResult:
    today_date = rules.parse_today(today)
    flags = rules.scam_flags(text)

    # Fast path: two or more strong red flags (for example "pay a fee" + "send your OTP") is a scam for sure.
    # Answer from the rules right away: no AI call, so it is instant and uses no AI quota.
    if RULES_ON and len(flags) >= FAST_SCAM_MIN_FLAGS:
        log.info("fast path: scam answered by rules only, no AI call. flags=%s", flags)
        return SmsResult(
            amount=0, type="expense", category="Other", paymentType="Cash", merchant="",
            date=today, isScam=True, scamReason=rules.scam_reason(flags, lang), confidence="high",
        )

    try:
        ai: Optional[SmsResult] = ask_ai(sms_prompt(text, lang, today), SmsResult)
        ai_error = None
    except AIError as e:
        ai, ai_error = None, e

    # Safety net: if the AI is down but the rules see a scam, still warn the user.
    if ai is None:
        if flags and RULES_ON:
            log.warning("AI failed, answering from scam rules only: %s", flags)
            return SmsResult(
                amount=0, type="expense", category="Other", paymentType="Cash", merchant="",
                date=today, isScam=True, scamReason=rules.scam_reason(flags, lang), confidence="low",
            )
        raise ai_error

    if not RULES_ON:
        return ai

    disagreements = 0
    notes: List[str] = []

    # ---- scam: rules can raise it; a plain receipt can cancel an AI false alarm
    is_scam = bool(flags) or ai.isScam
    if ai.isScam and not flags and rules.looks_like_plain_confirmation(text):
        is_scam = False
        notes.append("AI scam alarm cancelled: plain receipt with no red flags")
    if is_scam != ai.isScam:
        disagreements += 1
        notes.append(f"scam: AI={ai.isScam} final={is_scam} flags={flags}")
    reason = ""
    if is_scam:
        reason = (ai.scamReason or "").strip() if ai.isScam else ""
        if not reason:
            reason = rules.scam_reason(flags, lang)

    # ---- amount: regex first, cross-check with the AI
    candidates = [v for _, v in rules.extract_amounts(text)]
    amount, amount_ok = ai.amount, True
    if candidates:
        if not any(abs(ai.amount - c) < 0.5 for c in candidates):
            amount = candidates[0]
            disagreements += 1
            notes.append(f"amount: AI={ai.amount} regex={candidates}")
    elif ai.amount <= 0 and not is_scam:
        amount_ok = False

    # ---- type
    tx_type = ai.type
    guessed_type = rules.guess_type(text)
    if guessed_type and guessed_type != ai.type:
        tx_type = guessed_type
        disagreements += 1
        notes.append(f"type: AI={ai.type} rules={guessed_type}")

    # ---- payment type
    payment = ai.paymentType
    guessed_pay = rules.guess_payment(text)
    if guessed_pay and guessed_pay != ai.paymentType:
        payment = guessed_pay
        disagreements += 1
        notes.append(f"paymentType: AI={ai.paymentType} rules={guessed_pay}")

    # ---- category: keywords only step in when the AI said Other
    category = ai.category
    if category == "Other":
        guessed_cat = rules.guess_category(f"{text} {ai.merchant}")
        if guessed_cat:
            category = guessed_cat
            notes.append(f"category: AI=Other rules={guessed_cat}")
        elif tx_type == "income" and rules.strong_income(text):
            category = "Income"
            notes.append("category: AI=Other rules=Income")
    if category == "Shopping" and rules.is_grocery(f"{text} {ai.merchant}"):
        category = "Food"
        notes.append("category: AI=Shopping rules=Food (supermarket)")
    if tx_type == "income" and category not in ("Income", "Family", "Other"):
        category = "Income"  # an income can not be "Food" or "Bills"

    # ---- date: worked out in code. A written date wins, then aaj/kal/parson, else today.
    written = rules.explicit_date(text)
    markers = rules.relative_markers(text, today_date)
    final_date = written or (markers[0][1] if markers else today_date)

    result = SmsResult(
        amount=amount, type=tx_type, category=category, paymentType=payment,
        merchant=ai.merchant or "", date=final_date.isoformat(),
        isScam=is_scam, scamReason=reason, confidence=_confidence(disagreements, amount_ok),
    )
    if notes:
        log.info("parse-sms corrections (%s): %s", result.confidence, " | ".join(notes))
    return result


# ======================================================================= /quick-entry
def _clauses(text: str):
    """[(start, end, clause_text)] for each part of the sentence (split on aur / and / commas)."""
    out, pos = [], 0
    for m in _CLAUSE_SPLIT.finditer(text):
        out.append((pos, m.start(), text[pos:m.start()]))
        pos = m.end()
    out.append((pos, len(text), text[pos:]))
    return out


def _clause_for(position: int, parts) -> str:
    for start, end, clause in parts:
        if start <= position <= end:
            return clause
    return ""


def _date_for_item(position: Optional[int], ai_date: str, markers, today_date: date, written: Optional[date]) -> date:
    if written:
        return written
    if not markers:
        return today_date
    distinct = {d for _, d in markers}
    if len(distinct) == 1:
        return markers[0][1]
    # Several day words (for example "kal ... aur aaj ..."): trust the AI if it chose one of them,
    # otherwise use the closest day word before the amount.
    if ai_date in {d.isoformat() for d in distinct}:
        return date.fromisoformat(ai_date)
    if position is not None:
        before = [d for p, d in markers if p <= position]
        if before:
            return before[-1]
    return markers[0][1]


def quick_entry(text: str, lang: str, today: str) -> QuickEntryResult:
    today_date = rules.parse_today(today)
    ai = ask_ai(quick_entry_prompt(text, lang, today), QuickEntryResult)
    if not RULES_ON:
        return ai

    found = rules.extract_amounts(text, allow_bare=True, skip_balances=False)  # [(position, amount)]
    cand_values = [v for _, v in found]
    markers = rules.relative_markers(text, today_date)
    written = rules.explicit_date(text)
    parts = _clauses(text)
    items = list(ai.transactions)

    # The AI found nothing but the text clearly has amounts: build the entries from the rules.
    if not items and found:
        items = [
            Transaction(amount=v, type="expense", category="Other", paymentType="Cash",
                        date=today, note="", confidence="low")
            for _, v in found
        ]

    final: List[Transaction] = []
    for i, item in enumerate(items):
        disagreements = 0
        notes: List[str] = []

        # ---- amount: regex first, cross-check with the AI
        amount, amount_ok = item.amount, True
        if cand_values:
            if not any(abs(item.amount - c) < 0.5 for c in cand_values):
                if len(items) == len(cand_values):
                    amount = cand_values[i]
                    disagreements += 1
                    notes.append(f"amount: AI={item.amount} regex={cand_values[i]}")
                else:
                    amount_ok = False
        position = next((p for p, v in found if abs(v - amount) < 0.5), None)
        clause = _clause_for(position, parts) if position is not None else text

        # ---- type: clear income words only
        tx_type = item.type
        if tx_type == "expense" and rules.strong_income(clause):
            tx_type = "income"
            disagreements += 1
            notes.append("type: expense -> income (income word in the sentence)")

        # ---- payment type: words in this part of the sentence, else a single mention in the whole text
        payment = item.paymentType
        guessed = rules.guess_payment_quick(clause)
        if not guessed:
            overall = {g for g in (rules.guess_payment(text),) if g}
            guessed = next(iter(overall)) if len(overall) == 1 and len(items) == 1 else None
        if guessed and guessed != item.paymentType:
            payment = guessed
            disagreements += 1
            notes.append(f"paymentType: AI={item.paymentType} rules={guessed}")

        # ---- category: keywords step in when the AI said Other
        category = item.category
        if category == "Other":
            guessed_cat = rules.guess_category(f"{clause} {item.note} {item.merchant}")
            if guessed_cat:
                category = guessed_cat
                notes.append(f"category: AI=Other rules={guessed_cat}")
        if category == "Shopping" and rules.is_grocery(f"{clause} {item.note} {item.merchant}"):
            category = "Food"
        if tx_type == "income" and category not in ("Income", "Family", "Other"):
            category = "Income"

        # ---- date: aaj / kal / parson in code
        final_date = _date_for_item(position, item.date, markers, today_date, written)

        confidence = _confidence(disagreements, amount_ok)
        if item.confidence == "low":
            confidence = "low"
        if notes:
            log.info("quick-entry item %d corrections (%s): %s", i + 1, confidence, " | ".join(notes))
        final.append(
            Transaction(
                amount=amount, type=tx_type, category=category, paymentType=payment,
                merchant=item.merchant or "", date=final_date.isoformat(), note=item.note or "",
                confidence=confidence,
            )
        )
    return QuickEntryResult(transactions=final)
