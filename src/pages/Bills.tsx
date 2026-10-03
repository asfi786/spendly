import { useMemo, useState } from 'react';
import { CalendarClock, Check, Pencil, Plus, SkipForward, Trash2 } from 'lucide-react';
import { useStore } from '../store/AppContext';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import CategoryIcon from '../components/CategoryIcon';
import { categoryColor, categoryIcon } from '../data/categories';
import { formatDate } from '../utils/format';
import { dueLabel, frequencyLabel, isBillCompleted, upcomingBills } from '../utils/bills';
import type { Bill } from '../types';

export default function Bills() {
  const { state, money, openBillForm, deleteBill, markBillPaid, skipBill, toast } = useStore();
  const [deleting, setDeleting] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const upcoming = useMemo(() => upcomingBills(state.bills), [state.bills]);
  const completed = useMemo(() => state.bills.filter(isBillCompleted), [state.bills]);
  const monthlyTotal = useMemo(
    () => upcoming.filter((b) => b.frequency === 'monthly').reduce((s, b) => s + b.amount, 0),
    [upcoming],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Bills</h1>
          <p className="page-subtitle">
            {upcoming.length > 0
              ? `${upcoming.length} upcoming · ${money(monthlyTotal)}/mo in monthly bills`
              : 'Never miss a recurring payment.'}
          </p>
        </div>
        <button className="btn-primary btn-sm !py-2" onClick={() => openBillForm()}>
          <Plus size={15} aria-hidden /> New bill
        </button>
      </div>

      {state.bills.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bills tracked yet"
          body="Add rent, utilities, subscriptions — anything that repeats. Spendly reminds you before each due date and logs the payment in one tap."
          actionLabel="Add your first bill"
          onAction={() => openBillForm()}
        />
      ) : (
        <>
          {upcoming.length === 0 ? (
            <div className="card p-8 text-center">
              <Check size={28} className="mx-auto mb-2 text-brand-500" aria-hidden />
              <p className="text-sm font-bold text-slate-900 dark:text-white">All caught up!</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No upcoming bills. Add a new one anytime.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((b, i) => {
                const due = dueLabel(b.nextDue);
                const tone =
                  due.tone === 'overdue'
                    ? 'border-red-500/30 bg-red-500/[0.05]'
                    : due.tone === 'soon'
                      ? 'border-amber-500/30 bg-amber-500/[0.05]'
                      : '';
                return (
                  <li
                    key={b.id}
                    className={`card flex flex-col gap-3 p-4 animate-fade-up sm:flex-row sm:items-center ${tone}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <CategoryIcon icon={categoryIcon(b.category, 'expense')} color={categoryColor(b.category, 'expense')} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{b.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {frequencyLabel(b.frequency)} · {b.category}
                          {b.notes && <span className="text-slate-400"> · {b.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                          {money(b.amount)}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            due.tone === 'overdue'
                              ? 'text-red-500'
                              : due.tone === 'soon'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {due.text} · {b.nextDue ? formatDate(b.nextDue) : ''}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPaying(b)}
                          className="btn-primary btn-sm"
                          aria-label={`Mark ${b.title} as paid`}
                        >
                          <Check size={14} aria-hidden /> Paid
                        </button>
                        <button
                          onClick={() => skipBill(b)}
                          className="btn-ghost btn-sm"
                          aria-label={`Skip ${b.title}`}
                          title="Skip this occurrence"
                        >
                          <SkipForward size={14} aria-hidden />
                        </button>
                        <button
                          onClick={() => openBillForm(b)}
                          className="btn-ghost btn-sm !px-2.5"
                          aria-label={`Edit ${b.title}`}
                        >
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button
                          onClick={() => setDeleting(b)}
                          className="btn-ghost btn-sm !px-2.5 !text-red-500 hover:!bg-red-500/10"
                          aria-label={`Delete ${b.title}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted((s) => !s)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-expanded={showCompleted}
              >
                {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
              </button>
              {showCompleted && (
                <ul className="mt-2 space-y-2 opacity-70">
                  {completed.map((b) => (
                    <li key={b.id} className="card flex items-center justify-between p-3.5">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{b.title}</span>
                      <span className="text-xs tabular-nums text-slate-400">{money(b.amount)} · done</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!paying}
        onClose={() => setPaying(null)}
        onConfirm={() => {
          if (paying) markBillPaid(paying);
          setPaying(null);
        }}
        title="Mark as paid?"
        message={paying ? `This logs ${money(paying.amount)} as an expense for "${paying.title}" today.` : ''}
        confirmLabel="Mark paid"
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteBill(deleting.id);
            toast('Bill deleted.');
          }
        }}
        title="Delete bill?"
        message={deleting ? `"${deleting.title}" and its payment history will be removed.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
