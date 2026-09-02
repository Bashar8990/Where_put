import { ArrowLeft, Database, MapPin, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSettings } from '../../services/settings/settingsService';

const slides = [
  {
    icon: MapPin,
    title: 'وين حطيته؟',
    body: 'سجّل مكان الأشياء المهمة حتى تجدها بسرعة لاحقًا. افتح التطبيق، اكتب اسم الشيء، واعرف مكانه فورًا.',
  },
  {
    icon: Database,
    title: 'كل شيء يبقى على جهازك',
    body: 'لا حسابات. لا رفع صور. لا خوادم. كل بياناتك محفوظة محليًا في متصفحك أو جهازك.',
  },
  {
    icon: Save,
    title: 'لا تنسَ النسخة الاحتياطية',
    body: 'بياناتك محفوظة على هذا الجهاز فقط، لذلك ننصح بأخذ نسخة احتياطية من وقت لآخر من الإعدادات.',
  },
];

interface OnboardingPageProps {
  onComplete?: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  async function finish() {
    // Navigate first for instant response, then persist (fire-and-forget with error log).
    onComplete?.();
    navigate('/', { replace: true });
    try {
      await updateSettings({ onboardingCompleted: true });
    } catch (err) {
      console.error('Failed to persist onboarding completion:', err);
    }
  }

  const slide = slides[step];
  const Icon = slide.icon;
  const isLast = step === slides.length - 1;

  return (
    <div
      className="bg-app text-app flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      <div className="flex justify-end p-4 safe-top">
        <button
          type="button"
          onClick={finish}
          className="text-sm text-muted hover:text-app"
        >
          تخطّي
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 min-h-0">
        <div className="mb-6 text-brand-600 dark:text-brand-400">
          <Icon className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.2} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-3">{slide.title}</h1>
        <p className="text-muted leading-relaxed max-w-sm text-sm sm:text-base">
          {slide.body}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 pb-4">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? 'w-6 bg-brand-600' : 'w-2 bg-app/30'
            }`}
          />
        ))}
      </div>

      <div className="p-4 pb-6 safe-bottom">
        <button
          type="button"
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl text-base"
        >
          {isLast ? 'ابدأ' : 'التالي'}
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
