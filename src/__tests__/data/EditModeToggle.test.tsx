// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { EditModeToggle } from "@/components/common/EditModeToggle";
import { useDashboardStore } from "@/store";
import { DEFAULT_SETTINGS } from "@/types/dashboard";
const fetchMock = vi.hoisted(() => vi.fn());
const navigateToPublicDashboard = vi.hoisted(() => vi.fn());
vi.mock("@/lib/management", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  navigateToPublicDashboard,
}));
vi.mock("@/lib/api/client", () => ({ apiFetch: fetchMock }));
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: "en" }),
}));
beforeEach(() => {
  window.history.replaceState(null, "", "/admin");
  fetchMock.mockReset();
  navigateToPublicDashboard.mockReset();
  useDashboardStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    widgets: [],
    layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
    editMode: false,
    readOnly: false,
    capabilitiesStatus: "ready",
    saveStatus: "idle",
    syncError: null,
    revision: '"one"',
    dirty: true,
    changeSequence: 1,
  });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
describe("save and exit workflow", () => {
  it("mounting extra toolbar controls does not start another dashboard read", () => {
    render(
      <>
        <EditModeToggle />
        <EditModeToggle showLabel />
      </>,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("waits for save confirmation and preserves editing on PUT 500", async () => {
    let resolve!: (response: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    useDashboardStore.setState({ editMode: true });
    render(<EditModeToggle showLabel />);
    fireEvent.click(
      screen.getByRole("button", { name: "toolbar.exitEditMode" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(useDashboardStore.getState().editMode).toBe(true);
    expect(navigateToPublicDashboard).not.toHaveBeenCalled();
    resolve(new Response("", { status: 500 }));
    await waitFor(() =>
      expect(useDashboardStore.getState().saveStatus).toBe("error"),
    );
    expect(useDashboardStore.getState()).toMatchObject({
      editMode: true,
      dirty: true,
    });
    expect(screen.getByRole("alert").textContent).toContain("500");
    expect(navigateToPublicDashboard).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, revision: '"two"' })),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "toolbar.exitEditMode" }),
    );
    await waitFor(() =>
      expect(useDashboardStore.getState().editMode).toBe(false),
    );
    expect(useDashboardStore.getState().dirty).toBe(false);
    expect(navigateToPublicDashboard).toHaveBeenCalledTimes(1);
  });
});
