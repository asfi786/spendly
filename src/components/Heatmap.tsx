import { useMemo } from 'react';
import { useStore } from '../store/AppContext';
import { toISODate } from '../utils/format';

const DAYS = 119; // ~17 weeks

interface Cell {
  date: string;
  amount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * GitHub-style spending heatmap for the last ~120 days.
 * Intensity is relative to the user's own max daily spend. Dark-mode aware.
 */
export default function Heatmap() {
  const { state } = useStore();

  const weeks = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const t of state.transactions) {
      if (t.type !== 'expense') continue;
      byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
    }
    const cells: Cell[] = [];
    const today = new Date();
    for (let i = DAYS; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toISODate(d);
      cells.push({ date: key, amount: byDay.get(key) ?? 0, level: 0 });
    }
    const max = Math.max(1, ...cells.map((c) => c.amount));
    for (const c of cells) {
      const r = c.amount / max;
      c.level = c.amount === 0 ? 0 : r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4;
    }
    // group into weeks (columns), Sunday-first rows like GitHub
    const cols: Cell[][] = [];
    let col: Cell[] = [];
    for (const c of cells) {
      const dow = new Date(c.date + 'T12:00:00').getDay();
      if (col.length === 0 && cols.length === 0) {
        // pad first column
        for (let p = 0; p < dow; p++) col.push({ date: '', amount: 0, level: 0 });
      }
      col.push(c);
      if (dow === 6 || c === cells[cells.length - 1]) {
        cols.push(col);
        col = [];
      }
    }
    return cols;
  }, [state.transactions]);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let last = '';
    weeks.forEach((col, i) => {
      const first = col.find((c) => c.date);
      if (!first) return;
      const m = new Date(first.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
      if (m !== last) {
        labels.push({ col: i, label: m });
        last = m;
      }
    });
    return labels;
  }, [weeks]);

  const levelClass: Record<number, string> = {
    0: 'bg-slate-200/70 dark:bg-night-700/70',
    1: 'bg-brand-500/25',
    2: 'bg-brand-500/50',
    3: 'bg-brand-500/75',
    4: 'bg-brand-500',
  };

  const monthLabelFor = (colIdx: number) => monthLabels.find((l) => l.col === colIdx)?.label ?? '';

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div className="mb-1.5 flex text-[10px] font-medium text-slate-400 dark:text-slate-500" aria-hidden>
            {weeks.map((_, i) => (
              <span key={i} className="w-[15px] shrink-0 text-left">
                {monthLabelFor(i)}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]" role="img" aria-label="Spending heatmap for the last 120 days">
            {weeks.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.map((c, j) =>
                  c.date ? (
                    <span
                      key={j}
                      title={`${c.date}: ${c.amount > 0 ? `spent ${c.amount.toLocaleString()}` : 'no spending'}`}
                      className={`h-3 w-3 rounded-[4px] ${levelClass[c.level]}`}
                    />
                  ) : (
                    <span key={j} className="h-3 w-3" aria-hidden />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`h-3 w-3 rounded-[4px] ${levelClass[l]}`} aria-hidden />
        ))}
        More
      </div>
    </div>
  );
}
