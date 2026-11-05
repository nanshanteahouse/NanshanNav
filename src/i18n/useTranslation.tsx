import { useCallback, type ReactNode } from "react";
import { useDashboardStore } from "@/store";
import { I18nContext } from "./context";
import en from "./locales/en";
import zh from "./locales/zh-CN";

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useDashboardStore((s) => s.settings.locale);
  const translations = locale === "en" ? en : zh;
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let value: unknown = translations;
      for (const part of key.split(".")) {
        value =
          value && typeof value === "object"
            ? (value as Record<string, unknown>)[part]
            : undefined;
      }
      let text = typeof value === "string" ? value : key;
      for (const [name, replacement] of Object.entries(params ?? {}))
        text = text.replaceAll(`{${name}}`, String(replacement));
      return text;
    },
    [translations],
  );
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
