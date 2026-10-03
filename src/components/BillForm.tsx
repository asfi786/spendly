import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/AppContext';
import { EXPENSE_CATEGORIES } from '../data/categories';
import { todayISO } from '../utils/format';
import { frequencyLabel } from '../utils/bills';
import type { BillFrequency } from '../types';

const FREQUENCIES: BillFrequency[] = ['weekly', 'monthly', 'yearly', 'once'];

export default function BillForm() {
  const { billForm, closeBillForm, addBill, updateBill, toast } = useStore();
  const { open, editing } = billForm;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [firstDue, setFirstDue] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '');
      setAmount(editing ? String(editing.amount) : '');
      setCategory(editing?.category ?? 'Bills');
      setFrequency(editing?.frequency ?? 'monthly');
      setFirstDue(editing?.nextDue ?? todayISO());
      setNotes(editing?.notes ?? '');
      setErrors({});
      setSaving(false);
    }
  }, [open, editing]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = Number(amount);
    if (!title.trim()) errs.title = 'Give this bill a name.';
    if (!amount.trim()) errs.amount = 'Amount is required.';
    else if (!Number.isFinite(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than zero.';
    if (!firstDue) errs.firstDue = 'Pick the next due date.';
    setErrors(errs);
    if (Object.keys(errs).length > 0 || saving) return;
    setSaving(true);
    window.setTimeout(() => {
      try {
        const dayOfMonth = Number(firstDue.slice(8, 10));
        if (editing) {
          updateBill({
            ...editing,
            title: title.trim(),
            amount: Math.round(amt * 100) / 100,
            category,
            frequency,
            dayOfMonth,
            // keep existing nextDue unless the bill was completed
            nextDue: editing.nextDue ?? firstDue,
            notes: notes.trim(),
          });
          toast('Bill updated.');
        } else {
          addBill({
            title: title.trim(),
            amount: Math.round(amt * 100) / 100,
            category,
            frequency,
            dayOfMonth,
            nextDue: firstDue,
            notes: notes.trim(),
          });
          toast('Bill added. Spendly will remind you before it’s due.');
        }
        closeBillForm();
      } catch {
        toast('Unable to save this bill. Please try again.', 'error');
        setSaving(false);
      }
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={closeBillForm}
      title={editing ? 'Edit bill' : 'New bill'}
      subtitle="Track rent, utilities and subscriptions — mark them paid in one tap."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="bill-title" className="label">
            Bill name <span className="text-red-500">*</span>
          </label>
          <input
            id="bill-title"
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. House Rent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bill-amount" className="label">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="bill-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`input text-lg font-bold ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor="bill-category" className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="bill-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="label" id="bill-freq-label">Repeats</span>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-labelledby="bill-freq-label">
            {FREQUENCIES.map((f) => {
              const active = frequency === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFrequency(f)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-night-700 dark:text-slate-400'
                  }`}
                >
                  {frequencyLabel(f)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="bill-due" className="label">
            {editing ? 'Next due date' : 'First due date'} <span className="text-red-500">*</span>
          </label>
          <input
            id="bill-due"
            type="date"
            className={`input ${errors.firstDue ? 'input-error' : ''}`}
            value={firstDue}
            onChange={(e) => setFirstDue(e.target.value)}
          />
          {errors.firstDue && <p className="field-error">{errors.firstDue}</p>}
          {frequency !== 'once' && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              After each payment the due date advances automatically ({frequencyLabel(frequency).toLowerCase()}).
            </p>
          )}
        </div>

        <div>
          <label htmlFor="bill-notes" className="label">
            Notes
          </label>
          <input
            id="bill-notes"
            type="text"
            className="input"
            placeholder="e.g. Pay before the 10th"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={120}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add bill'}
        </button>
      </form>
    </Modal>
  );
}
