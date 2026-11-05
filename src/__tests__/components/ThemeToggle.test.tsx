/** @vitest-environment jsdom */
import { it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useDashboardStore } from "@/store";
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);
it("exposes all theme choices and labels the currently selected value", () => {
  useDashboardStore.getState().setThemeMode("dark");
  render(<ThemeToggle />);
  const select = screen.getByRole("combobox", {
    name: "toolbar.theme",
  }) as HTMLSelectElement;
  expect(select.value).toBe("dark");
  expect(select.options).toHaveLength(3);
  fireEvent.change(select, { target: { value: "system" } });
  expect(useDashboardStore.getState().settings.themeMode).toBe("system");
});
