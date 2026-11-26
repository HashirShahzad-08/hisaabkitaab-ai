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
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

# ============================================================ AMOUNTS

# Number words in Roman Urdu and Urdu script. Each line: value, then its spellings.
_NUMBER_LINES = """
1 ek aik ایک
2 do دو
3 teen تین
4 char chaar چار
5 paanch panch پانچ
6 chay chhe cheh chah چھ
7 saat سات
8 aath ath آٹھ
9 nau نو
10 das dus دس
11 gyarah gyara giarah گیارہ
12 barah baarah baara بارہ
13 terah تیرہ
14 chaudah chodah choda چودہ
15 pandrah pandra پندرہ
16 solah sola سولہ
17 satrah satra سترہ
18 atharah athara اٹھارہ
19 unnees unnis انیس
20 bees بیس
21 ikkees ikees ikis اکیس
22 baees baais بائیس
23 teis taees tees_ تئیس
24 chaubees chobis chaubis چوبیس
25 pachees pachis pacheas پچیس
26 chabbees chabbis چھبیس
27 sattaees satais sattais ستائیس
28 athaees athais athaais اٹھائیس
29 untees untis انتیس
30 tees تیس
31 ikattees ikatis اکتیس
32 battees batis بتیس
33 taintees tentis تینتیس
34 chauntees chontis چونتیس
35 paintees pentis پینتیس
36 chattees chattis چھتیس
37 saintees sentis سینتیس
38 artees athtees اڑتیس
39 untalees untalis انتالیس
40 chalees chalis chaalis چالیس
41 iktalees iktalis اکتالیس
42 bayalees byalis بیالیس
43 taintalees tentalis تینتالیس
44 chawalees chawalis چوالیس
45 paintalees pentalis پینتالیس
46 chiyalees chiyalis چھیالیس
47 saintalees sentalis سینتالیس
48 artalees artalis اڑتالیس
49 unchas unchaas انچاس
50 pachas pachaas پچاس
51 ikyawan اکیاون
52 bawan baawan باون
53 tirpan ترپن
54 chawwan chauwan چون
55 pachpan پچپن
56 chappan چھپن
57 sattawan ستاون
58 athawan اٹھاون
59 unsath انسٹھ
60 saath sath ساٹھ
61 iksath اکسٹھ
62 basath باسٹھ
63 tirsath تریسٹھ
64 chaunsath چونسٹھ
65 painsath پینسٹھ
66 chiyasath چھیاسٹھ
67 sarsath سڑسٹھ
68 arsath اڑسٹھ
69 unhattar انہتر
70 sattar ستر
71 ikhattar اکہتر
72 bahattar بہتر
73 tihattar تہتر
74 chauhattar چوہتر
75 pachattar pichattar پچہتر
76 chihattar چھہتر
77 sattattar ستتر
78 athattar اٹھہتر
79 unasi اناسی
80 assi اسی
81 ikyasi اکیاسی
82 bayasi بیاسی
83 tirasi تراسی
84 chaurasi چوراسی
85 pachasi پچاسی
86 chiyasi چھیاسی
87 satasi ستاسی
88 athasi اٹھاسی
89 nawasi نواسی
90 nabbe nabbay نوے
91 ikyanve اکانوے
92 banve بانوے
93 tiranve ترانوے
94 chauranve چورانوے
95 pachanve پچانوے
96 chiyanve چھیانوے
97 satanve ستانوے
98 athanve اٹھانوے
99 ninyanve ننانوے
1.5 dedh derh ڈیڑھ
2.5 dhai dhaai ڈھائی
"""
WORD_NUMBERS: Dict[str, float] = {}
for _line in _NUMBER_LINES.strip().splitlines():
    _value, *_spellings = _line.split()
    for _word in _spellings:
        if not _word.endswith("_"):
            WORD_NUMBERS[_word] = float(_value)

# "saadhe teen" = 3.5, "paune do" = 1.75, "sawa do" = 2.25. Before a multiplier alone, "sawa sau" = 125.
FRACTION_WORDS: Dict[str, float] = {
    "saadhe": 0.5, "sadhe": 0.5, "saadhay": 0.5, "sarhe": 0.5, "ساڑھے": 0.5,
    "paune": -0.25, "pone": -0.25, "ponay": -0.25, "پونے": -0.25,
    "sawa": 0.25, "swa": 0.25, "سوا": 0.25,
}
MULTIPLIERS: Dict[str, int] = {
    "k": 1000,
    "sau": 100, "sao": 100, "سو": 100,
    "hazaar": 1000, "hazar": 1000, "hazaaar": 1000, "hajar": 1000, "ہزار": 1000,
    "lakh": 100000, "lac": 100000, "lakhs": 100000, "لاکھ": 100000,
    "crore": 10000000, "crores": 10000000, "karor": 10000000, "caror": 10000000, "کروڑ": 10000000,
}
# These are also everyday words ("do" = give, "saath" = with, "اسی" = same), so on their own they prove nothing
_AMBIGUOUS_ALONE = {"do", "دو", "saat", "saath", "sath", "char", "das", "nau", "نو", "chah", "اسی", "بہتر", "sola", "choda"}

# Letters only (Urdu punctuation such as the full stop and comma is left out on purpose)
_UR_LETTER = r"\u0621-\u065F\u066E-\u06D3\u06D5\u06EE-\u06FF"
_TOKEN = re.compile(rf"[A-Za-z]+|[{_UR_LETTER}]+|\d[\d,]*(?:\.\d+)?")

_MULT = "|".join(sorted(map(re.escape, MULTIPLIERS), key=len, reverse=True))
_CUR = r"(?:rs\.?|pkr|rupees?|rupay|rupaye|rupiya|روپے|روپیہ|روپیے)"
_NUM = r"\d[\d,]*(?:\.\d+)?"
_CUR_BEFORE = re.compile(rf"(?<![a-z]){_CUR}\s*$", re.I)
_CUR_AFTER = re.compile(rf"^\s*{_CUR}(?![a-zA-Z{_UR_LETTER}])", re.I)

# 1) "Rs 1,500" / "PKR 85,000.00" / "Rs. 2k"
_P_CUR_FIRST = re.compile(rf"(?<![a-z])({_CUR})\s*({_NUM})\s*(?:({_MULT})(?![a-zA-Z{_UR_LETTER}]))?", re.I)
# 2) "500 rupay" / "6500 روپے"
_P_CUR_LAST = re.compile(rf"(?<![\d,.])({_NUM})\s*({_MULT})?\s*({_CUR})(?![a-zA-Z{_UR_LETTER}])", re.I)
# 3) "1.5k", "2 hazaar", "10 lakh"
_P_DIGIT_MULT = re.compile(rf"(?<![\d,.a-zA-Z])({_NUM})\s*({_MULT})(?![a-zA-Z{_UR_LETTER}])", re.I)
# 4) word numbers ("do hazaar paanch sau") are read by _word_phrases() below
# 5) a bare number (only used for short notes, not SMS)
_P_BARE = re.compile(r"(?<![\d,.\-/:a-zA-Z])(\d[\d,]*(?:\.\d+)?)(?![\d,.\-/:]*\d)(?![\d:/])")

# Numbers that are NOT the transaction: balances, fees, limits
_SKIP_BEFORE = re.compile(r"(bal(?:ance)?|avl|avail(?:able)?|limit|fee|fees|charges?|fed|wht|tax)\W{0,6}(?:is|:)?\W{0,3}$", re.I)


def _to_float(num: str) -> float:
    return float(num.replace(",", ""))


def _is_multiplier(word: str) -> bool:
    return word in MULTIPLIERS and word != "k"  # "k" usually means "ke" in Roman Urdu; "2k" is handled separately


def _is_number_part(word: str) -> bool:
    return word in WORD_NUMBERS or word in FRACTION_WORDS or _is_multiplier(word)


def _read_phrase(text: str, tokens, i: int):
    """Reads one spoken amount starting at tokens[i], like "do hazaar paanch sau" or "saadhe teen sau".
    tokens: [(start, end, lower_word)]. Returns (next_index, value, words_used, multiplier_count) or None."""
    total = 0.0
    current: Optional[float] = None
    fraction: Optional[float] = None
    last_mult: Optional[int] = None
    used: List[str] = []
    mults = 0
    j = i
    while j < len(tokens):
        if j > i:
            gap = tokens[j][0] - tokens[j - 1][1]
            if gap > 3 or not _ONLY_SPACE.match(text[tokens[j - 1][1]:tokens[j][0]]):
                break
        word = tokens[j][2]
        following = tokens[j + 1][2] if j + 1 < len(tokens) else ""
        if word in FRACTION_WORDS:
            if current is not None or fraction is not None:
                break
            if not (following in WORD_NUMBERS or following[:1].isdigit() or _is_multiplier(following)):
                break
            fraction = FRACTION_WORDS[word]
        elif _is_multiplier(word):
            mult = MULTIPLIERS[word]
            if current is None:
                if fraction is not None:
                    current, fraction = 1 + fraction, None
                elif used and last_mult is None:
                    break
                else:
                    current = 1.0
            if mult == 100:
                current *= 100
            else:
                total += current * mult
                current = None
            last_mult = mult
            mults += 1
        elif word in WORD_NUMBERS or word[:1].isdigit():
            is_digit = word[:1].isdigit()
            value = _to_float(word) if is_digit else WORD_NUMBERS[word]
            if current is None:
                if last_mult is not None and value >= last_mult:
                    break
            elif not (last_mult == 100 and current % 100 == 0 and value < 100):
                break
            # "paanch sau do" is probably "give 500", not 502: an ambiguous last word is left out
            if last_mult is not None and word in _AMBIGUOUS_ALONE and not _is_multiplier(following):
                break
            if fraction is not None:
                value, fraction = value + fraction, None
            current = (current or 0.0) + value
        else:
            break
        used.append(word)
        j += 1
    if not used or fraction is not None:
        return None
    return j, total + (current or 0.0), used, mults


_ONLY_SPACE = re.compile(r"^[ \t-]*$")


def _word_phrases(text: str, allow_bare: bool):
    """[(start, end, value)] for amounts written with number words."""
    tokens = [(m.start(), m.end(), m.group(0).lower()) for m in _TOKEN.finditer(text)]
    out = []
    i = 0
    while i < len(tokens):
        word = tokens[i][2]
        if not (_is_number_part(word) or word[:1].isdigit()):
            i += 1
            continue
        phrase = _read_phrase(text, tokens, i)
        if phrase is None:
            i += 1
            continue
        j, value, used, mults = phrase
        start, end = tokens[i][0], tokens[j - 1][1]
        has_words = any(not w[:1].isdigit() and not _is_multiplier(w) for w in used)
        currency = bool(_CUR_BEFORE.search(text[:start]) or _CUR_AFTER.search(text[end:]))
        if mults:
            # plain "2 hazaar" is left to the digit patterns; "sau" with no number needs a currency word
            digit_after_mult = any(w[:1].isdigit() for w in used[1:])
            only_mults = all(_is_multiplier(w) for w in used)
            take = (has_words or mults > 1 or digit_after_mult) and not (only_mults and not currency)
        else:
            take = has_words and (
                currency or (allow_bare and value >= 11 and not any(w in _AMBIGUOUS_ALONE for w in used)))
        if take and value > 0:
            out.append((start, end, value))
        i = j
    return out


def _amount_spans(text: str, allow_bare: bool, skip_balances: bool) -> List[Tuple[int, int, float]]:
    found: List[Tuple[int, int, float]] = []  # start, end, value

    def overlaps(a: int, b: int) -> bool:
        return any(a < e and b > s for s, e, _ in found)

    def add(start: int, end: int, value: float):
        if value > 0 and not overlaps(start, end):
            found.append((start, end, value))

    for start, end, value in _word_phrases(text, allow_bare):
        add(start, end, value)
    for m in _P_CUR_FIRST.finditer(text):
        value = _to_float(m.group(2)) * (MULTIPLIERS[m.group(3).lower()] if m.group(3) else 1)
        add(m.start(), m.end(), value)
    for m in _P_CUR_LAST.finditer(text):
        value = _to_float(m.group(1)) * (MULTIPLIERS[m.group(2).lower()] if m.group(2) else 1)
        add(m.start(), m.end(), value)
    for m in _P_DIGIT_MULT.finditer(text):
        add(m.start(), m.end(), _to_float(m.group(1)) * MULTIPLIERS[m.group(2).lower()])
    if allow_bare:
        for m in _P_BARE.finditer(text):
            value = _to_float(m.group(1))
            if value >= 1 and len(m.group(1).replace(",", "").split(".")[0]) <= 9:
                add(m.start(), m.end(), value)

    found.sort()
    result = []
    for start, end, value in found:
        before = _CUR_BEFORE.sub("", text[max(0, start - 28):start])
        if skip_balances and _SKIP_BEFORE.search(before[-22:]):
            continue
        result.append((start, end, round(value, 2)))
    return result


def extract_amounts(text: str, allow_bare: bool = False, skip_balances: bool = True) -> List[Tuple[int, float]]:
    """Returns [(position, amount), ...] in the order they appear in the text."""
    return [(start, value) for start, _end, value in _amount_spans(text, allow_bare, skip_balances)]


def unsure_amounts(text: str, allow_bare: bool = False, skip_balances: bool = True) -> List[float]:
    """Amounts we may have read only partly: a number word sits right next to them (for example
    "paanch sau do" or "500 pachas"). The rules must not overrule the AI with these."""
    tokens = [(m.start(), m.end(), m.group(0).lower()) for m in _TOKEN.finditer(text)]
    unsure = []
    for start, end, value in _amount_spans(text, allow_bare, skip_balances):
        before = [t for t in tokens if t[1] <= start]
        after = [t for t in tokens if t[0] >= end]
        near = []
        if before and _ONLY_SPACE.match(text[before[-1][1]:start]):
            near.append(before[-1][2])
        if after and _ONLY_SPACE.match(text[end:after[0][0]]):
            near.append(after[0][2])
        if any(_is_number_part(w) for w in near):
            unsure.append(value)
    return unsure


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
    return rf"(?<![A-Za-z{_UR_LETTER}]){re.escape(word)}(?![A-Za-z{_UR_LETTER}])"


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


# Urdu words must stand alone: "ملی" (received) must not match inside "فیملی" (family)
def _urdu_words(*words: str) -> str:
    return rf"(?<![{_UR_LETTER}])(?:{'|'.join(words)})(?![{_UR_LETTER}])"


_INCOME_WORDS = re.compile(
    r"\b(received|receive|credited|credit|salary|deposited|deposit|incoming|mosool|mausool|mila|mili|aaye|aya|"
    r"tankhwah|tankhah|refund)\b|" + _urdu_words("تنخواہ", "موصول", "ملی", "ملا", "ملے"), re.I)
_EXPENSE_WORDS = re.compile(
    r"\b(sent|paid|debited|debit|withdrawn|withdrawal|purchase|purchased|spent|used for|transferred to|"
    r"payment of|payment|bheja|bheje|bhejay|ada|kharch|khareeda|kharida|barwaya|bharwaya|kiya|kia)\b|"
    + _urdu_words("ادا", "خرچ", "خریدا", "بھیجے", "بھیجا"), re.I)


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
    r"\b(salary|tankhwah|tankhah|mosool|mausool|received|credited)\b|" + _urdu_words("تنخواہ", "موصول"), re.I)


def strong_income(text: str) -> bool:
    return bool(_STRONG_INCOME.search(text))


# ============================================================ SCAM RULES

# Any host.ending counts as a link. A bare one (no http or www) needs its ending all in small or all in
# capital letters, so that two sentences typed without a space ("received.Thank you") are not a link.
_URL = re.compile(
    r"(?i:https?://[^\s]+|www\.[^\s]+)"
    r"|(?<![@\w.-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+(?:[a-z]{2,24}|[A-Z]{2,24})(?![A-Za-z0-9-])(?:/[^\s]*)?")

OFFICIAL_DOMAINS = [
    "jazzcash.com.pk", "jazz.com.pk", "easypaisa.com.pk", "telenor.com.pk", "zong.com.pk", "ufone.com",
    "hbl.com", "meezanbank.com", "ubl.com.pk", "ubldigital.com", "mcb.com.pk", "abl.com", "bankalfalah.com",
    "askaribank.com.pk", "faysalbank.com", "bop.com.pk", "sbp.org.pk", "pta.gov.pk", "bisp.gov.pk",
    "tcsexpress.com", "leopardscourier.com", "postex.pk", "pakpost.gov.pk", "daraz.pk", "careem.com",
    "k-electric.com", "ke.com.pk", "ptcl.com.pk", "nadra.gov.pk", "sngpl.com.pk", "ssgc.com.pk",
    "lesco.gov.pk", "iesco.com.pk", "fesco.com.pk", "mepco.com.pk", "gepco.com.pk", "pesco.gov.pk",
    "wapda.gov.pk", "foodpanda.pk", "bankislami.com.pk", "nayatel.com", "stormfiber.com",
    "nbp.com.pk", "bankalhabib.com", "sc.com", "jsbl.com",
]

# Websites that scammers like: free or cheap endings, and link shorteners.
RISKY_ENDINGS = ("xyz", "top", "cfd", "click", "icu", "vip", "club", "site", "online", "live", "tk", "ml",
                 "cc", "ly", "gl", "link", "biz", "info", "shop")
SHORTENERS = ("bit.ly", "tinyurl.com", "cutt.ly", "t.co", "goo.gl", "rb.gy", "is.gd", "shorturl.at", "ow.ly")
# A website name that copies a brand people trust
BRAND_WORDS = ("jazz", "easypaisa", "hbl", "meezan", "ubl", "bisp", "benazir", "ehsaas", "nadra", "tcs", "leopards",
               "daraz", "bank", "alfalah", "askari", "faysal", "nbp", "sbp", "pta", "ptcl", "secure", "verify")
# Words that mean "do something on this site now" (whole words: "confirmed" is not "confirm")
ACTION_WORDS = re.compile(
    r"\b(verify|verification|login|log in|click|claim|unlock|update|confirm|kyc|secure|apply|register|"
    r"reactivate|reactivation|limited|suspend|suspended|block|blocked|expire|expired)\b", re.I)


def find_links(text: str) -> List[str]:
    return [m.group(0).rstrip(".,;)") for m in _URL.finditer(text)]


def _host(link: str) -> str:
    parsed = urlparse(link if "//" in link else "http://" + link)
    return (parsed.hostname or "").lower()


def _is_official(host: str) -> bool:
    return any(host == d or host.endswith("." + d) for d in OFFICIAL_DOMAINS)


def _is_lookalike(host: str) -> bool:
    """An unofficial website whose name copies a bank or brand. Short names (ubl, tcs, pta ...) must be a
    whole part of the name, so that "publisher.com" is not taken for UBL."""
    parts = re.split(r"[.-]", host)
    return any(w in parts or (len(w) >= 4 and any(w in p for p in parts)) for w in BRAND_WORDS)


def suspicious_links(text: str) -> List[str]:
    """Links that are not an official website AND look risky: a link shortener, a cheap ending like .xyz,
    a name that copies a bank or brand, or a message that tells you to verify/claim/click.
    A plain unknown website (for example a shop's own page) is not flagged on its own."""
    bad = []
    context_risky = bool(ACTION_WORDS.search(text))
    for link in find_links(text):
        host = _host(link)
        if _is_official(host):
            continue
        ending = host.rsplit(".", 1)[-1]
        if host in SHORTENERS or ending in RISKY_ENDINGS or _is_lookalike(host) or context_risky:
            bad.append(link)
    return bad


_NEG = re.compile(r"(?<![\w'])(do not|don't|dont|never|na|nahi|nahin|mat|not)(?![\w'])|(?:^|\s)(نہ|مت|نہیں)(?=\s|$)", re.I)
_NEVER_ASK = re.compile(r"\b(never|not|n't)\s+(?:\w+\s+)?ask", re.I)
# "enter", "type", "confirm" and "verify" are not here: apps ask you to type a code into the app itself
_VERB = (r"(?:share|send|give|provide|reply|tell|submit|text|sms|whatsapp|forward|"
         r"bhej\w*|bata\w*|likh\w*|dein|do)")
_SECRET = (r"(?:otp|pin|cnic|password|passcode|cvv|verification code|security code|(?:\d-?digit )?code|"
           r"identity card|id card|account number|شناختی کارڈ|پن|پاس ورڈ)")
_REQ_A = re.compile(rf"(?<![A-Za-z])({_VERB})(?![A-Za-z])[^.\n]{{0,45}}?(?<![A-Za-z])({_SECRET})(?![A-Za-z])", re.I)
_REQ_B = re.compile(rf"(?<![A-Za-z])({_SECRET})(?![A-Za-z])[^.\n]{{0,40}}?(?<![A-Za-z])({_VERB})(?![A-Za-z])", re.I)
_CLAUSE_BREAK = ".!?,;\n،۔؟"


def _is_warning(text: str, verb_start: int, verb_end: int) -> bool:
    """"Do not share ...", "PIN na batayen", "share mat karein", "we never ask ...". A "not" only counts
    in the same part of the sentence: within 3 words before the verb, or the word right after it."""
    clause_start = max(text.rfind(c, 0, verb_start) for c in _CLAUSE_BREAK) + 1
    before = text[clause_start:verb_start]
    words_before = " ".join(before.split()[-3:])
    word_after = re.split(rf"[{re.escape(_CLAUSE_BREAK)}]", text[verb_end:])[0].split()[:1]
    nearby = f"{words_before} | {' '.join(word_after)}"
    return bool(_NEG.search(nearby) or _NEVER_ASK.search(before))


def asks_for_secret(text: str) -> bool:
    """Is the message asking the user to hand over an OTP, PIN, CNIC, password or code?
    Warnings do not count (see _is_warning). "by SMS" or "via WhatsApp" describe how, they are not an order."""
    for pattern, verb_group in ((_REQ_A, 1), (_REQ_B, 2)):
        position = 0
        while True:
            m = pattern.search(text, position)
            if not m:
                break
            position = m.start() + 1  # look again from the next letter, so one warning cannot hide a request
            start, end = m.start(verb_group), m.end(verb_group)
            if _is_warning(text, start, end):
                continue
            verb = m.group(verb_group).lower()
            if verb in ("sms", "text", "whatsapp") and re.search(
                    r"\b(by|via|through|over|on|in)\s+$", text[max(0, start - 8):start], re.I):
                continue
            return True
    return False


_FEE_WORD = (r"(?:fee|fees|charges?|tax|processing|registration|security|deposit|customs|advance|"
             r"inaam tax)")
_PAY_VERB = r"(?:pay|send|deposit|transfer|jama|bhej\w*|ada|karein|karen|karwayein|kijiye|dein)"
_AMT = r"(?:rs\.?\s?\d[\d,]*|\d[\d,]*\s*(?:rupay|rupees|rs))"
_FEE_PATTERNS = [
    re.compile(rf"(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])[^.\n]{{0,50}}?(?<![A-Za-z]){_FEE_WORD}(?![A-Za-z])", re.I),
    re.compile(rf"(?<![A-Za-z]){_FEE_WORD}(?![A-Za-z])[^.\n]{{0,60}}?(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])", re.I),
    re.compile(rf"(?:claim|release|inaam|receive|lene|prize|unlock)[^.\n]{{0,60}}?{_AMT}[^.\n]{{0,40}}?(?<![A-Za-z]){_PAY_VERB}(?![A-Za-z])", re.I),
    re.compile(rf"(?<![A-Za-z])(?:send|bhej\w*|jama|pay|deposit)(?![A-Za-z])[^.\n]{{0,40}}?{_AMT}[^.\n]{{0,50}}?(?:to (?:claim|receive|release|get|confirm)|claim|release|prize|inaam|lene ke liye)", re.I),
]
# "Joining fee Rs 1000 only. WhatsApp 0300..." has no "pay": a joining-type fee, an amount and a mobile number
_UPFRONT_FEE = re.compile(
    r"\b(joining|registration|processing|verification|application|activation|security)\s+(fee|fees|charges?)\b", re.I)
# Paying the delivery rider is normal. It only stays a "fee" if there is a link or a number to pay to.
_DELIVERY_CHARGES = re.compile(r"\b(delivery (?:charges?|fee)|cash on delivery|cod charges?|cod)\b", re.I)
_MOBILE = re.compile(r"(?<!\d)(?:\+?92[- ]?|0)3\d{2}[- ]?\d{7}(?!\d)")
_CONTACT = re.compile(r"\b(call|rabta|raabta|contact|dial|whatsapp)\b|رابطہ|کال", re.I)


def _has_unofficial_link(text: str) -> bool:
    return any(not _is_official(_host(link)) for link in find_links(text))


def asks_for_fee(text: str) -> bool:
    if _UPFRONT_FEE.search(text) and re.search(_AMT, text, re.I) and (_MOBILE.search(text) or _has_unofficial_link(text)):
        return True
    if not (_MOBILE.search(text) or _has_unofficial_link(text)):
        text = _DELIVERY_CHARGES.sub(" ", text)
    return any(p.search(text) for p in _FEE_PATTERNS)


# A prize noun, or a "you won" phrase. "Congratulations" or "Mubarak ho" alone are ordinary words.
_PRIZE = re.compile(
    r"(\bwon\b(?!')|\bwinner\b|jeet gaye|jeet chuke|jeeta hai|jeeti hai|\bjeeta\b|lucky draw|lottery|jackpot|"
    r"jeeto pakistan|\bprize\b|\binaam\b|انعام|لاٹری|جیت)", re.I)
_BISP = re.compile(r"\b(bisp|benazir|ehsaas|kafalat)\b|بینظیر|بے نظیر|احساس", re.I)
# Words in a BISP message that ask the user to act
_BISP_TRIGGER = re.compile(
    r"(claim|selected|inaam|prize|winner|mubarak|congrat|apply|register|verify now|"
    r"processing|bhej\w*|jama|send your)", re.I)
_BISP_LINK_WORDS = re.compile(r"(click|link|http)", re.I)
# With a mobile number to contact, these are a trap too: real BISP never asks you to call a mobile
_BISP_PHONE_TRIGGER = re.compile(r"\b(call|rabta|raabta|raqam|whatsapp|contact)\b|رابطہ|کال|رقم", re.I)
# The SENDER is 8171 (the message starts with it). "8171" somewhere inside the text proves nothing.
_FROM_8171 = re.compile(r"^\s*(?:(?:from|sender)\s*:?\s*)?(?:bisp\s+)?8171\s*[:\-]", re.I)
_WRONG_A = re.compile(r"(by mistake|mistakenly|accidentally|galti se|ghalti se|ghalat|wrong (?:number|transfer|account)|غلطی سے)", re.I)
_WRONG_B = re.compile(r"(send (?:it |the money |the amount )?back|return|wapas|refund|bhej\w*|لوٹا|واپس)", re.I)
_BLOCK = re.compile(r"(block|suspend|deactivat|freeze|frozen|close[d]? today|expire|band ho|band kar|بند)", re.I)
_VERIFY = re.compile(r"(verify|click|update your|confirm your|reactivat)", re.I)
_COURIER = re.compile(r"\b(parcel|courier|package|shipment|delivery|customs|tcs|leopards|dhl|fedex|postex|pakistan post)\b", re.I)
_JOB = re.compile(r"\b(job|hiring|vacancy|vacancies|naukri|visa|work from home|offer letter|recruit\w*)\b", re.I)


# Flags that only follow from another one. They never count toward the fast path.
_DERIVED = {"courier", "job"}


@dataclass
class ScamCheck:
    flags: List[str]        # every red flag found (used for the reason text)
    strong: List[str]       # flags that are enough on their own to say "scam", even if the AI disagrees
    independent: List[str]  # flags found by themselves (2 of these: answer "scam" without asking the AI)


def check_scam(text: str) -> ScamCheck:
    flags: List[str] = []
    derived = set(_DERIVED)
    links = suspicious_links(text)
    secret = asks_for_secret(text)
    fee = asks_for_fee(text)
    mobile = bool(_MOBILE.search(text))

    if fee:
        flags.append("fee")
    if secret:
        flags.append("secret")
    if _BISP.search(text):
        from_8171 = bool(_FROM_8171.search(text))
        own = (fee or secret
               or (_BISP_TRIGGER.search(text) and not from_8171)
               or (mobile and _BISP_PHONE_TRIGGER.search(text)))
        from_link = bool(links) or (bool(_BISP_LINK_WORDS.search(text)) and not from_8171)
        if own or from_link:
            flags.append("bisp")
            if not own:
                derived.add("bisp")
    if _PRIZE.search(text):
        flags.append("prize")
    if _WRONG_A.search(text) and _WRONG_B.search(text):
        flags.append("wrong_transfer")
    if _BLOCK.search(text) and (links or secret or _VERIFY.search(text) or (mobile and _CONTACT.search(text))):
        flags.append("threat")
    if links:
        flags.append("link")
    if _COURIER.search(text) and (fee or links):
        flags.append("courier")
    if _JOB.search(text) and fee:
        flags.append("job")

    independent = [f for f in flags if f not in derived]
    # A link is a weak sign on its own. It is strong when its name copies a bank or brand, or when it is a
    # short or cheap link AND the message asks you to act on it (verify, update, claim ...)
    hosts = [_host(link) for link in links]
    cheap = any(h in SHORTENERS or h.rsplit(".", 1)[-1] in RISKY_ENDINGS for h in hosts)
    strong_link = any(_is_lookalike(h) for h in hosts) or (cheap and bool(ACTION_WORDS.search(text)))
    strong = [f for f in independent if f != "link" or strong_link]
    return ScamCheck(flags, strong, independent)


def scam_flags(text: str) -> List[str]:
    """Which red flags the message has. An empty list means none found."""
    return check_scam(text).flags


_TXN_WORDS = re.compile(
    r"\b(sent|received|paid|debited|credited|withdraw\w*|purchase\w*|spent|transferred|used for|load|payment|"
    r"ada|mosool|bheja|trx|tid|ref|salary)\b", re.I)


_RECEIPT_MARKER = re.compile(r"\b(trx|tid|txn|transaction id|ref|reference|avl|available|bal|balance|a/c|acct)\b", re.I)
_ASKS_SOMETHING = re.compile(
    r"\b(please|kindly|pls|urgent\w*|asap|immediately|return|wapas|back|send|bhej\w*|reply|call|whatsapp|"
    r"click|claim|verify|confirm|visit|open|login|log in|dial|mistake|accident\w*|galti|ghalat|mehrbani)\b", re.I)


def looks_like_plain_confirmation(text: str) -> bool:
    """A normal receipt. It has an amount, transaction words AND a receipt marker (transaction id, balance ...),
    and it asks the user for nothing. Only then may we cancel an AI scam alarm."""
    return (
        bool(extract_amounts(text, skip_balances=False))
        and bool(_TXN_WORDS.search(text))
        and bool(_RECEIPT_MARKER.search(text))
        and not _ASKS_SOMETHING.search(text)
        and not find_links(text)  # never cancel an alarm when there is a link
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
