// "Rs 6,200" in English, "6,200 روپے" in Urdu (digits are always Western). For money inside a sentence.
import { formatNumber } from './format';

export const rupeesText = (n, lang, unit) => (lang === 'ur' ? `${formatNumber(n)} ${unit}` : `Rs ${formatNumber(n)}`);

// "2026-12-21" -> "21 Dec 2026" (month names come from the translation files)
export function shortDate(key, t) {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${t(`months.short.${m - 1}`)} ${y}`;
}
