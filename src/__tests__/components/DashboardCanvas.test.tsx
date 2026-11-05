/** @vitest-environment jsdom */
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  cleanup,
  act,
  screen,
  fireEvent,
} from "@testing-library/react";
import type { ReactNode } from "react";
import type { LayoutItem } from "@/types/layout";
import { DashboardCanvas } from "@/components/layout/DashboardCanvas";
import { useDashboardStore } from "@/store";
const grid = vi.hoisted(() => ({
  props: null as null | {
    children: ReactNode;
    onLayoutChange: (layout: LayoutItem[]) => void;
    onDragStart: () => void;
    onDragStop: (layout: LayoutItem[]) => void;
  },
}));
vi.mock("react-grid-layout", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Responsive: (props: NonNullable<typeof grid.props>) => {
    grid.props = props;
    return <div>{props.children}</div>;
  },
  useContainerWidth: () => ({
    width: 820,
    mounted: true,
    containerRef: { current: null },
  }),
}));
vi.mock("@/components/widgets/WidgetCard", () => ({
  WidgetCard: () => <div>Clock</div>,
}));
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));
const initial: LayoutItem[] = [{ i: "clock", x: 0, y: 0, w: 2, h: 3 }];
beforeEach(() => {
  window.history.replaceState(null, "", "/admin");
  useDashboardStore.setState({
    editMode: true,
    currentBreakpoint: "lg",
    history: { past: [], future: [] },
    widgets: [
      {
        id: "clock",
        type: "clock",
        title: "",
        options: {},
        createdAt: "",
        updatedAt: "",
      },
    ],
    layouts: { lg: [], md: [], sm: initial, xs: [], xxs: [] },
  });
  useDashboardStore.setState({ dirty: false });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("uses container width and keeps generated layout adaptation out of draft history", () => {
  render(<DashboardCanvas />);
  expect(useDashboardStore.getState().currentBreakpoint).toBe("sm");
  act(() => grid.props!.onLayoutChange(initial));
  expect(useDashboardStore.getState().dirty).toBe(false);
  expect(useDashboardStore.getState().history.past).toHaveLength(0);
});

it("records one undo step for a complete movement gesture", () => {
  render(<DashboardCanvas />);
  const moved = [{ ...initial[0], x: 3 }];
  act(() => {
    grid.props!.onDragStart();
    grid.props!.onLayoutChange([{ ...initial[0], x: 1 }]);
    grid.props!.onLayoutChange([{ ...initial[0], x: 2 }]);
    grid.props!.onDragStop(moved);
  });
  expect(useDashboardStore.getState().layouts.sm[0].x).toBe(3);
  expect(useDashboardStore.getState().history.past).toHaveLength(1);
  expect(useDashboardStore.getState().dirty).toBe(true);
  act(() => {
    useDashboardStore.getState().undo();
  });
  expect(useDashboardStore.getState().layouts.sm[0].x).toBe(0);
});

it("ignores a gesture that ends without movement", () => {
  render(<DashboardCanvas />);
  act(() => {
    grid.props!.onDragStart();
    grid.props!.onDragStop(initial);
  });
  expect(useDashboardStore.getState().history.past).toHaveLength(0);
});

it("shows no editing entry for an empty public dashboard", () => {
  window.history.replaceState(null, "", "/");
  useDashboardStore.setState({
    editMode: false,
    widgets: [],
    readOnly: false,
    capabilitiesStatus: "ready",
  });
  render(<DashboardCanvas />);
  expect(
    screen.queryByRole("button", { name: "dashboard.startEditing" }),
  ).toBeNull();
});

it("lets an empty management dashboard open the widget panel", () => {
  useDashboardStore.setState({
    sidebarOpen: false,
    editMode: true,
    widgets: [],
    readOnly: false,
    capabilitiesStatus: "ready",
  });
  render(<DashboardCanvas />);
  fireEvent.click(
    screen.getByRole("button", { name: "dashboard.startEditing" }),
  );
  expect(useDashboardStore.getState().sidebarOpen).toBe(true);
});
