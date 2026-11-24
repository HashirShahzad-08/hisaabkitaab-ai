// Budget maths. No React, no Firebase: easy to test.
//   budget: { category, limit }     stats: what getMonthStats() returns for this month
import { EXPENSE_CATEGORIES } from '../constants/categories';

export const WARN_AT = 0.8; // orange from 80% of the limit
export const OVER_AT = 1; // red above 100%

// How much was spent per category this month: { Food: 6200, ... }
export function spentByCategory(stats) {
  const map = {};
  for (const c of stats.categories) map[c.category] = c.amount;
  return map;
}

// Adds spent / ratio / percent / status ("ok", "warning", "over") to every budget. Most used first.
export function budgetProgress(budgets, stats) {
  const spentMap = spentByCategory(stats);
  return budgets
    .map((b) => {
      const spent = spentMap[b.category] || 0;
      const ratio = b.limit > 0 ? spent / b.limit : 0;
      const status = ratio > OVER_AT ? 'over' : ratio >= WARN_AT ? 'warning' : 'ok';
      return { ...b, spent, ratio, percent: Math.round(ratio * 100), status, overBy: Math.max(0, spent - b.limit) };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

// The shape utils/healthScore.js wants: [{ limit, spent }]
export const budgetsForScore = (progress) => progress.map((p) => ({ limit: p.limit, spent: p.spent }));

// The budget closest to (or past) its limit, when it is at 80% or more. Otherwise null.
export const worstBudget = (progress) => progress.find((p) => p.status !== 'ok') || null;

// Categories that can still get a budget (one budget per category)
export const freeCategories = (budgets) => EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c));

// Goals: how much to put aside each week to reach the target by the date. null when there is no usable date.
export function weeklySaving(goal, today = new Date()) {
  if (!goal.targetDate || goal.savedAmount >= goal.targetAmount) return null;
  const [y, m, d] = goal.targetDate.split('-').map(Number);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((new Date(y, m - 1, d) - start) / 86400000);
  const remaining = goal.targetAmount - goal.savedAmount;
  if (days <= 0) return { pastDue: true, remaining };
  const weeks = Math.max(1, Math.ceil(days / 7));
  return { pastDue: false, remaining, weeks, perWeek: Math.ceil(remaining / weeks) };
}
