// Works out the numbers the "Can I afford it?" backend needs, from the user's own saved data.
// No React and no Firebase in here, so it is easy to test.
import { monthKey, toDateKey } from './format';
import { incomeFor } from './monthHealth';

const WINDOW_DAYS = 30; // average spending is taken over the last 30 days
const MIN_WINDOW_DAYS = 7; // a brand-new user must not look like a very big spender after one day

// items: transactions ({ date: "YYYY-MM-DD", type, amount })
// bills: saved bills (newest first, { amount, billMonth, addedToExpenses })
// profile: used for the monthly income when this month has no income transaction yet
export function buildAffordInputs(items, bills, profile, now = new Date()) {
  const thisMonth = monthKey(now);
  const today = toDateKey(now);
  const windowStart = toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WINDOW_DAYS - 1)));

  let income = 0;
  let spent = 0;
  let last30 = 0;
  let earliest = null; // first day with a transaction inside the 30-day window
  for (const tx of items) {
    if (tx.date.startsWith(thisMonth)) {
      if (tx.type === 'income') income += tx.amount;
      else spent += tx.amount;
    }
    if (tx.type !== 'income' && tx.date >= windowStart && tx.date <= today) {
      last30 += tx.amount;
      if (earliest === null || tx.date < earliest) earliest = tx.date;
    }
  }

  let windowDays = WINDOW_DAYS;
  if (earliest) {
    const [y, m, d] = earliest.split('-').map(Number);
    const daysSince = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(y, m - 1, d)) / 86400000) + 1;
    windowDays = Math.min(WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, daysSince));
  }

  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // A bill still to be paid: not already counted as an expense, and from this month or last month
  const recentMonths = [thisMonth, monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))];
  const unpaid = (bills || []).find((b) => !b.addedToExpenses && recentMonths.includes(b.billMonth));
  const upcoming = unpaid ? Number(unpaid.amount) || 0 : undefined;
  const monthlyIncome = incomeFor(income, profile);

  return {
    hasIncome: monthlyIncome > 0,
    monthly_income: monthlyIncome,
    spent_this_month: spent,
    days_left_in_month: Math.max(0, lastDayOfMonth - now.getDate()),
    avg_daily_spend: Math.round((last30 / windowDays) * 100) / 100,
    upcoming_bills_estimate: upcoming,
  };
}
