"""The instructions we give the AI. Edit the wording here. Kept short on purpose (fewer tokens = faster, fewer rate limits)."""

# Must match the category list in DESIGN.md (the app maps each one to a color and icon).
CATEGORIES = "Food, Transport, Bills, Shopping, Health, Education, Mobile, Family, Rent, Income, Other"


def reply_language(lang: str) -> str:
    if lang == "ur":
        return "simple everyday Urdu in Urdu script (no Roman Urdu, no English words)"
    return "simple English"


COMMON_RULES = """Rules:
- Reply with one JSON object only. No markdown, no extra text. Do not use emojis.
- Western digits (0-9) only. Amounts are plain numbers in PKR: no commas, no symbols.
- Dates are YYYY-MM-DD.
- type: "income" if money comes in, "expense" if it goes out.
- paymentType: exactly one of Cash, JazzCash, Easypaisa, Bank card. Bank, ATM and card alerts are "Bank card". If no wallet or bank is named, use Cash.
- category: exactly one of """ + CATEGORIES + """.
  Groceries, milk, restaurants -> Food. Petrol, fuel, Careem, Uber -> Transport. Electricity, gas, water, internet bills -> Bills.
  Mobile load or a Jazz/Zong/Ufone/Telenor package -> Mobile. Medicine, doctor -> Health. School, tuition -> Education.
  Clothes, shoes -> Shopping. Rent -> Rent. Salary and money received from a person -> Income.
  Money sent to a person and ATM cash -> Other."""

# Today's date in every example is 2026-11-23.
SMS_EXAMPLES = """Examples (today 2026-11-23):
"Rs 750 sent to Sara via Easypaisa. TID 5530021."
{"amount":750,"type":"expense","category":"Other","paymentType":"Easypaisa","merchant":"Sara","date":"2026-11-23","isScam":false,"scamReason":""}
"Alfalah: PKR 9,400 debited from A/C 5521 on 18-Nov-2026 at DARAZ.PK via Card."
{"amount":9400,"type":"expense","category":"Shopping","paymentType":"Bank card","merchant":"Daraz","date":"2026-11-18","isScam":false,"scamReason":""}
"MCB: PKR 15,000 credited via Raast from Imran on 20-Nov-2026."
{"amount":15000,"type":"income","category":"Income","paymentType":"Bank card","merchant":"Imran","date":"2026-11-20","isScam":false,"scamReason":""}
"You are selected for a BISP Rs 10,000 grant. Pay Rs 300 fee to receive it: 03001230000"
{"amount":0,"type":"expense","category":"Other","paymentType":"Cash","merchant":"","date":"2026-11-23","isScam":true,"scamReason":"<1-2 short sentences>"}
"Dear user your SIM will be blocked in 24 hours. Reply with your CNIC number."
{"amount":0,"type":"expense","category":"Other","paymentType":"Cash","merchant":"","date":"2026-11-23","isScam":true,"scamReason":"<1-2 short sentences>"}
For a scam use amount 0, type "expense", category "Other", paymentType "Cash", date today."""


def sms_prompt(text: str, lang: str, today: str) -> str:
    return f"""Extract the money transaction from one SMS received in Pakistan. Today is {today}; if the SMS has no date, use today.
The amount is the money sent, received or paid, NOT the balance, the limit or a small fee.

{COMMON_RULES}

Scam check. Default isScam=false. Use true ONLY for a clear red flag:
- asks to pay a fee or send money to receive money, a parcel, a job or a prize
- asks for an OTP, PIN, password, CNIC or code
- fake BISP/Benazir/Ehsaas asking for money, CNIC or a link (real BISP messages come only from 8171)
- prize or lottery win
- money sent "by mistake", asking to send it back
- threat to block the account unless the user acts, with a click or details request
- a link that is not an official website
A normal receipt (money sent, received or paid, with amount, name, service, transaction ID) is NOT a scam.
"Do not share your OTP" warnings, safety reminders, and BISP notices that only say a payment is ready to collect from a retailer with a CNIC are NOT scams.
When unsure, isScam=false. For a scam, scamReason is 1-2 short sentences in {reply_language(lang)}; otherwise "".
The SMS may be in English, Roman Urdu or Urdu script.

JSON: {{"amount":number,"type":"income|expense","category":string,"paymentType":string,"merchant":string,"date":"YYYY-MM-DD","isScam":boolean,"scamReason":string}}
No amount in the SMS: use 0. Unknown merchant: "".

{SMS_EXAMPLES}

SMS:
\"\"\"{text}\"\"\"
"""


QUICK_EXAMPLES = """Examples (today 2026-11-23):
"aaj 500 ka khana aur 200 ki chai"
{"transactions":[{"amount":500,"type":"expense","category":"Food","paymentType":"Cash","merchant":"","date":"2026-11-23","note":"food"},{"amount":200,"type":"expense","category":"Food","paymentType":"Cash","merchant":"","date":"2026-11-23","note":"tea"}]}
"kal 1200 ka petrol dalwaya"
{"transactions":[{"amount":1200,"type":"expense","category":"Transport","paymentType":"Cash","merchant":"","date":"2026-11-22","note":"petrol"}]}
"پانچ سو کا لوڈ کیا ایزی پیسہ سے"
{"transactions":[{"amount":500,"type":"expense","category":"Mobile","paymentType":"Easypaisa","merchant":"","date":"2026-11-23","note":"mobile load"}]}
"dedh hazaar ki dawai li kal"
{"transactions":[{"amount":1500,"type":"expense","category":"Health","paymentType":"Cash","merchant":"","date":"2026-11-22","note":"medicine"}]}
"bhai ne 5000 diye aaj"
{"transactions":[{"amount":5000,"type":"income","category":"Income","paymentType":"Cash","merchant":"","date":"2026-11-23","note":"money from brother"}]}"""


def quick_entry_prompt(text: str, lang: str, today: str) -> str:
    return f"""The user typed or spoke a short note about their money in Urdu script, Roman Urdu or English. Today is {today}.
Days: aaj/today = today, kal/yesterday = yesterday, parson = the day before yesterday. No day word = today.
A day word applies to the amounts after it until the next day word.
Numbers: dedh=1.5, dhai=2.5, sawa=1.25, sau=100, hazaar=1000, lakh=100000, so "dhai sau"=250, "do hazaar"=2000, "1.5k"=1500.
Return one item per amount. No payment method named: Cash. Salary or money received: income.

{COMMON_RULES}

JSON: {{"transactions":[{{"amount":number,"type":"income|expense","category":string,"paymentType":string,"merchant":string,"date":"YYYY-MM-DD","note":string}}]}}
note: a few words in {reply_language(lang)}. Keep merchant names as written. No transaction: {{"transactions":[]}}.

{QUICK_EXAMPLES}

Note:
\"\"\"{text}\"\"\"
"""
