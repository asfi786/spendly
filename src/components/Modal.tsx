import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;
}

/** Accessible modal: Esc closes, backdrop click closes, scroll locked, focus moved in. */
export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus to the dialog
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`card w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-b-none rounded-t-3xl p-5 outline-none animate-scale-in sm:rounded-3xl sm:p-6`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-night-700 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
