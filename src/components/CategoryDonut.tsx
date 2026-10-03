import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../store/AppContext';
import { categoryTotals } from '../utils/analytics';
import { categoryColor } from '../data/categories';
import type { Transaction } from '../types';

interface CategoryDonutProps {
  transactions: Transaction[];
  onSelect?: (category: string | null) => void;
  selected?: string | null;
}

export default function CategoryDonut({ transactions, onSelect, selected }: CategoryDonutProps) {
  const { money, resolvedTheme } = useStore();
  const dark = resolvedTheme === 'dark';

  const data = useMemo(() => categoryTotals(transactions, 'expense'), [transactions]);
  const total = data.reduce((s, d) => s + d.amount, 0);

  const pieData = data.map((d) => ({
    ...d,
    fill: categoryColor(d.category, 'expense'),
    dimmed: selected != null && selected !== d.category,
  }));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Expenses by category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {onSelect ? 'Tap a slice to filter transactions' : 'Where your money went'}
          </p>
        </div>
        {selected && onSelect && (
          <button className="btn-ghost btn-sm" onClick={() => onSelect(null)}>
            Clear filter
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400 dark:bg-night-800 dark:text-slate-500">
          No expenses this month.
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-56 w-full max-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="card !rounded-xl px-3.5 py-2.5 text-xs shadow-pop">
                        <p className="mb-1 flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
                          {p.category}
                        </p>
                        <p className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                          {money(p.amount)} · {p.pct.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={pieData}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="96%"
                  paddingAngle={2.5}
                  cornerRadius={5}
                  strokeWidth={0}
                  animationDuration={700}
                  onClick={(d: any) => onSelect?.(d?.category ?? null)}
                  style={{ cursor: onSelect ? 'pointer' : 'default', outline: 'none' }}
                >
                  {pieData.map((d) => (
                    <Cell
                      key={d.category}
                      fill={d.fill}
                      opacity={d.dimmed ? 0.25 : 1}
                      stroke={dark ? '#0e1729' : '#ffffff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</span>
              <span className="text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {money(total)}
              </span>
            </div>
          </div>

          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
            {data.map((d) => (
              <li key={d.category}>
                <button
                  onClick={() => onSelect?.(selected === d.category ? null : d.category)}
                  disabled={!onSelect}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    onSelect ? 'hover:bg-slate-100 dark:hover:bg-night-800' : ''
                  } ${selected === d.category ? 'bg-brand-500/10' : ''}`}
                  aria-pressed={selected === d.category}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: categoryColor(d.category, 'expense') }} />
                  <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{d.category}</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">{money(d.amount)}</span>
                  <span className="w-11 text-right text-xs tabular-nums text-slate-400">{d.pct.toFixed(0)}%</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
