// Small helpers for money and dates.

// 12500 -> "12,500"
export function formatNumber(n) {
  const rounded = Math.round(Math.abs(Number(n) || 0));
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Date -> "2026-11-23" using the phone's local day
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "2026-11-23" -> Date at local midnight
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date -> "3:45 PM" (the same in both languages, digits stay Western)
export function formatTime(date) {
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${suffix}`;
}

// "2026-11-21" -> "Today" / "Yesterday" / "21 Nov" (adds the year if it is not this year)
export function formatDayLabel(key, t) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (key === toDateKey(today)) return t('dates.today');
  if (key === toDateKey(yesterday)) return t('dates.yesterday');
  const d = fromDateKey(key);
  const label = `${d.getDate()} ${t(`months.short.${d.getMonth()}`)}`;
  return d.getFullYear() === today.getFullYear() ? label : `${label} ${d.getFullYear()}`;
}

// Month filter value: "2026-11" (or "all")
export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
