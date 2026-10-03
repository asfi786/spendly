import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BrainCircuit,
  Camera,
  Check,
  ChevronDown,
  Database,
  Download,
  FlaskConical,
  Globe,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import ConfirmModal from '../components/ConfirmModal';
import GoogleSignInButton from '../components/GoogleSignInButton';
import InstallModal from '../components/InstallModal';
import { CURRENCIES, downloadFile } from '../utils/format';
import { csvToTransactions, transactionsToCSV } from '../utils/analytics';
import { getClientId, saveClientId } from '../utils/google';
import { canInstall, isStandalone, promptInstall } from '../utils/pwa';
import type { CurrencyCode, ThemePref, Transaction } from '../types';

const AI_KEY = 'spendly:openai_key';
const LIVE_ORIGIN = 'https://spendly-acme-88a6.vercel.app';

/* ---------- Google Sign-In ---------- */
function GoogleSection() {
  const { auth, signOut, toast } = useStore();
  const [input, setInput] = useState(() => getClientId() ?? '');
  const [configured, setConfigured] = useState(() => getClientId() !== null);
  const [showGuide, setShowGuide] = useState(false);

  const save = () => {
    const v = input.trim();
    if (!v) {
      toast('Paste your Google OAuth Client ID first.', 'error');
      return;
    }
    if (!/^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(v)) {
      toast('That does not look like a Google Client ID. It should end with .apps.googleusercontent.com.', 'error');
      return;
    }
    saveClientId(v);
    setConfigured(true);
    toast('Google sign-in enabled.');
  };

  const remove = () => {
    saveClientId(null);
    setInput('');
    setConfigured(false);
    if (auth) signOut();
    toast('Google sign-in disabled.', 'info');
  };

  return (
    <Section
      icon={Globe}
      title="Google Sign-In"
      desc="Use your Google account to sign in. Identity only — data stays on this device."
    >
      {!configured ? (
        <div className="space-y-3">
          <label htmlFor="google-client-id" className="label">
            Google OAuth Client ID
          </label>
          <div className="flex gap-2">
            <input
              id="google-client-id"
              className="input flex-1 font-mono text-sm"
              placeholder="123…apps.googleusercontent.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
            <button className="btn-primary btn-sm shrink-0" onClick={save}>
              Save
            </button>
          </div>
          <button
            onClick={() => setShowGuide((s) => !s)}
            aria-expanded={showGuide}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400"
          >
            How do I get a Client ID?
            <ChevronDown size={14} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {showGuide && (
            <ol className="space-y-2.5 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-night-800/70 dark:text-slate-300 animate-fade-in">
              <li className="flex gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-[11px] font-bold text-brand-600">1</span>
                <span>Go to the <a className="font-bold text-brand-600 dark:text-brand-400" href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Google Cloud Console</a> and create (or pick) a project.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-[11px] font-bold text-brand-600">2</span>
                <span>Open <strong>APIs &amp; Services → Credentials</strong>, then <strong>Create credentials → OAuth client ID</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-[11px] font-bold text-brand-600">3</span>
                <span>Choose application type <strong>Web application</strong> and add this Authorized JavaScript origin:
                  <code className="mt-1 block rounded-lg bg-night-800 px-2.5 py-2 font-mono text-[11px] text-emerald-300 dark:bg-night-900">{LIVE_ORIGIN}</code>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-[11px] font-bold text-brand-600">4</span>
                <span>Copy the <strong>Client ID</strong> (it ends with <code>.apps.googleusercontent.com</code>) and paste it above.</span>
              </li>
            </ol>
          )}
        </div>
      ) : auth ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3.5 rounded-xl border divider p-4">
            {auth.avatar ? (
              <img src={auth.avatar} alt="" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
                {(auth.name || auth.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{auth.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{auth.email}</p>
            </div>
            <span className="chip bg-brand-500/10 text-brand-700 dark:text-brand-300">Signed in</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Your data is stored separately for this Google profile on this device. Signing out keeps
            the data — it just switches back to anonymous mode.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary btn-sm" onClick={signOut}>
              <LogOut size={14} aria-hidden /> Sign out
            </button>
            <button className="btn-ghost btn-sm !text-red-500" onClick={remove}>
              Remove Client ID
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <GoogleSignInButton />
          <button className="btn-ghost btn-sm !text-red-500" onClick={remove}>
            Remove Client ID
          </button>
        </div>
      )}
      <p className="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
        Google sign-in is identity only. Your transactions, budgets and goals never leave this
        browser. Multiple Google accounts on one device keep fully separate data.
      </p>
    </Section>
  );
}

/* ---------- AI Advisor ---------- */
function AiAdvisorSection() {
  const { toast } = useStore();
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setSaved(!!localStorage.getItem(AI_KEY));
    } catch {
      setSaved(false);
    }
  }, []);

  const save = () => {
    const v = input.trim();
    if (!v) {
      toast('Paste your OpenAI API key first.', 'error');
      return;
    }
    if (!/^sk-[A-Za-z0-9-]{8,}$/.test(v)) {
      toast('That does not look like an OpenAI API key (it starts with sk-).', 'error');
      return;
    }
    try {
      localStorage.setItem(AI_KEY, v);
    } catch {
      toast('Could not save the key on this device.', 'error');
      return;
    }
    setInput('');
    setSaved(true);
    toast('API key saved — it never leaves this browser.');
  };

  const remove = () => {
    try {
      localStorage.removeItem(AI_KEY);
    } catch {
      /* noop */
    }
    setSaved(false);
    toast('API key removed.', 'info');
  };

  return (
    <Section
      icon={BrainCircuit}
      title="AI Advisor"
      desc="Optional: deeper personalized advice powered by OpenAI."
    >
      {saved ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
            <Check size={16} aria-hidden /> API key saved on this device
          </p>
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Go to the <a href="/app/advisor" className="font-bold text-brand-600 dark:text-brand-400">Advisor</a> page
            and press “Generate AI advice”. Only anonymized monthly aggregates (totals by category — no
            names, notes or identifiers) are sent to api.openai.com, and only when you press Generate.
            Nothing is sent otherwise.
          </p>
          <button className="btn-ghost btn-sm !text-red-500" onClick={remove}>
            Remove API key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="openai-key" className="label">
            OpenAI API key
          </label>
          <div className="flex gap-2">
            <input
              id="openai-key"
              type="password"
              autoComplete="off"
              className="input flex-1 font-mono text-sm"
              placeholder="sk-…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-primary btn-sm shrink-0" onClick={save}>
              <KeyRound size={14} aria-hidden /> Save
            </button>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="font-bold text-brand-600 dark:text-brand-400">platform.openai.com/api-keys</a>.
            Your key is stored <strong>only in this browser</strong> and never logged. Without a key,
            the built-in smart tips on the Advisor page work just fine.
          </p>
        </div>
      )}
    </Section>
  );
}

/* ---------- Install app ---------- */
function AppSection() {
  const { toast } = useStore();
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
  }, []);

  const install = async () => {
    if (!canInstall()) {
      setShowInstall(true);
      return;
    }
    const accepted = await promptInstall();
    if (accepted) {
      setInstalled(true);
      toast('Spendly is installing — look for it on your home screen.', 'success');
    } else {
      toast('Install dismissed. You can try again anytime.', 'info');
    }
  };

  return (
    <Section icon={Smartphone} title="App" desc="Install Spendly on your device for an app-like experience.">
      {installed ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
          <Check size={16} aria-hidden /> You&apos;re running the installed app
        </p>
      ) : (
        <div className="space-y-3">
          <button className="btn-primary" onClick={install}>
            <Download size={16} aria-hidden /> Install App
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Opens full-screen, works offline for your saved data, and launches from your home screen.
          </p>
        </div>
      )}
      <InstallModal open={showInstall} onClose={() => setShowInstall(false)} />
    </Section>
  );
}

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

      {/* Google Sign-In */}
      <GoogleSection />

      {/* AI Advisor */}
      <AiAdvisorSection />

      {/* App / install */}
      <AppSection />

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

      {/* About */}
      <Section icon={Info} title="About" desc="Spendly — your money, beautifully tracked.">
        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">Crafted by Asfund Ali</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Spendly keeps everything in your browser — your data belongs to you.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Version 2.0</p>
        </div>
      </Section>
    </div>
  );
}
