import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useStore } from '../store/AppContext';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENTS: Record<string, string> = {
  success: 'text-brand-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
};

export default function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className="card pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 px-4 py-3"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${ACCENTS[t.kind]}`} aria-hidden />
            <p className="flex-1 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
              {t.message}
            </p>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-night-700 dark:hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
