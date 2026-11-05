import { useEffect, useRef, type RefObject } from "react";

const dialogStack: HTMLElement[] = [];
const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared focus and scroll management for dialogs and mobile drawers. */
export function useDialogFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialogStack.push(dialog);
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => {
        if (
          el.tabIndex < 0 ||
          el.closest("[hidden], [inert]") ||
          el.getAttribute("aria-hidden") === "true" ||
          el.getAttribute("type") === "hidden"
        )
          return false;
        for (
          let current: HTMLElement | null = el;
          current;
          current = current.parentElement
        ) {
          const style = window.getComputedStyle(current);
          if (style.display === "none" || style.visibility === "hidden")
            return false;
          if (current === dialog) break;
        }
        return true;
      });
    const autofocus = dialog.querySelector<HTMLElement>(
      "[autofocus], [data-autofocus]",
    );
    const focusedChild = dialog.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : null;
    (autofocus ?? focusedChild ?? focusable()[0] ?? dialog).focus();

    const handleKey = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const handleFocus = (event: FocusEvent) => {
      if (
        dialogStack.at(-1) === dialog &&
        !dialog.contains(event.target as Node)
      ) {
        (focusable()[0] ?? dialog).focus();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      document.removeEventListener("focusin", handleFocus);
      dialogStack.splice(dialogStack.indexOf(dialog), 1);
      document.body.style.overflow = dialogStack.length
        ? "hidden"
        : previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, ref]);
}
