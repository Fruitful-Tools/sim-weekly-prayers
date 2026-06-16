import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from '@/components/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Service worker registration is owned by vite-plugin-pwa and triggered from
// PWAUpdatePrompt (useRegisterSW), so it can drive the in-app update toast.
