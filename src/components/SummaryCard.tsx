import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

interface SummaryCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  delta?: number | null; // % change vs previous period
  deltaLabel?: string;
  invertDelta?: boolean; // for expenses, a rise is bad
  footer?: React.ReactNode;
  index?: number;
}

export default function SummaryCard({
  label,
  value,
  format,
  icon: Icon,
  iconBg,
  iconColor,
  delta,
  deltaLabel,
  invertDelta = false,
  footer,
  index = 0,
}: SummaryCardProps) {
  const good = delta != null && (invertDelta ? delta <= 0 : delta >= 0);
  return (
    <div
      className="card card-hover p-5 animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}>
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {delta != null ? (
          <span
            className={`chip ${good ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
          >
            {delta >= 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)}%
          </span>
        ) : (
          <span className="chip bg-slate-500/10 text-slate-500 dark:text-slate-400">—</span>
        )}
        {deltaLabel && <span className="text-xs text-slate-400 dark:text-slate-500">{deltaLabel}</span>}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
