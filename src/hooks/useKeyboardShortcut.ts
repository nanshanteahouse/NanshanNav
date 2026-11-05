import { useEffect } from "react";
import { useDashboardStore } from "@/store";

/** True when the active element is a text input (should not intercept). */
function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return true;
  return (el as HTMLElement).isContentEditable === true;
}

export function useKeyboardShortcut() {
  const editMode = useDashboardStore((s) => s.editMode);
  const undo = useDashboardStore((s) => s.undo);
  const redo = useDashboardStore((s) => s.redo);
  const copyWidget = useDashboardStore((s) => s.copyWidget);
  const duplicateWidget = useDashboardStore((s) => s.duplicateWidget);
  const pasteWidget = useDashboardStore((s) => s.pasteWidget);
  const lastInteractedWidgetId = useDashboardStore(
    (s) => s.lastInteractedWidgetId,
  );
  const widgets = useDashboardStore((s) => s.widgets);
  const setWidgets = useDashboardStore((s) => s.setWidgets);
  const setLayouts = useDashboardStore((s) => s.setLayouts);
  const currentBreakpoint = useDashboardStore((s) => s.currentBreakpoint);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        (document.activeElement as HTMLElement | null)?.closest(
          '[role="dialog"]',
        )
      )
        return;
      const key = e.key.toLowerCase();
      // ── Ctrl/Meta shortcuts ──
      if (e.ctrlKey || e.metaKey) {
        // All other Ctrl+ shortcuts require edit mode and no focused input
        if (!editMode) return;
        if (isTextInput(document.activeElement)) return;

        switch (key) {
          case "z": {
            e.preventDefault();
            const result = e.shiftKey ? redo() : undo();
            if (result) {
              setWidgets(result.widgets);
              setLayouts(result.layouts);
            }
            break;
          }
          case "y": {
            e.preventDefault();
            const result = redo();
            if (result) {
              setWidgets(result.widgets);
              setLayouts(result.layouts);
            }
            break;
          }
          case "c": {
            if (lastInteractedWidgetId) {
              e.preventDefault();
              const widget = widgets.find(
                (w) => w.id === lastInteractedWidgetId,
              );
              if (widget) {
                copyWidget(widget);
              }
            }
            break;
          }
          case "v": {
            e.preventDefault();
            pasteWidget(currentBreakpoint);
            break;
          }
          case "d": {
            if (lastInteractedWidgetId) {
              e.preventDefault();
              duplicateWidget(lastInteractedWidgetId, currentBreakpoint);
            }
            break;
          }
        }
        return;
      }

      // ── Single key shortcuts ──
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    editMode,
    undo,
    redo,
    copyWidget,
    duplicateWidget,
    pasteWidget,
    lastInteractedWidgetId,
    widgets,
    setWidgets,
    setLayouts,
    currentBreakpoint,
  ]);
}
