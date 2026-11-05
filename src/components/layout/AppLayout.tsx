import { DashboardToolbar } from "@/components/layout/DashboardToolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardCanvas } from "@/components/layout/DashboardCanvas";
import { useDashboardStore } from "@/store/index";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/i18n";
import { isAdminPath } from "@/lib/management";

export function AppLayout() {
  const { t } = useTranslation();
  const editMode = useDashboardStore((s) => s.editMode);
  const readOnly = useDashboardStore((s) => s.readOnly);
  const capabilitiesStatus = useDashboardStore((s) => s.capabilitiesStatus);
  const recoveryNotice = useDashboardStore((s) => s.recoveryNotice);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar />
      {isAdminPath() && (capabilitiesStatus !== "ready" || readOnly) && (
        <p
          role={capabilitiesStatus === "error" ? "alert" : "status"}
          className="px-4 py-3 text-sm"
        >
          {t(
            capabilitiesStatus === "loading"
              ? "review.managementLoading"
              : capabilitiesStatus === "error"
                ? "review.managementUnavailable"
                : "review.readOnly",
          )}
        </p>
      )}
      {isAdminPath() && recoveryNotice && (
        <p
          role="alert"
          className="px-4 py-3 text-sm text-[var(--status-warning)]"
        >
          {t("review.recoveryNotice")}
        </p>
      )}
      {editMode && sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
          role="button"
          tabIndex={-1}
          aria-label={t("sidebar.close")}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <DashboardCanvas />
      </div>
    </div>
  );
}
