import { useTranslation } from "@/i18n";
import type { WidgetSettingsProps, SearchBoxOptions } from "@/types/widget.ts";

export default function SearchBoxSettings({
  widgetId: _widgetId,
  options,
  onChange,
}: WidgetSettingsProps) {
  const { t } = useTranslation();
  const opts = options as unknown as SearchBoxOptions;

  const update = (patch: Partial<SearchBoxOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.searchBox.defaultEngine")}
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={opts.defaultEngine}
          onChange={(e) =>
            update({
              defaultEngine: e.target
                .value as SearchBoxOptions["defaultEngine"],
            })
          }
        >
          <option value="google">Google</option>
          <option value="baidu">Baidu</option>
          <option value="bing">Bing</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="custom">{t("widget.searchBox.engines.custom")}</option>
        </select>
      </label>

      {opts.defaultEngine === "custom" && (
        <label className="flex flex-col gap-1.5">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {t("widget.searchBox.customEngineUrl")}
          </span>
          <input
            type="text"
            className="rounded-md border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            value={opts.customEngineUrl || ""}
            onChange={(e) => update({ customEngineUrl: e.target.value })}
            placeholder="https://search.example.com?q={query}"
          />
        </label>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.enableLocalSearch}
          onChange={(e) => update({ enableLocalSearch: e.target.checked })}
        />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {t("widget.searchBox.enableLocalSearch")}
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.searchBox.placeholder")}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={opts.placeholder}
          onChange={(e) => update({ placeholder: e.target.value })}
        />
      </label>

      <p className="text-sm text-[var(--text-muted)]">
        {t("review.globalShortcut")}
      </p>
    </div>
  );
}
