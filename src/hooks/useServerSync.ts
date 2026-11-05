import { useEffect } from "react";
import { dashboardDocument, useDashboardStore } from "@/store";
import { apiFetch } from "@/lib/api/client";
import { isAdminPath } from "@/lib/management";
import { parseDashboard } from "@/lib/dashboard-schema";
import { syncText, type SyncMessageKey } from "@/i18n/sync-messages";
function responseRevision(
  response: Response,
  value: { revision?: unknown },
): string {
  // Compression proxies may weaken ETag; the JSON revision is the app's lock token.
  const revision =
    value.revision === undefined ? response.headers.get("ETag") : value.revision;
  if (typeof revision !== "string" || !/^"[a-zA-Z0-9-]+"$/.test(revision))
    throw new Error(message("saveUnconfirmed"));
  return revision;
}
const message = (
  key: SyncMessageKey,
  params?: Record<string, string | number>,
) => syncText(useDashboardStore.getState().settings.locale, key, params);

let initialization: Promise<void> | null = null;
let initializationFailed = false;
let saving: Promise<boolean> | null = null;

export async function initializeServerSync(retryFailed = false): Promise<void> {
  if (initialization && !(retryFailed && initializationFailed))
    return initialization;
  initializationFailed = false;
  const sequence = useDashboardStore.getState().changeSequence;
  useDashboardStore.setState({ saveStatus: "loading" });
  initialization = (async () => {
    try {
      const response = await apiFetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401 || response.status === 403)
        throw new Error(message("loadAccess"));
      if (response.status === 404) {
        const state = useDashboardStore.getState();
        useDashboardStore.setState({
          revision: state.dirty && state.revision ? state.revision : '"0"',
          saveStatus: "idle",
          syncError: null,
        });
        return;
      }
      if (response.headers.get("X-Dashboard-Recovery") === "available")
        useDashboardStore.setState({ serverRecovery: true });
      if (!response.ok)
        throw new Error(message("loadFailed", { status: response.status }));
      const value = await response.json();
      const document = parseDashboard(value);
      const revision = responseRevision(response, value);
      const state = useDashboardStore.getState();
      // A late request must never replace edits or a draft restored from the last session.
      if (!state.dirty && sequence === state.changeSequence)
        state.replaceDashboard(document, "server", revision);
      else if (!state.revision) useDashboardStore.setState({ revision });
      useDashboardStore.setState({
        saveStatus: "idle",
        syncError: null,
      });
    } catch (error) {
      initializationFailed = true;
      useDashboardStore.setState({
        saveStatus: "error",
        syncError:
          error instanceof Error
            ? error.message
            : message("loadFailed", { status: "network" }),
      });
    }
  })();
  return initialization;
}
/** Mount once at the application root. All other callers only subscribe to shared state. */
export function useInitializeServerSync() {
  useEffect(() => {
    void initializeServerSync();
    const warn = (event: BeforeUnloadEvent) => {
      if (useDashboardStore.getState().dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const retry = () => {
      if (initializationFailed) void initializeServerSync(true);
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("online", retry);
    };
  }, []);
}
function canManage(
  state: ReturnType<typeof useDashboardStore.getState>,
): boolean {
  return (
    isAdminPath() && state.capabilitiesStatus === "ready" && !state.readOnly
  );
}
export function saveToServer(): Promise<boolean> {
  if (saving) return saving;
  saving = Promise.resolve()
    .then(async () => {
      if (initialization) await initialization;
      const state = useDashboardStore.getState();
      if (!canManage(state)) return false;
      const sequence = state.changeSequence;
      useDashboardStore.setState({ saveStatus: "saving", syncError: null });
      try {
        const document = parseDashboard(dashboardDocument(state));
        const response = await apiFetch("/api/admin/dashboard", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": state.revision ?? '"0"',
          },
          body: JSON.stringify(document),
        });
        if (response.status === 409 || response.status === 412)
          throw new Error(message("saveConflict"));
        if (response.status === 401 || response.status === 403)
          throw new Error(message("saveAccess"));
        if (!response.ok)
          throw new Error(message("saveFailed", { status: response.status }));
        const result = await response.json();
        if (result.success !== true)
          throw new Error(message("saveUnconfirmed"));
        const revision = responseRevision(response, result);
        const unchanged =
          sequence === useDashboardStore.getState().changeSequence;
        useDashboardStore.setState({
          revision,
          dirty: !unchanged,
          saveStatus: unchanged ? "saved" : "idle",
          syncError: null,
        });
        return unchanged;
      } catch (error) {
        useDashboardStore.setState({
          dirty: true,
          saveStatus: "error",
          syncError:
            error instanceof Error
              ? error.message
              : message("saveFailed", { status: "network" }),
        });
        return false;
      }
    })
    .finally(() => {
      saving = null;
    });
  return saving;
}
export async function rollbackToVersion(revision: string): Promise<boolean> {
  const state = useDashboardStore.getState();
  if (!canManage(state)) return false;
  const sequence = state.changeSequence;
  useDashboardStore.setState({ saveStatus: "saving", syncError: null });
  try {
    const response = await apiFetch("/api/admin/dashboard/rollback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "If-Match": state.serverRecovery ? '"0"' : (state.revision ?? '"0"'),
      },
      body: JSON.stringify({ revision }),
    });
    if (!response.ok)
      throw new Error(
        response.status === 412
          ? message("restoreConflict")
          : message("restoreFailed", { status: response.status }),
      );
    const data = await response.json();
    parseDashboard(data);
    const restoredRevision = responseRevision(response, data);
    if (useDashboardStore.getState().changeSequence !== sequence) {
      useDashboardStore.setState({
        revision: restoredRevision,
        saveStatus: "idle",
        syncError: message("restoreChanged"),
      });
      return false;
    }
    state.replaceDashboard(data, "server", restoredRevision);
    useDashboardStore.setState({ saveStatus: "saved" });
    return true;
  } catch (error) {
    useDashboardStore.setState({
      saveStatus: "error",
      syncError:
        error instanceof Error
          ? error.message
          : message("restoreFailed", { status: "network" }),
    });
    return false;
  }
}
export function useServerSync() {
  const dirty = useDashboardStore((s) => s.dirty);
  const saveStatus = useDashboardStore((s) => s.saveStatus);
  const syncError = useDashboardStore((s) => s.syncError);
  const revision = useDashboardStore((s) => s.revision);
  return {
    saveToServer,
    rollbackToVersion,
    dirty,
    saveStatus,
    syncError,
    revision,
  };
}
