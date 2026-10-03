import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  FlaskConical,
  Landmark,
  Minus,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import SummaryCard from '../components/SummaryCard';
import SpendingChart from '../components/SpendingChart';
import CategoryDonut from '../components/CategoryDonut';
import CategoryIcon from '../components/CategoryIcon';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import { categoryColor, categoryIcon } from '../data/categories';
import { formatDate, greetingForHour, pctChange, shiftMonth } from '../utils/format';
import { sumByType, txInMonth } from '../utils/analytics';

/* Show skeletons only on the first dashboard visit of the session */
let dashboardBootstrapped = false;
function useBootLoad(ms = 550): boolean {
  const [loading, setLoading] = useState(!dashboardBootstrapped);
  useEffect(() => {
    if (dashboardBootstrapped) {
      setLoading(false);
      return;
    }
    dashboardBootstrapped = true;
    const t = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return loading;
}

export default function Dashboard() {
  const { state, money, moneyCompact, openTxForm, openBudgetForm, openGoalForm, openTxDetail, loadDemo, clearDemo, toast } =
    useStore();
  const navigate = useNavigate();
  const loading = useBootLoad();
  const month = state.selectedMonth;
  const prevMonth = shiftMonth(month, -1);

  const monthTxs = useMemo(() => state.transactions.filter((t) => txInMonth(t, month)), [state.transactions, month]);
  const prevTxs = useMemo(() => state.transactions.filter((t) => txInMonth(t, prevMonth)), [state.transactions, prevMonth]);

  const income = sumByType(monthTxs, 'income');
  const expenses = sumByType(monthTxs, 'expense');
  const savings = income - expenses;
  const prevIncome = sumByType(prevTxs, 'income');
  const prevExpenses = sumByType(prevTxs, 'expense');

  const totalIncome = useMemo(() => sumByType(state.transactions, 'income'), [state.transactions]);
  const totalExpenses = useMemo(() => sumByType(state.transactions, 'expense'), [state.transactions]);
  const balance = totalIncome - totalExpenses;

  const incomeDelta = pctChange(income, prevIncome);
  const expenseDelta = pctChange(expenses, prevExpenses);
  const netDelta = pctChange(income - expenses, prevIncome - prevExpenses);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const recent = useMemo(
    () => [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7),
    [state.transactions],
  );

  const monthBudgets = useMemo(() => state.budgets.filter((b) => b.month === month).slice(0, 3), [state.budgets, month]);

  const greeting = greetingForHour(new Date().getHours());
  const firstName = state.user.name.split(' ')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) return <PageSkeleton />;

  const hasAnyData = state.transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Demo banner */}
      {state.demoData && (
        <div className="card flex flex-col gap-3 border-brand-500/30 bg-brand-500/[0.06] p-4 sm:flex-row sm:items-center dark:border-brand-500/30">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <FlaskConical size={18} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                You're viewing demo data
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sample transactions, budgets and a goal so you can explore. Nothing here is real.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                clearDemo();
                toast('Demo data removed. Start fresh!', 'info');
              }}
            >
              Use my own data
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl sm:text-[28px]">
            {greeting}, {firstName}
          </h1>
          <p className="page-subtitle">Here's your financial overview. <span className="hidden sm:inline">· {todayLabel}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="lg:hidden">
            <MonthPicker compact />
          </div>
          <button className="btn-secondary btn-sm !py-2 lg:hidden" onClick={() => openTxForm('income')}>
            <Plus size={15} aria-hidden /> Income
          </button>
          <button className="btn-primary btn-sm !py-2" onClick={() => openTxForm('expense')}>
            <Minus size={15} aria-hidden /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          index={0}
          label="Total balance"
          value={balance}
          format={money}
          icon={Landmark}
          iconBg="bg-brand-500/10"
          iconColor="text-brand-600 dark:text-brand-400"
          delta={netDelta}
          deltaLabel="net vs last month"
        />
        <SummaryCard
          index={1}
          label="Income this month"
          value={income}
          format={money}
          icon={TrendingUp}
          iconBg="bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
          delta={incomeDelta}
          deltaLabel="vs last month"
        />
        <SummaryCard
          index={2}
          label="Expenses this month"
          value={expenses}
          format={money}
          icon={TrendingDown}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          delta={expenseDelta}
          deltaLabel="vs last month"
          invertDelta
        />
        <SummaryCard
          index={3}
          label="Savings"
          value={savings}
          format={money}
          icon={PiggyBank}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          delta={income > 0 ? savingsRate : null}
          deltaLabel={income > 0 ? 'savings rate' : 'no income yet'}
          footer={
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
              role="progressbar"
              aria-valuenow={Math.max(0, Math.min(100, savingsRate))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Savings rate"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
            </div>
          }
        />
      </div>

      {/* Quick actions (desktop) */}
      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {[
          { label: 'Add Expense', desc: 'Log money spent', icon: TrendingDown, c: 'text-red-500 bg-red-500/10', fn: () => openTxForm('expense') },
          { label: 'Add Income', desc: 'Log money earned', icon: TrendingUp, c: 'text-brand-500 bg-brand-500/10', fn: () => openTxForm('income') },
          { label: 'New Budget', desc: 'Cap a category', icon: Wallet, c: 'text-amber-500 bg-amber-500/10', fn: () => openBudgetForm() },
          { label: 'New Goal', desc: 'Save for something', icon: Target, c: 'text-sky-500 bg-sky-500/10', fn: () => openGoalForm() },
        ].map((a, i) => (
          <button
            key={a.label}
            onClick={a.fn}
            className="card card-hover flex items-center gap-3.5 p-4 text-left animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.c}`}>
              <a.icon size={20} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">{a.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{a.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={Sparkles}
          title="Welcome to Spendly — let's add your first transaction"
          body="Your dashboard, charts and insights will come alive as soon as you log income or an expense. It takes less than 30 seconds."
          actionLabel="Add your first expense"
          onAction={() => openTxForm('expense')}
          secondaryLabel="Explore demo data"
          onSecondary={() => {
            loadDemo();
            toast('Demo data loaded. Have a look around!', 'info');
          }}
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="card p-5 animate-fade-up xl:col-span-3">
              <SpendingChart transactions={state.transactions} />
            </div>
            <div className="card p-5 animate-fade-up xl:col-span-2" style={{ animationDelay: '80ms' }}>
              <CategoryDonut
                transactions={monthTxs}
                onSelect={(c) => navigate(`/app/transactions${c ? `?category=${encodeURIComponent(c)}` : ''}`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            {/* Recent transactions */}
            <div className="card p-5 animate-fade-up xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Recent transactions</h3>
                <Link
                  to="/app/transactions"
                  className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  View all <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              <ul className="divide-y divider">
                {recent.map((t) => {
                  const isExp = t.type === 'expense';
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => openTxDetail(t)}
                        className="flex w-full items-center gap-3.5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-night-800/60 rounded-xl px-2 -mx-2"
                      >
                        <CategoryIcon icon={categoryIcon(t.category, t.type)} color={categoryColor(t.category, t.type)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {t.title}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {t.category} · {formatDate(t.date)}
                          </span>
                        </span>
                        <span
                          className={`text-sm font-bold tabular-nums ${isExp ? 'text-slate-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'}`}
                        >
                          {isExp ? '−' : '+'}
                          {money(t.amount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Budgets preview */}
            <div className="card p-5 animate-fade-up xl:col-span-2" style={{ animationDelay: '80ms' }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Budgets</h3>
                <Link
                  to="/app/budgets"
                  className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Manage <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              {monthBudgets.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <Wallet size={26} className="mb-2 text-slate-300 dark:text-slate-600" aria-hidden />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No budgets for this month.</p>
                  <button className="btn-primary btn-sm mt-3" onClick={() => openBudgetForm()}>
                    Create one
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {monthBudgets.map((b) => {
                    const spent = monthTxs
                      .filter((t) => t.type === 'expense' && t.category === b.category)
                      .reduce((s, t) => s + t.amount, 0);
                    const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
                    const over = spent > b.amount;
                    const bar = over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500';
                    return (
                      <li key={b.id}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{b.category}</span>
                          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {moneyCompact(spent)} / {moneyCompact(b.amount)}
                          </span>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
                          role="progressbar"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${b.category} budget used`}
                        >
                          <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Upcoming / goals nudge */}
              {state.goals.length > 0 && (
                <div className="mt-5 border-t divider pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Goals</h4>
                    <Link to="/app/goals" className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      View <ArrowRight size={13} aria-hidden />
                    </Link>
                  </div>
                  {state.goals.slice(0, 2).map((g) => {
                    const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                    return (
                      <div key={g.id} className="mb-2.5 flex items-center gap-3">
                        <Target size={16} className="shrink-0 text-sky-500" aria-hidden />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{g.name}</span>
                            <span className="tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700">
                            <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Calendar nudge */}
          <button
            onClick={() => navigate('/app/calendar')}
            className="card card-hover flex w-full items-center gap-4 p-5 text-left animate-fade-up"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <CalendarClock size={20} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-slate-900 dark:text-white">Calendar view</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Browse your spending day by day with daily totals.
              </span>
            </span>
            <ArrowRight size={17} className="text-slate-400" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
