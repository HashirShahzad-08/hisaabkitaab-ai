// Small helpers shared by the Bills screens.
import { colors } from '../theme';

// Verdict -> color, soft background, icon and the i18n key of its words
export const VERDICT = {
  looks_ok: { color: colors.accentLight, bg: colors.primaryLight, icon: 'checkmark-circle', key: 'bills.verdict.looks_ok', variant: 'success' },
  check: { color: colors.warning, bg: colors.warningLight, icon: 'alert-circle', key: 'bills.verdict.check', variant: 'warning' },
  likely_overbilled: { color: colors.danger, bg: colors.dangerLight, icon: 'close-circle', key: 'bills.verdict.likely_overbilled', variant: 'danger' },
};

export const verdictMeta = (verdict) => VERDICT[verdict] || VERDICT.check;

// "2026-10" -> { year: 2026, month: 10 }
export function splitMonth(billMonth) {
  const [y, m] = String(billMonth).split('-').map(Number);
  return { year: y, month: m };
}

// "2026-10" -> "October 2026" (or the Urdu month name), through the translation files
export function monthLabel(billMonth, t) {
  const { year, month } = splitMonth(billMonth);
  return `${t(`months.long.${month - 1}`)} ${year}`;
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Moves a "YYYY-MM" by +1 or -1 month
export function shiftMonth(billMonth, delta) {
  const { year, month } = splitMonth(billMonth);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Where IESCO's helpline is known. Other companies: we do not guess.
export const helplineFor = (company) => (/iesco/i.test(company || '') ? '118' : null);
