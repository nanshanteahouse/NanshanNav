/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBoxWidget from "@/components/widgets/SearchBoxWidget";

const mockStore = {
  editMode: false,
  widgets: [] as {
    id: string;
    title: string;
    type: string;
    options: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }[],
};

vi.mock("@/store/index", () => ({
  useDashboardStore: Object.assign(
    (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
    { getState: () => mockStore },
  ),
}));

vi.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const widgetProps = {
  widgetId: "test-sb-1",
  options: {
    defaultEngine: "google",
    placeholder: "Search...",
    enableLocalSearch: false,
  },
  isEditMode: false,
  width: 400,
  height: 100,
};

describe("SearchBoxWidget - edit mode guards", () => {
  let hrefSetter: (v: string) => void;

  beforeEach(() => {
    mockStore.widgets = [];
    hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      value: {
        get href() {
          return "";
        },
        set href(v: string) {
          hrefSetter(v);
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should suppress navigation when search button is clicked in edit mode", async () => {
    mockStore.editMode = true;
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />);

    const input = screen.getByPlaceholderText("Search...");
    await userEvent.type(input, "test query");

    const searchButton = screen.getByRole("button", { name: "common.search" });
    await userEvent.click(searchButton);

    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it("should suppress navigation when Enter key is pressed in edit mode", async () => {
    mockStore.editMode = true;
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />);

    const input = screen.getByPlaceholderText("Search...");
    await userEvent.type(input, "test query");

    await userEvent.keyboard("{Enter}");

    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it("should still allow typing in input in edit mode", async () => {
    mockStore.editMode = true;
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    await userEvent.type(input, "hello");

    expect(input.value).toBe("hello");
  });

  it("should navigate on search button click in view mode", async () => {
    mockStore.editMode = false;
    render(<SearchBoxWidget {...widgetProps} isEditMode={false} />);

    const input = screen.getByPlaceholderText("Search...");
    await userEvent.type(input, "test query");

    const searchButton = screen.getByRole("button", { name: "common.search" });
    await userEvent.click(searchButton);

    expect(hrefSetter).toHaveBeenCalledWith(
      "https://www.google.com/search?q=test%20query",
    );
  });
  it("Enter on a local result navigates exactly once", async () => {
    mockStore.widgets = [
      {
        id: "links",
        type: "web-link",
        title: "",
        createdAt: "",
        updatedAt: "",
        options: {
          links: [
            {
              id: "nas",
              name: "NAS",
              url: "https://nas.example/",
              description: "",
              tags: ["storage"],
            },
          ],
        },
      },
    ];
    render(
      <SearchBoxWidget
        {...widgetProps}
        options={{ ...widgetProps.options, enableLocalSearch: true }}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText("Search..."), "storage");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(hrefSetter).toHaveBeenCalledTimes(1);
    expect(hrefSetter).toHaveBeenCalledWith("https://nas.example/");
  });

  it("keeps a configured custom engine selectable after switching away", async () => {
    render(
      <SearchBoxWidget
        {...widgetProps}
        options={{
          ...widgetProps.options,
          defaultEngine: "custom",
          customEngineUrl: "https://search.example/?q={query}",
        }}
      />,
    );
    const select = screen.getByRole("combobox", {
      name: "widget.searchBox.defaultEngine",
    });
    await userEvent.selectOptions(select, "google");
    await userEvent.selectOptions(select, "custom");
    await userEvent.type(
      screen.getByPlaceholderText("Search..."),
      "test{Enter}",
    );
    expect(hrefSetter).toHaveBeenCalledWith("https://search.example/?q=test");
  });

  it("uses a changed default engine immediately", async () => {
    const { rerender } = render(<SearchBoxWidget {...widgetProps} />);
    rerender(
      <SearchBoxWidget
        {...widgetProps}
        options={{ ...widgetProps.options, defaultEngine: "bing" }}
      />,
    );
    await userEvent.type(
      screen.getByPlaceholderText("Search..."),
      "test{Enter}",
    );
    expect(hrefSetter).toHaveBeenCalledWith(
      "https://www.bing.com/search?q=test",
    );
  });

  it("does not navigate while Enter confirms an IME composition", () => {
    render(<SearchBoxWidget {...widgetProps} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "中文" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it("resets a manual engine choice after a default round trip", async () => {
    const { rerender } = render(<SearchBoxWidget {...widgetProps} />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "widget.searchBox.defaultEngine" }),
      "bing",
    );
    rerender(
      <SearchBoxWidget
        {...widgetProps}
        options={{ ...widgetProps.options, defaultEngine: "bing" }}
      />,
    );
    rerender(<SearchBoxWidget {...widgetProps} />);
    expect(
      (
        screen.getByRole("combobox", {
          name: "widget.searchBox.defaultEngine",
        }) as HTMLSelectElement
      ).value,
    ).toBe("google");
  });
});
