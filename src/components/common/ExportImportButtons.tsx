import { useRef, useState } from "react";
import { Download, Upload, History } from "lucide-react";
import { dashboardDocument, useDashboardStore } from "@/store/index";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/i18n";
import {
  createDashboardBackup,
  parseDashboardBackup,
  restoreDashboardBackup,
} from "@/lib/dashboard-backup";
import { apiFetch } from "@/lib/api/client";
import { rollbackToVersion } from "@/hooks/useServerSync";

interface Version {
  revision: string;
  updatedAt: string;
  title: string;
}
export function ExportImportButtons({
  showLabel = false,
}: {
  showLabel?: boolean;
}) {
  const editMode = useDashboardStore((s) => s.editMode);
  const replaceDashboard = useDashboardStore((s) => s.replaceDashboard);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<
    typeof parseDashboardBackup
  > | null>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const reportError = (value: unknown) =>
    setError(value instanceof Error ? value.message : t("toolbar.importError"));
  const handleExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const config = await createDashboardBackup(
        dashboardDocument(useDashboardStore.getState()),
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(config, null, 2)], {
          type: "application/json",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nanshan-nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (value) {
      reportError(value);
    } finally {
      setBusy(false);
    }
  };
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      if (file.size > 100 * 1024 * 1024)
        throw new Error(t("sync.backupTooLarge"));
      setPreview(parseDashboardBackup(JSON.parse(await file.text())));
    } catch (value) {
      reportError(value);
    }
  };
  const applyImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      replaceDashboard(await restoreDashboardBackup(preview), "import");
      setPreview(null);
    } catch (value) {
      reportError(value);
    } finally {
      setBusy(false);
    }
  };
  const loadVersions = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch("/api/admin/dashboard/versions", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(t("sync.versionsFailed", { status: response.status }));
      const data = await response.json();
      if (!Array.isArray(data.versions))
        throw new Error(t("sync.invalidVersionResponse"));
      setVersions(data.versions);
    } catch (value) {
      reportError(value);
    } finally {
      setBusy(false);
    }
  };
  const restore = async (revision: string) => {
    setBusy(true);
    if (await rollbackToVersion(revision)) setVersions(null);
    else setError(useDashboardStore.getState().syncError);
    setBusy(false);
  };
  if (!editMode) return null;
  const buttonClass = showLabel ? "justify-start gap-2" : "";
  return (
    <>
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        disabled={busy}
        aria-label={t("toolbar.exportConfig")}
        title={t("sync.exportBackup")}
        onClick={handleExport}
        className={buttonClass}
      >
        <Upload className="h-4 w-4" />
        {showLabel && <span>{t("sync.fullBackup")}</span>}
      </Button>
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        disabled={busy}
        aria-label={t("toolbar.importConfig")}
        title={t("toolbar.importConfig")}
        onClick={() => fileInputRef.current?.click()}
        className={buttonClass}
      >
        <Download className="h-4 w-4" />
        {showLabel && <span>{t("toolbar.importConfig")}</span>}
      </Button>
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        disabled={busy}
        aria-label={t("sync.versions")}
        title={t("sync.versions")}
        onClick={loadVersions}
        className={buttonClass}
      >
        <History className="h-4 w-4" />
        {showLabel && <span>{t("sync.versions")}</span>}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label={t("toolbar.importConfig")}
        onChange={handleImport}
      />
      {error && (
        <p
          role="alert"
          className="max-w-72 text-sm text-[var(--status-offline)]"
        >
          {error}
        </p>
      )}
      <Modal
        open={preview !== null}
        onClose={() => {
          if (!busy) setPreview(null);
        }}
        title={t("sync.restorePreview")}
      >
        {preview && (
          <div className="space-y-4 text-sm">
            <p>
              {preview.document.settings.dashboardTitle} ·{" "}
              {preview.document.widgets.length} {t("sync.widgets")} ·{" "}
              {preview.assets.length} {t("sync.images")}
            </p>
            <p>{t("sync.restoreHelp")}</p>
            <Button disabled={busy} onClick={applyImport}>
              {busy ? t("common.loading") : t("common.confirm")}
            </Button>
          </div>
        )}
      </Modal>
      <Modal
        open={versions !== null}
        onClose={() => {
          if (!busy) setVersions(null);
        }}
        title={t("sync.versions")}
      >
        <div className="space-y-3 text-sm">
          <p>{t("sync.versionHelp")}</p>
          {versions?.length === 0 && <p>{t("sync.noVersions")}</p>}
          {versions?.map((version) => (
            <div
              className="flex items-center justify-between gap-3"
              key={version.revision}
            >
              <span>
                {new Date(version.updatedAt).toLocaleString(locale)} ·{" "}
                {version.title}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => restore(version.revision)}
              >
                {t("sync.restore")}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
