import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Camera,
  Check,
  Database,
  Download,
  FlaskConical,
  Loader2,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import ConfirmModal from '../components/ConfirmModal';
import { CURRENCIES, downloadFile } from '../utils/format';
import { csvToTransactions, transactionsToCSV } from '../utils/analytics';
import type { CurrencyCode, ThemePref, Transaction } from '../types';

function Section({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ size?: number | string; className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6 animate-fade-up">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Icon size={19} aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const THEMES: { key: ThemePref; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Palette },
];

export default function Settings() {
  const {
    state,
    updateProfile,
    setCurrency,
    setTheme,
    setNotifications,
    loadDemo,
    clearDemo,
    importTransactions,
    clearAll,
    toast,
  } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const profileDirty = name !== state.user.name || email !== state.user.email;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Please enter your name.', 'error');
      return;
    }
    setSavingProfile(true);
    window.setTimeout(() => {
      updateProfile({ name: name.trim(), email: email.trim() });
      toast('Profile updated.');
      setSavingProfile(false);
    }, 300);
  };

  const onAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be smaller than 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: String(reader.result) });
      toast('Profile photo updated.');
    };
    reader.onerror = () => toast('Could not read that image.', 'error');
    reader.readAsDataURL(file);
  };

  const exportJSON = () => {
    const payload = {
      app: 'Spendly',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: { name: state.user.name, email: state.user.email, currency: state.user.currency },
      transactions: state.transactions,
      budgets: state.budgets,
      goals: state.goals,
    };
    downloadFile(`spendly-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast('Data exported as JSON.');
  };

  const exportCSV = () => {
    downloadFile(
      `spendly-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactionsToCSV(state.transactions),
      'text/csv',
    );
    toast('Transactions exported as CSV.');
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        let txs: Transaction[];
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : parsed.transactions;
          if (!Array.isArray(arr)) throw new Error('JSON must contain a transactions array.');
          txs = arr.map((r: any, i: number) => {
            const type = String(r.type ?? '').toLowerCase();
            const amount = Number(r.amount);
            if (type !== 'expense' && type !== 'income') throw new Error(`Row ${i + 1}: invalid type.`);
            if (!r.title || !Number.isFinite(amount) || amount <= 0) throw new Error(`Row ${i + 1}: invalid title or amount.`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.date ?? ''))) throw new Error(`Row ${i + 1}: date must be yyyy-MM-dd.`);
            return {
              id: String(r.id ?? `imp_${Date.now().toString(36)}_${i}`),
              type,
              amount,
              title: String(r.title),
              category: String(r.category ?? 'Other'),
              date: String(r.date),
              paymentMethod: String(r.paymentMethod ?? 'Cash'),
              notes: String(r.notes ?? ''),
              receipt: null,
              recurring: !!r.recurring,
              createdAt: String(r.createdAt ?? new Date().toISOString()),
            } as Transaction;
          });
        } else {
          txs = csvToTransactions(text);
        }
        if (txs.length === 0) throw new Error('No transactions found in the file.');
        importTransactions(txs);
        toast(`Imported ${txs.length} transactions.`);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not import that file.', 'error');
      } finally {
        setImporting(false);
        if (importRef.current) importRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast('Could not read that file.', 'error');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Your profile, preferences and data.</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile" desc="How Spendly greets you.">
        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white">
              {state.user.avatar ? (
                <img src={state.user.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                (state.user.name || 'S').charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute -bottom-1.5 -right-1.5 rounded-full bg-slate-900 p-1.5 text-white shadow-pop transition-transform hover:scale-105"
            >
              <Camera size={13} aria-hidden />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="sr-only" aria-label="Upload profile photo" onChange={(e) => onAvatar(e.target.files?.[0])} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{state.user.name || 'Spendly user'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{state.user.email || 'No email set'}</p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-name" className="label">Name</label>
            <input id="set-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="set-email" className="label">Email</label>
            <input id="set-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={80} placeholder="you@example.com" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={!profileDirty || savingProfile} className="btn-primary btn-sm">
              {savingProfile && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </Section>

      {/* Currency */}
      <Section icon={Wallet} title="Currency" desc="Used everywhere amounts are shown.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CURRENCIES.map((c) => {
            const active = state.user.currency === c.code;
            return (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code as CurrencyCode);
                  toast(`Currency set to ${c.code}.`);
                }}
                aria-pressed={active}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-800'
                }`}
              >
                <span>{c.code} <span className="font-normal text-slate-400">{c.symbol}</span></span>
                {active && <Check size={15} aria-hidden />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance" desc="Light, dark, or follow your device.">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const active = state.user.theme === t.key;
            return (
              <button
                key={t.key}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-semibold transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-800'
                }`}
              >
                <t.icon size={20} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications" desc="In-app reminders and alerts.">
        <div className="space-y-3">
          {[
            { key: 'budgetAlerts' as const, title: 'Budget alerts', desc: 'Warn me when a budget reaches 80% or goes over.' },
            { key: 'dailyReminder' as const, title: 'Daily reminder', desc: 'Show a gentle nudge banner to log today’s spending.' },
          ].map((n) => {
            const on = state.notifications[n.key];
            return (
              <button
                key={n.key}
                role="switch"
                aria-checked={on}
                onClick={() => {
                  setNotifications({ [n.key]: !on });
                  toast(`${n.title} ${!on ? 'enabled' : 'disabled'}.`, 'info');
                }}
                className="flex w-full items-center justify-between gap-4 rounded-xl border divider px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-night-800"
              >
                <span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{n.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{n.desc}</span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-slate-300 dark:bg-night-700'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                </span>
              </button>
            );
          })}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Spendly runs entirely in your browser, so reminders appear as in-app banners — we never send push notifications or emails.
          </p>
        </div>
      </Section>

      {/* Data */}
      <Section icon={Database} title="Your data" desc="Export, import, or erase everything. Your data never leaves this device.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button className="btn-secondary justify-start" onClick={exportCSV}>
            <Download size={16} aria-hidden /> Export transactions (CSV)
          </button>
          <button className="btn-secondary justify-start" onClick={exportJSON}>
            <Download size={16} aria-hidden /> Export everything (JSON)
          </button>
          <button className="btn-secondary justify-start" onClick={() => importRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
            {importing ? 'Importing…' : 'Import CSV / JSON'}
          </button>
          <input ref={importRef} type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" aria-label="Import data file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          {state.demoData ? (
            <button
              className="btn-secondary justify-start"
              onClick={() => {
                clearDemo();
                toast('Demo data removed.', 'info');
              }}
            >
              <FlaskConical size={16} aria-hidden /> Remove demo data
            </button>
          ) : (
            <button
              className="btn-secondary justify-start"
              onClick={() => {
                loadDemo();
                toast('Demo data loaded.', 'info');
              }}
            >
              <FlaskConical size={16} aria-hidden /> Load demo data
            </button>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 dark:border-red-500/25">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">Danger zone</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Permanently delete your profile, transactions, budgets and goals from this device.
          </p>
          <button className="btn-danger btn-sm mt-3" onClick={() => setConfirmClear(true)}>
            <Trash2 size={14} aria-hidden /> Clear all data
          </button>
        </div>
      </Section>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          toast('All data cleared.', 'info');
          navigate('/onboarding', { replace: true });
        }}
        title="Clear all data?"
        message="This permanently deletes everything stored on this device — profile, transactions, budgets, goals. There is no backup and this can't be undone."
        confirmLabel="Delete everything"
        danger
        requireText="DELETE"
      />
    </div>
  );
}
