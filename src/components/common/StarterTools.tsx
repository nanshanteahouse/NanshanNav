import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/i18n";
import { useDashboardStore } from "@/store";
import { registry } from "@/registry";
import { COLS } from "@/lib/constants";
import { generateId } from "@/lib/utils/generate-id";
import { parseBookmarks } from "@/lib/bookmarks";
import type { WidgetConfig, WidgetType, LinkItem } from "@/types/widget";
import type { DashboardLayouts } from "@/types/layout";

function createWidget(
  type: WidgetType,
  title: string,
  options = {},
): WidgetConfig {
  return {
    id: generateId(),
    type,
    title,
    options: { ...registry[type].defaultOptions, ...options },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function addLayouts(
  widgets: WidgetConfig[],
  existing?: DashboardLayouts,
): DashboardLayouts {
  return Object.fromEntries(
    Object.entries(COLS).map(([bp, cols]) => {
      const previous = existing?.[bp as keyof DashboardLayouts] ?? [];
      let y = previous.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      let x = 0,
        rowHeight = 0;
      return [
        bp,
        [
          ...previous,
          ...widgets.map((widget) => {
            const wide = cols >= 10;
            const w =
              !wide || widget.type === "title-header"
                ? cols
                : widget.type === "search-box"
                  ? cols - 4
                  : widget.type === "clock"
                    ? 4
                    : Math.floor(cols / 2);
            const h =
              widget.type === "clock"
                ? wide
                  ? 2
                  : 3
                : registry[widget.type].defaultSize.h;
            if (x + w > cols) {
              y += rowHeight;
              x = 0;
              rowHeight = 0;
            }
            const item = { i: widget.id, x, y, w, h };
            x += w;
            rowHeight = Math.max(rowHeight, h);
            return item;
          }),
        ],
      ];
    }),
  ) as unknown as DashboardLayouts;
}
export function StarterTools() {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState("home");
  const [preview, setPreview] = useState<ReturnType<
    typeof parseBookmarks
  > | null>(null);
  const [error, setError] = useState("");
  const close = () => {
    setOpen(false);
    setPreview(null);
    setError("");
  };
  const applyTemplate = () => {
    const en = locale === "en";
    const widgets = [
      createWidget("search-box", t("common.search")),
      createWidget("clock", t("widget.clock.name")),
    ];
    if (template !== "minimal") {
      widgets.push(
        createWidget(
          "title-header",
          template === "work"
            ? en
              ? "Workspace"
              : "工作空间"
            : en
              ? "Home services"
              : "家庭服务",
        ),
      );
      widgets.push(
        createWidget("web-link", en ? "Quick links" : "常用链接", {
          healthCheckEnabled: false,
        }),
      );
      widgets.push(
        createWidget("markdown-text", en ? "Notes" : "备忘录", {
          content: en
            ? "### Today\n- [ ] Add your first task"
            : "### 今日待办\n- [ ] 添加你的第一项任务",
        }),
      );
    }
    const state = useDashboardStore.getState();
    try {
      state.replaceDashboard(
        { settings: state.settings, widgets, layouts: addLayouts(widgets) },
        "import",
      );
      close();
    } catch {
      setError(t("toolbar.importError"));
    }
  };
  const importBookmarks = () => {
    if (!preview) return;
    const widgets = preview.groups.map((group) =>
      createWidget("web-link", group.name, {
        links: group.links,
        healthCheckEnabled: false,
      }),
    );
    const state = useDashboardStore.getState();
    try {
      state.replaceDashboard(
        {
          settings: state.settings,
          widgets: [...state.widgets, ...widgets],
          layouts: addLayouts(widgets, state.layouts),
        },
        "import",
      );
      close();
    } catch {
      setError(t("toolbar.importError"));
    }
  };
  return (
    <>
      <Button
        variant="outline"
        className="mb-4 w-full"
        onClick={() => setOpen(true)}
      >
        {t("review.starter")}
      </Button>
      <Modal open={open} onClose={close} title={t("review.starter")}>
        <div className="space-y-5">
          <label className="flex flex-col gap-2 text-sm">
            {t("review.template")}
            <select
              className="rounded-lg border p-3 bg-[var(--bg-input)] border-[var(--border-default)]"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {["home", "minimal", "work"].map((key) => (
                <option key={key} value={key}>
                  {t(`review.${key}Template`)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("review.templateHelp")}
          </p>
          <Button onClick={applyTemplate}>{t("review.apply")}</Button>
          <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
            <label className="flex flex-col gap-2 text-sm">
              {t("review.bookmarks")}
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  setPreview(null);
                  setError("");
                  if (!file) return;
                  try {
                    if (file.size > 5 * 1024 * 1024) throw new Error();
                    const existing = useDashboardStore
                      .getState()
                      .widgets.flatMap((w) =>
                        w.type === "web-link"
                          ? (w.options.links as LinkItem[]).map((l) => l.url)
                          : [],
                      );
                    const result = parseBookmarks(await file.text(), existing);
                    if (!result.count && !result.duplicates) throw new Error();
                    setPreview(result);
                  } catch {
                    setError(t("review.importInvalid"));
                  }
                }}
              />
            </label>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("review.bookmarkHelp")}
            </p>
            {error && <p role="alert">{error}</p>}
            {preview && (
              <>
                <p role="status">
                  {t("review.importPreview", {
                    count: preview.count,
                    duplicates: preview.duplicates,
                  })}
                </p>
                <Button disabled={!preview.count} onClick={importBookmarks}>
                  {t("review.importBookmarks")}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
