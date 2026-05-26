import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '@/store/index'
import type { WidgetConfig } from '@/types'

describe('widgetSlice', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      widgets: [] as WidgetConfig[],
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
})
