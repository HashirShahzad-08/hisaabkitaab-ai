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
