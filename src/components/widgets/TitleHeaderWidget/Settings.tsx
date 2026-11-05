import { useTranslation } from "@/i18n";
import type {
  WidgetSettingsProps,
  TitleHeaderOptions,
} from "@/types/widget.ts";
import { IconPicker } from "@/components/ui/icon-picker";

export default function TitleHeaderSettings({
  widgetId: _widgetId,
  options,
  onChange,
}: WidgetSettingsProps) {
  const { t } = useTranslation();
  const opts = options as unknown as TitleHeaderOptions;

  const update = (patch: Partial<TitleHeaderOptions>) => {
    onChange({ ...opts, ...patch });
  };

  const headingLabels: Record<TitleHeaderOptions["headingLevel"], string> = {
    h1: t("widget.titleHeader.headingLabel", { level: 1 }),
    h2: t("widget.titleHeader.headingLabel", { level: 2 }),
    h3: t("widget.titleHeader.headingLabel", { level: 3 }),
    h4: t("widget.titleHeader.headingLabel", { level: 4 }),
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.titleHeader.iconName")}
        </span>
        <IconPicker
          value={opts.iconName}
          onChange={(iconName) => update({ iconName })}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.titleHeader.headingLevel")}
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={opts.headingLevel}
          onChange={(e) =>
            update({
              headingLevel: e.target
                .value as TitleHeaderOptions["headingLevel"],
            })
          }
        >
          {(["h1", "h2", "h3", "h4"] as const).map((level) => (
            <option key={level} value={level}>
              {headingLabels[level]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.titleHeader.alignment")}
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={opts.textAlign}
          onChange={(e) =>
            update({
              textAlign: e.target.value as TitleHeaderOptions["textAlign"],
            })
          }
        >
          <option value="left">{t("widget.titleHeader.textAlign.left")}</option>
          <option value="center">
            {t("widget.titleHeader.textAlign.center")}
          </option>
          <option value="right">
            {t("widget.titleHeader.textAlign.right")}
          </option>
        </select>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.showDivider}
          onChange={(e) => update({ showDivider: e.target.checked })}
        />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {t("widget.titleHeader.showDivider")}
        </span>
      </label>
    </div>
  );
}
