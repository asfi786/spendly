import type { Bill, Budget, CurrencyCode, Goal, Transaction } from '../types';
import { categoryTotals, sumByType, txInMonth } from './analytics';
import { daysUntilDue, upcomingBills } from './bills';
import { formatMoney, shiftMonth } from './format';
import { computeGoalStats } from './goals';

export interface AdvisorTip {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'success';
  actionLabel?: string;
  actionTo?: string;
}

interface AdvisorInput {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  month: string; // yyyy-MM
  currency: CurrencyCode;
}

function budgetSpent(b: Budget, txs: Transaction[]): number {
  return txs
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === b.category &&
        (b.period === 'yearly' ? t.date.slice(0, 4) === b.year : txInMonth(t, b.month)),
    )
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Built-in rule engine: factual, personalized tips computed only from the
 * user's real data. No predictions, no invented numbers.
 */
export function buildAdvisorTips(input: AdvisorInput): AdvisorTip[] {
  const { transactions, budgets, goals, bills, month, currency } = input;
  const tips: AdvisorTip[] = [];
  const money = (n: number) => formatMoney(n, currency);

  const cur = transactions.filter((t) => txInMonth(t, month));
  const prev = transactions.filter((t) => txInMonth(t, shiftMonth(month, -1)));
  const curExp = sumByType(cur, 'expense');
  const prevExp = sumByType(prev, 'expense');
  const curInc = sumByType(cur, 'income');

  if (transactions.length === 0) {
    tips.push({
      id: 'no-data',
      title: 'Add your first transaction',
      body: 'Smart tips appear here once you start logging income and expenses. It takes less than 30 seconds.',
      severity: 'info',
      actionLabel: 'Add expense',
      actionTo: '/app/transactions',
    });
    return tips;
  }

  /* ---- Budgets: over / near limit ---- */
  for (const b of budgets) {
    const inScope =
      b.period === 'yearly' ? b.year === month.slice(0, 4) : b.month === month;
    if (!inScope) continue;
    const spent = budgetSpent(b, transactions);
    if (b.amount <= 0) continue;
    const pct = (spent / b.amount) * 100;
    const scope = b.period === 'yearly' ? `for ${b.year}` : 'this month';
    if (pct >= 100) {
      tips.push({
        id: `over-${b.id}`,
        title: `${b.category} budget exceeded`,
        body: `You've spent ${money(spent)} of your ${money(b.amount)} ${b.category} budget ${scope} — ${money(spent - b.amount)} over.`,
        severity: 'warning',
        actionLabel: 'Review budgets',
        actionTo: '/app/budgets',
      });
    } else if (pct >= 80) {
      tips.push({
        id: `near-${b.id}`,
        title: `${b.category} budget nearly used`,
        body: `${Math.round(pct)}% of your ${money(b.amount)} ${b.category} budget is spent ${scope} (${money(b.amount - spent)} left).`,
        severity: 'info',
        actionLabel: 'Review budgets',
        actionTo: '/app/budgets',
      });
    }
  }

  /* ---- Category spikes vs last month ---- */
  if (curExp > 0 && prevExp > 0) {
    const prevMap = new Map(categoryTotals(prev, 'expense').map((c) => [c.category, c.amount]));
    const spikes = categoryTotals(cur, 'expense')
      .map((c) => {
        const p = prevMap.get(c.category) ?? 0;
        const change = p > 0 ? ((c.amount - p) / p) * 100 : 0;
        return { ...c, prev: p, change };
      })
      .filter((c) => c.change > 15 && c.prev > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);
    for (const s of spikes) {
      const saveable = s.amount - s.prev;
      tips.push({
        id: `spike-${s.category}`,
        title: `${s.category} spending spiked ${s.change.toFixed(0)}%`,
        body: `Up from ${money(s.prev)} to ${money(s.amount)} vs last month. Holding it at last month's level would save you ${money(saveable)} a month.`,
        severity: 'warning',
        actionLabel: 'See analytics',
        actionTo: '/app/analytics',
      });
    }
    const totalChange = ((curExp - prevExp) / prevExp) * 100;
    if (totalChange > 10) {
      tips.push({
        id: 'total-up',
        title: 'Overall spending is climbing',
        body: `Total spending is ${totalChange.toFixed(0)}% higher than last month (${money(prevExp)} → ${money(curExp)}).`,
        severity: 'warning',
        actionLabel: 'See analytics',
        actionTo: '/app/analytics',
      });
    }
  }

  /* ---- Savings rate coaching ---- */
  if (curInc > 0) {
    const rate = ((curInc - curExp) / curInc) * 100;
    if (rate >= 20) {
      tips.push({
        id: 'save-good',
        title: `Strong savings rate: ${rate.toFixed(0)}%`,
        body: `You're saving ${money(curInc - curExp)} of ${money(curInc)} income this month. Consider moving surplus toward a goal.`,
        severity: 'success',
        actionLabel: 'View goals',
        actionTo: '/app/goals',
      });
    } else if (rate >= 0 && rate < 10 && curExp > 0) {
      tips.push({
        id: 'save-low',
        title: `Savings rate is thin: ${rate.toFixed(0)}%`,
        body: `Only ${money(curInc - curExp)} of ${money(curInc)} income is left this month. Trimming your top category could rebuild the buffer.`,
        severity: 'warning',
        actionLabel: 'See analytics',
        actionTo: '/app/analytics',
      });
    } else if (rate < 0) {
      tips.push({
        id: 'save-neg',
        title: 'Spending more than you earn',
        body: `Expenses exceed income by ${money(curExp - curInc)} this month. Review the biggest categories to close the gap.`,
        severity: 'warning',
        actionLabel: 'See analytics',
        actionTo: '/app/analytics',
      });
    }
  }

  /* ---- Concentration ---- */
  if (curExp > 0) {
    const cats = categoryTotals(cur, 'expense');
    const top = cats[0];
    if (top && top.pct >= 40) {
      tips.push({
        id: 'concentration',
        title: `${top.category} dominates your spending`,
        body: `${top.pct.toFixed(0)}% of this month's spending (${money(top.amount)}) goes to ${top.category}. Small cuts here have the biggest impact.`,
        severity: 'info',
        actionLabel: 'See analytics',
        actionTo: '/app/analytics',
      });
    }
    // fixed vs variable split
    const withNature = cur.filter((t) => t.type === 'expense' && t.nature);
    if (withNature.length >= 3) {
      const fixed = withNature.filter((t) => t.nature === 'fixed').reduce((s, t) => s + t.amount, 0);
      const variable = withNature.filter((t) => t.nature === 'variable').reduce((s, t) => s + t.amount, 0);
      const total = fixed + variable;
      if (total > 0) {
        tips.push({
          id: 'fixed-var',
          title: `Fixed vs variable: ${((fixed / total) * 100).toFixed(0)}% fixed`,
          body: `${money(fixed)} of your tagged spending is fixed (bills, rent) and ${money(variable)} is variable — variable spending is where you have the most control.`,
          severity: 'info',
        });
      }
    }
  }

  /* ---- Goals behind pace ---- */
  for (const g of goals) {
    const s = computeGoalStats(g);
    if (s.complete || s.paceStatus === 'on-track') continue;
    if (s.paceStatus === 'behind' && s.catchUpMonthly !== null) {
      tips.push({
        id: `goal-behind-${g.id}`,
        title: `"${g.name}" is behind pace`,
        body: `At your current pace you'll reach it around ${s.projectedDate}. Saving ${formatMoney(s.catchUpMonthly, currency)} more per month gets you back on track for ${g.targetDate}.`,
        severity: 'warning',
        actionLabel: 'View goal',
        actionTo: '/app/goals',
      });
    } else if (s.paceStatus === 'no-plan' && s.remaining > 0) {
      tips.push({
        id: `goal-plan-${g.id}`,
        title: `"${g.name}" needs a monthly plan`,
        body: `${money(s.remaining)} to go. Saving ${money(s.requiredMonthly)} per month hits the target by ${g.targetDate}.`,
        severity: 'info',
        actionLabel: 'View goal',
        actionTo: '/app/goals',
      });
    }
  }

  /* ---- Bills due soon ---- */
  const upcoming = upcomingBills(bills).filter((b) => {
    const d = daysUntilDue(b.nextDue);
    return d !== null && d <= 7;
  });
  if (upcoming.length > 0) {
    const overdue = upcoming.filter((b) => (daysUntilDue(b.nextDue) ?? 0) < 0);
    const total = upcoming.reduce((s, b) => s + b.amount, 0);
    tips.push({
      id: 'bills-due',
      title: overdue.length > 0 ? `${overdue.length} bill${overdue.length === 1 ? '' : 's'} overdue` : `${upcoming.length} bill${upcoming.length === 1 ? '' : 's'} due this week`,
      body: `${upcoming.map((b) => b.title).slice(0, 3).join(', ')}${upcoming.length > 3 ? ` and ${upcoming.length - 3} more` : ''} — ${money(total)} total. Mark them paid to stay on track.`,
      severity: overdue.length > 0 ? 'warning' : 'info',
      actionLabel: 'View bills',
      actionTo: '/app/bills',
    });
  } else if (bills.length === 0 && curExp > 0) {
    tips.push({
      id: 'bills-none',
      title: 'Track recurring bills',
      body: 'Add rent, utilities and subscriptions as bills and Spendly will remind you before each due date — and log the payment in one tap.',
      severity: 'info',
      actionLabel: 'Add a bill',
      actionTo: '/app/bills',
    });
  }

  return tips;
}
