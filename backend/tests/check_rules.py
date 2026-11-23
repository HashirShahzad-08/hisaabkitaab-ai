"""Checks only the plain rules (no AI, no network, no quota used).
Run from the backend folder: python tests/check_rules.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

import rules  # noqa: E402

FILE = sys.argv[1] if len(sys.argv) > 1 else "eval_cases.json"
cases = json.load(open(os.path.join(HERE, FILE), encoding="utf-8"))

print("--- scam rules on the 30 SMS cases")
bad = 0
for c in cases:
    if c["kind"] != "sms":
        continue
    flags = rules.scam_flags(c["text"])
    expected = c["expected"]["isScam"]
    if bool(flags) != expected:
        bad += 1
        print("MISSED SCAM" if expected else "FALSE ALARM", c["id"], flags, "|", c["text"][:90])
print("mistakes:", bad, "of", sum(1 for c in cases if c["kind"] == "sms"))

print("--- amounts (first amount found vs expected)")
for c in cases:
    if c["kind"] == "sms" and not c["expected"]["isScam"] and "amount" in c["expected"]:
        found = [v for _, v in rules.extract_amounts(c["text"])]
        want = c["expected"]["amount"]
        print("ok " if found and found[0] == want else "BAD", c["id"], found, "expected", want)
    elif c["kind"] == "quick":
        found = [v for _, v in rules.extract_amounts(c["text"], allow_bare=True, skip_balances=False)]
        want = [t["amount"] for t in c["expected"]["transactions"]]
        print("ok " if found == want else "BAD", c["id"], found, "expected", want)
