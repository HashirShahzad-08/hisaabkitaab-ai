"""Plain, deterministic rules. No AI in this file.

The AI reads the message, then these rules double-check it:
  - dates      aaj / kal / parson / today / yesterday are worked out in code
  - amounts    found with regular expressions (Rs, PKR, commas, 1.5k, hazaar, sau, dhai sau ...)
  - categories keyword map (petrol -> Transport, doodh -> Food ...)
  - payment    JazzCash / Easypaisa / bank words
  - type       received / sent words
  - scams      strong red flags that raise isScam even if the AI misses them
"""
import re
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

# ============================================================ AMOUNTS

# Number words in Roman Urdu and Urdu script
WORD_NUMBERS: Dict[str, float] = {
    "ek": 1, "aik": 1, "ایک": 1,
    "do": 2, "دو": 2,
    "teen": 3, "تین": 3,
    "char": 4, "chaar": 4, "چار": 4,
    "paanch": 5, "panch": 5, "پانچ": 5,
    "chay": 6, "chhe": 6, "cheh": 6, "chah": 6, "چھ": 6,
    "saat": 7, "سات": 7,
    "aath": 8, "ath": 8, "آٹھ": 8,
    "nau": 9, "نو": 9,
    "das": 10, "dus": 10, "دس": 10,
    "dedh": 1.5, "ڈیڑھ": 1.5,
    "dhai": 2.5, "dhaai": 2.5, "ڈھائی": 2.5,
    "sawa": 1.25, "سوا": 1.25,
}
MULTIPLIERS: Dict[str, int] = {
    "k": 1000,
    "sau": 100, "sao": 100, "سو": 100,
    "hazaar": 1000, "hazar": 1000, "hazaaar": 1000, "hajar": 1000, "ہزار": 1000,
    "lakh": 100000, "lac": 100000, "lakhs": 100000, "لاکھ": 100000,
}

_MULT = "|".join(sorted(map(re.escape, MULTIPLIERS), key=len, reverse=True))
_WORDS = "|".join(sorted(map(re.escape, WORD_NUMBERS), key=len, reverse=True))
_CUR = r"(?:rs\.?|pkr|rupees?|rupay|rupaye|rupiya|روپے|روپیہ|روپیے)"
_NUM = r"\d[\d,]*(?:\.\d+)?"

# 1) "Rs 1,500" / "PKR 85,000.00" / "Rs. 2k"
_P_CUR_FIRST = re.compile(rf"(?<![a-z])({_CUR})\s*({_NUM})\s*(?:({_MULT})(?![a-zA-Z\u0600-\u06FF]))?", re.I)
# 2) "500 rupay" / "6500 روپے"
_P_CUR_LAST = re.compile(rf"(?<![\d,.])({_NUM})\s*({_MULT})?\s*({_CUR})(?![a-zA-Z\u0600-\u06FF])", re.I)
# 3) "1.5k", "2 hazaar", "10 lakh"
_P_DIGIT_MULT = re.compile(rf"(?<![\d,.a-zA-Z])({_NUM})\s*({_MULT})(?![a-zA-Z\u0600-\u06FF])", re.I)
# 4) "dhai sau", "do hazaar", "dedh hazaar", "ek lakh"
_P_WORD_MULT = re.compile(rf"(?<![a-zA-Z\u0600-\u06FF])({_WORDS})\s+({_MULT})(?![a-zA-Z\u0600-\u06FF])", re.I)
# 5) a bare number (only used for short notes, not SMS)
_P_BARE = re.compile(r"(?<![\d,.\-/:a-zA-Z])(\d[\d,]*(?:\.\d+)?)(?![\d,.\-/:]*\d)(?![\d:/])")

# Numbers that are NOT the transaction: balances, fees, limits
_SKIP_BEFORE = re.compile(r"(bal(?:ance)?|avl|avail(?:able)?|limit|fee|fees|charges?|fed|wht|tax)\W{0,6}(?:is|:)?\W{0,3}$", re.I)


def _to_float(num: str) -> float:
    return float(num.replace(",", ""))


def extract_amounts(text: str, allow_bare: bool = False, skip_balances: bool = True) -> List[Tuple[int, float]]:
    """Returns [(position, amount), ...] in the order they appear in the text."""
    found: List[Tuple[int, int, float]] = []  # start, end, value

    def overlaps(a: int, b: int) -> bool:
        return any(a < e and b > s for s, e, _ in found)

    def add(m: re.Match, value: float):
        if value > 0 and not overlaps(m.start(), m.end()):
            found.append((m.start(), m.end(), value))

    for m in _P_CUR_FIRST.finditer(text):
        value = _to_float(m.group(2)) * (MULTIPLIERS[m.group(3).lower()] if m.group(3) else 1)
        add(m, value)
    for m in _P_CUR_LAST.finditer(text):
        value = _to_float(m.group(1)) * (MULTIPLIERS[m.group(2).lower()] if m.group(2) else 1)
        add(m, value)
    for m in _P_DIGIT_MULT.finditer(text):
        add(m, _to_float(m.group(1)) * MULTIPLIERS[m.group(2).lower()])
    for m in _P_WORD_MULT.finditer(text):
        add(m, WORD_NUMBERS[m.group(1).lower()] * MULTIPLIERS[m.group(2).lower()])
    if allow_bare:
        for m in _P_BARE.finditer(text):
            value = _to_float(m.group(1))
            if value >= 1 and len(m.group(1).replace(",", "").split(".")[0]) <= 9:
                add(m, value)

    found.sort()
    result = []
    for start, _end, value in found:
        if skip_balances and _SKIP_BEFORE.search(text[max(0, start - 22):start]):
            continue
        result.append((start, round(value, 2)))
    return result


# ============================================================ DATES

_PAT_DAY_BEFORE = re.compile(r"(?<![\w])(parson|parsoon|parso|parsun|day before yesterday|پرسوں)(?![\w])", re.I)
_PAT_YESTERDAY = re.compile(r"(?<![\w])(kal|kl|yesterday|guzishta kal|کل)(?![\w])", re.I)
_PAT_TODAY = re.compile(r"(?<![\w])(aaj|aj|today|abhi|آج)(?![\w])", re.I)

_MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
_D_MON = re.compile(r"\b(\d{1,2})[-/ .]([A-Za-z]{3})[a-z]*[-/ .,]*(\d{4}|\d{2})\b")
_D_NUM = re.compile(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})\b")
_D_ISO = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


def _year(y: str) -> int:
    n = int(y)
    return 2000 + n if n < 100 else n


def relative_markers(text: str, today: date) -> List[Tuple[int, date]]:
    """[(position, date)] for every aaj / kal / parson / today / yesterday in the text."""
    markers = []
    taken: List[Tuple[int, int]] = []
    for pattern, days_ago in ((_PAT_DAY_BEFORE, 2), (_PAT_YESTERDAY, 1), (_PAT_TODAY, 0)):
        for m in pattern.finditer(text):
            if any(m.start() < e and m.end() > s for s, e in taken):
                continue
            taken.append((m.start(), m.end()))
            markers.append((m.start(), today - timedelta(days=days_ago)))
    markers.sort()
    return markers


def explicit_date(text: str) -> Optional[date]:
    """A real date written in the text, like 20-Nov-2026, 21/11/2026 or 2026-11-21."""
    m = _D_MON.search(text)
    if m and m.group(2).lower() in _MONTHS:
        try:
            return date(_year(m.group(3)), _MONTHS[m.group(2).lower()], int(m.group(1)))
        except ValueError:
            pass
    m = _D_ISO.search(text)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            pass
    m = _D_NUM.search(text)
    if m:
        try:  # Pakistan writes day/month/year
            return date(_year(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            pass
    return None


def parse_today(today: str) -> date:
    return datetime.strptime(today, "%Y-%m-%d").date()


# ============================================================ CATEGORIES

# Checked in this order; the first match wins. Words are matched as whole words or word starts.
CATEGORY_KEYWORDS: List[Tuple[str, List[str]]] = [
    ("Income", ["salary", "tankhwah", "tankhah", "tankha", "تنخواہ", "wages", "bonus"]),
    ("Mobile", ["load", "package", "recharge", "topup", "top-up", "zong", "ufone", "telenor", "mobile data",
                "data bundle", "لوڈ", "پیکج", "ریچارج"]),
    ("Bills", ["bijli", "electricity", "bill", "gas", "sngpl", "ssgc", "k-electric", "kelectric", "lesco",
               "iesco", "fesco", "mepco", "gepco", "pesco", "hesco", "wapda", "ptcl", "wasa", "water board",
               "utility", "بل", "بجلی", "گیس"]),
    ("Rent", ["rent", "kiraya", "kirayah", "kirayay", "کرایہ"]),
    ("Health", ["dawai", "dawa", "dawaian", "medicine", "medical", "doctor", "hospital", "clinic", "pharmacy",
                "chemist", "lab test", "dental", "دوائی", "دوا", "ڈاکٹر", "ہسپتال"]),
    ("Education", ["school", "tuition", "college", "university", "academy", "stationery", "books", "kitab",
                   "kitaben", "تعلیم", "اسکول", "کتاب"]),
    ("Transport", ["petrol", "patrol", "fuel", "diesel", "cng", "pump", "shell", "pso", "attock", "careem",
                   "uber", "indrive", "bykea", "rickshaw", "taxi", "bus fare", "metro bus", "toll",
                   "پیٹرول", "ڈیزل", "رکشہ"]),
    ("Food", ["doodh", "milk", "khana", "khaana", "khane", "food", "grocery", "groceries", "sabzi", "sabji",
              "atta", "chawal", "roti", "naan", "restaurant", "hotel", "kfc", "mcdonald", "burger", "pizza",
              "biryani", "chai", "fruit", "supermarket", "super market", "imtiaz", "carrefour", "naheed",
              "metro cash", "bakery", "ration", "foodpanda", "دودھ", "کھانا", "گروسری", "سبزی", "آٹا"]),
    ("Shopping", ["kapray", "kapre", "kapra", "clothes", "shirt", "shoes", "joota", "jootay", "shopping",
                  "daraz", "mall", "khaadi", "outfitters", "کپڑے", "جوتے", "خریداری"]),
    ("Family", ["eidi", "gift", "tohfa", "shadi", "تحفہ", "عیدی"]),
]


def _kw_pattern(word: str) -> str:
    return rf"(?<![A-Za-z\u0600-\u06FF]){re.escape(word)}(?![A-Za-z\u0600-\u06FF])"


_CATEGORY_RES = [(cat, re.compile("|".join(_kw_pattern(w) for w in words), re.I)) for cat, words in CATEGORY_KEYWORDS]


_GROCERY = re.compile(
    r"(?<![A-Za-z])(supermarket|super market|grocery|groceries|imtiaz|carrefour|naheed|ration|metro cash)(?![A-Za-z])", re.I)


def is_grocery(text: str) -> bool:
    """Supermarket and grocery names. There is no Groceries category, so these count as Food."""
    return bool(_GROCERY.search(text))


def guess_category(text: str) -> Optional[str]:
    for category, pattern in _CATEGORY_RES:
        if pattern.search(text):
            return category
    return None


# ============================================================ PAYMENT TYPE AND TYPE

_PAY_JAZZ = re.compile(r"jazz\s?-?cash|جاز\s?کیش", re.I)
_PAY_EASY = re.compile(r"easy\s?-?paisa|ایزی\s?پیسہ", re.I)
_PAY_BANK = re.compile(
    r"\b(hbl|meezan|ubl|abl|mcb|alfalah|askari|faysal|allied|habib|standard chartered|bank|a/c|acct|account|atm|"
    r"debit card|credit card|card ending|ibft|raast|cheque)\b|بینک", re.I)
_PAY_CASH = re.compile(r"\b(cash|nakad|naqd)\b|نقد|کیش", re.I)


def guess_payment(text: str) -> Optional[str]:
    """JazzCash and Easypaisa win over a bank name; bank words win over nothing."""
    jazz, easy = _PAY_JAZZ.search(text), _PAY_EASY.search(text)
    if jazz and easy:
        return "JazzCash" if jazz.start() < easy.start() else "Easypaisa"
    if jazz:
        return "JazzCash"
    if easy:
        return "Easypaisa"
    if _PAY_BANK.search(text):
        return "Bank card"
    return None


def guess_payment_quick(text: str) -> Optional[str]:
    """For short notes: cash is a clear answer too."""
    found = guess_payment(text)
    if found:
        return found
    if _PAY_CASH.search(text):
        return "Cash"
    return None


_INCOME_WORDS = re.compile(
    r"\b(received|receive|credited|credit|salary|deposited|deposit|incoming|mosool|mausool|mila|mili|aaye|aya|"
    r"tankhwah|tankhah|refund)\b|تنخواہ|موصول|ملی|ملا", re.I)
_EXPENSE_WORDS = re.compile(
    r"\b(sent|paid|debited|debit|withdrawn|withdrawal|purchase|purchased|spent|used for|transferred to|"
    r"payment of|payment|bheja|bheje|ada|kharch|khareeda|kharida|barwaya|bharwaya|kiya|kia)\b|ادا|خرچ|خریدا", re.I)


def guess_type(text: str) -> Optional[str]:
    """'income' or 'expense' only when the words point clearly one way."""
    clean = re.sub(r"credit card|debit card", " ", text, flags=re.I)
    inc = bool(_INCOME_WORDS.search(clean))
    exp = bool(_EXPENSE_WORDS.search(clean))
    if inc and not exp:
        return "income"
    if exp and not inc:
        return "expense"
    return None


_STRONG_INCOME = re.compile(
    r"\b(salary|tankhwah|tankhah|mosool|mausool|received|credited)\b|تنخواہ|موصول", re.I)


def strong_income(text: str) -> bool:
    return bool(_STRONG_INCOME.search(text))


# ============================================================ SCAM RULES

_URL = re.compile(
    r"(https?://[^\s]+|www\.[^\s]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|pk|xyz|top|cfd|click|link|"
    r"info|online|site|me|icu|vip|club|shop|live|biz|cc|ly|gl|tk|ml)(?:/[^\s]*)?)", re.I)

OFFICIAL_DOMAINS = [
    "jazzcash.com.pk", "jazz.com.pk", "easypaisa.com.pk", "telenor.com.pk", "zong.com.pk", "ufone.com",
    "hbl.com", "meezanbank.com", "ubl.com.pk", "ubldigital.com", "mcb.com.pk", "abl.com", "bankalfalah.com",
    "askaribank.com.pk", "faysalbank.com", "bop.com.pk", "sbp.org.pk", "pta.gov.pk", "bisp.gov.pk",
    "tcsexpress.com", "leopardscourier.com", "postex.pk", "pakpost.gov.pk", "daraz.pk", "careem.com",
    "k-electric.com", "ke.com.pk", "ptcl.com.pk", "nadra.gov.pk", "sngpl.com.pk", "ssgc.com.pk",
    "lesco.gov.pk", "iesco.com.pk", "fesco.com.pk", "mepco.com.pk", "gepco.com.pk", "pesco.gov.pk",
    "wapda.gov.pk", "foodpanda.pk", "bankislami.com.pk", "nayatel.com", "stormfiber.com",
]

# Websites that scammers like: free or cheap endings, and link shorteners.
RISKY_ENDINGS = ("xyz", "top", "cfd", "click", "icu", "vip", "club", "site", "online", "live", "tk", "ml",
                 "cc", "ly", "gl", "link", "biz", "info", "shop")
SHORTENERS = ("bit.ly", "tinyurl.com", "cutt.ly", "t.co", "goo.gl", "rb.gy", "is.gd", "shorturl.at", "ow.ly")
# A website name that copies a brand people trust
BRAND_WORDS = ("jazz", "easypaisa", "hbl", "meezan", "ubl", "bisp", "benazir", "ehsaas", "nadra", "tcs", "leopards",
               "daraz", "bank", "alfalah", "askari", "faysal", "nbp", "sbp", "pta", "ptcl", "secure", "verify")
# Words that mean "do something on this site now"
ACTION_WORDS = re.compile(r"(verify|login|log in|click|claim|unlock|update|confirm|kyc|secure|apply|register|"
                          r"reactivat|limited|suspend|block|expired)", re.I)


def find_links(text: str) -> List[str]:
    return [m.group(0).rstrip(".,;)") for m in _URL.finditer(text)]


def _host(link: str) -> str:
    parsed = urlparse(link if "//" in link else "http://" + link)
    return (parsed.hostname or "").lower()


def suspicious_links(text: str) -> List[str]:
    """Links that are not an official website AND look risky: a link shortener, a cheap ending like .xyz,
    a name that copies a bank or brand, or a message that tells you to verify/claim/click.
    A plain unknown website (for example a shop's own page) is not flagged on its own."""
    bad = []
    context_risky = bool(ACTION_WORDS.search(text))
    for link in find_links(text):
        host = _host(link)
        if any(host == d or host.endswith("." + d) for d in OFFICIAL_DOMAINS):
            continue
        ending = host.rsplit(".", 1)[-1]
        lookalike = any(w in host for w in BRAND_WORDS)
        if host in SHORTENERS or ending in RISKY_ENDINGS or lookalike or context_risky:
            bad.append(link)
    return bad


_NEG = re.compile(r"\b(do not|don't|dont|never|na|nahi|nahin|mat|not)\b", re.I)
_VERB = (r"(?:share|send|give|provide|reply|enter|confirm|verify|tell|submit|text|sms|whatsapp|forward|type|"
         r"bhej\w*|bata\w*|likh\w*|dein|do)")
_SECRET = (r"(?:otp|pin|cnic|password|passcode|cvv|verification code|security code|(?:\d-?digit )?code|"
           r"identity card|id card|account number|شناختی کارڈ|پن|پاس ورڈ)")
_REQ_A = re.compile(rf"(?<![A-Za-z])({_VERB})(?![A-Za-z])[^.\n]{{0,45}}?(?<![A-Za-z])({_SECRET})(?![A-Za-z])", re.I)
_REQ_B = re.compile(rf"(?<![A-Za-z])({_SECRET})(?![A-Za-z])[^.\n]{{0,40}}?(?<![A-Za-z])({_VERB})(?![A-Za-z])", re.I)


def asks_for_secret(text: str) -> bool:
    """Is the message asking the user to hand over an OTP, PIN, CNIC, password or code?
    Warnings do not count: "Do not share your OTP", "Banks never ask for your PIN by SMS",
    "Kisi ko apna PIN na batayen". We treat the sentence as a warning if it has a "not/never/na" in it.
    "by SMS" or "via WhatsApp" describe how, they are not an order to send."""
    for pattern, verb_group in ((_REQ_A, 1), (_REQ_B, 2)):
        for m in pattern.finditer(text):
            sentence_start = max(text.rfind(c, 0, m.start()) for c in ".!?\n") + 1
            sentence = text[sentence_start:m.end() + 14]
            if _NEG.search(sentence):
                continue
            verb = m.group(verb_group).lower()
            if verb in ("sms", "text", "whatsapp") and re.search(
                    r"\b(by|via|through|over|on|in)\s+$", text[max(0, m.start(verb_group) - 8):m.start(verb_group)], re.I):
                continue
            return True
    return False


_FEE_WORD = (r"(?:fee|fees|charges?|tax|processing|registration|security|deposit|customs|advance|"
             r"inaam tax|delivery charges)")
_PAY_VERB = r"(?:pay|send|deposit|transfer|jama|bhej\w*|ada|karein|karen|karwayein|kijiye|dein)"
_AMT = r"(?:rs\.?\s?\d[\d,]*|\d[\d,]*\s*(?:rupay|rupees|rs))"
_FEE_PATTERNS = [
    re.compile(rf"(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])[^.\n]{{0,50}}?(?<![A-Za-z]){_FEE_WORD}(?![A-Za-z])", re.I),
    re.compile(rf"(?<![A-Za-z]){_FEE_WORD}(?![A-Za-z])[^.\n]{{0,60}}?(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])", re.I),
    re.compile(rf"(?:claim|release|inaam|receive|lene|prize|unlock)[^.\n]{{0,60}}?{_AMT}[^.\n]{{0,40}}?(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])", re.I),
    re.compile(rf"(?<![A-Za-z])(?:send|bhej\w*|jama|pay|deposit)(?![A-Za-z])[^.\n]{{0,40}}?{_AMT}[^.\n]{{0,50}}?(?:to (?:claim|receive|release|get|confirm)|claim|release|prize|inaam|lene ke liye)", re.I),
]


def asks_for_fee(text: str) -> bool:
    return any(p.search(text) for p in _FEE_PATTERNS)


_PRIZE = re.compile(
    r"(you (?:have )?won|you are (?:the )?(?:lucky )?winner|congratulations|mubarak ho|jeet gaye|jeeta hai|nikli hai|"
    r"nikla hai|lucky draw|lottery|jackpot|jeeto pakistan|\bprize\b|inaam|انعام|لاٹری|مبارک)", re.I)
_BISP = re.compile(r"\b(bisp|benazir|ehsaas|kafalat)\b|بینظیر|بے نظیر|احساس", re.I)
_BISP_TRIGGER = re.compile(
    r"(claim|selected|inaam|prize|winner|mubarak|congrat|apply|register|verify now|click|link|http|"
    r"processing|bhej\w*|jama|send your)", re.I)
_WRONG_A = re.compile(r"(by mistake|mistakenly|accidentally|galti se|ghalti se|ghalat|wrong (?:number|transfer|account)|غلطی سے)", re.I)
_WRONG_B = re.compile(r"(send (?:it |the money |the amount )?back|return|wapas|refund|bhej\w*|لوٹا|واپس)", re.I)
_BLOCK = re.compile(r"(block|suspend|deactivat|freeze|frozen|close[d]? today|expire|band ho)", re.I)
_VERIFY = re.compile(r"(verify|click|update your|confirm your|reactivat)", re.I)
_COURIER = re.compile(r"\b(parcel|courier|package|shipment|delivery|customs|tcs|leopards|dhl|fedex|postex|pakistan post)\b", re.I)
_JOB = re.compile(r"\b(job|hiring|vacancy|vacancies|naukri|visa|work from home|offer letter|recruit\w*)\b", re.I)


def scam_flags(text: str) -> List[str]:
    """Which strong red flags the message has. An empty list means none found."""
    flags: List[str] = []
    links = suspicious_links(text)
    secret = asks_for_secret(text)
    fee = asks_for_fee(text)

    if fee:
        flags.append("fee")
    if secret:
        flags.append("secret")
    if _BISP.search(text):
        has_8171 = "8171" in text
        if links or fee or secret or (_BISP_TRIGGER.search(text) and not has_8171):
            flags.append("bisp")
    if _PRIZE.search(text):
        flags.append("prize")
    if _WRONG_A.search(text) and _WRONG_B.search(text):
        flags.append("wrong_transfer")
    if _BLOCK.search(text) and (links or secret or _VERIFY.search(text)):
        flags.append("threat")
    if links:
        flags.append("link")
    if _COURIER.search(text) and (fee or links):
        flags.append("courier")
    if _JOB.search(text) and fee:
        flags.append("job")
    return flags


_TXN_WORDS = re.compile(
    r"\b(sent|received|paid|debited|credited|withdraw\w*|purchase\w*|spent|transferred|used for|load|payment|"
    r"ada|mosool|bheja|trx|tid|ref|salary)\b", re.I)


_RECEIPT_MARKER = re.compile(r"\b(trx|tid|txn|transaction id|ref|reference|avl|available|bal|balance|a/c|acct)\b", re.I)
_ASKS_SOMETHING = re.compile(
    r"\b(please|kindly|pls|urgent\w*|asap|immediately|return|wapas|back|send|bhej\w*|reply|call|whatsapp|"
    r"click|claim|verify|confirm|mistake|accident\w*|galti|ghalat|mehrbani)\b", re.I)


def looks_like_plain_confirmation(text: str) -> bool:
    """A normal receipt. It has an amount, transaction words AND a receipt marker (transaction id, balance ...),
    and it asks the user for nothing. Only then may we cancel an AI scam alarm."""
    return (
        bool(extract_amounts(text, skip_balances=False))
        and bool(_TXN_WORDS.search(text))
        and bool(_RECEIPT_MARKER.search(text))
        and not _ASKS_SOMETHING.search(text)
        and not find_links(text)
        and not asks_for_secret(text)
        and not asks_for_fee(text)
        and not _PRIZE.search(text)
        and not _BISP.search(text)
    )


# Short reasons used when the rules (not the AI) caught the scam.
REASONS = {
    "en": {
        "fee": "It asks you to pay a fee or send money first in order to receive money. Real money never needs a fee first.",
        "secret": "It asks for your OTP, PIN, CNIC or a code. Never share these with anyone.",
        "bisp": "Real BISP messages come only from 8171. This one asks for money, details or a link.",
        "prize": "Prize and lottery messages like this are a common scam. You have not won anything.",
        "wrong_transfer": "Asking you to send money back after a wrong transfer is a common trick. Check your own balance first.",
        "threat": "It scares you with a blocked account and asks you to act. Banks do not ask for details by SMS.",
        "link": "It has a suspicious link that is not an official website. Do not open it.",
        "courier": "Real couriers do not ask for fees through a link or a mobile wallet.",
        "job": "A real job never asks you to pay a fee first.",
    },
    "ur": {
        "fee": "اس میں رقم لینے کے لیے پہلے فیس یا پیسے بھیجنے کو کہا گیا ہے۔ اصل رقم کے لیے پہلے فیس نہیں دینی پڑتی۔",
        "secret": "اس میں آپ کا او ٹی پی، پن، شناختی کارڈ یا کوڈ مانگا گیا ہے۔ یہ کسی کو نہ بتائیں۔",
        "bisp": "بی آئی ایس پی کے اصل پیغام صرف 8171 سے آتے ہیں۔ اس میں پیسے، معلومات یا لنک مانگا گیا ہے۔",
        "prize": "اس طرح کے انعام اور لاٹری کے پیغام عام فراڈ ہیں۔ آپ نے کچھ نہیں جیتا۔",
        "wrong_transfer": "غلط ٹرانسفر کا کہہ کر پیسے واپس مانگنا عام چال ہے۔ پہلے اپنا بیلنس خود دیکھیں۔",
        "threat": "اس میں اکاؤنٹ بند ہونے کا ڈراوا دے کر کام کرنے کو کہا گیا ہے۔ بینک ایس ایم ایس پر معلومات نہیں مانگتے۔",
        "link": "اس میں مشکوک لنک ہے جو اصل ویب سائٹ نہیں ہے۔ اسے نہ کھولیں۔",
        "courier": "اصل کوریئر لنک یا موبائل والٹ کے ذریعے فیس نہیں مانگتے۔",
        "job": "اصل نوکری کے لیے پہلے فیس نہیں دینی پڑتی۔",
    },
}


def scam_reason(flags: List[str], lang: str) -> str:
    table = REASONS["ur" if lang == "ur" else "en"]
    return " ".join(table[f] for f in flags[:2] if f in table)
