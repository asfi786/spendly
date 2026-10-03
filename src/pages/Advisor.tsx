import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Info,
  Loader2,
  Settings as SettingsIcon,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import EmptyState from '../components/EmptyState';
import { buildAdvisorTips, type AdvisorTip } from '../utils/advisor';
import { categoryTotals, sumByType, txInMonth } from '../utils/analytics';
import type { Transaction } from '../types';

const AI_KEY = 'spendly:openai_key';

const SEVERITY = {
  info: { icon: Info, chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', bar: 'border-sky-500/25' },
  warning: { icon: TriangleAlert, chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', bar: 'border-amber-500/25' },
  success: { icon: CheckCircle2, chip: 'bg-brand-500/10 text-brand-700 dark:text-brand-300', bar: 'border-brand-500/25' },
} as const;

function TipCard({ tip, index }: { tip: AdvisorTip; index: number }) {
  const s = SEVERITY[tip.severity];
  return (
    <article
      className={`card border-l-4 p-5 animate-fade-up ${s.bar}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${s.chip}`}>
          <s.icon size={19} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tip.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{tip.body}</p>
          {tip.actionLabel && tip.actionTo && (
            <Link
              to={tip.actionTo}
              className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {tip.actionLabel} <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Build a strictly anonymized aggregate summary for the optional AI call. */
function buildAnonymizedSummary(transactions: Transaction[]): string {
  const txs = transactions;
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;
  const c = txs.filter((t) => txInMonth(t, cur));
  const p = txs.filter((t) => txInMonth(t, prev));
  const byCat = (arr: typeof txs) =>
    categoryTotals(arr, 'expense')
      .map((x) => `${x.category}: ${Math.round(x.amount)} (${x.pct.toFixed(0)}%)`)
      .join(', ') || 'none';
  return [
    `Currency amounts are plain numbers, no personal identifiers included.`,
    `This month: income ${Math.round(sumByType(c, 'income'))}, expenses ${Math.round(sumByType(c, 'expense'))}.`,
    `This month by category: ${byCat(c)}.`,
    `Last month: income ${Math.round(sumByType(p, 'income'))}, expenses ${Math.round(sumByType(p, 'expense'))}.`,
    `Last month by category: ${byCat(p)}.`,
  ].join('\n');
}

/** Minimal markdown-ish renderer (bold, bullets, numbered lists, paragraphs). No deps. */
function renderAiText(text: string): React.ReactNode[] {
  const bold = (s: string, key: number) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p,
        )}
      </span>
    );
  };
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <span key={i} className="block h-2" />;
    if (/^#{1,4}\s/.test(t)) {
      return (
        <p key={i} className="mt-3 font-bold text-slate-900 dark:text-white first:mt-0">
          {bold(t.replace(/^#{1,4}\s/, ''), i)}
        </p>
      );
    }
    if (/^[-*•]\s/.test(t)) {
      return (
        <li key={i} className="ml-4 list-disc">
          {bold(t.replace(/^[-*•]\s/, ''), i)}
        </li>
      );
    }
    if (/^\d+[.)]\s/.test(t)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {bold(t.replace(/^\d+[.)]\s/, ''), i)}
        </li>
      );
    }
    return (
      <p key={i} className="mt-1.5 first:mt-0">
        {bold(t, i)}
      </p>
    );
  });
}

export default function Advisor() {
  const { state, toast } = useStore();
  const navigate = useNavigate();
  const tips = useMemo(
    () =>
      buildAdvisorTips({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        bills: state.bills,
        month: state.selectedMonth,
        currency: state.user.currency,
      }),
    [state.transactions, state.budgets, state.goals, state.bills, state.selectedMonth, state.user.currency],
  );

  const [keySaved, setKeySaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const refreshKey = () => {
    try {
      setKeySaved(!!localStorage.getItem(AI_KEY));
    } catch {
      setKeySaved(false);
    }
  };
  useEffect(() => {
    refreshKey();
    window.addEventListener('focus', refreshKey);
    return () => window.removeEventListener('focus', refreshKey);
  }, []);

  const generateAi = async () => {
    const key = (() => {
      try {
        return localStorage.getItem(AI_KEY);
      } catch {
        return null;
      }
    })();
    if (!key) {
      toast('Save your OpenAI API key first.', 'error');
      return;
    }
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const summary = buildAnonymizedSummary(state.transactions);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          messages: [
            {
              role: 'system',
              content:
                'You are a concise personal-finance coach. The user shares anonymized monthly spending aggregates (plain numbers, no identities). Give 4-6 short, actionable budgeting tips based ONLY on the numbers. Use bullet points. No disclaimers longer than one line, no investment advice, no invented data.',
            },
            { role: 'user', content: `Here is my anonymized spending summary:\n${summary}` },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('The API key was rejected. Check it and try again.');
        if (res.status === 429) throw new Error('Rate limited — please wait a minute and try again.');
        throw new Error(`Request failed (${res.status}). Please try again.`);
      }
      const data = await res.json();
      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response. Please try again.');
      setAiAnswer(text.trim());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not reach OpenAI. Check your connection.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Advisor</h1>
        <p className="page-subtitle">Smart tips computed from your data — never generic advice.</p>
      </div>

      {tips.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing to flag right now"
          body="Your budgets look healthy and spending is steady. Keep logging and new tips will appear here automatically."
          actionLabel="View analytics"
          onAction={() => navigate('/app/analytics')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {tips.map((t, i) => (
            <TipCard key={t.id} tip={t} index={i} />
          ))}
        </div>
      )}

      {/* AI advice (optional) */}
      <section className="card p-5 sm:p-6 animate-fade-up">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <BrainCircuit size={19} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">AI advice <span className="chip ml-1 bg-violet-500/10 text-violet-700 dark:text-violet-300 !text-[10px]">optional</span></h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bring your own OpenAI key for deeper, personalized coaching.
            </p>
          </div>
        </div>

        {!keySaved ? (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Save your OpenAI API key in <strong>Settings → AI Advisor</strong> to unlock deeper,
              personalized AI advice. Your key stays only in this browser and never gets logged.
            </p>
            <Link to="/app/settings" className="btn-secondary btn-sm inline-flex">
              <SettingsIcon size={14} aria-hidden /> Open Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-primary btn-sm" onClick={generateAi} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} aria-hidden />}
                {aiLoading ? 'Thinking…' : 'Generate AI advice'}
              </button>
              <Link to="/app/settings" className="btn-ghost btn-sm inline-flex">
                <SettingsIcon size={14} aria-hidden /> Manage key
              </Link>
            </div>
            {aiAnswer && (
              <div className="rounded-xl border divider bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-night-800/60 dark:text-slate-300 animate-fade-in" aria-live="polite">
                {renderAiText(aiAnswer)}
              </div>
            )}
            {!aiAnswer && !aiLoading && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Sends only anonymized monthly aggregates to OpenAI — no names, notes or identifiers.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
