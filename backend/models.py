"""Shapes of the data going in and out. Pydantic checks them for us."""
from datetime import date as calendar_date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Same list as DESIGN.md. Anything else becomes "Other" so the app can always pick an icon.
CATEGORIES = [
    "Food", "Transport", "Bills", "Shopping", "Health", "Education",
    "Mobile", "Family", "Rent", "Income", "Other",
]


def _clean_category(v: str) -> str:
    for c in CATEGORIES:
        if str(v).strip().lower() == c.lower():
            return c
    return "Other"


def _real_date(v: str) -> str:
    calendar_date.fromisoformat(v)  # raises ValueError for dates like 2026-02-30
    return v


def _not_blank(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("must not be empty")
    return v


MAX_MONEY = 1_000_000_000  # Rs, a generous upper bound for anything we send back
MAX_RESULT = 1e15  # computed numbers (they can be negative)


def _money(**limits):
    """A finite, bounded number (never inf or nan)."""
    return Field(..., allow_inf_nan=False, **limits)


Lang = Literal["en", "ur"]
TxType = Literal["income", "expense"]
PaymentType = Literal["Cash", "JazzCash", "Easypaisa", "Bank card"]

Confidence = Literal["high", "medium", "low"]

DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"


# ---------- Requests (what the app sends us) ----------
class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    lang: Lang = "en"
    today: str = Field(..., pattern=DATE_PATTERN, examples=["2026-11-23"])

    _check_today = field_validator("today")(_real_date)
    _check_text = field_validator("text")(_not_blank)


# ---------- Responses (what the AI must give us) ----------
class SmsResult(BaseModel):
    amount: float = _money(ge=0, le=MAX_MONEY)
    type: TxType
    category: str
    paymentType: PaymentType
    merchant: str = ""
    date: str = Field(..., pattern=DATE_PATTERN)
    isScam: bool
    scamReason: Optional[str] = ""
    # How sure we are. Set by our code after checking the AI's answer against the rules.
    confidence: Confidence = "medium"

    _fix_category = field_validator("category", mode="before")(_clean_category)


class Transaction(BaseModel):
    amount: float = _money(gt=0, le=MAX_MONEY)
    type: TxType
    category: str
    paymentType: PaymentType = "Cash"
    merchant: str = ""
    date: str = Field(..., pattern=DATE_PATTERN)
    note: str = ""
    confidence: Confidence = "medium"

    _fix_category = field_validator("category", mode="before")(_clean_category)


class QuickEntryResult(BaseModel):
    transactions: List[Transaction]


# ---------- Bill Analyzer ----------
BillVerdict = Literal["looks_ok", "check", "likely_overbilled"]


class BillRequest(BaseModel):
    lang: Lang = "en"
    company: Optional[str] = Field(None, max_length=60)  # for example "IESCO"
    bill_month: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-10"])
    previous_reading: float = Field(..., allow_inf_nan=False, ge=0, le=100_000_000)
    current_reading: float = Field(..., allow_inf_nan=False, ge=0, le=100_000_000)
    units_billed: float = Field(..., allow_inf_nan=False, ge=0, le=1_000_000)
    amount: float = Field(..., allow_inf_nan=False, ge=0, le=100_000_000)  # total payable, in Rs
    last_month_units: Optional[float] = Field(None, allow_inf_nan=False, ge=0, le=1_000_000)
    same_month_last_year_units: Optional[float] = Field(None, allow_inf_nan=False, ge=0, le=1_000_000)


class BillIssue(BaseModel):
    code: str
    message: str


class BillAiText(BaseModel):
    """What we ask the AI for. The AI writes words only, never numbers."""
    explanation: str
    tips: List[str]
    complaint: str = ""


class BillResult(BaseModel):
    verdict: BillVerdict
    reading_units: float = _money(ge=-MAX_RESULT, le=MAX_RESULT)
    units_billed: float = _money(ge=0, le=MAX_RESULT)
    extra_units: float = _money(ge=-MAX_RESULT, le=MAX_RESULT)
    cost_per_unit: float = _money(ge=0, le=MAX_RESULT)
    issues: List[BillIssue]
    explanation: str
    tips: List[str]
    complaint: str = ""


# ---------- Can I afford it? ----------
AffordVerdict = Literal["yes", "careful", "not_now"]


class AffordRequest(BaseModel):
    lang: Lang = "en"
    item: str = Field(..., min_length=1, max_length=80)  # what the user wants to buy
    price: float = Field(..., allow_inf_nan=False, gt=0, le=100_000_000)
    today: str = Field(..., pattern=DATE_PATTERN)
    monthly_income: float = Field(..., allow_inf_nan=False, gt=0, le=100_000_000)
    spent_this_month: float = Field(..., allow_inf_nan=False, ge=0, le=100_000_000)
    days_left_in_month: int = Field(..., ge=0, le=31)
    avg_daily_spend: float = Field(..., allow_inf_nan=False, ge=0, le=10_000_000)  # last 30 days
    upcoming_bills_estimate: Optional[float] = Field(None, allow_inf_nan=False, ge=0, le=100_000_000)
    savings_goal_monthly: Optional[float] = Field(None, allow_inf_nan=False, ge=0, le=100_000_000)

    _check_today = field_validator("today")(_real_date)
    _check_item = field_validator("item")(_not_blank)


class AffordAiText(BaseModel):
    """What we ask the AI for. Words only, never numbers."""
    explanation: str
    suggestion: str


class AffordResult(BaseModel):
    verdict: AffordVerdict
    price: float = _money(ge=0, le=MAX_RESULT)
    remaining: float = _money(ge=-MAX_RESULT, le=MAX_RESULT)
    safe_to_spend: float = _money(ge=-MAX_RESULT, le=MAX_RESULT)
    needed_until_month_end: float = _money(ge=0, le=MAX_RESULT)
    weeks_to_save: int = Field(..., ge=0, le=1_000_000_000)
    weekly_saving: float = _money(ge=0, le=MAX_RESULT)
    explanation: str
    suggestion: str
