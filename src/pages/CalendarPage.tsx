import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppContext';
import CategoryIcon from '../components/CategoryIcon';
import EmptyState from '../components/EmptyState';
import { categoryColor, categoryIcon } from '../data/categories';
import { currentMonthKey, formatDate, formatMonthKey, shiftMonth } from '../utils/format';
import { aggregateByDay } from '../utils/analytics';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { state, money, openTxDetail, openTxForm } = useStore();
  const [month, setMonth] = useState(currentMonthKey());
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => aggregateByDay(state.transactions), [state.transactions]);

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m, 0).getDate();
    const list: (string | null)[] = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(`${month}-${String(d).padStart(2, '0')}`);
    }
    return list;
  }, [month]);

  const selectedTxs = useMemo(
    () =>
      selected
        ? state.transactions.filter((t) => t.date === selected).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [selected, state.transactions],
  );
  const selAgg = selected ? byDay.get(selected) : undefined;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthTotal = useMemo(() => {
    let income = 0;
    let expenses = 0;
    byDay.forEach((a, k) => {
      if (k.startsWith(month)) {
        income += a.income;
        expenses += a.expenses;
      }
    });
    return { income, expenses };
  }, [byDay, month]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Daily totals — pick a day to see its transactions.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-night-700"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[150px] text-center text-sm font-bold text-slate-900 dark:text-white">
            {formatMonthKey(month)}
          </span>
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-night-700"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Grid */}
        <div className="card p-4 sm:p-5 xl:col-span-3">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`${formatMonthKey(month)} calendar`}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
            {cells.map((key, i) => {
              if (!key) return <div key={`e-${i}`} />;
              const agg = byDay.get(key);
              const net = agg ? agg.income - agg.expenses : 0;
              const isSelected = selected === key;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`${formatDate(key)}${agg ? `, ${agg.count} transactions` : ', no transactions'}`}
                  onClick={() => setSelected(isSelected ? null : key)}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border p-1 text-center transition-all sm:min-h-[68px] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-night-700 dark:hover:bg-night-800'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {Number(key.slice(8))}
                  </span>
                  {agg ? (
                    <span className={`mt-0.5 max-w-full truncate text-[10px] font-bold tabular-nums sm:text-[11px] ${net >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
                      {net >= 0 ? '+' : '−'}{money(Math.abs(net)).replace(/\s/g, '')}
                    </span>
                  ) : (
                    <span className="mt-0.5 hidden text-[10px] text-slate-300 dark:text-slate-600 sm:block">·</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t divider pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Month income: <strong className="tabular-nums text-brand-600 dark:text-brand-400">{money(monthTotal.income)}</strong></span>
            <span>Month expenses: <strong className="tabular-nums text-slate-800 dark:text-slate-100">{money(monthTotal.expenses)}</strong></span>
          </div>
        </div>

        {/* Day detail */}
        <div className="xl:col-span-2">
          {!selected ? (
            <EmptyState
              icon={CalendarDays}
              title="Pick a day"
              body="Select any date on the calendar to see every transaction from that day, with income and expense totals."
            />
          ) : (
            <div className="card p-5 animate-fade-up" key={selected}>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{formatDate(selected)}</h3>
              <div className="mt-2 flex gap-4 text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">
                  Income <strong className="tabular-nums text-brand-600 dark:text-brand-400">{money(selAgg?.income ?? 0)}</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Expenses <strong className="tabular-nums text-slate-800 dark:text-slate-100">{money(selAgg?.expenses ?? 0)}</strong>
                </span>
              </div>
              {selectedTxs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nothing logged on this day.</p>
                  <button className="btn-primary btn-sm mt-3" onClick={() => openTxForm('expense')}>
                    Add expense
                  </button>
                </div>
              ) : (
                <ul className="mt-3 divide-y divider">
                  {selectedTxs.map((t) => {
                    const isExp = t.type === 'expense';
                    return (
                      <li key={t.id}>
                        <button onClick={() => openTxDetail(t)} className="flex w-full items-center gap-3 py-2.5 text-left">
                          <CategoryIcon icon={categoryIcon(t.category, t.type)} color={categoryColor(t.category, t.type)} size={17} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{t.title}</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">{t.category} · {t.paymentMethod}</span>
                          </span>
                          <span className={`text-sm font-bold tabular-nums ${isExp ? 'text-slate-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'}`}>
                            {isExp ? '−' : '+'}{money(t.amount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
