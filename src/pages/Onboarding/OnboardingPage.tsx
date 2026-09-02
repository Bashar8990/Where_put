import { ArrowLeft, Database, MapPin, Monitor, Moon, Palette, Save, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyTheme } from '../../hooks/useTheme';
import { updateSettings } from '../../services/settings/settingsService';
import type { AppSettings } from '../../types';

type Theme = AppSettings['theme'];

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

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'تلقائي', icon: Monitor },
  { value: 'light', label: 'فاتح', icon: Sun },
  { value: 'dark', label: 'داكن', icon: Moon },
];

interface OnboardingPageProps {
  onComplete?: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // Theme chosen on the theme step; applied live for instant preview.
  const [theme, setTheme] = useState<Theme>('system');

  // Total steps = intro slides + theme selection step.
  const totalSteps = slides.length + 1;
  const isLast = step === totalSteps - 1;
  const isThemeStep = step === slides.length;

  function selectTheme(next: Theme) {
    setTheme(next);
    // Live preview: apply immediately so the user sees the change.
    applyTheme(next);
  }

  async function finish() {
    // Navigate first for instant response, then persist (fire-and-forget with error log).
    onComplete?.();
    navigate('/', { replace: true });
    try {
      await updateSettings({ onboardingCompleted: true, theme });
    } catch (err) {
      console.error('Failed to persist onboarding completion:', err);
    }
  }

  // Intro slide content
  const slide = slides[step];
  const Icon = slide?.icon;

  return (
    <div
      className="bg-app text-app flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      <div className="flex justify-end p-4 safe-top">
        <button
          type="button"
          onClick={finish}
          className="text-sm text-muted hover:text-app min-h-[44px] px-3 flex items-center"
        >
          تخطّي
        </button>
      </div>

      <div
        key={step}
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 min-h-0 anim-fade-in"
      >
        {isThemeStep ? (
          <>
            <div className="mb-6 text-brand-600 dark:text-brand-400">
              <Palette className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.2} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3">اختر مظهر التطبيق</h1>
            <p className="text-muted leading-relaxed max-w-sm text-sm sm:text-base mb-8">
              يمكنك تغييره لاحقًا من الإعدادات في أي وقت.
            </p>
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              {THEME_OPTIONS.map((opt) => {
                const OptIcon = opt.icon;
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 py-5 radius-lg border transition-colors ${
                      active
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-surface text-app border-app hover:border-brand-400'
                    }`}
                    aria-pressed={active}
                  >
                    <OptIcon className="w-6 h-6" strokeWidth={1.8} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 text-brand-600 dark:text-brand-400">
              <Icon className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.2} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3">{slide.title}</h1>
            <p className="text-muted leading-relaxed max-w-sm text-sm sm:text-base">
              {slide.body}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
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
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 radius-md text-base"
        >
          {isLast ? 'ابدأ' : 'التالي'}
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
