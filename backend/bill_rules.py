"""Bill Analyzer math. Plain rules, no AI. These numbers are final: the AI only explains them.

Rules:
  1. reading_units = current_reading - previous_reading. If current < previous: "reading_error".
  2. If units_billed differs from reading_units by more than 5 units: "units_mismatch".
  3. Units more than 40% higher than last month: "sudden_jump".
  4. Units more than 40% higher than the same month last year: "higher_than_last_year".
  5. Billed units from 180 to 200: warning "near_200". Above 200: note "above_200".
  6. cost_per_unit = amount / units_billed, rounded to 1 decimal.
  7. Verdict: "likely_overbilled" (reading_error, or billed units clearly above the readings),
     "check" (any warning or jump), otherwise "looks_ok".
"""
from typing import Any, Dict, List, Optional

MISMATCH_TOLERANCE_UNITS = 5
JUMP_PERCENT = 40
NEAR_200_FROM = 180
LIMIT_200 = 200

# Warnings make the verdict "check". Notes (above_200) do not change it.
WARNINGS = {"sudden_jump", "higher_than_last_year", "near_200"}

# Messages in both languages. {placeholders} are filled with the numbers worked out below.
MESSAGES = {
    "en": {
        "reading_error": "Your current reading ({current}) is lower than your previous reading ({previous}). "
                         "Please check the meter readings printed on the bill.",
        "units_mismatch_over": "The bill charges {billed} units but your readings show {reading} units. "
                               "That is {extra} extra units.",
        "units_mismatch_under": "The bill charges {billed} units but your readings show {reading} units. "
                                "The bill is {less} units lower than the meter, so a catch-up charge may come later.",
        "sudden_jump": "Your units are {percent}% higher than last month ({last} units).",
        "higher_than_last_year": "Your units are {percent}% higher than the same month last year ({last} units).",
        "near_200": "You used {billed} units. Going above 200 units can make your next bills much more expensive.",
        "above_200": "You used {billed} units, which is above 200. Units above this level cost more per unit.",
    },
    "ur": {
        "reading_error": "آپ کی موجودہ ریڈنگ ({current}) پچھلی ریڈنگ ({previous}) سے کم ہے۔ "
                         "براہ کرم بل پر لکھی میٹر ریڈنگ دیکھیں۔",
        "units_mismatch_over": "بل میں {billed} یونٹ لگائے گئے ہیں لیکن آپ کی ریڈنگ {reading} یونٹ دکھاتی ہے۔ "
                               "یہ {extra} یونٹ زیادہ ہیں۔",
        "units_mismatch_under": "بل میں {billed} یونٹ لگائے گئے ہیں لیکن آپ کی ریڈنگ {reading} یونٹ دکھاتی ہے۔ "
                                "بل میٹر سے {less} یونٹ کم ہے، اس لیے بعد میں فرق کی رقم آ سکتی ہے۔",
        "sudden_jump": "آپ کے یونٹ پچھلے مہینے ({last} یونٹ) سے {percent} فیصد زیادہ ہیں۔",
        "higher_than_last_year": "آپ کے یونٹ پچھلے سال اسی مہینے ({last} یونٹ) سے {percent} فیصد زیادہ ہیں۔",
        "near_200": "آپ نے {billed} یونٹ استعمال کیے۔ 200 یونٹ سے اوپر جانے پر اگلے بل بہت مہنگے ہو سکتے ہیں۔",
        "above_200": "آپ نے {billed} یونٹ استعمال کیے جو 200 سے اوپر ہیں۔ اس سے اوپر کے یونٹ زیادہ مہنگے لگتے ہیں۔",
    },
}


def _num(x: float) -> str:
    """12.0 -> "12", 12.5 -> "12.5" (for messages)."""
    return str(int(x)) if float(x) == int(x) else str(round(float(x), 1))


def _percent_higher(now: float, before: float) -> int:
    return round((now - before) / before * 100)


def _more_than_40_percent_higher(now: float, before: Optional[float]) -> bool:
    # whole-number maths so that exactly 40% is not "more than 40%"
    return before is not None and before > 0 and now * 100 > before * (100 + JUMP_PERCENT)


def analyze(
    previous_reading: float,
    current_reading: float,
    units_billed: float,
    amount: float,
    last_month_units: Optional[float] = None,
    same_month_last_year_units: Optional[float] = None,
    lang: str = "en",
) -> Dict[str, Any]:
    """Returns every number and issue. Nothing here comes from an AI."""
    msgs = MESSAGES["ur" if lang == "ur" else "en"]
    issues: List[Dict[str, str]] = []
    facts: Dict[str, Any] = {}  # numbers for each issue, handed to the AI later

    reading_units = current_reading - previous_reading
    reading_error = current_reading < previous_reading
    extra_units = 0.0

    if reading_error:
        issues.append({"code": "reading_error", "message": msgs["reading_error"].format(
            current=_num(current_reading), previous=_num(previous_reading))})
    else:
        extra_units = units_billed - reading_units
        if abs(extra_units) > MISMATCH_TOLERANCE_UNITS:
            key = "units_mismatch_over" if extra_units > 0 else "units_mismatch_under"
            issues.append({"code": "units_mismatch", "message": msgs[key].format(
                billed=_num(units_billed), reading=_num(reading_units),
                extra=_num(extra_units), less=_num(-extra_units))})

    if _more_than_40_percent_higher(units_billed, last_month_units):
        percent = _percent_higher(units_billed, last_month_units)
        facts["sudden_jump_percent"] = percent
        issues.append({"code": "sudden_jump", "message": msgs["sudden_jump"].format(
            percent=percent, last=_num(last_month_units))})

    if _more_than_40_percent_higher(units_billed, same_month_last_year_units):
        percent = _percent_higher(units_billed, same_month_last_year_units)
        facts["higher_than_last_year_percent"] = percent
        issues.append({"code": "higher_than_last_year", "message": msgs["higher_than_last_year"].format(
            percent=percent, last=_num(same_month_last_year_units))})

    if NEAR_200_FROM <= units_billed <= LIMIT_200:
        issues.append({"code": "near_200", "message": msgs["near_200"].format(billed=_num(units_billed))})
    elif units_billed > LIMIT_200:
        issues.append({"code": "above_200", "message": msgs["above_200"].format(billed=_num(units_billed))})

    cost_per_unit = round(amount / units_billed, 1) if units_billed > 0 else 0.0

    codes = {i["code"] for i in issues}
    overbilled = "units_mismatch" in codes and extra_units > MISMATCH_TOLERANCE_UNITS
    if reading_error or overbilled:
        verdict = "likely_overbilled"
    elif codes & (WARNINGS | {"units_mismatch"}):
        verdict = "check"  # warnings, a jump, or billed units that are lower than the meter
    else:
        verdict = "looks_ok"

    return {
        "verdict": verdict,
        "reading_units": reading_units,
        "units_billed": units_billed,
        "extra_units": extra_units,
        "cost_per_unit": cost_per_unit,
        "issues": issues,
        "facts": facts,
    }


# ---------------------------------------------------------------- fallback texts (used if the AI is down)
MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
           "November", "December"],
    "ur": ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"],
}

FALLBACK_TIPS = {
    "en": [
        "Switch off lights and fans when you leave a room, and use LED bulbs.",
        "Set the AC to 26 degrees and use it for fewer hours.",
        "Run the iron and the water motor or pump outside the evening peak hours (about 6 pm to 10 pm).",
    ],
    "ur": [
        "کمرے سے نکلتے وقت لائٹ اور پنکھے بند کریں اور ایل ای ڈی بلب لگائیں۔",
        "اے سی 26 ڈگری پر رکھیں اور اسے کم گھنٹے چلائیں۔",
        "استری اور پانی کی موٹر شام کے مہنگے اوقات (تقریباً 6 سے 10 بجے) میں نہ چلائیں۔",
    ],
}


def month_label(bill_month: str, lang: str) -> str:
    year, month = bill_month.split("-")
    return f"{MONTHS['ur' if lang == 'ur' else 'en'][int(month) - 1]} {year}"


def fallback_tips(lang: str) -> List[str]:
    return list(FALLBACK_TIPS["ur" if lang == "ur" else "en"])


def fallback_explanation(result: Dict[str, Any], amount: float, lang: str) -> str:
    billed, cost = _num(result["units_billed"]), _num(result["cost_per_unit"])
    verdict = result["verdict"]
    if lang == "ur":
        text = f"آپ کا بل {_num(amount)} روپے ہے، {billed} یونٹ کے، یعنی تقریباً {cost} روپے فی یونٹ۔ "
        if verdict == "likely_overbilled":
            text += "ریڈنگ اور بل کے یونٹ آپس میں نہیں ملتے، اس لیے بل کی جانچ کروائیں۔"
        elif verdict == "check":
            text += "کچھ باتیں دیکھنے والی ہیں، اوپر دیے گئے نکات پڑھیں۔"
        else:
            text += "کوئی غیر معمولی بات نہیں ملی۔"
        return text
    text = f"Your bill is Rs {_num(amount)} for {billed} units, about Rs {cost} per unit. "
    if verdict == "likely_overbilled":
        text += "The readings and the billed units do not match, so please get the bill checked."
    elif verdict == "check":
        text += "A few things need a look. Please read the notes above."
    else:
        text += "Nothing unusual was found."
    return text


def fallback_complaint(result: Dict[str, Any], req: Dict[str, Any], lang: str) -> str:
    """A short complaint written from a template, used if the AI is down. Only for likely_overbilled."""
    if result["verdict"] != "likely_overbilled":
        return ""
    month = month_label(req["bill_month"], lang)
    prev, cur = _num(req["previous_reading"]), _num(req["current_reading"])
    billed, reading, extra = _num(result["units_billed"]), _num(result["reading_units"]), _num(result["extra_units"])
    company = (req.get("company") or "").strip()
    reading_error = any(i["code"] == "reading_error" for i in result["issues"])
    if lang == "ur":
        to = company or "بجلی کمپنی"
        if reading_error:
            body = (f"{month} کے بل میں میری موجودہ ریڈنگ ({cur}) پچھلی ریڈنگ ({prev}) سے کم لکھی گئی ہے، "
                    f"جبکہ بل میں {billed} یونٹ لگائے گئے ہیں۔ براہ کرم میٹر کی ریڈنگ جانچ کر بل درست کریں۔")
        else:
            body = (f"{month} کے بل میں میری ریڈنگ {prev} (پچھلی) اور {cur} (موجودہ) ہے، یعنی {reading} یونٹ، "
                    f"لیکن بل میں {billed} یونٹ لگائے گئے ہیں۔ یہ {extra} یونٹ زیادہ ہیں۔ "
                    f"براہ کرم میٹر کی ریڈنگ جانچ کر بل درست کریں۔")
        return f"محترم {to} کسٹمر سروس، {body} شکریہ۔ صارف نمبر: [اپنا صارف نمبر]"
    to = company or "Electricity Company"
    if reading_error:
        body = (f"In the bill for {month}, my current reading ({cur}) is lower than my previous reading ({prev}), "
                f"but the bill charges {billed} units. Please check the meter reading and correct the bill.")
    else:
        body = (f"For the bill of {month}, my meter readings are {prev} (previous) and {cur} (current), "
                f"which is {reading} units, but the bill charges {billed} units. That is {extra} extra units. "
                f"Please check the meter reading and correct the bill.")
    return f"Dear {to} Customer Service, {body} Thank you. Consumer number: [your consumer number]"
