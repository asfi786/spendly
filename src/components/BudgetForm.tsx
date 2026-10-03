import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/AppContext';
import { EXPENSE_CATEGORIES } from '../data/categories';

export default function BudgetForm() {
  const { budgetForm, closeBudgetForm, addBudget, updateBudget, toast, state } = useStore();
  const { open, editing } = budgetForm;
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(state.selectedMonth);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(editing?.category ?? '');
      setAmount(editing ? String(editing.amount) : '');
      setMonth(editing?.month ?? state.selectedMonth);
      setErrors({});
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Prevent duplicate category+month budgets (excluding the one being edited)
  const used = new Set(
    state.budgets.filter((b) => b.month === month && b.id !== editing?.id).map((b) => b.category),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = Number(amount);
    if (!category) errs.category = 'Choose a category.';
    if (!amount.trim()) errs.amount = 'Budget amount is required.';
    else if (!Number.isFinite(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than zero.';
    if (!month) errs.month = 'Pick a month.';
    setErrors(errs);
    if (Object.keys(errs).length > 0 || saving) return;
    setSaving(true);
    window.setTimeout(() => {
      try {
        if (editing) {
          updateBudget({ ...editing, category, amount: amt, month });
          toast('Budget updated.');
        } else {
          addBudget({ category, amount: amt, month });
          toast(`Budget set for ${category}.`);
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
      subtitle="Set a monthly spending limit per category."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
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
            {errors.month && <p className="field-error">{errors.month}</p>}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create budget'}
        </button>
      </form>
    </Modal>
  );
}
