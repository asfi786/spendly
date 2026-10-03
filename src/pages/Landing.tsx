import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  CarFront,
  ChevronDown,
  Download,
  Eye,
  Lock,
  Moon,
  PiggyBank,
  Play,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';
import InstallModal from '../components/InstallModal';
import { getClientId } from '../utils/google';
import { canInstall, isStandalone, promptInstall } from '../utils/pwa';

/** Install button for the landing page: native prompt when available, instructions otherwise. */
function LandingInstallButton({ variant = 'secondary' }: { variant?: 'secondary' | 'white' }) {
  const [showModal, setShowModal] = useState(false);
  const [installed] = useState(() => isStandalone());
  if (installed) return null;
  const cls =
    variant === 'white'
      ? 'btn w-full !border-white/40 !px-7 !py-3.5 !text-white hover:!bg-white/10 sm:w-auto'
      : 'btn-secondary w-full !px-7 !py-3.5 text-base sm:w-auto';
  const onClick = async () => {
    if (!canInstall()) {
      setShowModal(true);
      return;
    }
    await promptInstall();
  };
  return (
    <>
      <button onClick={onClick} className={cls}>
        <Download size={18} aria-hidden /> Install App
      </button>
      <InstallModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

/* ---------------- JSON-LD ---------------- */
function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Spendly',
        url: 'https://spendly.app/',
        logo: 'https://spendly.app/favicon.svg',
        description:
          'Track expenses, manage budgets, monitor spending, and understand your finances with Spendly, a simple and beautiful expense tracker.',
      },
      {
        '@type': 'WebSite',
        name: 'Spendly',
        url: 'https://spendly.app/',
        description: 'Simple and Smart Expense Tracker for personal finance.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Spendly',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  };
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

/* ---------------- CSS product mockup ---------------- */
function DashboardMockup() {
  const bars = [42, 68, 35, 80, 55, 92, 62, 74, 48, 88, 58, 70];
  const txs = [
    { icon: UtensilsCrossed, tint: 'bg-brand-500/10 text-brand-600', title: 'Lunch at office', cat: 'Food', amount: 'Rs 850', neg: true },
    { icon: Briefcase, tint: 'bg-sky-500/10 text-sky-600', title: 'Monthly salary', cat: 'Salary', amount: 'Rs 120,000', neg: false },
    { icon: CarFront, tint: 'bg-amber-500/10 text-amber-600', title: 'Petrol', cat: 'Transport', amount: 'Rs 3,200', neg: true },
  ];
  return (
    <div
      className="card overflow-hidden !rounded-3xl shadow-pop"
      role="img"
      aria-label="Preview of the Spendly dashboard showing balance, a spending chart and recent transactions"
    >
      <div className="flex items-center gap-1.5 border-b divider px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
        <span className="ml-2 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-night-800">
          app.spendly.app
        </span>
      </div>
      <div className="grid gap-3 bg-slate-50 p-4 dark:bg-night-900 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white sm:col-span-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Total balance</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums">Rs 86,450</p>
          <p className="mt-1 text-[10px] text-white/70">+12.4% vs last month</p>
        </div>
        <div className="rounded-2xl border divider bg-white p-4 dark:bg-night-850">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Spent in Oct</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">Rs 48,200</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-night-700">
            <div className="h-full w-3/4 rounded-full bg-brand-500" />
          </div>
        </div>
        <div className="hidden items-center justify-center rounded-2xl border divider bg-white p-4 dark:bg-night-850 sm:flex">
          <div
            className="h-20 w-20 rounded-full"
            style={{ background: 'conic-gradient(#10b981 0 34%, #3b82f6 34% 55%, #8b5cf6 55% 72%, #f59e0b 72% 86%, #e2e8f0 86% 100%)' }}
          />
        </div>
        <div className="rounded-2xl border divider bg-white p-4 dark:bg-night-850 sm:col-span-2">
          <p className="mb-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">Spending trend</p>
          <div className="flex h-20 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md ${i % 3 === 0 ? 'bg-brand-500/80' : 'bg-brand-500/25'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border divider bg-white p-4 dark:bg-night-850">
          <p className="mb-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">Recent</p>
          <div className="space-y-2.5">
            {txs.map((t) => (
              <div key={t.title} className="flex items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.tint}`}>
                  <t.icon size={15} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                  <p className="text-[10px] text-slate-400">{t.cat}</p>
                </div>
                <p className={`text-[11px] font-bold tabular-nums ${t.neg ? 'text-slate-800 dark:text-slate-100' : 'text-brand-600'}`}>
                  {t.neg ? '−' : '+'}{t.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  {
    q: 'Is Spendly really free?',
    a: 'Yes. There is no subscription and no paywall. Every feature — transactions, budgets, goals, analytics, exports — is available to everyone. Google sign-in is optional and also free.',
  },
  {
    q: 'Where is my financial data stored?',
    a: 'Entirely in your own browser (local storage on your device). Nothing is uploaded to a server, so your spending data never leaves your hands. Google sign-in is identity only — it just labels your data per profile. The trade-off: clearing your browser data erases it, so use the export feature for backups.',
  },
  {
    q: 'Can I use Spendly on my phone?',
    a: 'Absolutely. Spendly is mobile-first: a bottom tab bar, a floating quick-add button, thumb-friendly forms and charts that adapt to small screens. It works just as well on desktop with a full sidebar layout.',
  },
  {
    q: 'Which currencies are supported?',
    a: 'PKR (default), USD, EUR, GBP, AED and SAR. You can switch currency anytime in Settings and every amount across the app updates instantly.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes — export all transactions as CSV or your complete dataset (transactions, budgets, goals) as JSON from Settings. You can also import CSV/JSON files back in.',
  },
  {
    q: 'Does Spendly give financial advice?',
    a: 'The Advisor page shows smart tips computed from your own data (e.g. "Food is 24% of your spending", budget-breach warnings, savings-rate coaching). You can also connect your own OpenAI key for deeper AI advice — your key stays in your browser and only anonymized summaries are ever sent, only when you ask.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400 animate-fade-in">{a}</p>
      )}
    </div>
  );
}

/* ---------------- Features ---------------- */
const FEATURES = [
  {
    icon: ReceiptText,
    title: 'Effortless expense tracking',
    desc: 'Log an expense or income in seconds with categories, payment methods, receipts and recurring flags.',
  },
  {
    icon: BarChart3,
    title: 'Analytics that make sense',
    desc: 'Spending trends, income-vs-expense comparisons and factual insights computed from your real data.',
  },
  {
    icon: Wallet,
    title: 'Monthly budgets',
    desc: 'Set per-category limits and get warned at 80% — and clearly told when you go over.',
  },
  {
    icon: Target,
    title: 'Savings goals',
    desc: 'Emergency fund, new laptop, vacation — set targets, add money over time and watch progress grow.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar view',
    desc: 'Browse your spending day by day with daily totals at a glance.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    desc: 'No account, no cloud, no tracking. Your data lives only in your browser — export it anytime.',
  },
];

/* ---------------- Page ---------------- */
export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-night-950">
      <JsonLd />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b divider bg-white/85 backdrop-blur-lg dark:bg-night-950/85">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Spendly home">
            <Logo size={34} />
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Spendly</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="transition-colors hover:text-brand-600">Features</a>
            <a href="#how" className="transition-colors hover:text-brand-600">How it works</a>
            <a href="#faq" className="transition-colors hover:text-brand-600">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/onboarding?demo=1" className="btn-ghost btn-sm hidden sm:inline-flex">
              <Eye size={15} aria-hidden /> View demo
            </Link>
            <Link to="/onboarding" className="btn-primary btn-sm">
              Start tracking <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="absolute right-[-6rem] top-40 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
            <span className="chip bg-brand-500/10 text-brand-700 dark:text-brand-300">
              <Sparkles size={13} aria-hidden /> Free forever · No sign-up · Private by design
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Take Control of <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">Your Money</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
              Track your expenses, manage your budget, and understand where your money goes — all in
              one beautiful place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/onboarding" className="btn-primary w-full !px-7 !py-3.5 text-base sm:w-auto">
                <Zap size={18} aria-hidden /> Start Tracking
              </Link>
              <Link to="/onboarding?demo=1" className="btn-secondary w-full !px-7 !py-3.5 text-base sm:w-auto">
                <Play size={18} aria-hidden /> View Demo
              </Link>
            </div>
            {getClientId() && (
              <div className="mt-5 flex justify-center">
                <GoogleSignInButton />
              </div>
            )}
            <div className="mx-auto mt-12 max-w-4xl animate-fade-up">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Features</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to master your money
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              A complete personal finance toolkit — designed to feel like a premium fintech product, not a spreadsheet.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="card card-hover p-6 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <f.icon size={22} aria-hidden />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Highlights band */}
        <section className="border-y divider bg-slate-50 dark:bg-night-900">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-3 md:gap-0 md:divide-x md:divide-slate-200/80 dark:md:divide-night-700/70">
            {[
              { icon: Moon, title: 'Beautiful dark mode', desc: 'A properly designed dark theme — not just inverted colors — that remembers your preference.' },
              { icon: Download, title: 'Your data, portable', desc: 'Export to CSV or JSON, import it back, or wipe it clean. No lock-in, ever.' },
              { icon: Lock, title: 'No account needed', desc: 'Open Spendly and start tracking. Nothing to sign up for, nothing to verify.' },
            ].map((h) => (
              <div key={h.title} className="flex gap-4 md:items-start md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card dark:bg-night-800 dark:text-brand-400">
                  <h.icon size={20} aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              From chaos to clarity in three steps
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { n: '1', title: 'Log your money', desc: 'Add expenses and income in seconds — on desktop or from your phone.' },
              { n: '2', title: 'Set budgets & goals', desc: 'Cap your spending per category and save toward what matters.' },
              { n: '3', title: 'Understand & improve', desc: 'Charts and honest insights show exactly where your money goes.' },
            ].map((s) => (
              <div key={s.n} className="card relative overflow-hidden p-6">
                <span className="pointer-events-none absolute -right-2 -top-4 text-[92px] font-extrabold leading-none text-brand-500/10" aria-hidden>
                  {s.n}
                </span>
                <h3 className="relative text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center sm:p-12">
            <PiggyBank size={36} className="text-white/90" aria-hidden />
            <h2 className="max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Your money deserves better than a forgotten spreadsheet.
            </h2>
            <p className="max-w-md text-sm text-white/80">
              Join the people taking control of their spending — free, private, and ready in under a minute.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/onboarding" className="btn w-full !bg-white !px-7 !py-3.5 !text-brand-700 hover:!bg-brand-50 sm:w-auto">
                Start Tracking — it's free <ArrowRight size={17} aria-hidden />
              </Link>
              <Link to="/onboarding?demo=1" className="btn w-full !border-white/40 !px-7 !py-3.5 !text-white hover:!bg-white/10 sm:w-auto">
                View Demo
              </Link>
              <LandingInstallButton variant="white" />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">FAQ</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Questions, answered
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t divider bg-slate-50 dark:bg-night-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <Logo size={30} />
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Spendly</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                A simple, beautiful expense tracker. Track expenses, manage budgets, monitor spending
                and understand your finances — privately, on your own device.
              </p>
            </div>
            <nav aria-label="Product">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Product</p>
              <ul className="space-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li><Link to="/" className="hover:text-brand-600">Home</Link></li>
                <li><a href="#features" className="hover:text-brand-600">Features</a></li>
                <li><Link to="/onboarding" className="hover:text-brand-600">Start tracking</Link></li>
                <li><Link to="/onboarding?demo=1" className="hover:text-brand-600">View demo</Link></li>
              </ul>
            </nav>
            <nav aria-label="Legal">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Legal</p>
              <ul className="space-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li><Link to="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand-600">Terms of Service</Link></li>
                <li><a href="mailto:hello@spendly.app" className="hover:text-brand-600">Contact</a></li>
              </ul>
            </nav>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t divider pt-6 text-xs text-slate-400 dark:text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Spendly. All rights reserved.</p>
            <p className="font-semibold text-slate-500 dark:text-slate-400">Crafted by Asfund Ali</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
