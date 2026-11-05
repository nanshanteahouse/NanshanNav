/** @vitest-environment jsdom */
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { useDashboardStore } from "@/store";
const control = vi.hoisted(() => ({ fail: false }));
vi.mock("@/registry/loaders", () => ({
  getWidgetDisplayKey: () => "clock",
  loadWidgetComponent: async () => ({
    default: ({ width, height }: { width: number; height: number }) => {
      if (control.fail) throw new Error("temporary widget failure");
      return (
        <p>
          {width} × {height}
        </p>
      );
    },
  }),
}));
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/useElementSize", () => ({
  useElementSize: () => [() => {}, { width: 320, height: 180 }],
}));
vi.mock("@/components/widgets/WidgetSettings", () => ({ default: () => null }));
const widget = {
  id: "clock",
  type: "clock" as const,
  title: "Clock",
  options: {},
  createdAt: "",
  updatedAt: "",
};
beforeEach(() => {
  control.fail = false;
  useDashboardStore.setState({ editMode: false, widgets: [widget] });
});
afterEach(cleanup);

it("passes the measured content area to the widget", async () => {
  render(<WidgetCard widget={widget} />);
  expect(await screen.findByText("320 × 180")).toBeDefined();
});

it("retries a failed widget locally while retaining the dashboard", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  control.fail = true;
  render(<WidgetCard widget={widget} />);
  await screen.findByText("error.title");
  control.fail = false;
  fireEvent.click(screen.getByText("error.retry"));
  await waitFor(() => expect(screen.getByText("320 × 180")).toBeDefined());
  expect(useDashboardStore.getState().widgets).toHaveLength(1);
  error.mockRestore();
});
