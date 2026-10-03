import { useState } from 'react';
import { CalendarDays, CreditCard, FileText, Pencil, Repeat, Trash2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import CategoryIcon from './CategoryIcon';
import { useStore } from '../store/AppContext';
import { categoryColor, categoryIcon } from '../data/categories';
import { formatDate } from '../utils/format';

export default function TxDetailModal() {
  const { txDetail, closeTxDetail, openTxForm, deleteTransaction, toast, money } = useStore();
  const { open, tx } = txDetail;
  const [confirming, setConfirming] = useState(false);

  if (!open || !tx) return null;

  const isExpense = tx.type === 'expense';
  const color = categoryColor(tx.category, tx.type);

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <CalendarDays size={16} className="text-slate-400" aria-hidden />,
      label: 'Date',
      value: formatDate(tx.date),
    },
    {
      icon: <CreditCard size={16} className="text-slate-400" aria-hidden />,
      label: 'Payment method',
      value: tx.paymentMethod,
    },
    ...(tx.recurring
      ? [
          {
            icon: <Repeat size={16} className="text-slate-400" aria-hidden />,
            label: 'Recurring',
            value: 'Yes',
          },
        ]
      : []),
    ...(tx.notes
      ? [
          {
            icon: <FileText size={16} className="text-slate-400" aria-hidden />,
            label: 'Notes',
            value: tx.notes,
          },
        ]
      : []),
  ];

  return (
    <>
      <Modal open={open} onClose={closeTxDetail} title="Transaction details" maxWidth="max-w-md">
        <div className="flex items-center gap-4">
          <CategoryIcon icon={categoryIcon(tx.category, tx.type)} color={color} size={24} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">{tx.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tx.category}</p>
          </div>
          <p
            className={`text-xl font-extrabold tracking-tight ${
              isExpense ? 'text-slate-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'
            }`}
          >
            {isExpense ? '−' : '+'}
            {money(tx.amount)}
          </p>
        </div>

        <dl className="mt-5 space-y-1 rounded-xl bg-slate-50 p-4 dark:bg-night-800">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 py-1.5">
              {r.icon}
              <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {r.label}
              </dt>
              <dd className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{r.value}</dd>
            </div>
          ))}
          <div className="flex items-center gap-3 py-1.5">
            <FileText size={16} className="text-slate-400" aria-hidden />
            <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">Added</dt>
            <dd className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              {new Date(tx.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </dd>
          </div>
        </dl>

        {tx.receipt && (
          <div className="mt-4">
            <p className="label">Receipt</p>
            <img
              src={tx.receipt}
              alt={`Receipt for ${tx.title}`}
              className="max-h-64 w-full rounded-xl border divider object-contain bg-slate-50 dark:bg-night-800"
            />
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => {
              closeTxDetail();
              openTxForm(tx.type, tx);
            }}
          >
            <Pencil size={15} aria-hidden /> Edit
          </button>
          <button className="btn-ghost !text-red-500 hover:!bg-red-500/10 flex-1" onClick={() => setConfirming(true)}>
            <Trash2 size={15} aria-hidden /> Delete
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteTransaction(tx.id);
          toast('Transaction deleted.');
          closeTxDetail();
        }}
        title="Delete transaction?"
        message={`"${tx.title}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
