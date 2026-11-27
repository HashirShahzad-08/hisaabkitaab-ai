"""Checks the finishing of AI texts (digits, commas, the afford tip) with a fake AI. No network, no quota.
Run from the backend folder (the .venv must be active): python tests/check_text.py
Exits with code 1 if anything fails.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

import pipeline  # noqa: E402
from models import AffordAiText, AffordRequest, BillAiText, BillRequest  # noqa: E402
from text_format import format_numbers  # noqa: E402

failures = passed = 0


def check(name: str, ok: bool, detail: str = ""):
    global failures, passed
    failures += not ok
    passed += ok
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  [{detail}]"))


for text, want in [
    ("The price is 500000.", "The price is 500,000."),
    ("It costs Rs 3023 now", "It costs Rs 3,023 now"),
    ("Rs.12000, then 4500 more", "Rs.12,000, then 4,500 more"),
    ("قیمت ۵۰۰۰۰۰ روپے ہے", "قیمت 500,000 روپے ہے"),
    ("Already 500,000 and 1,00,000", "Already 500,000 and 1,00,000"),
    ("Bill of October 2026 (2026-10)", "Bill of October 2026 (2026-10)"),
    ("You pay Rs 2026 or 2000 روپے", "You pay Rs 2,026 or 2,000 روپے"),
    ("Call 0800-55055 or 03001234567", "Call 0800-55055 or 03001234567"),
    ("A 5000mAh battery, 999 units, 41.7 per unit", "A 5000mAh battery, 999 units, 41.7 per unit"),
    ("You are -10500 short", "You are -10,500 short"),
]:
    got = format_numbers(text)
    check(f"{text} -> {got}", got == want, f"expected {want}")
check("the item name is left as written",
      format_numbers("Nokia 3310 costs 8500", keep="Nokia 3310") == "Nokia 3310 costs 8,500")

reply = {}
pipeline.ask_ai = lambda prompt, schema: schema(**reply)

# ---- afford
request = AffordRequest(item="laptop", price=500000, today="2026-11-27", monthly_income=50000,
                        spent_this_month=46000, days_left_in_month=3, avg_daily_spend=3500)
reply = {"explanation": "A laptop at 500000 is too much. You have Rs 4000 left.", "suggestion": "Look for a used laptop."}
result = pipeline.afford(request)
check("AI explanation gets commas", result.explanation == "A laptop at 500,000 is too much. You have Rs 4,000 left.",
      result.explanation)
reply = {"explanation": "A laptop at 500,000 is too much.", "suggestion": "Look for a used laptop."}
check("the number guard accepts commas", pipeline.afford(request).explanation == "A laptop at 500,000 is too much.")
reply = {"explanation": "It costs 777777.", "suggestion": "Look for a used laptop."}
check("an invented number is still rejected", "777" not in pipeline.afford(request).explanation)
for bad in (f"Save {result.weekly_saving:.0f} a week.", f"Save for {result.weeks_to_save} weeks."):
    reply = {"explanation": "Too much now.", "suggestion": bad}
    got = pipeline.afford(request).suggestion
    check(f"a suggestion repeating the plan is replaced: {bad}", got != bad and str(result.weeks_to_save) not in got, got)
for lang in ("en", "ur"):
    reply = {"explanation": "", "suggestion": ""}
    got = pipeline.afford(request.model_copy(update={"lang": lang})).suggestion
    check(f"{lang} backup tip has no weekly amount or weeks", bool(got) and not any(ch.isdigit() for ch in got), got)
prompt = pipeline.afford_prompt({"verdict": "not_now"}, "en")
check("the prompt asks for no weekly amount or weeks", "do NOT mention a weekly saving amount or a number of weeks" in prompt)

# ---- bill
bill = BillRequest(bill_month="2026-10", previous_reading=41310, current_reading=41500, units_billed=235,
                   amount=9800, company="IESCO")
reply = {"explanation": "Your bill is Rs 9800 for 235 units.", "tips": ["Use LED bulbs."],
         "complaint": "For October 2026 my readings are 41310 and 41500."}
result = pipeline.analyze_bill(bill)
check("bill explanation gets commas", result.explanation == "Your bill is Rs 9,800 for 235 units.", result.explanation)
check("complaint gets commas but the year stays",
      result.complaint == "For October 2026 my readings are 41,310 and 41,500.", result.complaint)

# ---- reading typo, both languages
for lang in ("en", "ur"):
    reply = {"explanation": "", "tips": [], "complaint": ""}
    typo = pipeline.analyze_bill(bill.model_copy(update={"lang": lang, "current_reading": 141500}))
    messages = [i.message for i in typo.issues if i.code == "reading_typo"]
    check(f"{lang}: typo gives verdict check, a message, no complaint",
          typo.verdict == "check" and len(messages) == 1 and typo.complaint == "", str(typo.verdict))
    print("     ", messages[0] if messages else "(no message)")

print(f"\n{passed}/{passed + failures} passed")
sys.exit(1 if failures else 0)
