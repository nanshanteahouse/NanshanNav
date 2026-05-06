import { createContext, useContext, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resolvedTheme = useStore((s) => s.resolvedTheme);
  const setResolvedTheme = useStore((s) => s.setResolvedTheme);

  const theme = settings.theme;

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setSettings({ ...settings, theme: newTheme });
  }, [settings, setSettings]);

  useEffect(() => {
    const updateResolved = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolved();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolved();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, setResolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const colors = resolvedTheme === 'dark' ? settings.colors.dark : settings.colors.light;
    const cssVars: Record<string, string> = {
      '--color-background': colors.background,
      '--color-card': colors.card,
      '--color-card-border': colors.cardBorder,
      '--color-text-primary': colors.textPrimary,
      '--color-text-secondary': colors.textSecondary,
      '--color-accent': colors.accent,
      '--color-search-bg': colors.searchBg,
      '--color-search-border': colors.searchBorder,
      '--color-category-title': colors.categoryTitle,
      '--color-status-online': colors.statusOnline,
      '--color-status-offline': colors.statusOffline,
    };

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [resolvedTheme, settings.colors]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
