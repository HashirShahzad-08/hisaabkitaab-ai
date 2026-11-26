"""Checks only the plain rules (no AI, no network, no quota used).
Run from the backend folder (the .venv must be active): python tests/check_rules.py
Exits with code 1 if anything fails.

"Scam by rules" means the rules found a STRONG red flag, so they say scam even if the AI disagrees.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

import rules  # noqa: E402

failures = 0


def check(name: str, ok: bool, detail: str = "", show: bool = True):
    global failures
    if not ok:
        failures += 1
    if show or not ok:
        print(("ok  " if ok else "BAD ") + name + (f"  [{detail}]" if detail else ""))


FILES = [sys.argv[1]] if len(sys.argv) > 1 else ["eval_cases.json", "holdout_cases.json", "trap_cases.json"]

for file in FILES:
    cases = json.load(open(os.path.join(HERE, file), encoding="utf-8"))
    sms = [c for c in cases if c["kind"] == "sms"]
    print(f"--- scam rules: {file} ({len(sms)} SMS cases)")
    bad = 0
    for c in sms:
        result = rules.check_scam(c["text"])
        expected = c["expected"]["isScam"]
        if bool(result.strong) != expected:
            bad += 1
            check(f"{'MISSED SCAM' if expected else 'FALSE ALARM'} {c['id']} {result.flags} | {c['text'][:80]}", False)
    print(f"mistakes: {bad} of {len(sms)}")

    print(f"--- amounts: {file} (first amount found vs expected)")
    count, before = 0, failures
    for c in cases:
        if c["kind"] == "sms" and not c["expected"]["isScam"] and "amount" in c["expected"]:
            found = [v for _, v in rules.extract_amounts(c["text"])]
            want = c["expected"]["amount"]
            count += 1
            check(f"{c['id']} {found} expected {want}", bool(found) and found[0] == want, show=False)
        elif c["kind"] == "quick":
            found = [v for _, v in rules.extract_amounts(c["text"], allow_bare=True, skip_balances=False)]
            want = [t["amount"] for t in c["expected"]["transactions"]]
            count += 1
            check(f"{c['id']} {found} expected {want}", found == want, show=False)
    print(f"mistakes: {failures - before} of {count}")

if len(sys.argv) <= 1:
    print("--- amounts written in words")
    WORD_AMOUNTS = [
        ("do hazaar paanch sau", [2500]),
        ("do sau pachas", [250]),
        ("saadhe teen sau", [350]),
        ("paune do hazaar", [1750]),
        ("sawa do sau", [225]),
        ("sawa lakh", [125000]),
        ("dhai sau ki chai", [250]),
        ("dedh hazaar ki dawai", [1500]),
        ("bees hazaar kiraya", [20000]),
        ("pachas rupay", [50]),
        ("aaj pachas ka doodh", [50]),
        ("ek crore", [10000000]),
        ("do karor pachas lakh", [25000000]),
        ("2 hazaar paanch sau", [2500]),
        ("پانچ سو کا لوڈ", [500]),
        ("ساڑھے تین سو", [350]),
        ("دو ہزار پانچ سو", [2500]),
        ("aaj 800 ka petrol aur do sau ka doodh", [800, 200]),
        ("do din mein 500 diye", [500]),
    ]
    for text, want in WORD_AMOUNTS:
        found = [v for _, v in rules.extract_amounts(text, allow_bare=True, skip_balances=False)]
        check(f"{text} -> {found}", found == want, f"expected {want}")
    check("'paanch sau do' is marked unsure (the AI amount is kept)",
          rules.unsure_amounts("mujhe paanch sau do", True, False) == [500])
    check("a complete amount is not marked unsure", rules.unsure_amounts("do sau pachas ka doodh", True, False) == [])

    print("--- Urdu income and expense words")
    check("'family' does not count as 'received'", rules.guess_type("فیملی کو پیسے بھیجے") == "expense")
    check("'bheje' (Urdu) is an expense", rules.guess_type("امی کو پیسے بھیجے") == "expense")
    check("'mili' (Urdu) is income", rules.guess_type("مجھے تنخواہ ملی۔") == "income")
    check("'family' alone gives no type", rules.guess_type("فیملی کا کھانا") is None)

    print("--- one weak flag does not overrule the AI; derived flags do not count for the fast path")
    weak = rules.check_scam("Offer: details at http://bit.ly/abc")
    check("a short link alone is weak", weak.flags == ["link"] and weak.strong == [], str(weak))
    parcel = rules.check_scam("Your parcel is waiting. See http://bit.ly/abc")
    check("courier is derived from the link", "courier" in parcel.flags and parcel.independent == ["link"], str(parcel))

    print("--- input validation, settings and limits")
    from pydantic import ValidationError  # noqa: E402

    import config  # noqa: E402
    import rate_limit  # noqa: E402
    from models import AffordRequest, SmsResult, TextRequest  # noqa: E402

    def rejected(build) -> bool:
        try:
            build()
        except ValidationError:
            return True
        return False

    check("today 2026-02-30 is rejected", rejected(lambda: TextRequest(text="hi", today="2026-02-30")))
    check("blank text is rejected", rejected(lambda: TextRequest(text="   ", today="2026-11-23")))
    check("text is stripped", TextRequest(text="  hi  ", today="2026-11-23").text == "hi")
    check("blank item is rejected", rejected(lambda: AffordRequest(
        item="  ", price=1, today="2026-11-23", monthly_income=1, spent_this_month=0, days_left_in_month=1, avg_daily_spend=0)))
    for value in (float("inf"), float("nan")):
        check(f"amount {value} is rejected", rejected(lambda: SmsResult(
            amount=value, type="expense", category="Other", paymentType="Cash", date="2026-11-23", isScam=False)))
    saved = os.environ.get("ENV")
    import importlib

    for value, want in ((None, "production"), ("", "production"), ("prod", "production"), ("development", "development")):
        # .env must not decide this test: set the variable ourselves (an empty one still counts as set)
        os.environ["ENV"] = value or ""
        importlib.reload(config)
        check(f"ENV={value!r} means {want}", config.ENV == want)
    if saved is None:
        os.environ.pop("ENV", None)
    else:
        os.environ["ENV"] = saved

    def limited(call) -> bool:
        try:
            call()
        except rate_limit.RateLimited:
            return True
        return False

    rate_limit.reset()
    for i in range(8):
        rate_limit.check("u1", now=1000 + i)
    check("9th request in a minute is limited", limited(lambda: rate_limit.check("u1", now=1010)))
    rate_limit.reset()
    for i in range(20):
        rate_limit.check("u1", now=1000 + i * 61)
    check("21st request in a day is limited", limited(lambda: rate_limit.check("u1", now=1000 + 20 * 61)))
    rate_limit.reset()
    for i in range(150):
        rate_limit.use_global_call(now=1000 + i)
    check("151st AI call of the day (all users) is limited", limited(lambda: rate_limit.use_global_call(now=2000)))
    rate_limit.reset()

print(f"\n{'ALL PASSED' if failures == 0 else f'{failures} FAILED'}")
sys.exit(1 if failures else 0)
