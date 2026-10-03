import { useMemo, useState } from 'react';
import { CalendarDays, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useStore } from '../store/AppContext';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate } from '../utils/format';
import type { Goal } from '../types';

export default function Goals() {
  const { state, money, openGoalForm, openContribute, deleteGoal, toast } = useStore();
  const [deleting, setDeleting] = useState<Goal | null>(null);

  const goals = useMemo(
    () => [...state.goals].sort((a, b) => (a.targetDate < b.targetDate ? -1 : 1)),
    [state.goals],
  );

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">
            {goals.length > 0
              ? `${money(totalSaved)} saved toward ${money(totalTarget)}`
              : 'Save for the things that matter.'}
          </p>
        </div>
        <button className="btn-primary btn-sm !py-2" onClick={() => openGoalForm()}>
          <Plus size={15} aria-hidden /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          body="Whether it's a new laptop, an emergency fund or a vacation — set a target, add money over time, and watch the bar fill up."
          actionLabel="Create your first goal"
          onAction={() => openGoalForm()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g, i) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
            const complete = g.currentAmount >= g.targetAmount;
            const daysLeft = Math.ceil(
              (new Date(g.targetDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
            );
            return (
              <div key={g.id} className="card card-hover flex flex-col p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                      <Target size={20} aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarDays size={12} aria-hidden /> {formatDate(g.targetDate)}
                        {daysLeft >= 0 && !complete && (
                          <span className="text-slate-400">· {daysLeft}d left</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => openGoalForm(g)}
                      aria-label={`Edit ${g.name}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-night-700 dark:hover:text-slate-200"
                    >
                      <Pencil size={15} aria-hidden />
                    </button>
                    <button
                      onClick={() => setDeleting(g)}
                      aria-label={`Delete ${g.name}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {money(g.currentAmount)}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">of {money(g.targetAmount)}</p>
                </div>
                <div
                  className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${g.name}: ${Math.round(pct)}% saved`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${complete ? 'bg-gradient-to-r from-brand-500 to-brand-400' : 'bg-gradient-to-r from-sky-500 to-sky-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  {pct.toFixed(0)}% {complete && <span className="text-brand-600 dark:text-brand-400">· Complete!</span>}
                </p>

                {g.contributions.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t divider pt-3 text-xs">
                    {g.contributions.slice(0, 3).map((c) => (
                      <li key={c.id} className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>{formatDate(c.date)}</span>
                        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                          +{money(c.amount)}
                        </span>
                      </li>
                    ))}
                    {g.contributions.length > 3 && (
                      <li className="text-slate-400">+{g.contributions.length - 3} more contributions</li>
                    )}
                  </ul>
                )}

                <button
                  className={`btn mt-4 w-full ${complete ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => openContribute(g)}
                  disabled={complete}
                >
                  <Plus size={15} aria-hidden /> Add money
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteGoal(deleting.id);
            toast('Goal deleted.');
          }
        }}
        title="Delete goal?"
        message={deleting ? `"${deleting.name}" and its contribution history will be removed.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
