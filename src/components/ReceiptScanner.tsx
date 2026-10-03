import { useRef, useState } from 'react';
import { ChevronDown, Loader2, ScanLine } from 'lucide-react';
import { parseReceiptText, type ReceiptData } from '../utils/receipt';

interface Props {
  onExtract: (data: ReceiptData) => void;
  notify: (msg: string, kind?: 'success' | 'error' | 'info' | 'warning') => void;
}

/**
 * Receipt scanner: OCR via tesseract.js (lazy-loaded so the main bundle stays lean).
 * Extracts amount / merchant / date and hands them back for the user to verify.
 */
export default function ReceiptScanner({ onExtract, notify }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const scan = async (file: File | undefined) => {
    if (!file || scanning) return;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image of the receipt.', 'error');
      return;
    }
    setScanning(true);
    setProgress(0);
    setRawText(null);
    setShowRaw(false);
    try {
      const { createWorker } = await import('tesseract.js');
      // OCR core + worker load from the tesseract.js CDN at runtime (default
      // paths); language data likewise. Needs network on first scan.
      const worker = await createWorker('eng', undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        },
      } as any);
      const {
        data: { text },
      } = await (worker as any).recognize(file);
      await (worker as any).terminate();

      const parsed = parseReceiptText(text || '');
      setRawText(parsed.raw || '(no text recognized)');
      if (!parsed.amount && !parsed.title && !parsed.date) {
        notify('Could not read this receipt. Try a clearer photo.', 'error');
      } else {
        onExtract(parsed);
        const bits = [
          parsed.amount !== null ? 'amount' : null,
          parsed.title ? 'merchant' : null,
          parsed.date ? 'date' : null,
        ].filter(Boolean);
        notify(`Receipt scanned — found ${bits.join(', ')}. Please verify.`, 'info');
      }
    } catch (err) {
      notify('Receipt scanning failed. You can still enter the details manually.', 'error');
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-60 dark:border-night-700 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
      >
        {scanning ? (
          <Loader2 size={17} className="animate-spin" aria-hidden />
        ) : (
          <ScanLine size={17} aria-hidden />
        )}
        {scanning ? `Reading receipt… ${progress}%` : 'Scan receipt'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Scan receipt photo"
        onChange={(e) => scan(e.target.files?.[0])}
      />
      {scanning && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-night-700"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Receipt scanning progress"
        >
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {rawText !== null && !scanning && (
        <div className="mt-2 rounded-xl border divider bg-slate-50 dark:bg-night-800/60">
          <button
            type="button"
            onClick={() => setShowRaw((s) => !s)}
            aria-expanded={showRaw}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400"
          >
            Verify extracted text
            <ChevronDown size={14} className={`transition-transform ${showRaw ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {showRaw && (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-t divider px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
