import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/common/AppLayout';
import { InstallPrompt } from './components/common/InstallPrompt';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { ToastProvider } from './components/common/Toast';
import { useTheme } from './hooks/useTheme';
import { AddItemPage } from './pages/AddItem/AddItemPage';
import { EditItemPage } from './pages/EditItem/EditItemPage';
import { FavoritesPage } from './pages/Favorites/FavoritesPage';
import { HomePage } from './pages/Home/HomePage';
import { ItemDetailsPage } from './pages/ItemDetails/ItemDetailsPage';
import { LocationsPage } from './pages/Locations/LocationsPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { PrivacyPage } from './pages/Privacy/PrivacyPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { getSettings } from './services/settings/settingsService';
import { countItems } from './services/items/itemService';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <AppRoutes />
        <PWAUpdatePrompt />
        <InstallPrompt />
      </HashRouter>
    </ToastProvider>
  );
}

function AppRoutes() {
  useTheme();
  const [bootState, setBootState] = useState<'loading' | 'onboarding' | 'ready'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      if (!s.onboardingCompleted) {
        setBootState('onboarding');
        return;
      }
      setBootState('ready');
    })();
    return () => {
      active = false;
    };
  }, []);

  if (bootState === 'loading') {
    return (
      <div className="min-h-screen bg-app text-app flex items-center justify-center">
        <p className="text-muted text-sm">جارٍ التحميل…</p>
      </div>
    );
  }

  if (bootState === 'onboarding') {
    return (
      <Routes>
        <Route
          path="/onboarding"
          element={<OnboardingPage onComplete={() => setBootState('ready')} />}
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add" element={<AddItemPage />} />
      <Route path="/item/:id" element={<ItemDetailsPage />} />
      <Route path="/item/:id/edit" element={<EditItemPage />} />
      <Route path="/locations" element={<LocationsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Keep AppLayout import used in case of future wrappers; also avoids unused warning.
void AppLayout;
void countItems;
