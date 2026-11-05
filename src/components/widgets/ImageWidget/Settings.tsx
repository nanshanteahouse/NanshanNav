import { useTranslation } from "@/i18n";
import type { WidgetSettingsProps } from "@/types/widget.ts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "./components/ImageUploader";

// ── Local options type (not yet in @/types/widget) ──

interface ImageOptions {
  sourceType?: "url" | "upload";
  url?: string;
  imageData?: string;
  scaleMode?: "contain" | "cover" | "fill" | "original";
  alignX?: "left" | "center" | "right";
  alignY?: "top" | "center" | "bottom";
  borderRadius?: number;
  shadow?: boolean;
  caption?: string;
  onClick?: "none" | "link" | "preview";
  linkUrl?: string;
  openInNewTab?: boolean;
  altText?: string;
}

const SCALE_MODE_OPTIONS: {
  value: ImageOptions["scaleMode"];
  label: string;
  description: string;
}[] = [
  {
    value: "contain",
    label: "widget.image.scaleMode.contain",
    description: "widget.image.containDescription",
  },
  {
    value: "cover",
    label: "widget.image.scaleMode.cover",
    description: "widget.image.coverDescription",
  },
  {
    value: "fill",
    label: "widget.image.scaleMode.fill",
    description: "widget.image.fillDescription",
  },
  {
    value: "original",
    label: "widget.image.scaleMode.original",
    description: "widget.image.originalDescription",
  },
];

const ALIGN_X_OPTIONS: {
  value: NonNullable<ImageOptions["alignX"]>;
  label: string;
}[] = [
  { value: "left", label: "widget.image.alignX.left" },
  { value: "center", label: "widget.image.alignX.center" },
  { value: "right", label: "widget.image.alignX.right" },
];

const ALIGN_Y_OPTIONS: {
  value: NonNullable<ImageOptions["alignY"]>;
  label: string;
}[] = [
  { value: "top", label: "widget.image.alignY.top" },
  { value: "center", label: "widget.image.alignY.center" },
  { value: "bottom", label: "widget.image.alignY.bottom" },
];

const CLICK_ACTION_OPTIONS: {
  value: NonNullable<ImageOptions["onClick"]>;
  label: string;
  description: string;
}[] = [
  {
    value: "none",
    label: "widget.image.onClick.none",
    description: "widget.image.noneDescription",
  },
  {
    value: "preview",
    label: "widget.image.onClick.preview",
    description: "widget.image.previewDescription",
  },
  {
    value: "link",
    label: "widget.image.onClick.link",
    description: "widget.image.linkDescription",
  },
];

export default function ImageSettings({
  widgetId: _widgetId,
  options,
  onChange,
}: WidgetSettingsProps) {
  const { t } = useTranslation();
  const opts = options as unknown as ImageOptions;

  const update = (patch: Partial<ImageOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.source")}
        </span>
        <div className="flex gap-2">
          {(["url", "upload"] as const).map((src) => (
            <label
              key={src}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.sourceType || "url") === src
                    ? "var(--accent-primary)"
                    : "var(--border-default)",
                backgroundColor:
                  (opts.sourceType || "url") === src
                    ? "var(--bg-widget-hover)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="sourceType"
                className="h-4 w-4"
                style={{ accentColor: "var(--accent-primary)" }}
                checked={(opts.sourceType || "url") === src}
                onChange={() => update({ sourceType: src })}
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {t(`widget.image.sourceType.${src}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {opts.sourceType !== "upload" && (
        <label className="flex flex-col gap-1.5">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {t("widget.image.url")}
          </span>
          <input
            type="text"
            className="rounded-md border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            placeholder="https://example.com/image.jpg"
            value={opts.url || ""}
            onChange={(e) => update({ url: e.target.value })}
          />
        </label>
      )}

      {opts.sourceType === "upload" && (
        <div className="flex flex-col gap-1.5">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {t("widget.image.uploadImage")}
          </span>
          <ImageUploader
            value={opts.url || ""}
            onChange={(url) => update({ url })}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.scale")}
        </span>
        <div className="flex flex-col gap-1.5">
          {SCALE_MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.scaleMode || "contain") === opt.value
                    ? "var(--accent-primary)"
                    : "var(--border-default)",
                backgroundColor:
                  (opts.scaleMode || "contain") === opt.value
                    ? "var(--bg-widget-hover)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="scaleMode"
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: "var(--accent-primary)" }}
                checked={(opts.scaleMode || "contain") === opt.value}
                onChange={() => update({ scaleMode: opt.value })}
              />
              <div className="flex flex-col">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t(opt.label)}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t(opt.description)}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.horizontalAlignment")}
        </span>
        <div className="flex gap-2">
          {ALIGN_X_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.alignX || "center") === opt.value
                    ? "var(--accent-primary)"
                    : "var(--border-default)",
                backgroundColor:
                  (opts.alignX || "center") === opt.value
                    ? "var(--bg-widget-hover)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="alignX"
                className="h-4 w-4"
                style={{ accentColor: "var(--accent-primary)" }}
                checked={(opts.alignX || "center") === opt.value}
                onChange={() => update({ alignX: opt.value })}
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {t(opt.label)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.verticalAlignment")}
        </span>
        <div className="flex gap-2">
          {ALIGN_Y_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.alignY || "center") === opt.value
                    ? "var(--accent-primary)"
                    : "var(--border-default)",
                backgroundColor:
                  (opts.alignY || "center") === opt.value
                    ? "var(--bg-widget-hover)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="alignY"
                className="h-4 w-4"
                style={{ accentColor: "var(--accent-primary)" }}
                checked={(opts.alignY || "center") === opt.value}
                onChange={() => update({ alignY: opt.value })}
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {t(opt.label)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.borderRadius")}: {opts.borderRadius ?? 0}px
        </span>
        <Slider
          value={opts.borderRadius ?? 0}
          min={0}
          max={24}
          step={1}
          onChange={(value) => update({ borderRadius: value })}
        />
      </label>

      <label className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.showShadow")}
        </span>
        <Switch
          checked={opts.shadow ?? false}
          onCheckedChange={(checked) => update({ shadow: checked })}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.caption")}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder={t("widget.image.caption")}
          value={opts.caption || ""}
          onChange={(e) => update({ caption: e.target.value })}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.clickAction")}
        </span>
        <div className="flex flex-col gap-1.5">
          {CLICK_ACTION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.onClick || "none") === opt.value
                    ? "var(--accent-primary)"
                    : "var(--border-default)",
                backgroundColor:
                  (opts.onClick || "none") === opt.value
                    ? "var(--bg-widget-hover)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="onClick"
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: "var(--accent-primary)" }}
                checked={(opts.onClick || "none") === opt.value}
                onChange={() => update({ onClick: opt.value })}
              />
              <div className="flex flex-col">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t(opt.label)}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t(opt.description)}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {opts.onClick === "link" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {t("widget.image.linkUrl")}
            </span>
            <input
              type="text"
              className="rounded-md border px-4 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
              placeholder="https://example.com"
              value={opts.linkUrl || ""}
              onChange={(e) => update({ linkUrl: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              style={{ accentColor: "var(--accent-primary)" }}
              checked={opts.openInNewTab ?? false}
              onChange={(e) => update({ openInNewTab: e.target.checked })}
            />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {t("widget.image.openInNewTab")}
            </span>
          </label>
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.image.alt")}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder={t("widget.image.altPlaceholder")}
          value={opts.altText || ""}
          onChange={(e) => update({ altText: e.target.value })}
        />
      </label>
    </div>
  );
}
