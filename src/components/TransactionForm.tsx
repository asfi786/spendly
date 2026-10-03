import { useEffect, useRef, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ImagePlus, Loader2, Repeat, X } from 'lucide-react';
import Modal from './Modal';
import ReceiptScanner from './ReceiptScanner';
import { useStore } from '../store/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../data/categories';
import { todayISO } from '../utils/format';
import { parseQuickAdd } from '../utils/quickParse';
import type { ReceiptData } from '../utils/receipt';

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;

interface FormState {
  amount: string;
  title: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  recurring: boolean;
  receipt: string | null;
  nature: '' | 'fixed' | 'variable';
}

export default function TransactionForm() {
  const { txForm, closeTxForm, addTransaction, updateTransaction, toast } = useStore();
  const { open, txType, editing } = txForm;
  const [type, setType] = useState<'expense' | 'income'>(txType);
  const [form, setForm] = useState<FormState>({
    amount: '',
    title: '',
    category: '',
    date: todayISO(),
    paymentMethod: 'Cash',
    notes: '',
    recurring: false,
    receipt: null,
    nature: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setType(editing?.type ?? txType);
      setForm({
        amount: editing ? String(editing.amount) : '',
        title: editing?.title ?? '',
        category: editing?.category ?? '',
        date: editing?.date ?? todayISO(),
        paymentMethod: editing?.paymentMethod ?? 'Cash',
        notes: editing?.notes ?? '',
        recurring: editing?.recurring ?? false,
        receipt: editing?.receipt ?? null,
        nature: editing?.nature ?? '',
      });
      setErrors({});
      setSaving(false);
    }
  }, [open, editing, txType]);

  if (!open) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isExpense = type === 'expense';

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const onReceipt = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, receipt: 'Please choose an image file.' }));
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setErrors((e) => ({ ...e, receipt: 'Image must be smaller than 2 MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('receipt', String(reader.result));
    reader.onerror = () => setErrors((e) => ({ ...e, receipt: 'Could not read that image.' }));
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const amount = Number(form.amount);
    if (!form.amount.trim()) e.amount = 'Amount is required.';
    else if (!Number.isFinite(amount) || amount <= 0) e.amount = 'Please enter a valid amount greater than zero.';
    else if (amount > 1_000_000_000) e.amount = 'That amount looks too large.';
    if (!form.title.trim()) e.title = 'Give this transaction a title.';
    if (!form.category) e.category = 'Choose a category.';
    if (!form.date) e.date = 'Pick a date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Fill the form from a scanned receipt (user verifies before saving). */
  const applyReceipt = (data: ReceiptData) => {
    setForm((f) => {
      const next = { ...f };
      if (data.amount !== null) next.amount = String(data.amount);
      if (data.title) {
        next.title = data.title;
        // guess a category from the merchant name when none is chosen yet
        if (!next.category) {
          const guess = parseQuickAdd(data.title);
          if (guess.category && guess.category !== 'Other') next.category = guess.category;
        }
      }
      if (data.date) next.date = data.date;
      return next;
    });
    setErrors((e) => ({ ...e, amount: '', title: '', date: '' }));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);
    // Tiny delay so the button loading state is perceptible and honest
    window.setTimeout(() => {
      try {
        const payload = {
          type,
          amount: Math.round(Number(form.amount) * 100) / 100,
          title: form.title.trim(),
          category: form.category,
          date: form.date,
          paymentMethod: form.paymentMethod,
          notes: form.notes.trim(),
          receipt: form.receipt,
          recurring: form.recurring,
          ...(isExpense && form.nature ? { nature: form.nature } : {}),
        };
        if (editing) {
          updateTransaction({ ...editing, ...payload });
          toast(`${isExpense ? 'Expense' : 'Income'} updated.`);
        } else {
          addTransaction(payload);
          toast(`${isExpense ? 'Expense' : 'Income'} added.`);
        }
        closeTxForm();
      } catch {
        toast('Unable to save this transaction. Please try again.', 'error');
        setSaving(false);
      }
    }, 350);
  };

  return (
    <Modal
      open={open}
      onClose={closeTxForm}
      title={editing ? `Edit ${isExpense ? 'expense' : 'income'}` : `Add ${isExpense ? 'expense' : 'income'}`}
      subtitle={editing ? 'Update the details below.' : 'Log it in seconds — every chart updates instantly.'}
    >
      {/* Type switcher */}
      <div
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-night-800"
        role="tablist"
        aria-label="Transaction type"
      >
        {(['expense', 'income'] as const).map((t) => {
          const active = type === t;
          const Icon = t === 'expense' ? ArrowDownCircle : ArrowUpCircle;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => {
                setType(t);
                set('category', '');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? t === 'expense'
                    ? 'bg-white text-red-600 shadow-sm dark:bg-night-700 dark:text-red-400'
                    : 'bg-white text-brand-600 shadow-sm dark:bg-night-700 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={16} aria-hidden />
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {/* Fixed / variable (expenses only) */}
        {isExpense && (
          <div>
            <span className="label" id="tx-nature-label">Spending type</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-night-800" role="radiogroup" aria-labelledby="tx-nature-label">
              {(
                [
                  { v: 'fixed', label: 'Fixed', hint: 'Rent, bills, subscriptions' },
                  { v: 'variable', label: 'Variable', hint: 'Food, shopping, fun' },
                ] as const
              ).map((o) => {
                const active = form.nature === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('nature', active ? '' : o.v)}
                    title={o.hint}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Optional — helps analytics split fixed costs from flexible spending.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="tx-amount" className="label">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`input text-lg font-bold ${errors.amount ? 'input-error' : ''}`}
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'tx-amount-err' : undefined}
          />
          {errors.amount && (
            <p id="tx-amount-err" className="field-error">
              {errors.amount}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="tx-title" className="label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="tx-title"
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder={isExpense ? 'e.g. Lunch at office' : 'e.g. Monthly salary'}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={80}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tx-category" className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="tx-category"
              className={`input ${errors.category ? 'input-error' : ''}`}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="field-error">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="tx-date" className="label">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="tx-date"
              type="date"
              className={`input ${errors.date ? 'input-error' : ''}`}
              value={form.date}
              max={todayISO()}
              onChange={(e) => set('date', e.target.value)}
            />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="tx-method" className="label">
            Payment method
          </label>
          <select
            id="tx-method"
            className="input"
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tx-notes" className="label">
            Notes
          </label>
          <textarea
            id="tx-notes"
            className="input min-h-[72px] resize-none"
            placeholder="Anything worth remembering…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            maxLength={300}
          />
        </div>

        {/* Receipt */}
        <div>
          <span className="label">Receipt (optional)</span>
          {isExpense && (
            <div className="mb-2">
              <ReceiptScanner onExtract={applyReceipt} notify={toast} />
            </div>
          )}
          {form.receipt ? (
            <div className="relative w-fit">
              <img
                src={form.receipt}
                alt="Receipt preview"
                className="h-28 w-28 rounded-xl border divider object-cover"
              />
              <button
                type="button"
                onClick={() => set('receipt', null)}
                aria-label="Remove receipt"
                className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1.5 text-white shadow-pop"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm font-medium text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-night-700 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              <ImagePlus size={18} aria-hidden />
              Attach receipt photo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload receipt image"
            onChange={(e) => onReceipt(e.target.files?.[0])}
          />
          {errors.receipt && <p className="field-error">{errors.receipt}</p>}
        </div>

        {/* Recurring */}
        <button
          type="button"
          role="switch"
          aria-checked={form.recurring}
          onClick={() => set('recurring', !form.recurring)}
          className="flex w-full items-center justify-between rounded-xl border divider px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-night-800"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Repeat size={17} className={form.recurring ? 'text-brand-500' : 'text-slate-400'} aria-hidden />
            Recurring {isExpense ? 'expense' : 'income'}
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${form.recurring ? 'bg-brand-500' : 'bg-slate-300 dark:bg-night-700'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.recurring ? 'left-[22px]' : 'left-0.5'}`}
            />
          </span>
        </button>

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3 text-base">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : `Add ${isExpense ? 'expense' : 'income'}`}
        </button>
      </form>
    </Modal>
  );
}
