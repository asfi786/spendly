import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store/AppContext';
import { dailySeries, monthlySeries } from '../utils/analytics';
import { formatMoneyCompact } from '../utils/format';
import type { Transaction } from '../types';

type Range = '7D' | '30D' | '3M' | '6M' | '1Y';

const RANGES: Range[] = ['7D', '30D', '3M', '6M', '1Y'];

interface SpendingChartProps {
  transactions: Transaction[];
  height?: number;
}

function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card !rounded-xl px-3.5 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-bold text-slate-900 dark:text-white">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.stroke }} />
            {p.dataKey === 'income' ? 'Income' : p.dataKey === 'expenses' ? 'Expenses' : 'Balance'}
          </span>
          <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
            {formatMoneyCompact(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SpendingChart({ transactions, height = 280 }: SpendingChartProps) {
  const { resolvedTheme, state } = useStore();
  const [range, setRange] = useState<Range>('30D');
  const dark = resolvedTheme === 'dark';

  const data = useMemo(() => {
    if (range === '7D') return dailySeries(transactions, 7);
    if (range === '30D') return dailySeries(transactions, 30);
    return monthlySeries(transactions, range === '3M' ? 3 : range === '6M' ? 6 : 12);
  }, [transactions, range]);

  const hasData = data.some((d: any) => d.income > 0 || d.expenses > 0);
  const grid = dark ? '#1e3050' : '#e2e8f0';
  const tick = dark ? '#7d8aa3' : '#94a3b8';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Spending overview</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Income, expenses and balance trend</p>
        </div>
        <div
          className="flex gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-night-800"
          role="tablist"
          aria-label="Chart range"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`tab-pill ${range === r ? 'tab-pill-active' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400 dark:bg-night-800 dark:text-slate-500">
          No data for this range yet.
        </div>
      ) : (
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sp-inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={dark ? 0.45 : 0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="sp-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={dark ? 0.4 : 0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                dy={6}
              />
              <YAxis
                tick={{ fill: tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) => formatMoneyCompact(v, state.user.currency)}
              />
              <Tooltip content={<ChartTooltip currency={state.user.currency} />} cursor={{ stroke: tick, strokeOpacity: 0.3 }} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#sp-inc)"
                animationDuration={700}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#sp-exp)"
                animationDuration={700}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={dark ? '#93c5fd' : '#3b82f6'}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                animationDuration={700}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expenses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 rounded" style={{ borderTop: '2px dashed #3b82f6' }} aria-hidden /> Balance trend
        </span>
      </div>
    </div>
  );
}
