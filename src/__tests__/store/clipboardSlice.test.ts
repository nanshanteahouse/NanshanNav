import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '@/store/index'
import type { WidgetConfig } from '@/types'

describe('clipboardSlice', () => {
  beforeEach(() => {
    useDashboardStore.setState({ clipboard: null })
  })

  it('should start with null clipboard', () => {
    expect(useDashboardStore.getState().clipboard).toBeNull()
  })

  it('should copy widget to clipboard', () => {
    const widget: WidgetConfig = {
      id: 'test-1',
      type: 'clock',
      title: 'My Clock',
      options: { displayMode: 'digital' },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    useDashboardStore.getState().copyWidget(widget)

    const clipboard = useDashboardStore.getState().clipboard
    expect(clipboard).not.toBeNull()
    expect(clipboard!.id).toBe('test-1')
    expect(clipboard!.type).toBe('clock')
    expect(clipboard!.title).toBe('My Clock')
  })

  it('should deep-clone on copy (original mutation does not affect clipboard)', () => {
    const widget: WidgetConfig = {
      id: 'test-2',
      type: 'search-box',
      title: 'Original Title',
      options: { defaultEngine: 'google' },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    useDashboardStore.getState().copyWidget(widget)

    // Mutate the original
    widget.title = 'Mutated Title'

    const clipboard = useDashboardStore.getState().clipboard
    expect(clipboard!.title).toBe('Original Title')
  })

  it('should clear clipboard', () => {
    const widget: WidgetConfig = {
      id: 'test-3',
      type: 'clock',
      title: 'To Clear',
      options: {},
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    useDashboardStore.getState().copyWidget(widget)
    expect(useDashboardStore.getState().clipboard).not.toBeNull()

    useDashboardStore.getState().clearClipboard()
    expect(useDashboardStore.getState().clipboard).toBeNull()
  })

  it('should overwrite previous clipboard contents on new copy', () => {
    const widget1: WidgetConfig = {
      id: 'first',
      type: 'clock',
      title: 'First Widget',
      options: {},
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const widget2: WidgetConfig = {
      id: 'second',
      type: 'title-header',
      title: 'Second Widget',
      options: { headingLevel: 'h1' },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    useDashboardStore.getState().copyWidget(widget1)
    expect(useDashboardStore.getState().clipboard!.id).toBe('first')

    useDashboardStore.getState().copyWidget(widget2)
    expect(useDashboardStore.getState().clipboard!.id).toBe('second')
    expect(useDashboardStore.getState().clipboard!.title).toBe('Second Widget')
  })
})
