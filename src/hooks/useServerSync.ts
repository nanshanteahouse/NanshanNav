import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store';

export function useServerSync() {
  const settings = useDashboardStore((s) => s.settings);
  const layouts = useDashboardStore((s) => s.layouts);
  const widgets = useDashboardStore((s) => s.widgets);

  // On mount, try to load saved config from server
  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data?.settings) return;
        const store = useDashboardStore.getState();
        store.updateSettings(data.settings);
        store.setLayouts(data.layouts);
        store.setWidgets(data.widgets);
      })
      .catch(() => {
        // Silent — offline or unauthenticated user keeps localStorage state
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

  return { saveToServer };
}
