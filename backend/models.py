"""Shapes of the data going in and out. Pydantic checks them for us."""
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


# ---------- Responses (what the AI must give us) ----------
class SmsResult(BaseModel):
    amount: float = Field(..., ge=0)
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
    amount: float = Field(..., gt=0)
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
    previous_reading: float = Field(..., ge=0, le=100_000_000)
    current_reading: float = Field(..., ge=0, le=100_000_000)
    units_billed: float = Field(..., ge=0, le=1_000_000)
    amount: float = Field(..., ge=0, le=100_000_000)  # total payable, in Rs
    last_month_units: Optional[float] = Field(None, ge=0, le=1_000_000)
    same_month_last_year_units: Optional[float] = Field(None, ge=0, le=1_000_000)


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
    reading_units: float
    units_billed: float
    extra_units: float
    cost_per_unit: float
    issues: List[BillIssue]
    explanation: str
    tips: List[str]
    complaint: str = ""


# ---------- Can I afford it? ----------
AffordVerdict = Literal["yes", "careful", "not_now"]


class AffordRequest(BaseModel):
    lang: Lang = "en"
    item: str = Field(..., min_length=1, max_length=80)  # what the user wants to buy
    price: float = Field(..., gt=0, le=100_000_000)
    today: str = Field(..., pattern=DATE_PATTERN)
    monthly_income: float = Field(..., gt=0, le=100_000_000)
    spent_this_month: float = Field(..., ge=0, le=100_000_000)
    days_left_in_month: int = Field(..., ge=0, le=31)
    avg_daily_spend: float = Field(..., ge=0, le=10_000_000)  # last 30 days
    upcoming_bills_estimate: Optional[float] = Field(None, ge=0, le=100_000_000)
    savings_goal_monthly: Optional[float] = Field(None, ge=0, le=100_000_000)


class AffordAiText(BaseModel):
    """What we ask the AI for. Words only, never numbers."""
    explanation: str
    suggestion: str


class AffordResult(BaseModel):
    verdict: AffordVerdict
    price: float
    remaining: float
    safe_to_spend: float
    needed_until_month_end: float
    weeks_to_save: int
    weekly_saving: float
    explanation: str
    suggestion: str
