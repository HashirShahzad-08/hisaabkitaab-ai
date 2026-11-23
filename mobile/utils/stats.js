// Totals for one month, worked out from the transaction list.
import { monthKey } from './format';

export function getMonthStats(items, date = new Date()) {
  const key = monthKey(date);
  let income = 0;
  let expense = 0;
  const byCategory = {};
  for (const tx of items) {
    if (!tx.date.startsWith(key)) continue;
    if (tx.type === 'income') income += tx.amount;
    else {
      expense += tx.amount;
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    }
  }
  // Biggest first, with the share of total spending
  const categories = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount, percent: expense ? Math.round((amount / expense) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { income, expense, balance: income - expense, categories };
}
