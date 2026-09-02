import { Shield } from 'lucide-react';
import { AppLayout } from '../../components/common/AppLayout';
import { TopBar } from '../../components/common/TopBar';

export function PrivacyPage() {
  return (
    <AppLayout>
      <TopBar title="الخصوصية" showBack backTo="/settings" />
      <div className="bg-surface border border-app radius-lg elev-card p-5 space-y-4 text-sm leading-relaxed text-app">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
          <Shield className="w-5 h-5" />
          خصوصيتك مهمة
        </div>
        <ul className="space-y-3 list-disc pr-5">
          <li>جميع البيانات (الأغراض، الأماكن، الصور) محفوظة محليًا على جهازك فقط.</li>
          <li>الصور لا يتم رفعها إلى أي خادم. تُعالَج وتُضغط داخل المتصفح ثم تُحفظ في IndexedDB.</li>
          <li>التطبيق لا يحتاج إلى حساب، ولا يطلب بريدًا إلكترونيًا أو اسم مستخدم.</li>
          <li>التطبيق لا يرسل أسماء الأغراض أو أماكنها إلى أي جهة خارجية.</li>
          <li>لا توجد خدمات Analytics أو Tracking على الإطلاق.</li>
          <li>التطبيق يعمل بالكامل بدون اتصال بالإنترنت بعد أول تحميل.</li>
        </ul>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 radius-md p-3 text-amber-800 dark:text-amber-300">
          تحذير: حذف بيانات الموقع أو التطبيق من المتصفح قد يؤدي إلى فقدان جميع بياناتك.
          ننصح بإنشاء نسخة احتياطية دوريًا من صفحة الإعدادات.
        </div>
      </div>
    </AppLayout>
  );
}
