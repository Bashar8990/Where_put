import { Database, Download, Info, MessageCircle, Moon, Shield, Sun, Trash2, Upload, Monitor } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TopBar } from '../../components/common/TopBar';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../hooks/useTheme';
import {
  backupFilename,
  exportBackup,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  wipeAllData,
  type BackupSummary,
  type ParsedBackup,
  type RestoreMode,
} from '../../services/backup/backupService';
import {
  countItems,
  listAllItems,
} from '../../services/items/itemService';
import { getImageStats } from '../../services/images/imageService';
import { getSettings, updateSettings } from '../../services/settings/settingsService';
import {
  getStorageEstimate,
  requestPersistentStorage,
} from '../../services/storage/storageService';
import { formatBytes } from '../../utils/images';
import { formatFullDate } from '../../utils/dates';
import { haptic } from '../../utils/haptics';

export function SettingsPage() {
  const { settings, setTheme } = useTheme();
  const { showToast } = useToast();
  const [itemCount, setItemCount] = useState(0);
  const [imageStats, setImageStats] = useState({ count: 0, totalBytes: 0 });
  const [storage, setStorage] = useState<{ usage: number | null; quota: number | null; persisted: boolean | null }>(
    { usage: null, quota: null, persisted: null },
  );
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const [restoreSummary, setRestoreSummary] = useState<{ summary: BackupSummary; parsed: ParsedBackup } | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [count, imgs, est, s] = await Promise.all([
      countItems(),
      getImageStats(),
      getStorageEstimate(),
      getSettings(),
    ]);
    setItemCount(count);
    setImageStats(imgs);
    setStorage(est);
    setLastBackup(s.lastBackupAt);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleExport() {
    setBusy(true);
    try {
      const blob = await exportBackup();
      const filename = backupFilename();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await updateSettings({ lastBackupAt: new Date().toISOString() });
      setLastBackup(new Date().toISOString());
      showToast({ message: 'تم إنشاء النسخة الاحتياطية' });
      haptic('success');
    } catch (e) {
      showToast({
        message: e instanceof Error ? e.message : 'تعذّر إنشاء النسخة الاحتياطية.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await parseBackup(file);
      const summary = summarizeBackup(parsed);
      setRestoreSummary({ summary, parsed });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'تعذّر قراءة النسخة الاحتياطية.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function confirmRestore() {
    if (!restoreSummary) return;
    setBusy(true);
    try {
      await restoreBackup(restoreSummary.parsed, restoreMode);
      showToast({
        message:
          restoreMode === 'replace'
            ? 'تم استبدال البيانات بالنسخة الاحتياطية'
            : 'تم دمج البيانات بنجاح',
      });
      haptic(restoreMode === 'replace' ? 'warning' : 'success');
      setRestoreSummary(null);
      await refresh();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'تعذّرت الاستعادة.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleWipe() {
    setConfirmWipe(false);
    setBusy(true);
    try {
      await wipeAllData();
      showToast({ message: 'تم حذف جميع البيانات' });
      haptic('error');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handlePersist() {
    const granted = await requestPersistentStorage();
    if (granted) {
      await updateSettings({ persistRequested: true });
      showToast({ message: 'تم طلب تخزين دائم للبيانات' });
      await refresh();
    } else {
      showToast({ message: 'المتصفح لم يمنح تخزينًا دائمًا.' });
    }
  }

  return (
    <AppLayout>
      <TopBar title="الإعدادات" showBack backTo="/" />

      {/* Appearance */}
      <Section title="المظهر" icon={<Sun className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-2">
          <ThemeButton
            active={settings?.theme === 'system'}
            onClick={() => setTheme('system')}
            icon={<Monitor className="w-4 h-4" />}
            label="النظام"
          />
          <ThemeButton
            active={settings?.theme === 'light'}
            onClick={() => setTheme('light')}
            icon={<Sun className="w-4 h-4" />}
            label="فاتح"
          />
          <ThemeButton
            active={settings?.theme === 'dark'}
            onClick={() => setTheme('dark')}
            icon={<Moon className="w-4 h-4" />}
            label="داكن"
          />
        </div>
      </Section>

      {/* Data */}
      <Section title="البيانات" icon={<Database className="w-4 h-4" />}>
        <Row label="عدد الأغراض" value={String(itemCount)} />
        <Row label="عدد الصور" value={String(imageStats.count)} />
        <Row
          label="حجم الصور"
          value={imageStats.totalBytes > 0 ? formatBytes(imageStats.totalBytes) : '—'}
        />
        {storage.usage != null && (
          <Row
            label="المساحة المستخدمة"
            value={
              storage.quota != null
                ? `${formatBytes(storage.usage)} / ${formatBytes(storage.quota)}`
                : formatBytes(storage.usage)
            }
          />
        )}
        {storage.persisted != null && (
          <Row label="تخزين دائم" value={storage.persisted ? 'مفعّل' : 'غير مفعّل'} />
        )}
        {storage.persisted === false && (
          <button
            type="button"
            onClick={handlePersist}
            className="mt-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            اطلب تخزينًا دائمًا للبيانات
          </button>
        )}
      </Section>

      {/* Backup */}
      <Section title="النسخ الاحتياطي والاستعادة" icon={<Download className="w-4 h-4" />}>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy || itemCount === 0}
          className="w-full flex items-center gap-3 bg-surface border border-app radius-md px-4 py-3 hover:border-brand-400 disabled:opacity-50"
        >
          <Download className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-medium">تصدير نسخة احتياطية</span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center gap-3 bg-surface border border-app radius-md px-4 py-3 hover:border-brand-400 disabled:opacity-50"
        >
          <Upload className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-medium">استعادة نسخة احتياطية</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleRestoreFile}
        />
        <Row label="آخر نسخة احتياطية" value={lastBackup ? formatFullDate(lastBackup) : 'لا توجد'} />
      </Section>

      {/* Privacy */}
      <Section title="الخصوصية" icon={<Shield className="w-4 h-4" />}>
        <Link
          to="/privacy"
          className="block w-full text-right text-sm text-brand-600 dark:text-brand-400 hover:underline py-1"
        >
          اقرأ سياسة الخصوصية
        </Link>
      </Section>

      {/* About */}
      <Section title="حول التطبيق" icon={<Info className="w-4 h-4" />}>
        <Row label="الإصدار" value={__APP_VERSION__} />
        <Row label="تاريخ آخر تحديث" value={formatFullDate(__BUILD_DATE__)} />
        <p className="text-xs text-muted leading-relaxed pt-2">
          «وين حطيته؟» تطبيق عربي بسيط يساعدك على تذكّر أين وضعت أشياءك المهمة.
          كل بياناتك تبقى على جهازك فقط — لا خوادم، لا حسابات، لا تتبّع.
        </p>
      </Section>

      {/* Contact developer */}
      <Section title="تواصل مع المطور" icon={<MessageCircle className="w-4 h-4" />}>
        <a
          href="https://wa.me/963953812362"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 radius-md px-4 py-3 hover:bg-green-100 dark:hover:bg-green-950/50"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span className="text-sm font-medium">تواصل عبر واتساب</span>
        </a>
      </Section>

      {/* Danger */}
      <Section title="حذف البيانات" icon={<Trash2 className="w-4 h-4 text-red-500" />} danger>
        <button
          type="button"
          onClick={() => setConfirmWipe(true)}
          disabled={busy}
          className="w-full flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 radius-md px-4 py-3 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-medium">حذف جميع البيانات</span>
        </button>
      </Section>

      <p className="text-xs text-muted text-center mt-6 flex items-center justify-center gap-1">
        <Info className="w-3.5 h-3.5" />
        وين حطيته؟ — كل بياناتك على جهازك
      </p>

      {/* Restore summary dialog */}
      <ConfirmDialog
        open={!!restoreSummary}
        title="استعادة النسخة الاحتياطية"
        description={
          restoreSummary ? (
            <div className="space-y-2">
              <div className="text-sm">
                تم العثور على:
                <ul className="list-disc pr-5 mt-1 space-y-0.5">
                  <li>{restoreSummary.summary.itemCount} غرض</li>
                  <li>{restoreSummary.summary.imageCount} صورة</li>
                </ul>
              </div>
              <div className="text-sm">
                تاريخ النسخة: {formatFullDate(restoreSummary.summary.createdAt)}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                  />
                  دمج مع البيانات الحالية (يُبقي الأحدث)
                </label>
                <label className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'replace'}
                    onChange={() => setRestoreMode('replace')}
                  />
                  استبدال البيانات الحالية (تحذير: ستفقد بياناتك الحالية)
                </label>
              </div>
            </div>
          ) : null
        }
        confirmLabel="استعادة"
        cancelLabel="إلغاء"
        danger={restoreMode === 'replace'}
        onConfirm={confirmRestore}
        onCancel={() => setRestoreSummary(null)}
      />

      <ConfirmDialog
        open={confirmWipe}
        title="هل أنت متأكد؟"
        description="سيتم حذف جميع الأغراض والصور وسجل الأماكن من هذا الجهاز. لا يمكن التراجع عن ذلك إذا لم تكن لديك نسخة احتياطية."
        confirmLabel="حذف الكل"
        cancelLabel="إلغاء"
        danger
        onConfirm={handleWipe}
        onCancel={() => setConfirmWipe(false)}
      />
    </AppLayout>
  );
}

function Section({
  title,
  icon,
  children,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`mb-5 ${danger ? '' : ''}`}>
      <h2 className="text-sm font-bold text-app mb-2 flex items-center gap-1.5 px-1">
        {icon}
        {title}
      </h2>
      <div className="bg-surface border border-app radius-lg elev-card p-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted">{label}</span>
      <span className="text-app font-medium">{value}</span>
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 radius-md border text-sm transition-colors ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-surface text-app border-app hover:border-brand-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

void listAllItems;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
