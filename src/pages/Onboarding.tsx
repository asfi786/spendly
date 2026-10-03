import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FlaskConical, Sparkles, Wallet } from 'lucide-react';
import Logo from '../components/Logo';
import { useStore } from '../store/AppContext';
import { CURRENCIES } from '../utils/format';
import type { CurrencyCode } from '../types';

const STEPS = ['Welcome', 'Name', 'Currency', 'Data', 'Done'];

export default function Onboarding() {
  const { state, updateProfile, setCurrency, loadDemo, setOnboarded, toast } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wantsDemo = params.get('demo') === '1';

  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.user.name);
  const [currency, setCur] = useState<CurrencyCode>(state.user.currency);
  const [useDemo, setUseDemo] = useState(wantsDemo);
  const [nameError, setNameError] = useState('');

  const finish = (withDemo: boolean) => {
    const finalName = name.trim() || 'there';
    updateProfile({ name: name.trim() || 'Friend' });
    setCurrency(currency);
    if (withDemo) loadDemo();
    setOnboarded(true);
    toast(`Welcome${finalName !== 'there' ? `, ${finalName.split(' ')[0]}` : ''}! ${withDemo ? 'Demo data loaded — explore freely.' : "Let's track your first transaction."}`);
    navigate('/app', { replace: true });
  };

  const nextFromName = () => {
    if (!name.trim()) {
      setNameError('Tell us your name — or skip for now.');
      return;
    }
    setNameError('');
    setStep(2);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-night-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Spendly home">
          <Logo size={32} />
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Spendly</span>
        </Link>
        {step > 0 && step < 4 && (
          <button onClick={() => finish(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400">
            Skip
          </button>
        )}
      </header>

      {/* Progress */}
      <div className="mx-auto w-full max-w-md px-6" aria-hidden>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-slate-300 dark:bg-night-700'}`}
            />
          ))}
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="card w-full max-w-md p-7 sm:p-9 animate-scale-in" key={step}>
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-5 w-fit animate-fade-up"><Logo size={64} /></div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome to Spendly
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Track expenses, manage budgets and understand where your money goes — all in one
                beautiful place. Set up takes under a minute.
              </p>
              <div className="mt-6 space-y-2.5">
                <button className="btn-primary w-full !py-3" onClick={() => setStep(1)}>
                  {wantsDemo ? 'Explore the demo' : 'Get started'} <ArrowRight size={17} aria-hidden />
                </button>
                <p className="text-xs text-slate-400">Free forever · No account needed · Data stays on your device</p>
              </div>
            </div>
          )}

          {/* Step 1 — Name */}
          {step === 1 && (
            <div>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Sparkles size={22} aria-hidden />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">What should we call you?</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Your dashboard greets you by name.</p>
              <div className="mt-5">
                <label htmlFor="ob-name" className="label">Your name</label>
                <input
                  id="ob-name"
                  className={`input !py-3 text-base ${nameError ? 'input-error' : ''}`}
                  placeholder="e.g. Asfund Ali"
                  value={name}
                  maxLength={40}
                  autoFocus
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && nextFromName()}
                />
                {nameError && <p className="field-error">{nameError}</p>}
              </div>
              <div className="mt-6 flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(0)} aria-label="Back">
                  <ArrowLeft size={17} aria-hidden />
                </button>
                <button className="btn-primary flex-1 !py-3" onClick={nextFromName}>
                  Continue <ArrowRight size={17} aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Currency */}
          {step === 2 && (
            <div>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Wallet size={22} aria-hidden />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pick your currency</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">You can change this anytime in Settings.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Currency">
                {CURRENCIES.map((c) => {
                  const active = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCur(c.code)}
                      className={`rounded-xl border p-3.5 text-left transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-200 hover:border-slate-300 dark:border-night-700 dark:hover:border-night-700'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{c.code}</span>
                        {active && <Check size={16} className="text-brand-500" aria-hidden />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{c.name} ({c.symbol})</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(1)} aria-label="Back">
                  <ArrowLeft size={17} aria-hidden />
                </button>
                <button className="btn-primary flex-1 !py-3" onClick={() => setStep(3)}>
                  Continue <ArrowRight size={17} aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Demo data */}
          {step === 3 && (
            <div>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <FlaskConical size={22} aria-hidden />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Start with sample data?</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                See Spendly in action instantly with realistic sample transactions — clearly labeled, removable anytime.
              </p>
              <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Demo data choice">
                {[
                  { key: true, title: 'Yes, load demo data', desc: 'Explore charts, budgets and goals right away.' },
                  { key: false, title: 'No, start fresh', desc: 'Begin with a clean slate and add your own.' },
                ].map((o) => {
                  const active = useDemo === o.key;
                  return (
                    <button
                      key={String(o.key)}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setUseDemo(o.key)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-500/[0.07]'
                          : 'border-slate-200 hover:border-slate-300 dark:border-night-700'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-brand-500' : 'border-slate-300 dark:border-night-700'}`}>
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">{o.title}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{o.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(2)} aria-label="Back">
                  <ArrowLeft size={17} aria-hidden />
                </button>
                <button className="btn-primary flex-1 !py-3" onClick={() => finish(useDemo)}>
                  Start tracking <ArrowRight size={17} aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="px-5 py-5 text-center text-xs text-slate-400 dark:text-slate-500">
        By continuing you agree to our <Link to="/terms" className="underline hover:text-slate-500">Terms</Link> and{' '}
        <Link to="/privacy" className="underline hover:text-slate-500">Privacy Policy</Link>.
      </footer>
    </div>
  );
}
