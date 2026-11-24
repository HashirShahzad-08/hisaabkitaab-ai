"""Can I afford it? Plain rules, no AI. These numbers are final: the AI only explains them.

  remaining               = monthly_income - spent_this_month
  needed_until_month_end  = avg_daily_spend * days_left_in_month + upcoming_bills_estimate
  buffer                  = 10% of monthly_income
  safe_to_spend           = remaining - needed_until_month_end - buffer      (can be negative)

  verdict "yes"      if price <= safe_to_spend
          "careful"  if price <= remaining - needed_until_month_end          (only the buffer would be used)
          "not_now"  otherwise

  for "not_now":
      weekly_saving = max(10% of monthly_income / 4.3, 500)
      weeks_to_save = ceil(price / weekly_saving)
      "after next salary" is also suggested if price <= 30% of monthly_income

savings_goal_monthly is accepted but does not change the math (the rules above are fixed).
"""
import math
from typing import Any, Dict, Optional

BUFFER_PERCENT = 10
WEEKLY_SAVING_PERCENT = 10
WEEKS_PER_MONTH = 4.3
MIN_WEEKLY_SAVING = 500
AFTER_SALARY_PERCENT = 30


def _rs(x: float) -> int:
    """Whole rupees for display."""
    return int(round(x))


def analyze(
    price: float,
    monthly_income: float,
    spent_this_month: float,
    days_left_in_month: int,
    avg_daily_spend: float,
    upcoming_bills_estimate: Optional[float] = None,
    savings_goal_monthly: Optional[float] = None,  # accepted, not used in the math
) -> Dict[str, Any]:
    upcoming = upcoming_bills_estimate or 0.0

    remaining = monthly_income - spent_this_month
    needed = avg_daily_spend * days_left_in_month + upcoming
    buffer = monthly_income * BUFFER_PERCENT / 100
    safe_to_spend = remaining - needed - buffer
    without_buffer = remaining - needed

    if price <= safe_to_spend:
        verdict = "yes"
    elif price <= without_buffer:
        verdict = "careful"
    else:
        verdict = "not_now"

    weekly_saving = max(monthly_income * WEEKLY_SAVING_PERCENT / 100 / WEEKS_PER_MONTH, MIN_WEEKLY_SAVING)
    weeks_to_save = math.ceil(price / weekly_saving) if verdict == "not_now" else 0
    after_salary = verdict == "not_now" and price <= monthly_income * AFTER_SALARY_PERCENT / 100

    return {
        "verdict": verdict,
        "price": _rs(price),
        "remaining": _rs(remaining),
        "safe_to_spend": _rs(safe_to_spend),
        "needed_until_month_end": _rs(needed),
        "weeks_to_save": weeks_to_save,
        "weekly_saving": _rs(weekly_saving),
        "after_salary": after_salary,
    }


# ---------------------------------------------------------------- template texts (used if the AI is down)
def _rs_text(n: float, lang: str) -> str:
    text = f"{abs(_rs(n)):,}"
    sign = "-" if _rs(n) < 0 else ""
    return f"{sign}{text} روپے" if lang == "ur" else f"{sign}Rs {text}"


def fallback_explanation(result: Dict[str, Any], item: str, lang: str) -> str:
    item = item.strip()[:60]
    price, remaining, safe = (_rs_text(result[k], lang) for k in ("price", "remaining", "safe_to_spend"))
    verdict = result["verdict"]
    if lang == "ur":
        if verdict == "yes":
            return (f"آپ {item} خرید سکتے ہیں۔ اس کی قیمت {price} ہے۔ مہینے کے آخر تک کے معمول کے خرچ اور بلوں کے بعد بھی "
                    f"آپ کے پاس تقریباً {safe} آرام سے خرچ کرنے کے لیے بچتے ہیں۔")
        if verdict == "careful":
            return (f"{item} کی قیمت {price} ہے اور آپ کے پاس اس مہینے {remaining} باقی ہیں۔ آپ خرید سکتے ہیں، "
                    f"لیکن اس سے آپ کی احتیاطی بچت استعمال ہو جائے گی۔")
        return (f"ابھی {item} خریدنا مشکل ہے۔ اس کی قیمت {price} ہے جبکہ اس مہینے آپ کے پاس {remaining} باقی ہیں "
                f"اور مہینے کے آخر تک کے خرچ کے لیے رقم چاہیے۔")
    if verdict == "yes":
        return (f"You can afford {item}. It costs {price}. After your usual spending and bills until the end of the month, "
                f"you would still have about {safe} safe to spend.")
    if verdict == "careful":
        return (f"{item} costs {price} and you have {remaining} left this month. You can buy it, "
                f"but it would use up your safety buffer.")
    return (f"{item} is hard to afford right now. It costs {price} but you have {remaining} left this month, "
            f"and you need money for the rest of the month.")


def fallback_suggestion(result: Dict[str, Any], lang: str) -> str:
    verdict = result["verdict"]
    weekly = _rs_text(result["weekly_saving"], lang)
    weeks = result["weeks_to_save"]
    if lang == "ur":
        if verdict == "yes":
            return "خرید لیں، لیکن باقی مہینے کا خرچ معمول پر رکھیں۔"
        if verdict == "careful":
            return "کوئی سستا آپشن دیکھ لیں، یا اگلی تنخواہ کا انتظار کریں تاکہ آپ کی احتیاطی بچت نہ چھیڑنی پڑے۔"
        text = f"ہر ہفتے {weekly} بچائیں، تقریباً {weeks} ہفتوں میں یہ رقم جمع ہو جائے گی۔"
        if result["after_salary"]:
            text += " یا اگلی تنخواہ کے بعد خریدیں۔"
        return text
    if verdict == "yes":
        return "Go ahead, but keep the rest of your month's spending steady."
    if verdict == "careful":
        return "Look for a cheaper option, or wait for your next salary so you do not touch your safety buffer."
    text = f"Save {weekly} a week and you will have the money in about {weeks} weeks."
    if result["after_salary"]:
        text += " Or buy it after your next salary."
    return text
