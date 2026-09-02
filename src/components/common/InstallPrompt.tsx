import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { getSettings, updateSettings } from '../../services/settings/settingsService';
import { countItems } from '../../services/items/itemService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!deferred) return;
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      // Don't show if dismissed recently (within 14 days) or already has many items.
      const dismissedAt = s.installPromptDismissedAt
        ? new Date(s.installPromptDismissedAt).getTime()
        : 0;
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < twoWeeks) return;
      const count = await countItems();
      if (!active) return;
      // Show after the user has at least one item.
      if (count >= 1) setShow(true);
    })();
    return () => {
      active = false;
    };
  }, [deferred]);

  if (!show || !deferred) return null;

  return (
    <div className="fixed bottom-36 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-surface border border-app rounded-2xl shadow-xl p-4 safe-bottom">
      <div className="flex items-start gap-3">
        <div className="text-brand-600 dark:text-brand-400 shrink-0">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-app text-sm">ثبّت «وين حطيته؟»</div>
          <p className="text-muted text-xs mt-1">
            للوصول السريع من الشاشة الرئيسية والعمل بدون إنترنت.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={async () => {
            await updateSettings({ installPromptDismissedAt: new Date().toISOString() });
            setShow(false);
          }}
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-surface-muted text-app border border-app"
        >
          لاحقًا
        </button>
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
            setShow(false);
          }}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700"
        >
          تثبيت
        </button>
      </div>
    </div>
  );
}
