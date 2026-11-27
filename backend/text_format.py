"""Tidies the words we send back: Western digits, and thousands commas in amounts (500000 -> 500,000).
Used only AFTER the invented-number guard, so it never changes which numbers are in a text."""
import re

# Urdu and Arabic digits -> 0-9
_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")

# A run of 4 or more digits that stands on its own. Left alone: parts of a word ("5000mAh"), phone
# numbers, dates and times ("0300-1234567", "2026-10"), and digits after a decimal point.
_LONG_NUMBER = re.compile(r"(?<![A-Za-z0-9_,])(?<!\d[.\-/:])\d{4,}(?![A-Za-z0-9_])(?![\-/:,]\d)")
_MONEY_BEFORE = re.compile(r"(?:\brs\.?|\bpkr|روپے)\s*-?\s*$", re.I)
_MONEY_AFTER = re.compile(r"^(?:\.\d+)?\s*(?:rupees?\b|rs\b|روپے|روپیہ)", re.I)


def format_numbers(text: str, keep: str = "") -> str:
    """keep: words that must stay exactly as written (the name of the thing the user wants to buy)."""
    if not text:
        return text
    text = text.translate(_DIGITS)
    keep = (keep or "").translate(_DIGITS)
    if keep and keep in text:
        return keep.join(format_numbers(part) for part in text.split(keep))

    def with_commas(m: re.Match) -> str:
        digits = m.group(0)
        if digits.startswith("0"):
            return digits  # a code or phone number, not an amount
        value = int(digits)
        money = _MONEY_BEFORE.search(text[:m.start()]) or _MONEY_AFTER.search(text[m.end():])
        if 1900 <= value <= 2100 and not money:
            return digits  # a year, like "October 2026"
        return f"{value:,}"

    return _LONG_NUMBER.sub(with_commas, text)
