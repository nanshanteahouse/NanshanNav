import type { StateCreator } from 'zustand';
import type { WidgetConfig } from '@/types/widget.ts';

export interface ClipboardSlice {
  clipboard: WidgetConfig | null;
  copyWidget: (widget: WidgetConfig) => void;
  clearClipboard: () => void;
}

export const createClipboardSlice: StateCreator<ClipboardSlice, [], []> = (
  set,
) => ({
  clipboard: null,
  copyWidget: (widget) =>
    set({ clipboard: JSON.parse(JSON.stringify(widget)) as WidgetConfig }),
  clearClipboard: () => set({ clipboard: null }),
});
