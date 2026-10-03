import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/AppContext';
import { EXPENSE_CATEGORIES } from '../data/categories';
import type { BudgetPeriod } from '../types';

export default function BudgetForm() {
  const { budgetForm, closeBudgetForm, addBudget, updateBudget, toast, state } = useStore();
  const { open, editing } = budgetForm;
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [month, setMonth] = useState(state.selectedMonth);
  const [year, setYear] = useState(state.selectedMonth.slice(0, 4));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(editing?.category ?? '');
      setAmount(editing ? String(editing.amount) : '');
      setPeriod(editing?.period ?? 'monthly');
      setMonth(editing?.month ?? state.selectedMonth);
      setYear(editing?.year ?? state.selectedMonth.slice(0, 4));
      setErrors({});
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Prevent duplicate category+period+scope budgets (excluding the one being edited)
  const used = new Set(
    state.budgets
      .filter(
        (b) =>
          b.id !== editing?.id &&
          (b.period ?? 'monthly') === period &&
          (period === 'monthly' ? b.month === month : (b.year ?? b.month.slice(0, 4)) === year),
      )
      .map((b) => b.category),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = Number(amount);
    if (!category) errs.category = 'Choose a category.';
    if (!amount.trim()) errs.amount = 'Budget amount is required.';
    else if (!Number.isFinite(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than zero.';
    if (period === 'monthly' && !month) errs.scope = 'Pick a month.';
    if (period === 'yearly' && !/^\d{4}$/.test(year)) errs.scope = 'Pick a valid year.';
    setErrors(errs);
    if (Object.keys(errs).length > 0 || saving) return;
    setSaving(true);
    window.setTimeout(() => {
      try {
        const payload = {
          category,
          amount: Math.round(amt * 100) / 100,
          period,
          month: period === 'monthly' ? month : `${year}-01`,
          year: period === 'yearly' ? year : month.slice(0, 4),
        };
        if (editing) {
          updateBudget({ ...editing, ...payload });
          toast('Budget updated.');
        } else {
          addBudget(payload);
          toast(`${period === 'monthly' ? 'Monthly' : 'Yearly'} budget set for ${category}.`);
        }
        closeBudgetForm();
      } catch {
        toast('Unable to save this budget. Please try again.', 'error');
        setSaving(false);
      }
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={closeBudgetForm}
      title={editing ? 'Edit budget' : 'New budget'}
      subtitle="Set a spending limit per category — monthly or yearly."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {/* Period switcher */}
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-night-800"
          role="radiogroup"
          aria-label="Budget period"
        >
          {(['monthly', 'yearly'] as const).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="bd-category" className="label">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="bd-category"
            className={`input ${errors.category ? 'input-error' : ''}`}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setErrors((x) => ({ ...x, category: '' }));
            }}
          >
            <option value="">Select…</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name} disabled={used.has(c.name)}>
                {c.name}
                {used.has(c.name) ? ' (already set)' : ''}
              </option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bd-amount" className="label">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="bd-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`input text-lg font-bold ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((x) => ({ ...x, amount: '' }));
              }}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>
          <div>
            {period === 'monthly' ? (
              <>
                <label htmlFor="bd-month" className="label">
                  Month <span className="text-red-500">*</span>
                </label>
                <input
                  id="bd-month"
                  type="month"
                  className="input"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </>
            ) : (
              <>
                <label htmlFor="bd-year" className="label">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  id="bd-year"
                  type="number"
                  className="input"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </>
            )}
            {errors.scope && <p className="field-error">{errors.scope}</p>}
          </div>
        </div>
        {period === 'yearly' && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Yearly budgets add up all spending in {year || 'the year'} for the chosen category.
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create budget'}
        </button>
      </form>
    </Modal>
  );
}
