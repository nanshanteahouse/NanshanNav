// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useAutoEditMode } from "@/hooks/useAutoEditMode";
import { EditModeToggle } from "@/components/common/EditModeToggle";
import { ExportImportButtons } from "@/components/common/ExportImportButtons";
import { useDashboardStore } from "@/store";
const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiFetch }));
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: "en" }),
}));
function Access() {
  useAutoEditMode();
  return (
    <>
      <EditModeToggle />
      <ExportImportButtons />
    </>
  );
}
beforeEach(() => {
  apiFetch.mockReset();
  useDashboardStore.setState({
    editMode: false,
    readOnly: true,
    capabilitiesStatus: "loading",
  });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
describe("public and management UI", () => {
  it.each(["/", "/administrator"])(
    "keeps %s in display mode without management requests",
    async (path) => {
      window.history.replaceState(null, "", path);
      apiFetch.mockResolvedValue(
        new Response(JSON.stringify({ readOnly: false })),
      );
      render(<Access />);
      await waitFor(() =>
        expect(useDashboardStore.getState().capabilitiesStatus).toBe("ready"),
      );
      expect(useDashboardStore.getState().editMode).toBe(false);
      expect(
        screen.queryByRole("button", { name: "toolbar.importConfig" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "toolbar.enterEditMode" }),
      ).toBeNull();
      expect(apiFetch.mock.calls.map(([url]) => url)).toEqual([
        "/api/capabilities",
      ]);
    },
  );
  it("allows editing on /admin only after capabilities confirm writes are enabled", async () => {
    window.history.replaceState(null, "", "/admin");
    let resolve!: (response: Response) => void;
    apiFetch.mockReturnValue(
      new Promise<Response>((r) => {
        resolve = r;
      }),
    );
    render(<Access />);
    expect(useDashboardStore.getState().editMode).toBe(false);
    expect(screen.queryByRole("button")).toBeNull();
    resolve(new Response(JSON.stringify({ readOnly: false })));
    await waitFor(() =>
      expect(useDashboardStore.getState().editMode).toBe(true),
    );
    expect(
      screen.getByRole("button", { name: "toolbar.importConfig" }),
    ).toBeTruthy();
  });
  it.each(["readOnly", "failed", "malformed"])(
    "hides management controls when capabilities are %s",
    async (mode) => {
      window.history.replaceState(null, "", "/admin");
      if (mode === "failed") apiFetch.mockRejectedValue(new Error("offline"));
      else
        apiFetch.mockResolvedValue(
          new Response(
            JSON.stringify(mode === "readOnly" ? { readOnly: true } : {}),
          ),
        );
      render(<Access />);
      await waitFor(() =>
        expect(useDashboardStore.getState().capabilitiesStatus).not.toBe(
          "loading",
        ),
      );
      expect(useDashboardStore.getState().editMode).toBe(false);
      expect(screen.queryByRole("button")).toBeNull();
    },
  );
});
