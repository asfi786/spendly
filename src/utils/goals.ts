import type { Goal } from '../types';
import { parseISODate, toISODate } from './format';

export type GoalPace = 'completed' | 'on-track' | 'behind' | 'no-plan';

export interface GoalStats {
  pct: number;
  complete: boolean;
  remaining: number;
  monthsLeft: number; // ceil, can be 0
  daysLeft: number;
  requiredMonthly: number; // to hit target by target date
  paceMonthly: number | null; // observed saving pace from contributions
  paceStatus: GoalPace;
  catchUpMonthly: number | null; // extra per month needed beyond current pace
  projectedDate: string | null; // yyyy-MM-dd at current pace
  overdue: boolean;
}

/** Months between two dates, fractional. */
function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  const dayRatio = (to.getDate() - from.getDate()) / 30;
  return Math.max(0, months + dayRatio);
}

export function computeGoalStats(goal: Goal, now = new Date()): GoalStats {
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const complete = goal.currentAmount >= goal.targetAmount;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = parseISODate(goal.targetDate);
  const daysLeft = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  const overdue = daysLeft < 0 && !complete;
  const monthsLeft = Math.max(0, Math.ceil(monthsBetween(today, target)));
  const requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;

  // Observed pace from contributions
  let paceMonthly: number | null = null;
  const contribs = [...(goal.contributions ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (contribs.length > 0) {
    const first = parseISODate(contribs[0].date);
    const spanMonths = Math.max(1 / 30, monthsBetween(first, today) || 1 / 30);
    const total = contribs.reduce((s, c) => s + c.amount, 0);
    paceMonthly = total / spanMonths;
  }

  let paceStatus: GoalPace;
  let catchUpMonthly: number | null = null;
  let projectedDate: string | null = null;

  if (complete) {
    paceStatus = 'completed';
  } else if (paceMonthly === null || paceMonthly <= 0) {
    paceStatus = 'no-plan';
  } else {
    const monthsNeeded = remaining / paceMonthly;
    const proj = new Date(today);
    proj.setDate(proj.getDate() + Math.ceil(monthsNeeded * 30.44));
    projectedDate = toISODate(proj);
    if (projectedDate <= goal.targetDate) {
      paceStatus = 'on-track';
    } else {
      paceStatus = 'behind';
      catchUpMonthly = Math.max(0, requiredMonthly - paceMonthly);
    }
  }

  return {
    pct,
    complete,
    remaining,
    monthsLeft,
    daysLeft,
    requiredMonthly,
    paceMonthly,
    paceStatus,
    catchUpMonthly,
    projectedDate,
    overdue,
  };
}
