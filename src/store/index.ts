import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SettingsSlice } from "@/store/slices/settingsSlice.ts";
import { createSettingsSlice } from "@/store/slices/settingsSlice.ts";
import type { LayoutSlice } from "@/store/slices/layoutSlice.ts";
import { createLayoutSlice } from "@/store/slices/layoutSlice.ts";
import type { WidgetSlice } from "@/store/slices/widgetSlice.ts";
import { createWidgetSlice } from "@/store/slices/widgetSlice.ts";
import type { UiSlice } from "@/store/slices/uiSlice.ts";
import { createUiSlice } from "@/store/slices/uiSlice.ts";
import type { ClipboardSlice } from "@/store/slices/clipboardSlice.ts";
import { createClipboardSlice } from "@/store/slices/clipboardSlice.ts";
import type { HistorySlice } from "@/store/slices/historySlice.ts";
import { createHistorySlice } from "@/store/slices/historySlice.ts";
import { STORAGE_KEY } from "@/lib/constants.ts";
import { isAdminPath } from "@/lib/management";
import { parseDashboard } from "@/lib/dashboard-schema";
import type { DashboardDocument } from "@/lib/dashboard-schema";

export type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";
export interface SyncSlice {
  dirty: boolean;
  changeSequence: number;
  revision: string | null;
  saveStatus: SaveStatus;
  syncError: string | null;
  readOnly: boolean;
  capabilitiesStatus: "loading" | "ready" | "error";
  recoveryNotice: string | null;
  serverRecovery: boolean;
  setGeneratedLayouts: (layouts: DashboardState["layouts"]) => void;
  replaceDashboard: (
    value: unknown,
    source?: "server" | "import",
    revision?: string | null,
  ) => void;
}
export type DashboardState = SettingsSlice &
  UiSlice &
  LayoutSlice &
  WidgetSlice &
  ClipboardSlice &
  HistorySlice &
  SyncSlice;

// Quarantine a corrupt payload before Zustand can merge it into the live store.
let recoveryNotice: string | null = null;
if (typeof localStorage !== "undefined" && isAdminPath()) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        parseDashboard(JSON.parse(saved).state);
      } catch {
        const recoveryKey = `${STORAGE_KEY}-recovery-${Date.now()}`;
        localStorage.setItem(recoveryKey, saved);
        localStorage.removeItem(STORAGE_KEY);
        recoveryNotice = recoveryKey;
      }
    }
  } catch {
    recoveryNotice = "Browser storage is unavailable";
  }
}
let applyingServerState = false;
let reportStorageIssue = () => {
  recoveryNotice =
    "Browser storage is full or unavailable. Export your draft before leaving.";
};
const browserStorage = {
  getItem: (name: string) => {
    try {
      return isAdminPath() ? localStorage.getItem(name) : null;
    } catch {
      reportStorageIssue();
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (isAdminPath()) localStorage.setItem(name, value);
    } catch {
      reportStorageIssue();
    }
  },
  removeItem: (name: string) => {
    try {
      if (isAdminPath()) localStorage.removeItem(name);
    } catch {
      reportStorageIssue();
    }
  },
};
export function dashboardDocument(
  state: Pick<DashboardState, "settings" | "layouts" | "widgets">,
): DashboardDocument {
  return {
    schemaVersion: 1,
    settings: state.settings,
    layouts: state.layouts,
    widgets: state.widgets,
  };
}
export const useDashboardStore = create<DashboardState>()(
  persist<
    DashboardState,
    [],
    [],
    DashboardDocument & Pick<DashboardState, "dirty" | "revision">
  >(
    (...args) => {
      const [set, get] = args;
      return {
        ...createSettingsSlice(...args),
        ...createUiSlice(...args),
        ...createLayoutSlice(...args),
        ...createWidgetSlice(...args),
        ...createClipboardSlice(...args),
        ...createHistorySlice(...args),
        dirty: false,
        changeSequence: 0,
        revision: null,
        saveStatus: "idle",
        syncError: null,
        readOnly: true,
        capabilitiesStatus: "loading",
        recoveryNotice,
        serverRecovery: false,
        setGeneratedLayouts: (layouts) => {
          applyingServerState = true;
          try {
            set({ layouts });
          } finally {
            applyingServerState = false;
          }
        },
        replaceDashboard: (value, source = "import", revision = null) => {
          const doc = parseDashboard(value);
          const state = get();
          if (source === "import") {
            state.pushSnapshot({ ...dashboardDocument(state) });
            set({
              ...doc,
              dirty: true,
              changeSequence: state.changeSequence + 1,
              syncError: null,
            });
          } else {
            applyingServerState = true;
            try {
              set({
                ...doc,
                revision,
                dirty: false,
                serverRecovery: false,
                saveStatus: "idle",
                syncError: null,
                history: { past: [], future: [] },
              });
            } finally {
              applyingServerState = false;
            }
          }
        },
      };
    },
    {
      name: STORAGE_KEY,
      storage:
        typeof localStorage === "undefined"
          ? undefined
          : createJSONStorage(() => browserStorage),
      partialize: (state) => ({
        ...dashboardDocument(state),
        dirty: state.dirty,
        revision: state.revision,
      }),
      merge: (persisted: unknown, current: DashboardState): DashboardState => {
        if (persisted == null) return current;
        try {
          const doc = parseDashboard(persisted);
          const metadata = persisted as Record<string, unknown>;
          return {
            ...current,
            ...doc,
            dirty: metadata.dirty !== false,
            revision:
              typeof metadata.revision === "string" ? metadata.revision : null,
          };
        } catch {
          return {
            ...current,
            recoveryNotice: recoveryNotice ?? "Invalid saved draft was ignored",
          };
        }
      },
    },
  ),
);
// Every document mutation participates, including existing slice actions and keyboard undo.
useDashboardStore.subscribe((state, previous) => {
  if (
    (typeof window !== "undefined" && !isAdminPath()) ||
    applyingServerState ||
    (state.settings === previous.settings &&
      state.widgets === previous.widgets &&
      state.layouts === previous.layouts)
  )
    return;
  if (
    JSON.stringify(dashboardDocument(state)) ===
    JSON.stringify(dashboardDocument(previous))
  )
    return;
  if (state.changeSequence === previous.changeSequence)
    useDashboardStore.setState({
      dirty: true,
      changeSequence: previous.changeSequence + 1,
      saveStatus: "idle",
    });
});

reportStorageIssue = () => {
  const notice =
    "Browser storage is full or unavailable. Export your draft before leaving.";
  if (useDashboardStore.getState().recoveryNotice !== notice)
    useDashboardStore.setState({ recoveryNotice: notice });
};
