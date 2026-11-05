/** @vitest-environment jsdom */
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WidgetShell } from "@/components/widgets/WidgetShell";
import { useDashboardStore } from "@/store";

vi.mock("@/components/widgets/WidgetSettings", () => ({ default: () => null }));
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const widget = {
  id: "widget-1",
  type: "clock" as const,
  title: "Test Widget",
  options: {},
  createdAt: "",
  updatedAt: "",
};

beforeEach(() => {
  useDashboardStore.setState({
    editMode: true,
    widgets: [widget],
    clipboard: null,
    currentBreakpoint: "xs",
    lastInteractedWidgetId: null,
    layouts: {
      lg: [],
      md: [],
      sm: [],
      xs: [{ i: widget.id, x: 0, y: 0, w: 2, h: 3 }],
      xxs: [],
    },
    history: { past: [], future: [] },
  });
});
afterEach(cleanup);
function openActions() {
  fireEvent.click(screen.getByLabelText("widgetShell.moreOptions"));
}

it("keeps content visible and selects the widget on pointer or keyboard focus", () => {
  const { container } = render(
    <WidgetShell widget={widget}>
      <p>Content</p>
    </WidgetShell>,
  );
  const shell = container.querySelector<HTMLElement>("[data-widget-id]")!;
  expect(screen.getByText("Content")).toBeDefined();
  expect(shell.dataset.selected).toBe("false");
  fireEvent.pointerDown(shell);
  expect(useDashboardStore.getState().lastInteractedWidgetId).toBe(widget.id);
  expect(shell.dataset.selected).toBe("true");
  expect(
    container.querySelector(".widget-drag-handle")?.className,
  ).not.toContain("absolute");
});

it("uses a labelled action dialog and disables paste without a copied widget", () => {
  render(
    <WidgetShell widget={widget}>
      <p>Content</p>
    </WidgetShell>,
  );
  expect(screen.queryByLabelText("widgetShell.copy")).toBeNull();
  openActions();
  expect(screen.getByRole("dialog", { name: widget.title })).toBeDefined();
  expect(
    (screen.getByLabelText("widgetShell.paste") as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByLabelText("widgetShell.copy"));
  expect(useDashboardStore.getState().clipboard?.id).toBe(widget.id);
});

it("duplicates into the actual container breakpoint", () => {
  render(
    <WidgetShell widget={widget}>
      <p>Content</p>
    </WidgetShell>,
  );
  openActions();
  fireEvent.click(screen.getByLabelText("widgetShell.duplicate"));
  const state = useDashboardStore.getState();
  expect(state.widgets).toHaveLength(2);
  expect(state.layouts.xs).toHaveLength(2);
  expect(state.layouts.lg).toHaveLength(0);
});

it("offers touch size controls and records an undoable layout change", () => {
  render(
    <WidgetShell widget={widget}>
      <p>Content</p>
    </WidgetShell>,
  );
  openActions();
  fireEvent.change(screen.getByLabelText("widgetShell.width"), {
    target: { value: "3" },
  });
  expect(useDashboardStore.getState().layouts.xs[0].w).toBe(3);
  expect(useDashboardStore.getState().history.past).toHaveLength(1);
  const snapshot = useDashboardStore.getState().undo();
  expect(snapshot?.layouts.xs[0].w).toBe(2);
});

it("offers no editing controls in view mode", () => {
  useDashboardStore.setState({ editMode: false });
  render(
    <WidgetShell widget={widget}>
      <p>Content</p>
    </WidgetShell>,
  );
  expect(screen.getByText("Content")).toBeDefined();
  expect(screen.queryByLabelText("widgetShell.moreOptions")).toBeNull();
});
