import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useStore } from '../store/AppContext';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import CategoryIcon from '../components/CategoryIcon';
import { categoryColor, categoryIcon } from '../data/categories';
import { formatMonthKey } from '../utils/format';
import { txInMonth } from '../utils/analytics';
import type { Budget, BudgetPeriod } from '../types';

type Health = 'healthy' | 'near' | 'over';

function healthOf(pct: number): Health {
  if (pct >= 100) return 'over';
  if (pct >= 80) return 'near';
  return 'healthy';
}

const HEALTH_STYLES: Record<Health, { bar: string; chip: string; label: string }> = {
  healthy: { bar: 'bg-brand-500', chip: 'bg-brand-500/10 text-brand-700 dark:text-brand-300', label: 'On track' },
  near: { bar: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Near limit' },
  over: { bar: 'bg-red-500', chip: 'bg-red-500/10 text-red-600 dark:text-red-400', label: 'Over budget' },
};

export default function Budgets() {
  const { state, money, openBudgetForm, deleteBudget, toast } = useStore();
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [tab, setTab] = useState<BudgetPeriod>('monthly');
  const month = state.selectedMonth;
  const [year, setYear] = useState(month.slice(0, 4));

  const isMonthly = tab === 'monthly';
  const scopeLabel = isMonthly ? formatMonthKey(month) : year;

  const budgets = useMemo(
    () =>
      state.budgets.filter((b) =>
        isMonthly
          ? (b.period ?? 'monthly') === 'monthly' && b.month === month
          : b.period === 'yearly' && (b.year ?? b.month.slice(0, 4)) === year,
      ),
    [state.budgets, isMonthly, month, year],
  );

  const rows = useMemo(
    () =>
      budgets.map((b) => {
        const spent = state.transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category === b.category &&
              (isMonthly ? txInMonth(t, month) : t.date.slice(0, 4) === year),
          )
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return { budget: b, spent, pct, health: healthOf(pct), remaining: b.amount - spent };
      }),
    [budgets, state.transactions, isMonthly, month, year],
  );

  const overCount = rows.filter((r) => r.health === 'over').length;
  const totalBudget = rows.reduce((s, r) => s + r.budget.amount, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">
            {isMonthly ? 'Monthly spending limits' : 'Yearly spending limits'} · {scopeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="lg:hidden">{isMonthly && <MonthPicker compact />}</div>
          <button className="btn-primary btn-sm !py-2" onClick={() => openBudgetForm()}>
            <Plus size={15} aria-hidden /> New budget
          </button>
        </div>
      </div>

      {/* Period tabs + scope controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-night-800"
          role="tablist"
          aria-label="Budget period"
        >
          {(['monthly', 'yearly'] as const).map((p) => {
            const active = tab === p;
            return (
              <button
                key={p}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(p)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        {isMonthly ? (
          <div className="hidden lg:block">
            <MonthPicker />
          </div>
        ) : (
          <div className="flex items-center gap-1" aria-label="Choose year">
            <button
              className="btn-ghost btn-sm !px-2"
              onClick={() => setYear((y) => String(Number(y) - 1))}
              aria-label="Previous year"
            >
              <ChevronLeft size={15} aria-hidden />
            </button>
            <span className="min-w-[64px] text-center text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
              {year}
            </span>
            <button
              className="btn-ghost btn-sm !px-2"
              onClick={() => setYear((y) => String(Number(y) + 1))}
              aria-label="Next year"
            >
              <ChevronRight size={15} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {overCount > 0 && (
        <div
          role="alert"
          className="card flex items-start gap-3 border-red-500/30 bg-red-500/[0.06] p-4 animate-fade-in dark:border-red-500/30"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {overCount} {overCount === 1 ? 'budget' : 'budgets'} exceeded
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rows
                .filter((r) => r.health === 'over')
                .map((r) => r.budget.category)
                .join(', ')}{' '}
              {overCount === 1 ? 'is' : 'are'} over the limit {isMonthly ? 'this month' : 'this year'}. Consider adjusting spending or the budget.
            </p>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={isMonthly ? 'No budgets for this month' : `No budgets for ${year}`}
          body={
            isMonthly
              ? 'Set a monthly limit per category and Spendly will warn you before you overspend. Budgets reset every month.'
              : 'Set a yearly limit per category — great for travel, gifts and annual plans. Spending is aggregated across the whole year.'
          }
          actionLabel={isMonthly ? 'Create your first budget' : 'Create a yearly budget'}
          onAction={() => openBudgetForm()}
        />
      ) : (
        <>
          {totalBudget > 0 && (
            <div className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Total budgeted <span className="font-bold text-slate-900 dark:text-white">{money(totalBudget)}</span>
                </p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Spent <span className={`font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {money(totalSpent)}
                  </span>
                </p>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
                role="progressbar"
                aria-valuenow={Math.round(Math.min(100, (totalSpent / totalBudget) * 100))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Total budget used"
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}
                  style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ budget: b, spent, pct, health, remaining }, i) => {
              const hs = HEALTH_STYLES[health];
              const period = b.period ?? 'monthly';
              return (
                <div key={b.id} className="card card-hover p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={categoryIcon(b.category, 'expense')} color={categoryColor(b.category, 'expense')} />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.category}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {period === 'monthly' ? formatMonthKey(b.month) : `${b.year ?? b.month.slice(0, 4)} · yearly`}
                        </p>
                      </div>
                    </div>
                    <span className={`chip ${hs.chip}`}>{hs.label}</span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="text-xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                      {money(spent)}
                    </p>
                    <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">of {money(b.amount)}</p>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
                    role="progressbar"
                    aria-valuenow={Math.round(Math.min(100, pct))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${b.category} budget: ${Math.round(pct)}% used`}
                  >
                    <div className={`h-full rounded-full ${hs.bar} transition-all duration-700`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className={`mt-2 text-xs font-medium tabular-nums ${remaining < 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {remaining < 0 ? `${money(Math.abs(remaining))} over budget` : `${money(remaining)} remaining`}
                  </p>

                  <div className="mt-3 flex gap-2 border-t divider pt-3">
                    <button className="btn-ghost btn-sm flex-1" onClick={() => openBudgetForm(b)} aria-label={`Edit ${b.category} budget`}>
                      <Pencil size={14} aria-hidden /> Edit
                    </button>
                    <button
                      className="btn-ghost btn-sm flex-1 !text-red-500 hover:!bg-red-500/10"
                      onClick={() => setDeleting(b)}
                      aria-label={`Delete ${b.category} budget`}
                    >
                      <Trash2 size={14} aria-hidden /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteBudget(deleting.id);
            toast('Budget deleted.');
          }
        }}
        title="Delete budget?"
        message={
          deleting
            ? `The ${deleting.category} budget (${(deleting.period ?? 'monthly') === 'monthly' ? formatMonthKey(deleting.month) : `${deleting.year ?? deleting.month.slice(0, 4)} (yearly)`}) will be removed.`
            : ''
        }
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
