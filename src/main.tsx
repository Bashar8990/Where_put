import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'virtual:pwa-register';
import App from './App';
import './index.css';

// Prevent pinch-zoom and gesture-based zoom to feel like a native app.
if (typeof window !== 'undefined') {
  const preventZoom = (e: Event) => e.preventDefault();
  // iOS Safari gesture events
  document.addEventListener('gesturestart', preventZoom, { passive: false });
  document.addEventListener('gesturechange', preventZoom, { passive: false });
  document.addEventListener('gestureend', preventZoom, { passive: false });
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
