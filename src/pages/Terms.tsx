import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, ShieldAlert, Wallet } from 'lucide-react';
import Logo from '../components/Logo';

const SECTIONS = [
  {
    icon: FileText,
    title: 'The service',
    body: 'Spendly is a free personal finance tracker that runs entirely in your web browser. It helps you record income and expenses, set budgets and savings goals, and view analytics computed from the data you enter. No account is required and the service is provided as-is.',
  },
  {
    icon: Wallet,
    title: 'Your data, your responsibility',
    body: 'Your data is stored only in your browser\u2019s local storage. You are responsible for keeping backups using the built-in CSV/JSON export. We cannot recover data lost through browser clearing, device loss or the "Clear all data" action, because we never receive or store a copy.',
  },
  {
    icon: ShieldAlert,
    title: 'Not financial advice',
    body: 'Insights shown in Spendly (such as spending breakdowns and month-over-month comparisons) are factual summaries of the data you entered. They are not financial, investment, tax or legal advice. Always consult a qualified professional before making financial decisions.',
  },
  {
    icon: Scale,
    title: 'Acceptable use & liability',
    body: 'Use Spendly lawfully and for personal purposes. The service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any loss arising from your use of Spendly, including data loss or decisions made based on its summaries.',
  },
];

export default function Terms() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: October 4, 2026</p>

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
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Changes</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We may update these terms as Spendly evolves; the "last updated" date above will
            reflect the latest version. Continued use of the app after changes means you accept
            the updated terms.
          </p>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Questions? <a href="mailto:hello@spendly.app" className="font-semibold text-brand-600 hover:underline">hello@spendly.app</a>
        </p>
      </main>
    </div>
  );
}
