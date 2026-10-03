import { useEffect, useRef, useState } from 'react';
import { Check, CornerDownLeft, Mic, MicOff, X, Zap } from 'lucide-react';
import { useStore } from '../store/AppContext';
import { parseQuickAdd, type ParsedQuickTx } from '../utils/quickParse';
import { categoryColor, categoryIcon } from '../data/categories';
import { formatDate } from '../utils/format';
import CategoryIcon from './CategoryIcon';

type SR = typeof window extends never ? never : any;

function getSpeechRecognition(): (new () => SR) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function QuickAdd() {
  const { addTransaction, money, toast } = useStore();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedQuickTx | null>(null);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const recogRef = useRef<SR | null>(null);

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const doParse = (raw: string) => {
    const p = parseQuickAdd(raw);
    if (p.amount === null) {
      toast("Couldn't spot an amount — try something like “850 lunch food”.", 'error');
      return;
    }
    setParsed(p);
  };

  const startListening = () => {
    const SRClass = getSpeechRecognition();
    if (!SRClass) {
      toast('Voice input is not supported in this browser. Type it instead!', 'error');
      return;
    }
    try {
      const recog = new SRClass();
      recog.lang = 'en-US';
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setLiveText(final || interim);
        if (final) {
          setText(final.trim());
          try {
            recog.stop();
          } catch {
            /* noop */
          }
          doParse(final.trim());
        }
      };
      recog.onerror = (e: any) => {
        setListening(false);
        setLiveText('');
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          toast('Microphone access was denied. Allow it in your browser to use voice input.', 'error');
        } else if (e?.error !== 'aborted' && e?.error !== 'no-speech') {
          toast('Voice input had a hiccup — please try again or type it.', 'error');
        }
      };
      recog.onend = () => {
        setListening(false);
        recogRef.current = null;
      };
      recogRef.current = recog;
      setLiveText('');
      recog.start();
      setListening(true);
    } catch {
      toast('Could not start voice input on this device.', 'error');
    }
  };

  const stopListening = () => {
    try {
      recogRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  };

  const confirm = () => {
    if (!parsed || parsed.amount === null) return;
    addTransaction({
      type: parsed.type,
      amount: parsed.amount,
      title: parsed.title || parsed.category,
      category: parsed.category,
      date: parsed.date,
      paymentMethod: parsed.paymentMethod,
      notes: '',
      receipt: null,
      recurring: false,
    });
    toast(`${parsed.type === 'expense' ? 'Expense' : 'Income'} added: ${money(parsed.amount)}`);
    setParsed(null);
    setText('');
  };

  return (
    <div className="card p-4 animate-fade-up">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Zap size={16} aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick add</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Type or speak — e.g. “850 lunch food”</p>
        </div>
      </div>

      {listening ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3">
          <span className="relative flex h-3 w-3" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200" aria-live="polite">
            {liveText || 'Listening… speak now'}
          </p>
          <button
            onClick={stopListening}
            className="btn-secondary btn-sm shrink-0"
            aria-label="Stop listening"
          >
            <MicOff size={14} aria-hidden /> Stop
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) doParse(text.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="850 lunch food · coffee 300 yesterday · 5000 salary"
            aria-label="Quick add — describe a transaction"
            className="input flex-1"
            maxLength={120}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={startListening}
            aria-label="Add by voice"
            title="Add by voice"
            className="btn-secondary shrink-0 !px-3"
          >
            <Mic size={17} aria-hidden />
          </button>
          <button type="submit" className="btn-primary shrink-0 !px-3.5" aria-label="Parse quick add">
            <CornerDownLeft size={17} aria-hidden />
          </button>
        </form>
      )}

      {/* Parsed preview */}
      {parsed && parsed.amount !== null && !listening && (
        <div className="mt-3 rounded-xl border divider bg-slate-50 p-3.5 animate-fade-in dark:bg-night-800/60" aria-live="polite">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">Looks like this — confirm?</p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm !px-3 !py-1.5 font-bold">
              {money(parsed.amount)}
            </span>
            <span className="chip bg-slate-200/70 text-slate-700 dark:bg-night-700 dark:text-slate-200">
              {parsed.title || '—'}
            </span>
            <span className="chip bg-slate-200/70 text-slate-700 dark:bg-night-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <CategoryIcon icon={categoryIcon(parsed.category, parsed.type)} color={categoryColor(parsed.category, parsed.type)} size={14} />
              {parsed.category}
            </span>
            <span className={`chip ${parsed.type === 'income' ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {parsed.type}
            </span>
            <span className="chip bg-slate-200/70 text-slate-700 dark:bg-night-700 dark:text-slate-200">{formatDate(parsed.date)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={confirm} className="btn-primary btn-sm flex-1">
              <Check size={15} aria-hidden /> Confirm & save
            </button>
            <button onClick={() => setParsed(null)} className="btn-secondary btn-sm" aria-label="Discard parsed transaction">
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
