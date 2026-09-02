import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for updates periodically.
      if (registration) {
        setInterval(() => {
          void registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  const { showToast } = useToast();
  const [refreshToastId, setRefreshToastId] = useState<number | null>(null);
  const [offlineToastId, setOfflineToastId] = useState<number | null>(null);

  useEffect(() => {
    if (needRefresh && refreshToastId === null) {
      const id = showToast({
        message: 'يتوفر تحديث جديد للتطبيق',
        actionLabel: 'تحديث الآن',
        onAction: () => updateServiceWorker(true),
        duration: 0,
      });
      setRefreshToastId(id);
    } else if (!needRefresh && refreshToastId !== null) {
      setRefreshToastId(null);
    }
  }, [needRefresh, refreshToastId, showToast, updateServiceWorker]);

  useEffect(() => {
    if (offlineReady && offlineToastId === null) {
      const id = showToast({
        message: 'التطبيق جاهز للعمل بدون إنترنت',
        duration: 4000,
      });
      setOfflineToastId(id);
      setOfflineReady(false);
    } else if (!offlineReady && offlineToastId !== null) {
      setOfflineToastId(null);
    }
  }, [offlineReady, offlineToastId, showToast, setOfflineReady]);

  return null;
}
