import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { decodeGoogleCredential, getClientId, loadGsi } from '../utils/google';
import { useStore } from '../store/AppContext';

/**
 * "Sign in with Google" via Google Identity Services.
 * Renders only when a Client ID has been saved in Settings.
 */
export default function GoogleSignInButton({ onDone }: { onDone?: () => void }) {
  const { signInWithGoogle } = useStore();
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const clientId = getClientId();

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !btnRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            try {
              const profile = decodeGoogleCredential(resp.credential);
              signInWithGoogle(profile);
              onDone?.();
            } catch {
              setError('Sign-in failed. Please try again.');
            }
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with',
          shape: 'pill',
        });
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message || 'Could not load Google sign-in.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {loading && !error && (
        <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 size={15} className="animate-spin" aria-hidden /> Loading Google sign-in…
        </span>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div ref={btnRef} aria-label="Sign in with Google" />
      <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        Identity only — your financial data stays in this browser.
      </p>
    </div>
  );
}
