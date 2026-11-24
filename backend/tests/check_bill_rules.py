"""Tests ONLY bill_rules.py. No AI calls, no network, no quota used.
Run from the backend folder: python tests/check_bill_rules.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

import bill_rules  # noqa: E402

cases = json.load(open(os.path.join(HERE, "bill_cases.json"), encoding="utf-8"))
failures = []
passed = 0


def same(a, b):
    return abs(float(a) - float(b)) < 0.001


print(f"{'case':4s} {'verdict':18s} {'reading':>8s} {'extra':>6s} {'rs/unit':>8s}  issues")
for c in cases:
    got = bill_rules.analyze(**c["input"])
    codes = sorted(i["code"] for i in got["issues"])
    exp = c["expected"]
    problems = []
    if got["verdict"] != exp["verdict"]:
        problems.append(f"verdict {got['verdict']} != {exp['verdict']}")
    for key in ("reading_units", "extra_units", "cost_per_unit"):
        if not same(got[key], exp[key]):
            problems.append(f"{key} {got[key]} != {exp[key]}")
    if codes != sorted(exp["issue_codes"]):
        problems.append(f"issues {codes} != {sorted(exp['issue_codes'])}")
    print(f"{c['id']:4s} {got['verdict']:18s} {got['reading_units']:8g} {got['extra_units']:6g} "
          f"{got['cost_per_unit']:8.1f}  {','.join(codes) or '-'}   {'PASS' if not problems else 'FAIL'}")
    if problems:
        failures.append((c["id"], problems))
    else:
        passed += 1

# ---- a few extra edge cases, written in code
print("\nextra edge cases")
base = dict(previous_reading=0, amount=1000)


def extra(name, ok, detail=""):
    global passed
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
    if ok:
        passed += 1
    else:
        failures.append((name, [detail]))


r = bill_rules.analyze(current_reading=100, units_billed=106, **base)
extra("6 extra units is a mismatch and likely_overbilled", r["verdict"] == "likely_overbilled" and r["extra_units"] == 6)
r = bill_rules.analyze(current_reading=100, units_billed=80, **base)
codes = [i["code"] for i in r["issues"]]
extra("billed LESS than the meter: units_mismatch but only 'check'", r["verdict"] == "check" and codes == ["units_mismatch"] and r["extra_units"] == -20)
r = bill_rules.analyze(current_reading=0, units_billed=0, **base)
extra("0 units: no divide-by-zero, cost 0", r["cost_per_unit"] == 0.0 and r["verdict"] == "looks_ok")
r = bill_rules.analyze(current_reading=179, units_billed=179, **base)
extra("179 units: no near_200 warning", not r["issues"])
r = bill_rules.analyze(current_reading=180, units_billed=180, **base)
extra("180 units: near_200 warning", [i["code"] for i in r["issues"]] == ["near_200"])
r = bill_rules.analyze(current_reading=100, units_billed=100, last_month_units=0, **base)
extra("last month 0 units: no jump (no divide-by-zero)", not r["issues"])
r = bill_rules.analyze(current_reading=150, units_billed=150, last_month_units=107, **base)
extra("150 vs 107 is +40.2 percent: sudden_jump", [i["code"] for i in r["issues"]] == ["sudden_jump"])
r = bill_rules.analyze(current_reading=150, units_billed=150, last_month_units=107, lang="ur", **base)
extra("Urdu messages are in Urdu script", any("؀" <= ch <= "ۿ" for ch in r["issues"][0]["message"]))
r = bill_rules.analyze(current_reading=150, units_billed=150, last_month_units=107, lang="en", **base)
extra("English messages have no Urdu letters", not any("؀" <= ch <= "ۿ" for ch in r["issues"][0]["message"]))
text = " ".join(m for lang in bill_rules.MESSAGES.values() for m in lang.values()) + " ".join(bill_rules.FALLBACK_TIPS["en"])
extra("no emojis in the messages", all(ord(ch) < 0x2190 or 0x0600 <= ord(ch) <= 0x06ff or ord(ch) in (0x2019,) for ch in text))

total = len(cases) + 10
print(f"\n{passed}/{total} passed")
if failures:
    print("FAILURES:")
    for name, problems in failures:
        print(" ", name, problems)
sys.exit(0 if not failures else 1)
