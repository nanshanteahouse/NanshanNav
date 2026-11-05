// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/types/dashboard";
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiFetch: fetchMock }));
const document = (title = "server") => ({
  schemaVersion: 1,
  settings: { ...DEFAULT_SETTINGS, dashboardTitle: title },
  layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
  widgets: [],
});
beforeEach(() => {
  window.history.replaceState(null, "", "/admin");
  vi.resetModules();
  fetchMock.mockReset();
  localStorage.clear();
});
afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});
describe("shared dashboard synchronization", () => {
  it.each(["/", "/admin"])(
    "first visit to %s has no invalid-draft warning",
    async (path) => {
      window.history.replaceState(null, "", path);
      const { useDashboardStore } = await import("@/store");
      expect(useDashboardStore.getState().recoveryNotice).toBeNull();
      expect(useDashboardStore.getState().dirty).toBe(false);
      expect(useDashboardStore.getState().widgets).toEqual([]);
    },
  );
  it("public loading shows the published dashboard without reading or overwriting the admin draft", async () => {
    const draft = JSON.stringify({
      state: { ...document("admin draft"), dirty: true, revision: '"old"' },
      version: 0,
    });
    localStorage.setItem("dashboard-storage", draft);
    window.history.replaceState(null, "", "/");
    const { useDashboardStore } = await import("@/store");
    const { initializeServerSync, saveToServer, rollbackToVersion } =
      await import("@/hooks/useServerSync");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(document("published")), {
        headers: { ETag: '"one"' },
      }),
    );
    await initializeServerSync();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "published",
    );
    expect(localStorage.getItem("dashboard-storage")).toBe(draft);
    expect(await saveToServer()).toBe(false);
    expect(await rollbackToVersion('"old"')).toBe(false);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/dashboard",
    ]);
  });
  it("admin loading restores an unsaved local draft", async () => {
    localStorage.setItem(
      "dashboard-storage",
      JSON.stringify({
        state: { ...document("admin draft"), dirty: true, revision: '"old"' },
        version: 0,
      }),
    );
    const { useDashboardStore } = await import("@/store");
    const { initializeServerSync } = await import("@/hooks/useServerSync");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(document("published")), {
        headers: { ETag: '"one"' },
      }),
    );
    await initializeServerSync();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "admin draft",
    );
    expect(useDashboardStore.getState().dirty).toBe(true);
  });
  it("does not send management requests while capabilities are loading or read-only", async () => {
    const { useDashboardStore } = await import("@/store");
    const { saveToServer, rollbackToVersion } =
      await import("@/hooks/useServerSync");
    expect(await saveToServer()).toBe(false);
    useDashboardStore.setState({ readOnly: true, capabilitiesStatus: "ready" });
    expect(await rollbackToVersion('"old"')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("loads once and protects edits made while GET is in flight", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const { useDashboardStore } = await import("@/store");
    const { initializeServerSync } = await import("@/hooks/useServerSync");
    const loading = initializeServerSync();
    void initializeServerSync();
    useDashboardStore
      .getState()
      .updateSettings({ dashboardTitle: "local draft" });
    resolve(
      new Response(JSON.stringify(document()), { headers: { ETag: '"one"' } }),
    );
    await loading;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "local draft",
    );
    expect(useDashboardStore.getState().dirty).toBe(true);
  });
  it("retries a failed initial read after the connection recovers without replacing a restored draft", async () => {
    const { useDashboardStore } = await import("@/store");
    const { initializeServerSync } = await import("@/hooks/useServerSync");
    useDashboardStore.setState({ dirty: true, revision: '"old"' });
    useDashboardStore
      .getState()
      .updateSettings({ dashboardTitle: "restored draft" });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await initializeServerSync();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(document()), { headers: { ETag: '"new"' } }),
    );
    await initializeServerSync(true);
    expect(useDashboardStore.getState()).toMatchObject({
      dirty: true,
      revision: '"old"',
      syncError: null,
    });
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "restored draft",
    );
  });
  it("preserves a stale draft revision even when the server was reset", async () => {
    const { useDashboardStore } = await import("@/store");
    const { initializeServerSync } = await import("@/hooks/useServerSync");
    useDashboardStore.setState({ dirty: true, revision: '"old"' });
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    await initializeServerSync();
    expect(useDashboardStore.getState().revision).toBe('"old"');
  });
  it("retains local draft on failed save and only clears dirty after a confirmed response", async () => {
    const { useDashboardStore } = await import("@/store");
    const { saveToServer } = await import("@/hooks/useServerSync");
    useDashboardStore.setState({
      readOnly: false,
      capabilitiesStatus: "ready",
    });
    useDashboardStore.getState().replaceDashboard(document("draft"));
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    expect(await saveToServer()).toBe(false);
    expect(useDashboardStore.getState()).toMatchObject({
      dirty: true,
      saveStatus: "error",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, revision: '"two"' }), {
        headers: { ETag: '"two"' },
      }),
    );
    expect(await saveToServer()).toBe(true);
    expect(useDashboardStore.getState()).toMatchObject({
      dirty: false,
      revision: '"two"',
      saveStatus: "saved",
    });
  });
  it("does not mark edits made during PUT as saved", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const { useDashboardStore } = await import("@/store");
    const { saveToServer } = await import("@/hooks/useServerSync");
    useDashboardStore.setState({
      readOnly: false,
      capabilitiesStatus: "ready",
    });
    const saving = saveToServer();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    useDashboardStore
      .getState()
      .updateSettings({ dashboardTitle: "newer draft" });
    resolve(new Response(JSON.stringify({ success: true, revision: '"two"' })));
    expect(await saving).toBe(false);
    expect(useDashboardStore.getState().dirty).toBe(true);
  });
  it("validates imports atomically and undo restores settings with widgets and layouts", async () => {
    const { useDashboardStore } = await import("@/store");
    const state = useDashboardStore.getState();
    state.replaceDashboard(document("before"), "server", '"one"');
    expect(() =>
      state.replaceDashboard({ ...document(), widgets: {} }),
    ).toThrow();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe("before");
    state.replaceDashboard(document("imported"));
    state.undo();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe("before");
    state.redo();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "imported",
    );
  });
  it("retains edits and reports unavailable local storage without recursive failure", async () => {
    const { useDashboardStore } = await import("@/store");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(() =>
      useDashboardStore
        .getState()
        .updateSettings({ dashboardTitle: "in-memory draft" }),
    ).not.toThrow();
    expect(useDashboardStore.getState().settings.dashboardTitle).toBe(
      "in-memory draft",
    );
    expect(useDashboardStore.getState().recoveryNotice).toContain(
      "Browser storage",
    );
  });
  it("quarantines invalid browser storage and recovers without merging broken values", async () => {
    localStorage.setItem(
      "dashboard-storage",
      JSON.stringify({ state: { ...document(), widgets: {} }, version: 0 }),
    );
    const { useDashboardStore } = await import("@/store");
    expect(useDashboardStore.getState().widgets).toEqual([]);
    const key = useDashboardStore.getState().recoveryNotice!;
    expect(key).toContain("dashboard-storage-recovery-");
    expect(localStorage.getItem(key)).toContain('"widgets":{}');
  });
});
