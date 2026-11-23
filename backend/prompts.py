"""The instructions we give Gemini. Edit the wording here."""

# Must match the category list in DESIGN.md (the app maps each one to a color and icon).
# Petrol and fuel count as Transport. Salary and other money received count as Income.
CATEGORIES = (
    "Food, Transport, Bills, Shopping, Health, Education, Mobile, "
    "Family, Rent, Income, Other"
)


def reply_language(lang: str) -> str:
    if lang == "ur":
        return "simple, everyday Urdu in Urdu script (no Roman Urdu, no English words)"
    return "simple English"


COMMON_RULES = """Rules:
- Reply with JSON only. No markdown, no code fences, no extra text.
- Do not use emojis.
- Always write numbers and amounts with Western digits (0-9), never Urdu digits.
- Keep a calm, friendly tone. Never blame the user.
- Dates must be in YYYY-MM-DD format.
- Amounts are plain numbers in Pakistani Rupees (PKR), with no commas or currency symbols.
- type is "income" when money comes in, "expense" when money goes out.
- paymentType must be exactly one of: Cash, JazzCash, Easypaisa, Bank card.
- category must be one of: """ + CATEGORIES + "."


def sms_prompt(text: str, lang: str, today: str) -> str:
    reason_lang = reply_language(lang)
    return f"""You read one SMS or message received in Pakistan and extract the money transaction from it.
Today's date is {today}. If the message has no date, use today's date.

{COMMON_RULES}

Also decide if the message is a scam. The default is isScam false.
Set isScam to true ONLY when the message itself contains a clear red flag, such as:
- It asks the user to send money, or to pay a fee, tax or charges, in order to receive money.
- It asks the user for an OTP, PIN, password, CNIC number or any verification code.
- It claims to be from BISP / Benazir Income Support but does not come from the official number 8171,
  or it asks for money, CNIC details or a link.
- It says the user won a prize, lottery or reward.
- It says "wrong transfer, please send the money back" (or similar), asking the user to return money.
- It makes an urgent threat, such as the account will be blocked or closed unless the user acts now.
- It contains a suspicious link or asks the user to call an unknown number or click to claim something.

A normal confirmation is NOT a scam. A message that only says money was sent, received or paid,
with an amount, a name, a service name and/or a transaction ID, has no red flag. Do not guess.
Do not flag a message just because it mentions money, a person's name, JazzCash, Easypaisa or a bank.
If you are unsure, use isScam false.

Examples of normal messages (isScam false, scamReason empty):
1. "Rs 1,500 received from Ali via JazzCash. Trx ID 12345"
2. "You have paid Rs 850 to K-Electric via Easypaisa. TID 98765432. Balance Rs 4,210."
3. "HBL: Your card ending 4421 was used for Rs 3,200 at Imtiaz Super Market on 20-Nov."

Examples of scam messages (isScam true):
1. "Congratulations! You won Rs 500,000 in the Jeeto Pakistan lucky draw. Send Rs 2,000 fee to claim your prize." (prize plus a fee to receive money)
2. "Sorry, I sent Rs 5,000 to your number by mistake. Please send it back to this number urgently." (wrong transfer, send back)
3. "Your account will be blocked today. Share the 6-digit code you just received and your CNIC to verify." (urgent threat plus asking for a code and CNIC)

If it is not a scam, set isScam to false and scamReason to an empty string.
If it is a scam, scamReason is one or two short sentences in {reason_lang}. Say why it looks like a scam.
If it is a fake BISP message, add that real BISP messages come only from 8171.
If it asks for a PIN or OTP, add that the user should never share a PIN or OTP.
The input message itself may be in Urdu script, Roman Urdu or English, in either language mode.

Return exactly this JSON object:
{{"amount": number, "type": "income|expense", "category": string, "paymentType": string, "merchant": string, "date": "YYYY-MM-DD", "isScam": boolean, "scamReason": string}}
If there is no amount in the message, use 0. If the merchant is unknown, use an empty string.

Message:
\"\"\"{text}\"\"\"
"""


def quick_entry_prompt(text: str, lang: str, today: str) -> str:
    return f"""The user typed or spoke a short note about their money in Urdu script, Roman Urdu or English.
Example: "kal mainy 100 ka petrol barwaya" means one expense of 100, category Transport, dated yesterday.
Today's date is {today}. Convert relative words into real dates using today:
aaj = today, kal = yesterday (kal means tomorrow only if the sentence is clearly about the future),
parson = the day before yesterday (or the day after tomorrow if clearly about the future).
If no day is mentioned, use today.
The note may contain more than one transaction. Return one item per transaction.
If paymentType is not mentioned, use Cash.

{COMMON_RULES}

Return exactly this JSON object:
{{"transactions": [{{"amount": number, "type": "income|expense", "category": string, "paymentType": string, "merchant": string, "date": "YYYY-MM-DD", "note": string}}]}}
note is a very short description in {reply_language(lang)}. Keep merchant names as the user wrote them. If there is no transaction in the text, return {{"transactions": []}}.

User note:
\"\"\"{text}\"\"\"
"""
