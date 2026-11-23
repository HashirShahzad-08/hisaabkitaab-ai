"""Measures how accurate /parse-sms and /quick-entry are.

Run from the backend folder (the .venv must be active):
    python tests/run_eval.py                      all cases in eval_cases.json
    python tests/run_eval.py --file holdout_cases.json
    python tests/run_eval.py --only quick         only quick-entry cases
    python tests/run_eval.py --ids n01,s03,q02    only these cases
    python tests/run_eval.py --url http://127.0.0.1:8000    test a running server instead

It sleeps between calls so Groq's free limit (30 requests a minute) is respected,
and waits and retries if the AI says "too many requests".
"""
import argparse
import json
import os
import sys
import time
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

FIELDS = ["amount", "type", "category", "paymentType", "date"]
SMS_FIELDS = FIELDS
QUICK_FIELDS = FIELDS


def make_caller(url):
    """Returns post(path, body) -> (status_code, json)."""
    if url:
        import httpx

        def post(path, body):
            r = httpx.post(url.rstrip("/") + path, json=body, timeout=120)
            return r.status_code, r.json()

        return post

    from fastapi.testclient import TestClient
    import main

    client = TestClient(main.app)

    def post(path, body):
        r = client.post(path, json=body)
        return r.status_code, r.json()

    return post


def call_with_patience(post, path, body, quota_waits):
    for attempt in range(5):
        status, data = post(path, body)
        is_quota = status in (429, 503) and isinstance(data, dict) and data.get("code") == "ai_quota"
        if not is_quota:
            return status, data
        quota_waits.append(1)
        wait = 20 * (attempt + 1)
        print(f"      (rate limit, waiting {wait}s)", flush=True)
        time.sleep(wait)
    return status, data


def same(field, expected, got):
    if field == "amount":
        try:
            return abs(float(expected) - float(got)) < 0.5
        except (TypeError, ValueError):
            return False
    return expected == got


def score_sms(case, status, data, stats, failures):
    exp = case["expected"]
    if status != 200:
        failures.append((case["id"], "http", "200", f"{status} {str(data)[:90]}", case["text"]))
        stats["scam"]["errors"] += 1
        return
    got_scam = bool(data.get("isScam"))
    stats["scam"]["total"] += 1
    if got_scam == exp["isScam"]:
        stats["scam"]["correct"] += 1
    elif got_scam:
        stats["scam"]["false_pos"] += 1
        failures.append((case["id"], "isScam", "False", "True", case["text"]))
    else:
        stats["scam"]["false_neg"] += 1
        failures.append((case["id"], "isScam", "True", "False", case["text"]))

    if exp["isScam"]:
        # a scam must also come with a reason
        if got_scam and not (data.get("scamReason") or "").strip():
            failures.append((case["id"], "scamReason", "text", "(empty)", case["text"]))
        return
    for f in SMS_FIELDS:
        if f not in exp:
            continue  # trap cases only score isScam
        stats["fields"][f]["total"] += 1
        if same(f, exp[f], data.get(f)):
            stats["fields"][f]["correct"] += 1
        else:
            failures.append((case["id"], f, exp[f], data.get(f), case["text"]))
    stats["confidence"][data.get("confidence", "?")] += 1


def score_quick(case, status, data, stats, failures):
    expected = sorted(case["expected"]["transactions"], key=lambda t: t["amount"])
    if status != 200:
        failures.append((case["id"], "http", "200", f"{status} {str(data)[:90]}", case["text"]))
        for f in QUICK_FIELDS:
            stats["fields"][f]["total"] += len(expected)
        return
    got = sorted(data.get("transactions", []), key=lambda t: t["amount"])
    pool = list(got)
    stats["items"]["total"] += len(expected)
    for exp in expected:
        match = next((g for g in pool if abs(g["amount"] - exp["amount"]) < 0.5), None)
        if match is None:
            stats["items"]["missed"] += 1
            for f in QUICK_FIELDS:
                stats["fields"][f]["total"] += 1
            failures.append((case["id"], "item", f"amount {exp['amount']}", "missing", case["text"]))
            continue
        pool.remove(match)
        stats["items"]["found"] += 1
        stats["confidence"][match.get("confidence", "?")] += 1
        for f in QUICK_FIELDS:
            stats["fields"][f]["total"] += 1
            if same(f, exp[f], match.get(f)):
                stats["fields"][f]["correct"] += 1
            else:
                failures.append((case["id"], f, exp[f], match.get(f), case["text"]))
    if pool:
        stats["items"]["extra"] += len(pool)
        failures.append((case["id"], "extra", "-", f"{[g['amount'] for g in pool]}", case["text"]))


def pct(a, b):
    return f"{100 * a / b:5.1f}%" if b else "  n/a"


def new_stats():
    return {"scam": Counter(), "fields": defaultdict(Counter), "items": Counter(), "confidence": Counter()}


def report(label, stats, failures, cases, quota_waits):
    print("\n" + "=" * 64)
    print(f"RESULTS: {label}")
    print("=" * 64)
    s = stats["scam"]
    n_total = s["total"] + s["errors"]
    if n_total:
        n_scam = sum(1 for c in cases if c["kind"] == "sms" and c["expected"]["isScam"])
        n_norm = sum(1 for c in cases if c["kind"] == "sms" and not c["expected"]["isScam"])
        print(f"Scam detection accuracy : {pct(s['correct'], n_total)}  ({s['correct']}/{n_total})")
        print(f"  false positives       : {s['false_pos']}  (normal SMS flagged as scam, out of {n_norm})")
        print(f"  false negatives       : {s['false_neg']}  (scam SMS missed, out of {n_scam})")
    print("\nField accuracy (normal SMS + quick-entry items):")
    total_ok = total_all = 0
    for f in FIELDS:
        c = stats["fields"][f]
        total_ok += c["correct"]
        total_all += c["total"]
        print(f"  {f:12s} {pct(c['correct'], c['total'])}  ({c['correct']}/{c['total']})")
    print(f"  {'OVERALL':12s} {pct(total_ok, total_all)}  ({total_ok}/{total_all})")
    if stats["items"]["total"]:
        i = stats["items"]
        print(f"\nQuick-entry items found : {i['found']}/{i['total']}  (missed {i['missed']}, extra {i['extra']})")
    print(f"Confidence of answers   : {dict(stats['confidence'])}")
    if quota_waits:
        print(f"Rate-limit waits        : {len(quota_waits)}")

    if failures:
        print("\nFAILURES")
        print(f"{'case':5s} {'field':12s} {'expected':16s} {'got':28s} text")
        for cid, field, expected, got, text in failures:
            print(f"{cid:5s} {field:12s} {str(expected)[:16]:16s} {str(got)[:28]:28s} {text[:60]!r}")
    else:
        print("\nNo failures.")

    scam_ok = (s["correct"] / n_total >= 0.95) if n_total else True
    field_ok = (total_ok / total_all >= 0.90) if total_all else True
    print(f"\nTargets: scam >= 95% {'MET' if scam_ok else 'NOT MET'} | fields >= 90% {'MET' if field_ok else 'NOT MET'}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default="eval_cases.json")
    ap.add_argument("--url", default=None)
    ap.add_argument("--sleep", type=float, default=2.5)
    ap.add_argument("--only", choices=["sms", "quick"], default=None)
    ap.add_argument("--ids", default=None)
    ap.add_argument("--compare", action="store_true",
                    help="score the AI on its own AND with the rules, from the same AI answers (in-process only)")
    args = ap.parse_args()

    cases = json.load(open(os.path.join(HERE, args.file), encoding="utf-8"))
    if args.only:
        cases = [c for c in cases if c["kind"] == ("sms" if args.only == "sms" else "quick")]
    if args.ids:
        wanted = set(args.ids.split(","))
        cases = [c for c in cases if c["id"] in wanted]

    post = make_caller(args.url)
    modes = ["ai_only", "hybrid"] if args.compare else ["hybrid"]
    if args.compare:
        if args.url:
            sys.exit("--compare works in-process only (leave out --url)")
        import pipeline

        original_ask = pipeline.ask_ai
        memo = {}

        def cached_ask(prompt, schema):
            key = (prompt, schema.__name__)
            if key not in memo:
                memo[key] = original_ask(prompt, schema)
            return memo[key].model_copy(deep=True)

        pipeline.ask_ai = cached_ask

    stats = {m: new_stats() for m in modes}
    failures = {m: [] for m in modes}
    quota_waits, results = [], {}

    print(f"Running {len(cases)} cases ({args.sleep}s between AI calls)\n")
    for i, case in enumerate(cases, 1):
        path = "/parse-sms" if case["kind"] == "sms" else "/quick-entry"
        body = {"text": case["text"], "lang": case["lang"], "today": case["today"]}
        started = time.time()
        marks = []
        for mode in modes:
            if args.compare:
                pipeline.RULES_ON = mode == "hybrid"
            try:
                status, data = call_with_patience(post, path, body, quota_waits)
            except Exception as e:  # noqa: BLE001
                status, data = 0, {"error": repr(e)}
            results.setdefault(case["id"], {})[mode] = {"status": status, "response": data}
            before = len(failures[mode])
            (score_sms if case["kind"] == "sms" else score_quick)(case, status, data, stats[mode], failures[mode])
            marks.append(("ok " if len(failures[mode]) == before else "BAD"))
        took = time.time() - started
        print(f"[{i:2d}/{len(cases)}] {' / '.join(f'{m}:{k}' for m, k in zip(modes, marks))}  {case['id']}  {took:4.1f}s", flush=True)
        if i < len(cases):
            time.sleep(args.sleep)

    json.dump(results, open(os.path.join(HERE, "last_results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    for mode in modes:
        label = {"ai_only": "AI ONLY (no rules)", "hybrid": "HYBRID (AI + rules)"}[mode]
        report(label, stats[mode], failures[mode], cases, quota_waits if mode == modes[-1] else [])


if __name__ == "__main__":
    main()
