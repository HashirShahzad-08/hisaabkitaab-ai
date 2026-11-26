// One place that builds this month's Health Score inputs, used by Home and "Can I afford it?",
// so both screens always show the same number.
import { budgetProgress, budgetsForScore } from './budgets';
import { calculateHealthScore } from './healthScore';

// This month's income transactions; if there are none yet, the monthly income saved in the profile.
export function incomeFor(monthIncome, profile) {
  return monthIncome > 0 ? monthIncome : Number(profile?.monthlyIncome) || 0;
}

// stats: getMonthStats(items). budgets: the saved budgets. extraSpend: "what if I also spend this much?"
export function monthHealth(stats, budgets, profile, extraSpend = 0) {
  return calculateHealthScore({
    income: incomeFor(stats.income, profile),
    expense: stats.expense + extraSpend,
    budgets: budgetsForScore(budgetProgress(budgets, stats)),
  });
}
