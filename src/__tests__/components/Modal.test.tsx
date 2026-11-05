/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "@/components/ui/modal";
vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);

describe("Modal keyboard flow", () => {
  it("names the dialog, traps focus in both directions and restores the trigger", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open onClose={onClose} title="Widget settings">
        <input aria-label="Title" />
        <button>Last</button>
      </Modal>,
    );
    expect(
      screen.getByRole("dialog", { name: "Widget settings" }),
    ).toBeDefined();
    const close = screen.getByLabelText("common.close");
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText("Last"));
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Modal open={false} onClose={onClose} title="Widget settings">
        <input />
      </Modal>,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("keeps the focus trap stable when the close callback changes", () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Settings">
        <input aria-label="Name" />
      </Modal>,
    );
    const input = screen.getByLabelText("Name");
    input.focus();
    rerender(
      <Modal open onClose={() => {}} title="Settings">
        <input aria-label="Name" />
      </Modal>,
    );
    expect(document.activeElement).toBe(input);
  });
});
