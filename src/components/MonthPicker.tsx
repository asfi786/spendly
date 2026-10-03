import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppContext';
import { formatMonthKey, formatMonthKeyShort, shiftMonth } from '../utils/format';

interface MonthPickerProps {
  compact?: boolean;
}

/** Prev/next arrows + dropdown of the last 18 months. */
export default function MonthPicker({ compact = false }: MonthPickerProps) {
  const { state, setMonth } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const months: string[] = [];
  const now = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  for (let i = 0; i < 18; i++) months.push(shiftMonth(curKey, -i));

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <button
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-night-700 dark:hover:text-slate-100"
          onClick={() => setMonth(shiftMonth(state.selectedMonth, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className={`btn-secondary ${compact ? 'btn-sm !px-2.5' : '!px-3.5'} !py-2 font-semibold`}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Selected month: ${formatMonthKey(state.selectedMonth)}`}
        >
          <CalendarDays size={15} className="text-brand-500" aria-hidden />
          <span className="hidden xs:inline sm:inline">{formatMonthKey(state.selectedMonth)}</span>
          <span className="xs:hidden sm:hidden">{formatMonthKeyShort(state.selectedMonth)}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        <button
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-night-700 dark:hover:text-slate-100"
          onClick={() => setMonth(shiftMonth(state.selectedMonth, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Choose month"
          className="card absolute right-0 z-50 mt-2 max-h-72 w-52 overflow-y-auto p-1.5 animate-scale-in"
        >
          {months.map((m) => {
            const active = m === state.selectedMonth;
            return (
              <button
                key={m}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setMonth(m);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-500/10 font-semibold text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-700'
                }`}
              >
                {formatMonthKey(m)}
                {active && <Check size={15} aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
