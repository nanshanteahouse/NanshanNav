/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardToolbar } from '@/components/layout/DashboardToolbar'

const mockUndo = vi.fn<(...args: any[]) => any>(() => null)
const mockRedo = vi.fn<(...args: any[]) => any>(() => null)
const mockSetWidgets = vi.fn()
const mockSetLayouts = vi.fn()

interface MockStore {
  editMode: boolean
  sidebarOpen: boolean
  history: { past: unknown[]; future: unknown[] }
  settings: { dashboardTitle: string; glassEnabled: boolean; glassBlur: number }
  updateSettings: ReturnType<typeof vi.fn>
  toggleSidebar: ReturnType<typeof vi.fn>
  undo: typeof mockUndo
  redo: typeof mockRedo
  setWidgets: typeof mockSetWidgets
  setLayouts: typeof mockSetLayouts
}

const defaults: MockStore = {
  editMode: false,
  sidebarOpen: false,
  history: { past: [], future: [] },
  settings: { dashboardTitle: 'Test Dashboard', glassEnabled: false, glassBlur: 0 },
  updateSettings: vi.fn(),
  toggleSidebar: vi.fn(),
  undo: mockUndo,
  redo: mockRedo,
  setWidgets: mockSetWidgets,
  setLayouts: mockSetLayouts,
}

function buildStore(overrides: Partial<MockStore> = {}): MockStore {
  return { ...defaults, ...overrides, settings: { ...defaults.settings, ...(overrides.settings ?? {}) } }
}

/** Reference that the mocked module reads */
let currentStore: MockStore = buildStore()

vi.mock('@/store/index', () => {
  const useDashboardStore = (selector: (s: MockStore) => unknown) => selector(currentStore)
  useDashboardStore.getState = () => currentStore
  return { useDashboardStore }
})

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.toolbar': 'Toolbar',
        'toolbar.toggleWidgetPanel': 'Toggle widget panel',
        'toolbar.cellSize': 'Cell size',
        'toolbar.showGridLines': 'Show grid lines',
        'toolbar.editMode': 'Edit mode',
        'toolbar.exportImport': 'Export/Import',
        'toolbar.undo': 'Undo',
        'toolbar.redo': 'Redo',
        'toolbar.colorPalette': 'Color palette',
        'toolbar.moreOptions': 'More options',
      }
      return map[key] ?? key
    },
    locale: 'zh-CN',
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/components/common/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}))

vi.mock('@/components/common/EditModeToggle', () => ({
  EditModeToggle: () => <div data-testid="edit-mode-toggle">Edit Mode</div>,
}))

vi.mock('@/components/common/CellSizeSlider', () => ({
  CellSizeSlider: () => <div data-testid="cell-size-slider">Cell Size</div>,
}))

vi.mock('@/components/common/GridLinesToggle', () => ({
  GridLinesToggle: () => <div data-testid="grid-lines-toggle">Grid Lines</div>,
}))

vi.mock('@/components/common/ExportImportButtons', () => ({
  ExportImportButtons: () => <div data-testid="export-import">Export/Import</div>,
}))

vi.mock('@/components/common/LanguageSelect', () => ({
  LanguageSelect: () => <div data-testid="language-select">Language</div>,
}))

vi.mock('@/components/common/ColorThemeEditor', () => ({
  ColorThemeEditor: () => <div data-testid="color-theme-editor">Color Editor</div>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="title-input" {...props} />
  ),
}))

function renderToolbar() {
  return render(<DashboardToolbar />)
}

describe('DashboardToolbar - Undo/Redo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentStore = buildStore()
  })

  describe('visibility by editMode', () => {
    it('should NOT render undo/redo buttons when editMode is false', () => {
      currentStore = buildStore({ editMode: false })
      renderToolbar()
      expect(screen.queryByLabelText('Undo')).toBeNull()
      expect(screen.queryByLabelText('Redo')).toBeNull()
    })

    it('should render undo/redo buttons in desktop section when editMode is true', () => {
      currentStore = buildStore({ editMode: true })
      renderToolbar()
      expect(screen.getAllByLabelText('Undo').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByLabelText('Redo').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('disabled state', () => {
    it('should disable undo when history.past is empty', () => {
      currentStore = buildStore({
        editMode: true,
        history: { past: [], future: [] },
      })
      renderToolbar()
      const btns = screen.getAllByLabelText('Undo')
      btns.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true)
      })
    })

    it('should enable undo when history.past is not empty', () => {
      currentStore = buildStore({
        editMode: true,
        history: {
          past: [{ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }],
          future: [],
        },
      })
      renderToolbar()
      const btns = screen.getAllByLabelText('Undo')
      btns.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false)
      })
    })

    it('should disable redo when history.future is empty', () => {
      currentStore = buildStore({
        editMode: true,
        history: { past: [], future: [] },
      })
      renderToolbar()
      const btns = screen.getAllByLabelText('Redo')
      btns.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true)
      })
    })

    it('should enable redo when history.future is not empty', () => {
      currentStore = buildStore({
        editMode: true,
        history: {
          past: [],
          future: [{ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }],
        },
      })
      renderToolbar()
      const btns = screen.getAllByLabelText('Redo')
      btns.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false)
      })
    })
  })

  describe('click handlers', () => {
    it('should call undo and restore snapshot when undo button is clicked', () => {
      const snapshot = {
        widgets: [{ id: 'w1', type: 'clock' as const, title: 'Clock', options: {}, createdAt: '', updatedAt: '' }],
        layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      }
      mockUndo.mockReturnValue(snapshot)

      currentStore = buildStore({
        editMode: true,
        history: { past: [snapshot], future: [] },
      })
      renderToolbar()

      fireEvent.click(screen.getAllByLabelText('Undo')[0])

      expect(mockUndo).toHaveBeenCalledTimes(1)
      expect(mockSetWidgets).toHaveBeenCalledWith(snapshot.widgets)
      expect(mockSetLayouts).toHaveBeenCalledWith(snapshot.layouts)
    })

    it('should call redo and restore snapshot when redo button is clicked', () => {
      const snapshot = {
        widgets: [{ id: 'w2', type: 'clock' as const, title: 'Clock', options: {}, createdAt: '', updatedAt: '' }],
        layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      }
      mockRedo.mockReturnValue(snapshot)

      currentStore = buildStore({
        editMode: true,
        history: { past: [], future: [snapshot] },
      })
      renderToolbar()

      fireEvent.click(screen.getAllByLabelText('Redo')[0])

      expect(mockRedo).toHaveBeenCalledTimes(1)
      expect(mockSetWidgets).toHaveBeenCalledWith(snapshot.widgets)
      expect(mockSetLayouts).toHaveBeenCalledWith(snapshot.layouts)
    })

    it('should handle null return from undo gracefully (no crash)', () => {
      mockUndo.mockReturnValue(null)

      currentStore = buildStore({
        editMode: true,
        history: {
          past: [{ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }],
          future: [],
        },
      })
      renderToolbar()

      fireEvent.click(screen.getAllByLabelText('Undo')[0])

      expect(mockUndo).toHaveBeenCalledTimes(1)
      expect(mockSetWidgets).not.toHaveBeenCalled()
      expect(mockSetLayouts).not.toHaveBeenCalled()
    })

    it('should handle null return from redo gracefully (no crash)', () => {
      mockRedo.mockReturnValue(null)

      currentStore = buildStore({
        editMode: true,
        history: {
          past: [],
          future: [{ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }],
        },
      })
      renderToolbar()

      fireEvent.click(screen.getAllByLabelText('Redo')[0])

      expect(mockRedo).toHaveBeenCalledTimes(1)
      expect(mockSetWidgets).not.toHaveBeenCalled()
      expect(mockSetLayouts).not.toHaveBeenCalled()
    })
  })

  describe('mobile menu', () => {
    it('should include undo/redo buttons in mobile dropdown when editMode is true and menu is open', () => {
      currentStore = buildStore({
        editMode: true,
        history: {
          past: [{ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }],
          future: [],
        },
      })
      renderToolbar()

      fireEvent.click(screen.getByLabelText('More options'))

      expect(screen.getAllByLabelText('Undo').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByLabelText('Redo').length).toBeGreaterThanOrEqual(2)
    })
  })
})
