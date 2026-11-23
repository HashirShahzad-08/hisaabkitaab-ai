// HEALTH SCORE (0 to 100). Simple, rule-based, easy to explain.
//
// Start at 50 points, then:
//   +20  if the user saved more than 10% of their income this month
//   +15  if the user has at least one budget AND every budget is within its limit
//        (no budgets yet = no points, so the score cannot be inflated by doing nothing)
//   +15  if spending is below income
//   -20  if any budget is over 100% used
// Then two limits:
//   - If spending is MORE than income this month, the score is capped at 45
//     (so the label is "Okay" or lower).
//   - The result is always kept between 0 and 100.
//
// Inputs:
//   income   money received this month
//   expense  money spent this month
//   budgets  list like [{ limit: 8000, spent: 6400 }] (empty for now)

export const MAX_SCORE_WHEN_OVERSPENDING = 45;

export const SCORE_RULES = {
  start: 50,
  savedMoreThan10Percent: 20,
  budgetsWithinLimit: 15,
  spendingBelowIncome: 15,
  anyBudgetOver100: -20,
};

export function calculateHealthScore({ income = 0, expense = 0, budgets = [] }) {
  const savings = income - expense;
  const savedMoreThan10Percent = income > 0 && savings / income > 0.1;
  const allBudgetsWithinLimit = budgets.length > 0 && budgets.every((b) => b.limit <= 0 || b.spent <= b.limit);
  const spendingBelowIncome = expense < income;
  const anyBudgetOver100 = budgets.some((b) => b.limit > 0 && b.spent / b.limit > 1);

  let score = SCORE_RULES.start;
  if (savedMoreThan10Percent) score += SCORE_RULES.savedMoreThan10Percent;
  if (allBudgetsWithinLimit) score += SCORE_RULES.budgetsWithinLimit;
  if (spendingBelowIncome) score += SCORE_RULES.spendingBelowIncome;
  if (anyBudgetOver100) score += SCORE_RULES.anyBudgetOver100;
  if (expense > income) score = Math.min(score, MAX_SCORE_WHEN_OVERSPENDING);
  score = Math.max(0, Math.min(100, score));

  return { score, band: getBand(score), tip: getTip({ income, expense, savedMoreThan10Percent, anyBudgetOver100 }) };
}

// 80-100 excellent, 60-79 good, 40-59 okay, 0-39 care (DESIGN.md section 8.3)
export function getBand(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'okay';
  return 'care';
}

// One short tip, picked by the most important problem first. Returns an i18n key.
function getTip({ income, expense, savedMoreThan10Percent, anyBudgetOver100 }) {
  if (anyBudgetOver100) return 'health.tips.overBudget';
  if (income <= 0) return 'health.tips.noIncome';
  if (expense >= income) return 'health.tips.overspending';
  if (!savedMoreThan10Percent) return 'health.tips.lowSavings';
  return 'health.tips.great';
}
