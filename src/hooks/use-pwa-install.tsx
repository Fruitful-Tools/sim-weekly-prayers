import { useCallback, useEffect, useState } from 'react';

// `beforeinstallprompt` isn't in the standard DOM lib yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Captures Chromium's `beforeinstallprompt` so we can show our own install
// button and fire the native prompt on demand. Returns `canInstall: false` on
// browsers that never fire it (notably iOS Safari, where users add to the home
// screen manually).
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // The event can only be used once.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { canInstall: deferredPrompt !== null, promptInstall };
}
