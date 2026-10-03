import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, Database, Eye, Lock, Trash2, UserCheck } from 'lucide-react';
import Logo from '../components/Logo';

const SECTIONS = [
  {
    icon: Database,
    title: 'What we store',
    body: 'Everything you enter into Spendly — your name, transactions, budgets, goals, bills and preferences — is stored exclusively in your browser\u2019s local storage on your own device. We operate no servers for user data, so there is nothing to breach, sell or subpoena on our end because we simply don\u2019t have it.',
  },
  {
    icon: Eye,
    title: 'What we don\u2019t collect',
    body: 'We don\u2019t require an account, we don\u2019t set tracking cookies, and we don\u2019t run analytics that follow you around. The demo data toggle, theme and currency choices are stored locally too, for your convenience only.',
  },
  {
    icon: UserCheck,
    title: 'Google sign-in (optional, identity only)',
    body: 'If you enable Google sign-in and sign in, Spendly receives only your basic Google profile (name, email and profile photo) to identify you. That is all Google shares with us, and it is all we store about your identity. Your financial data still never leaves your browser — signing in simply namespaces your data per Google profile so multiple people sharing one device keep separate data. We never send your transactions, budgets or goals to Google.',
  },
  {
    icon: Bot,
    title: 'AI advice (optional, only when you ask)',
    body: 'The Advisor page works out of the box with smart tips computed entirely in your browser. If you choose to add your own OpenAI API key, the key stays in your browser\u2019s local storage and is never logged. When — and only when — you press \u201cGenerate AI advice\u201d, Spendly sends an anonymized summary (monthly totals by category, budget usage, goal progress — no names, notes, titles or other identifiers) to api.openai.com to produce the advice. Nothing is sent to OpenAI at any other time.',
  },
  {
    icon: Lock,
    title: 'Receipts and photos',
    body: 'If you attach a receipt photo or a profile picture, the image is stored as data inside your browser\u2019s local storage alongside your other data. Receipt scanning (OCR) also runs entirely in your browser using an on-device library — receipt images are never uploaded anywhere.',
  },
  {
    icon: Trash2,
    title: 'Deleting your data',
    body: 'You can remove everything at any time from Settings \u2192 Your data \u2192 Clear all data (with a typed confirmation). Signing out of the app also clears your local data; signing out of Google keeps each profile\u2019s data saved but switches you back to anonymous mode. Clearing your browser\u2019s site data will erase it as well — use the CSV/JSON export feature to keep backups.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-night-950">
      <header className="border-b divider">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Spendly home">
            <Logo size={30} />
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">Spendly</span>
          </Link>
          <Link to="/" className="btn-ghost btn-sm">
            <ArrowLeft size={15} aria-hidden /> Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: October 4, 2026</p>

        <div className="card mt-8 border-brand-500/30 bg-brand-500/[0.06] p-5 dark:border-brand-500/30">
          <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
            The short version: Spendly is designed so that your financial data never leaves your
            device. There is no cloud sync and no tracking — the only exceptions are entirely
            optional: Google sign-in (identity only) and AI advice (anonymized summaries, only
            when you press Generate).
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <s.icon size={19} aria-hidden />
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.body}</p>
            </section>
          ))}
        </div>

        <section className="card mt-4 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">A note on honesty</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We don\u2019t claim certifications, audits or compliance regimes we haven\u2019t
            undergone. Spendly\u2019s privacy promise is architectural: without servers storing
            your data, there is simply less that can go wrong. That said, anyone with access to
            your unlocked device or browser profile could view your data — keep your device
            secured as you would with any finance app.
          </p>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Questions? <a href="mailto:hello@spendly.app" className="font-semibold text-brand-600 hover:underline">hello@spendly.app</a>
        </p>
      </main>
    </div>
  );
}
