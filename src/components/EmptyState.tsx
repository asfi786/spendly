import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center animate-fade-up">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <Icon size={30} strokeWidth={1.8} aria-hidden />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {actionLabel && onAction && (
            <button className="btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button className="btn-secondary" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
