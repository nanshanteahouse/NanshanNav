import { Sun, Moon, Monitor } from "lucide-react";
import { useDashboardStore } from "@/store/index";
import { useTranslation } from "@/i18n";
import type { ThemeMode } from "@/types/dashboard";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const setThemeMode = useDashboardStore((s) => s.setThemeMode);
  const themeMode = useDashboardStore((s) => s.settings.themeMode);
  const { t } = useTranslation();
  const Icon =
    themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--text-primary)]">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {showLabel && <span>{t("toolbar.theme")}</span>}
      <select
        aria-label={t("toolbar.theme")}
        value={themeMode}
        onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
        className="min-h-11 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-2 text-sm"
      >
        <option value="light">{t("toolbar.themeLight")}</option>
        <option value="dark">{t("toolbar.themeDark")}</option>
        <option value="system">{t("toolbar.themeSystem")}</option>
      </select>
    </label>
  );
}
