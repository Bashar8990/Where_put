/**
 * Holds a reference to the active Service Worker registration so that
 * other parts of the app (e.g. Settings → "Check for updates") can
 * trigger an update check on demand without waiting for the hourly
 * interval in PWAUpdatePrompt.
 */

let registration: ServiceWorkerRegistration | undefined;

export function setSWRegistration(reg: ServiceWorkerRegistration | undefined) {
  registration = reg;
}

/**
 * Manually check for a Service Worker update.
 * @returns `true` if an update was found, `false` if already up-to-date.
 */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  try {
    await registration.update();
    // After update(), if a new SW is waiting, needRefresh will be triggered
    // by the useRegisterSW hook in PWAUpdatePrompt. We can detect a waiting
    // SW directly here for an immediate result.
    return !!registration.waiting;
  } catch {
    return false;
  }
}
