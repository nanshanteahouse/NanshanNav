import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '@/store/index'
import type { WidgetConfig } from '@/types'

describe('widgetSlice', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      widgets: [] as WidgetConfig[],
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      clipboard: null,
    })
  })

  it('should start with an empty widget list', () => {
    expect(useDashboardStore.getState().widgets).toEqual([])
  })

  it('should add a widget with generated id and timestamps', () => {
    const id = useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'Test Clock',
      options: { displayMode: 'digital' },
    })

    const widgets = useDashboardStore.getState().widgets
    expect(widgets).toHaveLength(1)
    expect(widgets[0].id).toBe(id)
    expect(widgets[0].type).toBe('clock')
    expect(widgets[0].title).toBe('Test Clock')
    expect(widgets[0].createdAt).toBeDefined()
    expect(widgets[0].updatedAt).toBeDefined()
    expect(widgets[0].createdAt).toBe(widgets[0].updatedAt)
  })

  it('should add multiple widgets with unique ids', () => {
    const id1 = useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'Clock 1',
      options: {},
    })
    const id2 = useDashboardStore.getState().addWidget({
      type: 'search-box',
      title: 'Search',
      options: {},
    })

    expect(id1).not.toBe(id2)
    expect(useDashboardStore.getState().widgets).toHaveLength(2)
  })

  it('should update a widget title', () => {
    const id = useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'Old Title',
      options: {},
    })

    useDashboardStore.getState().updateWidget(id, { title: 'New Title' })

    const widget = useDashboardStore.getState().widgets.find(w => w.id === id)
    expect(widget?.title).toBe('New Title')
  })

  it('should set updatedAt when modifying a widget', async () => {
    const id = useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'Test',
      options: {},
    })

    const original = useDashboardStore.getState().widgets.find(w => w.id === id)
    expect(original!.createdAt).toBeDefined()
    expect(original!.updatedAt).toBeDefined()

    // Ensure next timestamp differs from creation time
    await new Promise((r) => setTimeout(r, 5))

    useDashboardStore.getState().updateWidget(id, { title: 'Changed' })

    const updated = useDashboardStore.getState().widgets.find(w => w.id === id)
    expect(updated!.title).toBe('Changed')
    expect(updated!.updatedAt).toBeDefined()
    expect(updated!.updatedAt).not.toBe(original!.updatedAt)
  })

  it('should remove a widget by id', () => {
    const id = useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'To Remove',
      options: {},
    })
    expect(useDashboardStore.getState().widgets).toHaveLength(1)

    useDashboardStore.getState().removeWidget(id)

    expect(useDashboardStore.getState().widgets).toHaveLength(0)
  })

  it('should not fail when removing a non-existent widget', () => {
    useDashboardStore.getState().addWidget({
      type: 'clock',
      title: 'Keep',
      options: {},
    })
    useDashboardStore.getState().removeWidget('nonexistent-id')
    expect(useDashboardStore.getState().widgets).toHaveLength(1)
  })

  describe('pasteWidget', () => {
    const clipboardWidget: WidgetConfig = {
      id: 'clipboard-id',
      type: 'clock',
      title: 'Pasted Clock',
      options: { displayMode: 'digital' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('should paste widget from clipboard and return new id', () => {
      useDashboardStore.getState().copyWidget(clipboardWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')
      expect(newId).toBeTruthy()
      expect(newId).not.toBe('clipboard-id')

      const widgets = useDashboardStore.getState().widgets
      expect(widgets).toHaveLength(1)
      expect(widgets[0].id).toBe(newId)
      expect(widgets[0].type).toBe('clock')
      expect(widgets[0].title).toBe('Pasted Clock')
      expect(widgets[0].options).toEqual({ displayMode: 'digital' })
    })

    it('should return null when clipboard is null', () => {
      useDashboardStore.getState().clearClipboard()

      const result = useDashboardStore.getState().pasteWidget('lg')
      expect(result).toBeNull()
      expect(useDashboardStore.getState().widgets).toHaveLength(0)
    })

    it('should generate fresh id and timestamps', () => {
      useDashboardStore.getState().copyWidget(clipboardWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')
      expect(newId).not.toBe('clipboard-id')

      const pasted = useDashboardStore.getState().widgets.find(w => w.id === newId)
      expect(pasted).toBeDefined()
      expect(pasted!.createdAt).not.toBe('2024-01-01T00:00:00.000Z')
      expect(pasted!.updatedAt).not.toBe('2024-01-01T00:00:00.000Z')
      expect(pasted!.createdAt).toBe(pasted!.updatedAt)
    })

    it('should deep-clone options from clipboard', () => {
      useDashboardStore.getState().copyWidget(clipboardWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')

      const clipboard = useDashboardStore.getState().clipboard!
      clipboard.options.displayMode = 'analog'
      clipboard.options.newField = 'should not appear'

      const pasted = useDashboardStore.getState().widgets.find(w => w.id === newId)
      expect(pasted!.options.displayMode).toBe('digital')
      expect(pasted!.options).not.toHaveProperty('newField')
    })

    it('should create layout entry at x=0 below existing items', () => {
      const existId = useDashboardStore.getState().addWidget({
        type: 'clock',
        title: 'Existing',
        options: {},
      })
      useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
        { i: existId, x: 0, y: 0, w: 4, h: 4 },
      ])

      useDashboardStore.getState().copyWidget(clipboardWidget)
      const newId = useDashboardStore.getState().pasteWidget('lg')

      const layouts = useDashboardStore.getState().layouts
      expect(layouts.lg).toHaveLength(2)
      const pastedLayout = layouts.lg.find(l => l.i === newId)
      expect(pastedLayout).toBeDefined()
      expect(pastedLayout!.x).toBe(0)
      expect(pastedLayout!.y).toBe(1)
      expect(pastedLayout!.w).toBe(4)
      expect(pastedLayout!.h).toBe(4)
      expect(layouts.md).toHaveLength(0)
      expect(layouts.sm).toHaveLength(0)
      expect(layouts.xs).toHaveLength(0)
      expect(layouts.xxs).toHaveLength(0)
    })
  })

  it('should set widgets from an external source', () => {
    const existing: WidgetConfig[] = [
      {
        id: 'pre-existing-1',
        type: 'title-header',
        title: 'Imported',
        options: {},
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    useDashboardStore.getState().setWidgets(existing)
    expect(useDashboardStore.getState().widgets).toHaveLength(1)
    expect(useDashboardStore.getState().widgets[0].id).toBe('pre-existing-1')
  })

  describe('pasteWidget', () => {
    it('should return null when clipboard is empty', () => {
      const result = useDashboardStore.getState().pasteWidget('lg')
      expect(result).toBeNull()
    })

    it('should paste widget from clipboard and return new id', () => {
      const origWidget: WidgetConfig = {
        id: 'test-1',
        type: 'clock',
        title: 'Clock',
        options: { displayMode: 'digital' },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      useDashboardStore.getState().copyWidget(origWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')

      expect(newId).not.toBeNull()
      expect(newId).not.toBe(origWidget.id)
      expect(useDashboardStore.getState().widgets).toHaveLength(1)
      expect(useDashboardStore.getState().widgets[0].id).toBe(newId)
    })

    it('should create deep-cloned copy with same type and options but fresh id and timestamps', () => {
      const origWidget: WidgetConfig = {
        id: 'test-1',
        type: 'clock',
        title: 'Clock',
        options: { displayMode: 'digital', alarmEnabled: true },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      useDashboardStore.getState().copyWidget(origWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')!
      const pasted = useDashboardStore.getState().widgets.find(w => w.id === newId)!

      expect(pasted.id).not.toBe(origWidget.id)
      expect(pasted.type).toBe(origWidget.type)
      expect(pasted.title).toBe(origWidget.title)
      expect(pasted.options).toEqual(origWidget.options)
      expect(pasted.createdAt).not.toBe(origWidget.createdAt)
      expect(pasted.updatedAt).not.toBe(origWidget.updatedAt)
    })

    it('should add layout entry to current breakpoint at computed position', () => {
      const origWidget: WidgetConfig = {
        id: 'test-1',
        type: 'clock',
        title: 'Clock',
        options: {},
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      useDashboardStore.getState().copyWidget(origWidget)

      // Pre-populate layout with two items
      useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
        { i: 'existing-1', x: 0, y: 0, w: 6, h: 4 },
        { i: 'existing-2', x: 6, y: 0, w: 6, h: 3 },
      ])

      const newId = useDashboardStore.getState().pasteWidget('lg')!

      const layouts = useDashboardStore.getState().layouts
      expect(layouts.lg).toHaveLength(3)

      const pastedLayout = layouts.lg.find(l => l.i === newId)
      expect(pastedLayout).toBeDefined()
      expect(pastedLayout!.x).toBe(0)
      // max(l.y) = max(0, 0) = 0, so y = 0 + 1 = 1
      expect(pastedLayout!.y).toBe(1)
      // Clock default size: w=4, h=4
      expect(pastedLayout!.w).toBe(4)
      expect(pastedLayout!.h).toBe(4)

      // Other breakpoints remain empty
      expect(layouts.md).toHaveLength(0)
      expect(layouts.sm).toHaveLength(0)
      expect(layouts.xs).toHaveLength(0)
      expect(layouts.xxs).toHaveLength(0)
    })

    it('should place pasted widget at y=0 when breakpoint layout is empty', () => {
      const origWidget: WidgetConfig = {
        id: 'test-1',
        type: 'clock',
        title: 'Clock',
        options: {},
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      useDashboardStore.getState().copyWidget(origWidget)

      const newId = useDashboardStore.getState().pasteWidget('lg')!

      const layouts = useDashboardStore.getState().layouts
      expect(layouts.lg).toHaveLength(1)

      const pastedLayout = layouts.lg.find(l => l.i === newId)!
      expect(pastedLayout.y).toBe(0)
      expect(pastedLayout.x).toBe(0)
    })
  })

  describe('duplicateWidget', () => {
    it('should duplicate widget with new id', () => {
      const origId = useDashboardStore.getState().addWidget({
        type: 'clock',
        title: 'Clock',
        options: { displayMode: 'digital' },
      })

      useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
        { i: origId, x: 0, y: 0, w: 4, h: 4 },
      ])

      const newId = useDashboardStore.getState().duplicateWidget(origId, 'lg')

      expect(newId).not.toBe(origId)
      expect(newId).toBeTruthy()
      expect(useDashboardStore.getState().widgets).toHaveLength(2)
    })

    it('should deep-clone options', () => {
      const origId = useDashboardStore.getState().addWidget({
        type: 'clock',
        title: 'Clock',
        options: { displayMode: 'digital', alarmEnabled: true },
      })

      useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
        { i: origId, x: 0, y: 0, w: 4, h: 4 },
      ])

      const newId = useDashboardStore.getState().duplicateWidget(origId, 'lg')

      // Mutate original options to verify deep clone
      const orig = useDashboardStore.getState().widgets.find(w => w.id === origId)!
      orig.options.displayMode = 'analog'
      orig.options.newField = 'should not appear in duplicate'

      const dup = useDashboardStore.getState().widgets.find(w => w.id === newId)!
      expect(dup.options.displayMode).toBe('digital')
      expect(dup.options).not.toHaveProperty('newField')
      expect(dup.options.alarmEnabled).toBe(true)
    })

    it('should create layout entry for the current breakpoint only', () => {
      const origId = useDashboardStore.getState().addWidget({
        type: 'clock',
        title: 'Clock',
        options: {},
      })

      useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
        { i: origId, x: 0, y: 0, w: 4, h: 4 },
      ])

      const newId = useDashboardStore.getState().duplicateWidget(origId, 'lg')

      // Layout should have 2 entries (original + duplicate)
      const layouts = useDashboardStore.getState().layouts
      expect(layouts.lg).toHaveLength(2)

      // Duplicate entry exists
      const newLayout = layouts.lg.find(l => l.i === newId)
      expect(newLayout).toBeDefined()

      // Position offset: x+2, y+2
      expect(newLayout!.x).toBe(2)
      expect(newLayout!.y).toBe(2)

      // Other breakpoints remain empty
      expect(layouts.md).toHaveLength(0)
      expect(layouts.sm).toHaveLength(0)
      expect(layouts.xs).toHaveLength(0)
      expect(layouts.xxs).toHaveLength(0)
    })
  })
})
