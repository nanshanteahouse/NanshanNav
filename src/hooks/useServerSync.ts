import { useEffect, useCallback, useState } from 'react';
import { useDashboardStore } from '@/store';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export function useServerSync() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const settings = useDashboardStore((s) => s.settings);
  const layouts = useDashboardStore((s) => s.layouts);
  const widgets = useDashboardStore((s) => s.widgets);

  // On mount, try to load saved config from server
  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (r) => {
        if (r.status === 404) {
          setAuthState('authenticated');
          return null;
        }
        const text = await r.text();
        try {
          const data = JSON.parse(text);
          setAuthState('authenticated');
          return data;
        } catch {
          // Response is not JSON — likely Authelia login page (HTML)
          setAuthState('unauthenticated');
          return null;
        }
      })
      .then((data) => {
        if (!data?.settings) return;
        const store = useDashboardStore.getState();
        store.updateSettings(data.settings);
        store.setLayouts(data.layouts);
        store.setWidgets(data.widgets);
      })
      .catch(() => {
        setAuthState('unauthenticated');
      });
  }, []);

  // Save current state to server
  const saveToServer = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, layouts, widgets }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [settings, layouts, widgets]);

  return { saveToServer, authState };
}
