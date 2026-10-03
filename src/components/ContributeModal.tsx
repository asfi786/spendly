import { useEffect, useState } from 'react';
import { Loader2, PiggyBank } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/AppContext';
import { todayISO } from '../utils/format';

export default function ContributeModal() {
  const { contributeGoal, closeContribute, addContribution, toast, money } = useStore();
  const { open, goal } = contributeGoal;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount('');
      setDate(todayISO());
      setError('');
      setSaving(false);
    }
  }, [open ]);

  if (!open || !goal) return null;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (amt > remaining) {
      setError(`That is more than the ${money(remaining)} remaining for this goal.`);
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      addContribution(goal.id, Math.round(amt * 100) / 100, date);
      toast(`Added ${money(amt)} to "${goal.name}".`);
      closeContribute();
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={closeContribute}
      title="Add money to goal"
      subtitle={`"${goal.name}" — ${money(goal.currentAmount)} of ${money(goal.targetAmount)} saved`}
      maxWidth="max-w-sm"
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-500/10 p-3">
        <PiggyBank size={22} className="text-brand-600 dark:text-brand-400" aria-hidden />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {money(remaining)} remaining to reach this goal.
        </p>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="contrib-amount" className="label">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            id="contrib-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`input text-lg font-bold ${error ? 'input-error' : ''}`}
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
          />
          {error && <p className="field-error">{error}</p>}
        </div>
        <div>
          <label htmlFor="contrib-date" className="label">
            Date
          </label>
          <input
            id="contrib-date"
            type="date"
            className="input"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Adding…' : 'Add to goal'}
        </button>
      </form>
    </Modal>
  );
}
