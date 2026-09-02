import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast';

export function PWAUpdatePrompt() {
  // Track the SW update interval so we can clear it on unmount or re-register.
  const intervalRef = useRef<number | null>(null);

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Clear any previous interval before setting a new one (prevents accumulation).
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (registration) {
        intervalRef.current = window.setInterval(() => {
          void registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  // Clear the interval on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

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
