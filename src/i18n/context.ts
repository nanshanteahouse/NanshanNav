import { createContext, useContext } from "react";
export interface I18nContextValue {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}
export const I18nContext = createContext<I18nContextValue | null>(null);
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context)
    throw new Error("useTranslation must be used within I18nProvider");
  return context;
}
