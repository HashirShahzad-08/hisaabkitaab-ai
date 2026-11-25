# Backend tests

- `check_rules.py`, `check_bill_rules.py`, `check_afford_rules.py`: test only the plain rules. No AI, no network, no quota.
- `run_eval.py`: measures the AI + rules pipeline. It calls `pipeline.parse_sms` and `pipeline.quick_entry` directly (not the HTTP routes), so no Firebase login is needed. It uses real AI quota, so run it on purpose.
  Options: `--file`, `--only sms|quick`, `--ids`, `--compare`, `--sleep` (default 4 seconds), `--provider zai`.

## real_sms_cases.json

Put real SMS messages here, anonymized, in the same format as `eval_cases.json`. It starts empty (`[]`).
Run it with `python tests/run_eval.py --file real_sms_cases.json`.

Rules for anonymizing:
- No real names.
- No account, card or CNIC numbers.
- No personal phone numbers. Official short codes and helplines (for example 8171) are fine.
- Keep the amounts, dates and wording, because those are what the test checks.

Each case has an `id`, `kind` ("sms"), `lang`, `today` (the date the message was received), the `text`,
and the `expected` fields: `isScam`, and for normal messages `amount`, `type`, `category`, `paymentType`, `date`.
