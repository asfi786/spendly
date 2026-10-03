import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarRange,
  Lightbulb,
  PieChart as PieIcon,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import Heatmap from '../components/Heatmap';
import SpendingChart from '../components/SpendingChart';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { buildInsights, categoryTotals, monthlySeries, sumByType, txInMonth, type Insight } from '../utils/analytics';
import { categoryColor } from '../data/categories';
import { formatMoneyCompact, formatMonthKey, shiftMonth } from '../utils/format';

const INSIGHT_ICONS: Record<Insight['icon'], React.ComponentType<{ size?: number | string; className?: string }>> = {
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  pie: PieIcon,
  wallet: Wallet,
  target: Target,
  calendar: CalendarRange,
};

const TONE_STYLES: Record<Insight['tone'], string> = {
  good: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  neutral: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

export default function Analytics() {
  const { state, money, openTxForm, resolvedTheme } = useStore();
  const month = state.selectedMonth;
  const dark = resolvedTheme === 'dark';
  const grid = dark ? '#1e3050' : '#e2e8f0';
  const tick = dark ? '#7d8aa3' : '#94a3b8';

  const hasData = state.transactions.length > 0;

  const sixMonths = useMemo(() => monthlySeries(state.transactions, 6), [state.transactions]);

  const monthTxs = useMemo(() => state.transactions.filter((t) => txInMonth(t, month)), [state.transactions, month]);
  const prevTxs = useMemo(
    () => state.transactions.filter((t) => txInMonth(t, shiftMonth(month, -1))),
    [state.transactions, month],
  );

  const cats = useMemo(() => categoryTotals(monthTxs, 'expense').slice(0, 6), [monthTxs]);
  const maxCat = cats[0]?.amount ?? 1;

  const compare = useMemo(
    () => [
      { name: 'Income', current: sumByType(monthTxs, 'income'), previous: sumByType(prevTxs, 'income'), fill: '#10b981' },
      { name: 'Expenses', current: sumByType(monthTxs, 'expense'), previous: sumByType(prevTxs, 'expense'), fill: '#f43f5e' },
    ],
    [monthTxs, prevTxs],
  );

  const insights = useMemo(
    () => buildInsights(state.transactions, month, state.user.currency),
    [state.transactions, month, state.user.currency],
  );

  const tooltipStyle = {
    background: dark ? '#0e1729' : '#ffffff',
    border: `1px solid ${dark ? '#1e3050' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
    boxShadow: '0 12px 40px -8px rgb(15 23 42 / 0.25)',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Patterns in your money, computed from your real data.</p>
        </div>
        <div className="lg:hidden">
          <MonthPicker compact />
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data to analyze yet"
          body="Add a few transactions and come back — your trends, comparisons and insights will appear here automatically."
          actionLabel="Add a transaction"
          onAction={() => openTxForm('expense')}
        />
      ) : (
        <>
          {/* Insights */}
          {insights.length > 0 && (
            <section aria-label="Spending insights">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Lightbulb size={15} className="text-amber-500" aria-hidden /> Insights · {formatMonthKey(month)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {insights.map((ins, i) => {
                  const Icon = INSIGHT_ICONS[ins.icon];
                  return (
                    <div key={ins.id} className="card card-hover p-4 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[ins.tone]}`}>
                          <Icon size={17} aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{ins.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{ins.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Spending heatmap */}
          <section className="card p-5 animate-fade-up" aria-label="Spending heatmap">
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Spending heatmap</h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Daily spending intensity · last 120 days</p>
            <Heatmap />
          </section>

          {/* Trends */}
          <div className="card p-5 animate-fade-up">
            <SpendingChart transactions={state.transactions} height={300} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Income vs expenses */}
            <div className="card p-5 animate-fade-up">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Income vs expenses</h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Last 6 months</p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sixMonths} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={3}>
                    <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} opacity={0.6} />
                    <XAxis dataKey="label" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
                    <YAxis
                      tick={{ fill: tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      tickFormatter={(v: number) => formatMoneyCompact(v, state.user.currency)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [
                        money(Number(value ?? 0)),
                        name === 'income' ? 'Income' : 'Expenses',
                      ]}
                      labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[5, 5, 0, 0]} animationDuration={700} maxBarSize={26} />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[5, 5, 0, 0]} animationDuration={700} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Income</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expenses</span>
              </div>
            </div>

            {/* Category analysis */}
            <div className="card p-5 animate-fade-up">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Category analysis</h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Top spending categories · {formatMonthKey(month)}
              </p>
              {cats.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No expenses this month.</p>
              ) : (
                <ul className="space-y-4">
                  {cats.map((c) => {
                    const color = categoryColor(c.category, 'expense');
                    return (
                      <li key={c.category}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                            <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                            {c.category}
                          </span>
                          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-900 dark:text-white">{money(c.amount)}</span> · {c.pct.toFixed(0)}%
                          </span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
                          role="progressbar"
                          aria-valuenow={Math.round((c.amount / maxCat) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${c.category} spending`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(c.amount / maxCat) * 100}%`, background: color }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Monthly comparison */}
          <div className="card p-5 animate-fade-up">
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Monthly comparison</h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              {formatMonthKey(month)} vs {formatMonthKey(shiftMonth(month, -1))}
            </p>
            <div className="h-56 w-full max-w-2xl">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compare} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={6}>
                  <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fill: tick, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis
                    tick={{ fill: tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={(v: number) => formatMoneyCompact(v, state.user.currency)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      money(Number(value ?? 0)),
                      name === 'current' ? 'This month' : 'Last month',
                    ]}
                    labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                  />
                  <Bar dataKey="previous" name="previous" fill={dark ? '#334155' : '#cbd5e1'} radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700} />
                  <Bar dataKey="current" name="current" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700}>
                    {compare.map((c) => (
                      <Cell key={c.name} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-slate-600' : 'bg-slate-300'}`} /> Last month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> This month
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
