import { useEffect } from "react";
import { useDashboardStore } from "@/store/index";
import { apiFetch } from "@/lib/api/client";

import { isAdminPath } from "@/lib/management";

/** Editing stays disabled until the server explicitly allows management. */
export function useAutoEditMode() {
  const readOnly = useDashboardStore((s) => s.readOnly);
  const capabilitiesStatus = useDashboardStore((s) => s.capabilitiesStatus);
  const setEditMode = useDashboardStore((s) => s.setEditMode);

  useEffect(() => {
    const controller = new AbortController();
    useDashboardStore.setState({
      readOnly: true,
      capabilitiesStatus: "loading",
    });
    apiFetch("/api/capabilities", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Cannot load capabilities");
        const value = await response.json();
        if (typeof value.readOnly !== "boolean")
          throw new Error("Invalid capabilities");
        if (!controller.signal.aborted)
          useDashboardStore.setState({
            readOnly: value.readOnly,
            capabilitiesStatus: "ready",
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          useDashboardStore.setState({
            readOnly: true,
            capabilitiesStatus: "error",
          });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const syncFromPath = () => {
      setEditMode(isAdminPath() && capabilitiesStatus === "ready" && !readOnly);
    };
    syncFromPath();
    const navigate = () => {
      setEditMode(false);
      // Re-enter through the server so optional proxy rules and draft isolation apply.
      window.location.reload();
    };
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, [setEditMode, readOnly, capabilitiesStatus]);
}
