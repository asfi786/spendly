import type { GoogleProfile } from '../types';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID_KEY = 'spendly:google_client_id';

let gsiPromise: Promise<void> | null = null;

/** Load the Google Identity Services script once (only when needed). */
export function loadGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Google sign-in.')));
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

export function getClientId(): string | null {
  try {
    return localStorage.getItem(CLIENT_ID_KEY);
  } catch {
    return null;
  }
}

export function saveClientId(id: string | null): void {
  try {
    if (id) localStorage.setItem(CLIENT_ID_KEY, id);
    else localStorage.removeItem(CLIENT_ID_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Decode a Google ID token payload (client-side identity only).
 * NOTE: this does not cryptographically verify the token — it is used purely
 * to read the signed-in user's profile for display, never for server auth.
 */
export function decodeGoogleCredential(credential: string): GoogleProfile {
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('Invalid sign-in response.');
  const payload = JSON.parse(
    atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
  ) as { sub?: string; name?: string; email?: string; picture?: string };
  if (!payload.sub) throw new Error('Invalid sign-in response.');
  return {
    googleId: payload.sub,
    name: payload.name ?? '',
    email: payload.email ?? '',
    avatar: payload.picture ?? null,
  };
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
          revoke: (email: string, done: () => void) => void;
        };
      };
    };
  }
}
