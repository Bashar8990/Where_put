import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/settings/settingsService';
import type { AppSettings } from '../types';

export function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0b1220' : '#0ea5e9');
  }
}

export function useTheme() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    getSettings().then((s) => {
      if (!mounted) return;
      setSettings(s);
      applyTheme(s.theme);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // React to system theme changes when in 'system' mode.
  useEffect(() => {
    if (!settings || settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings]);

  const setTheme = async (theme: AppSettings['theme']) => {
    const next = await updateSettings({ theme });
    setSettings(next);
    applyTheme(theme);
  };

  return { settings, setTheme };
}
