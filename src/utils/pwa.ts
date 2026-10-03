/**
 * PWA helpers: service-worker registration + install-prompt capture.
 * All browser-feature checks are defensive so nothing breaks on unsupported browsers.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let updateAvailable = false;
const updateListeners = new Set<() => void>();

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

export function onSwUpdate(cb: () => void): () => void {
  updateListeners.add(cb);
  return () => {
    updateListeners.delete(cb);
  };
}

function notifyUpdate(): void {
  updateAvailable = true;
  updateListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* noop */
    }
  });
}

export function swUpdateAvailable(): boolean {
  return updateAvailable;
}

/** Call once at startup. Registers /sw.js in production only. */
export function initPwa(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });

  if (!('serviceWorker' in navigator)) return;
  // Only in production builds — dev server + file:// get no SW.
  const isProd = import.meta.env.PROD;
  if (!isProd) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // If a new worker is already waiting, surface the update immediately.
        if (reg.waiting) notifyUpdate();
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });
      })
      .catch(() => {
        /* offline-first is a bonus, not a requirement */
      });
  });
}

/** Trigger the captured install prompt. Returns false when unavailable. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choice.outcome === 'accepted';
  } catch {
    deferredPrompt = null;
    return false;
  }
}

/** Ask the waiting service worker to take over, then reload. */
export function applySwUpdate(): void {
  if (!('serviceWorker' in navigator)) {
    window.location.reload();
    return;
  }
  navigator.serviceWorker.getRegistration().then((reg) => {
    const worker = reg?.waiting;
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
      // Reload once the new worker controls the page.
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloaded) {
          reloaded = true;
          window.location.reload();
        }
      });
      window.setTimeout(() => {
        if (!reloaded) window.location.reload();
      }, 1500);
    } else {
      window.location.reload();
    }
  });
}
