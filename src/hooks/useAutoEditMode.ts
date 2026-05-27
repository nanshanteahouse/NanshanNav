import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/index';

/**
 * Syncs edit mode with the URL path.
 *
 * - Visiting /admin directly → auto-enables edit mode.
 * - Browser back/forward across /admin boundary → toggles edit mode accordingly.
 * - The EditModeToggle component handles pushState on manual toggle.
 */
export function useAutoEditMode() {
  const setEditMode = useDashboardStore((s) => s.setEditMode);

  const syncFromPath = useCallback(() => {
    setEditMode(window.location.pathname.startsWith('/admin'));
  }, [setEditMode]);

  useEffect(() => {
    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [syncFromPath]);
}
