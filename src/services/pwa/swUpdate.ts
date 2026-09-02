/**
 * Holds a reference to the active Service Worker registration so that
 * other parts of the app (e.g. Settings → "Check for updates") can
 * trigger an update check on demand without waiting for the hourly
 * interval in PWAUpdatePrompt.
 */

let registration: ServiceWorkerRegistration | undefined;
// Stored callback to activate the waiting SW and reload (from useRegisterSW).
let updateFn: (() => Promise<void>) | undefined;

export function setSWRegistration(reg: ServiceWorkerRegistration | undefined) {
  registration = reg;
}

export function setUpdateFn(fn: (() => Promise<void>) | undefined) {
  updateFn = fn;
}

/**
 * Manually check for a Service Worker update.
 * @returns `true` if an update was found, `false` if already up-to-date.
 */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  try {
    await registration.update();
    return !!registration.waiting;
  } catch {
    return false;
  }
}

/**
 * Activate the waiting Service Worker and reload the page.
 * Uses the updateServiceWorker callback from useRegisterSW when available,
 * which handles the SW lifecycle (skipWaiting + clients.claim) correctly.
 */
export async function applyUpdate(): Promise<void> {
  if (updateFn) {
    await updateFn();
    return;
  }
  // Fallback: tell the waiting SW to skip waiting, then reload.
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
}
