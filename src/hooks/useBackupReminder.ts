import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings } from '../services/settings/settingsService';
import { useToast } from '../components/common/Toast';

/** Days without a backup before we show a reminder. */
const REMINDER_THRESHOLD_DAYS = 30;

/** Days after a dismissed reminder before we nag again. */
const DISMISS_COOLDOWN_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / MS_PER_DAY;
}

/**
 * Shows a backup reminder toast when the user hasn't exported a backup in
 * {@link REMINDER_THRESHOLD_DAYS} days (or never has), and hasn't dismissed
 * the reminder within {@link DISMISS_COOLDOWN_DAYS} days.
 *
 * The check runs once shortly after mount, with a small delay so it doesn't
 * collide with other startup toasts (e.g. undo-delete). The reminder offers
 * a direct link to Settings → Backup and a "لاحقاً" dismiss action that
 * records `backupReminderDismissedAt` in settings.
 */
export function useBackupReminder() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    let dismissed = false;

    const timer = window.setTimeout(async () => {
      if (dismissed) return;
      try {
        const s = await getSettings();
        const sinceBackup = daysSince(s.lastBackupAt);
        const sinceDismiss = daysSince(s.backupReminderDismissedAt);

        if (sinceBackup < REMINDER_THRESHOLD_DAYS) return;
        if (sinceDismiss < DISMISS_COOLDOWN_DAYS) return;

        showToast({
          message:
            sinceBackup === Infinity
              ? 'لم تأخذ نسخة احتياطية بعد. احمِ بياناتك بتصدير نسخة.'
              : `لم تأخذ نسخة احتياطية منذ ${Math.floor(sinceBackup)} يوماً.`,
          actionLabel: 'نسخ احتياطي',
          onAction: () => {
            void updateSettings({ backupReminderDismissedAt: new Date().toISOString() });
            navigate('/settings');
          },
          duration: 8000,
        });
      } catch {
        // Settings not available yet — silently skip.
      }
    }, 2500);

    return () => {
      dismissed = true;
      window.clearTimeout(timer);
    };
  }, [showToast, navigate]);
}
