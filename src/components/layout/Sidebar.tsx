import { useRef, useId } from "react";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { X } from "lucide-react";
import { StarterTools } from "@/components/common/StarterTools";
import { WidgetPalette } from "@/components/widgets/WidgetPalette";
import { useDashboardStore } from "@/store/index";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Sidebar() {
  const editMode = useDashboardStore((s) => s.editMode);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const drawerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useDialogFocus(isMobile && editMode && sidebarOpen, drawerRef, () =>
    setSidebarOpen(false),
  );

  if (!editMode || !sidebarOpen) return null;

  return (
    <aside
      ref={drawerRef}
      role={isMobile ? "dialog" : undefined}
      aria-modal={isMobile ? true : undefined}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] shadow-xl overflow-y-auto scrollbar-thin border-r border-[var(--border-default)] bg-[var(--bg-secondary)]"
          : "w-[280px] shrink-0 h-full overflow-y-auto scrollbar-thin border-r border-[var(--border-default)] bg-[var(--bg-secondary)]"
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <span
          id={titleId}
          className="text-sm font-semibold text-[var(--text-primary)]"
        >
          {t("sidebar.widgetLibrary")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("sidebar.close")}
          title={t("sidebar.close")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        <StarterTools />
        <WidgetPalette />
      </div>
    </aside>
  );
}
