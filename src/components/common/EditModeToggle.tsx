import { Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/store/index";
import { useTranslation } from "@/i18n";
import { useServerSync } from "@/hooks/useServerSync";
import { isAdminPath, navigateToPublicDashboard } from "@/lib/management";

export function EditModeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const editMode = useDashboardStore((s) => s.editMode);
  const managementAvailable = useDashboardStore(
    (s) => s.capabilitiesStatus === "ready" && !s.readOnly,
  );
  const storageUnavailable = useDashboardStore((s) =>
    s.recoveryNotice?.startsWith("Browser storage"),
  );
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const { t } = useTranslation();
  const { saveToServer, saveStatus, syncError, dirty } = useServerSync();

  const handleToggle = async () => {
    if (editMode) {
      // Exiting edit mode: persist config to server, then back to homepage
      if (!(await saveToServer())) return;
      toggleEditMode();
      setSidebarOpen(false);
      navigateToPublicDashboard();
      return;
    }

    // Full navigation lets an optional proxy protect the management route.
    window.location.assign("/admin");
  };

  if (!isAdminPath() || !managementAvailable) return null;

  if (editMode) {
    return (
      <span className="inline-flex flex-col items-start gap-1 lg:flex-row lg:items-center lg:gap-2 max-lg:max-w-32">
        <Button
          className="whitespace-nowrap shrink-0"
          disabled={saveStatus === "saving" || saveStatus === "loading"}
          variant="default"
          size={showLabel ? "sm" : "icon"}
          aria-label={t("toolbar.exitEditMode")}
          title={t("toolbar.exitEditMode")}
          onClick={handleToggle}
        >
          <Save className="h-4 w-4" />
          {showLabel &&
            (saveStatus === "saving"
              ? t("sync.saving")
              : t("toolbar.saveExit"))}
        </Button>
        <span
          role={syncError ? "alert" : "status"}
          className="max-w-32 lg:max-w-64 break-words text-xs text-[var(--text-secondary)]"
        >
          {syncError ||
            (dirty
              ? storageUnavailable
                ? t("sync.storageFailure")
                : t("sync.draftStored")
              : saveStatus === "saved"
                ? t("sync.saved")
                : "")}
        </span>
      </span>
    );
  }

  return (
    <Button
      variant={showLabel ? "outline" : "ghost"}
      size={showLabel ? "sm" : "icon"}
      aria-label={t("toolbar.enterEditMode")}
      title={t("toolbar.enterEditMode")}
      onClick={handleToggle}
    >
      <Pencil className="h-4 w-4" />
      {showLabel && t("toolbar.editBtn")}
    </Button>
  );
}
