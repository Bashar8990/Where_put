import { Fingerprint, Lock, Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { checkBiometric, checkPassword, isBiometricAvailable } from '../../services/auth/authService';
import { getSettings } from '../../services/settings/settingsService';
import { haptic } from '../../utils/haptics';

interface LockPageProps {
  /** Called when the user successfully unlocks the app. */
  onUnlock: () => void;
}

export function LockPage({ onUnlock }: LockPageProps) {
  // Apply theme so the lock screen respects dark/light mode.
  useTheme();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryBiometric = useCallback(async () => {
    setBusy(true);
    setError(null);
    const ok = await checkBiometric();
    setBusy(false);
    if (ok) {
      haptic('success');
      onUnlock();
    }
    // If biometric fails or is cancelled, focus the password field.
    inputRef.current?.focus();
  }, [onUnlock]);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      setBiometricEnabled(s.biometricEnabled);
      if (s.biometricEnabled) {
        const available = await isBiometricAvailable();
        if (!active) return;
        setBiometricAvailable(available);
        // Auto-prompt biometric on load if available.
        if (available) {
          void tryBiometric();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [tryBiometric]);

  // Focus the password input (after biometric auto-prompt attempt).
  useEffect(() => {
    if (!biometricAvailable) {
      inputRef.current?.focus();
    }
  }, [biometricAvailable]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await checkPassword(password);
      if (ok) {
        haptic('success');
        onUnlock();
      } else {
        haptic('error');
        setError('كلمة السر غير صحيحة.');
        setPassword('');
      }
    } catch {
      setError('حدث خطأ. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="bg-app text-app flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh' }}
    >
      <div className="w-full max-w-sm px-6 anim-fade-in">
        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-600/10 flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-brand-600 dark:text-brand-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-app">وين حطيته؟</h1>
          <p className="text-sm text-muted mt-1">أدخل كلمة السر للدخول</p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة السر"
              autoComplete="current-password"
              disabled={busy}
              className="w-full bg-surface text-app border border-app radius-md px-4 py-3.5 text-base text-center tracking-widest focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition placeholder:text-muted placeholder:tracking-normal"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-muted hover:text-app"
              aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 radius-md text-base disabled:opacity-50 transition-colors"
          >
            {busy ? '…' : 'دخول'}
          </button>
        </form>

        {/* Biometric button */}
        {biometricAvailable && biometricEnabled && (
          <button
            type="button"
            onClick={tryBiometric}
            disabled={busy}
            className="w-full mt-4 inline-flex flex-col items-center gap-2 py-4 text-brand-600 dark:text-brand-400 disabled:opacity-50 transition-opacity"
            aria-label="استخدام البصمة للدخول"
          >
            <Fingerprint className="w-12 h-12" strokeWidth={1.5} />
            <span className="text-sm font-medium">استخدام البصمة</span>
          </button>
        )}
      </div>
    </div>
  );
}
