import { Download, MonitorSmartphone, Share, Smartphone } from 'lucide-react';
import Modal from './Modal';

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** Shown when the native install prompt isn't available: platform-specific steps. */
export default function InstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ios = isIOS();
  return (
    <Modal open={open} onClose={onClose} title="Install Spendly" subtitle="Add it to your home screen for an app-like experience.">
      <div className="space-y-3">
        {ios ? (
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">1</span>
              <span className="pt-1.5">Tap the <Share size={14} className="inline" aria-hidden /> <strong>Share</strong> button in Safari's toolbar.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">2</span>
              <span className="pt-1.5">Scroll down and choose <strong>“Add to Home Screen”</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">3</span>
              <span className="pt-1.5">Tap <strong>Add</strong> — Spendly appears on your home screen.</span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">1</span>
              <span className="pt-1.5">Open your browser's menu <strong>⋮</strong> (top-right on Android, or the address-bar install icon <MonitorSmartphone size={14} className="inline" aria-hidden /> on desktop).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">2</span>
              <span className="pt-1.5">Choose <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 font-bold text-brand-600">3</span>
              <span className="pt-1.5">Confirm — Spendly launches full-screen like a native app.</span>
            </li>
          </ol>
        )}
        <div className="flex items-center gap-2.5 rounded-xl bg-brand-500/[0.07] p-3.5 text-xs text-slate-500 dark:text-slate-400">
          <Smartphone size={16} className="shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
          Installed apps open instantly, work offline for your saved data, and live alongside your other apps.
        </div>
        <button className="btn-primary w-full" onClick={onClose}>
          <Download size={16} aria-hidden /> Got it
        </button>
      </div>
    </Modal>
  );
}
