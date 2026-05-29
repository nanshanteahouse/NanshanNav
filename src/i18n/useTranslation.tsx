import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TranslationSchema } from './types';
import { useDashboardStore } from '@/store';

// ── Context ──

interface I18nContextValue {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Translation Loader ──

async function loadTranslation(locale: string): Promise<TranslationSchema> {
  switch (locale) {
    case 'en':
      return (await import('./locales/en')).default;
    case 'zh-CN':
    default:
      return (await import('./locales/zh-CN')).default;
  }
}

// ── Provider ──

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useDashboardStore((s) => s.settings.locale);
  const [translations, setTranslations] = useState<TranslationSchema | null>(null);

  useEffect(() => {
    let cancelled = false;

    setTranslations(null);
    loadTranslation(locale)
      .then((t) => {
        if (!cancelled) setTranslations(t);
      })
      .catch(() => {
        // Fallback to zh-CN if the requested locale fails to load
        loadTranslation('zh-CN').then((t) => {
          if (!cancelled) setTranslations(t);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!translations) {
        return params ? `${key} (params: ${JSON.stringify(params)})` : key;
      }

      const keys = key.split('.');
      let value: unknown = translations;
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      let result = typeof value === 'string' ? value : key;

      // Variable interpolation: "Hello {name}" → "Hello World"
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          result = result.replaceAll(`{${paramKey}}`, String(paramValue));
        }
      }

      return result;
    },
    [translations],
  );

  // Show nothing during initial load — dynamic import of a bundled file
  // is near-instantaneous (single-digit ms), so the flash is imperceptible.
  if (!translations) return null;

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ──

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation() must be used within an <I18nProvider>');
  }
  return ctx;
}
