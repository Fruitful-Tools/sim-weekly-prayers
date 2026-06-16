import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

// Surfaces service-worker lifecycle events as Sonner toasts:
//   - a new version is waiting  -> offer a "Reload" action that activates it
//   - the app is ready offline  -> a brief confirmation
// Registration itself is owned by vite-plugin-pwa (injectRegister: false in
// vite.config.ts means we trigger it here via useRegisterSW).
const PWAUpdatePrompt = () => {
  const { t } = useTranslation();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (offlineReady) {
      toast.success(t('pwa.offlineReady'));
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, t]);

  useEffect(() => {
    if (needRefresh) {
      toast(t('pwa.updateAvailable'), {
        id: 'pwa-update',
        duration: Infinity,
        action: {
          label: t('pwa.reload'),
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker, t]);

  return null;
};

export default PWAUpdatePrompt;
