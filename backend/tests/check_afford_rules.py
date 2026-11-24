"""Tests ONLY afford_rules.py. No AI calls, no network, no quota used.
Run from the backend folder: python tests/check_afford_rules.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

import afford_rules  # noqa: E402

cases = json.load(open(os.path.join(HERE, "afford_cases.json"), encoding="utf-8"))
failures = []
passed = 0

print(f"{'case':4s} {'verdict':8s} {'remaining':>9s} {'safe':>7s} {'needed':>7s} {'weekly':>7s} {'weeks':>5s}  after_salary")
for c in cases:
    got = afford_rules.analyze(**c["input"])
    exp = c["expected"]
    problems = [f"{k}: got {got[k]!r}, expected {v!r}" for k, v in exp.items() if got[k] != v]
    print(f"{c['id']:4s} {got['verdict']:8s} {got['remaining']:9d} {got['safe_to_spend']:7d} {got['needed_until_month_end']:7d} "
          f"{got['weekly_saving']:7d} {got['weeks_to_save']:5d}  {str(got['after_salary']):5s}  {'PASS' if not problems else 'FAIL'}")
    if problems:
        failures.append((c["id"], problems))
    else:
        passed += 1

print("\nextra edge cases")
base = dict(monthly_income=50000, spent_this_month=20000, avg_daily_spend=800)


def extra(name, ok, detail=""):
    global passed
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
    if ok:
        passed += 1
    else:
        failures.append((name, [detail]))


r = afford_rules.analyze(price=3000, days_left_in_month=10, savings_goal_monthly=20000, **base)
extra("savings_goal_monthly does not change the math", r["verdict"] == "yes" and r["safe_to_spend"] == 17000)
r = afford_rules.analyze(price=3000, days_left_in_month=0, **base)
extra("0 days left: needed is 0 and safe_to_spend is 25000", r["needed_until_month_end"] == 0 and r["safe_to_spend"] == 25000)
r = afford_rules.analyze(price=3000, days_left_in_month=10, upcoming_bills_estimate=None, **base)
extra("no upcoming bills (None) is fine", r["needed_until_month_end"] == 8000)
r = afford_rules.analyze(price=100000, days_left_in_month=10, **base)
extra("a very large price still returns weeks (100000 / 1162.8 = 86)", r["verdict"] == "not_now" and r["weeks_to_save"] == 86, str(r["weeks_to_save"]))

r = afford_rules.analyze(price=50000, days_left_in_month=10, monthly_income=30000, spent_this_month=10000, avg_daily_spend=500)
en_e, en_s = afford_rules.fallback_explanation(r, "laptop", "en"), afford_rules.fallback_suggestion(r, "en")
ur_e, ur_s = afford_rules.fallback_explanation(r, "laptop", "ur"), afford_rules.fallback_suggestion(r, "ur")
has_urdu = lambda s: any("؀" <= ch <= "ۿ" for ch in s)
extra("English templates: numbers filled in, no Urdu letters", "Rs 50,000" in en_e and "Rs 698" in en_s and "72 weeks" in en_s and not has_urdu(en_e + en_s))
extra("Urdu templates: Urdu script with the same numbers", has_urdu(ur_e) and "50,000" in ur_e and "698" in ur_s and "72" in ur_s)
every = " ".join([en_e, en_s, ur_e, ur_s])
extra("no emojis in the template texts", all(ord(ch) < 0x2190 or 0x0600 <= ord(ch) <= 0x06ff for ch in every))

total = len(cases) + 7
print(f"\n{passed}/{total} passed")
if failures:
    print("FAILURES:")
    for name, problems in failures:
        print(" ", name, problems)
sys.exit(0 if not failures else 1)
