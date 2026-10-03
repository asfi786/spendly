import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/AppContext';

export default function GoalForm() {
  const { goalForm, closeGoalForm, addGoal, updateGoal, toast } = useStore();
  const { open, editing } = goalForm;
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setTargetAmount(editing ? String(editing.targetAmount) : '');
      setTargetDate(editing?.targetDate ?? '');
      setErrors({});
      setSaving(false);
    }
  }, [open, editing]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = Number(targetAmount);
    if (!name.trim()) errs.name = 'Give your goal a name.';
    if (!targetAmount.trim()) errs.targetAmount = 'Target amount is required.';
    else if (!Number.isFinite(amt) || amt <= 0) errs.targetAmount = 'Enter a valid amount greater than zero.';
    if (!targetDate) errs.targetDate = 'Pick a target date.';
    setErrors(errs);
    if (Object.keys(errs).length > 0 || saving) return;
    setSaving(true);
    window.setTimeout(() => {
      try {
        if (editing) {
          updateGoal({ ...editing, name: name.trim(), targetAmount: amt, targetDate });
          toast('Goal updated.');
        } else {
          addGoal({ name: name.trim(), targetAmount: amt, currentAmount: 0, targetDate });
          toast(`Goal "${name.trim()}" created.`);
        }
        closeGoalForm();
      } catch {
        toast('Unable to save this goal. Please try again.', 'error');
        setSaving(false);
      }
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={closeGoalForm}
      title={editing ? 'Edit goal' : 'New goal'}
      subtitle="Something worth saving for — give it a target and a date."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="goal-name" className="label">
            Goal name <span className="text-red-500">*</span>
          </label>
          <input
            id="goal-name"
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Emergency fund"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((x) => ({ ...x, name: '' }));
            }}
            maxLength={60}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="goal-target" className="label">
              Target amount <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`input text-lg font-bold ${errors.targetAmount ? 'input-error' : ''}`}
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => {
                setTargetAmount(e.target.value);
                setErrors((x) => ({ ...x, targetAmount: '' }));
              }}
            />
            {errors.targetAmount && <p className="field-error">{errors.targetAmount}</p>}
          </div>
          <div>
            <label htmlFor="goal-date" className="label">
              Target date <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-date"
              type="date"
              className={`input ${errors.targetDate ? 'input-error' : ''}`}
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                setErrors((x) => ({ ...x, targetDate: '' }));
              }}
            />
            {errors.targetDate && <p className="field-error">{errors.targetDate}</p>}
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create goal'}
        </button>
      </form>
    </Modal>
  );
}
