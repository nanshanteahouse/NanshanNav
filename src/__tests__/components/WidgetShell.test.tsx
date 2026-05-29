/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetShell } from '@/components/widgets/WidgetShell'

const mockStore = {
  editMode: false,
  removeWidget: vi.fn(),
  updateWidget: vi.fn(),
  removeWidgetFromLayouts: vi.fn(),
  widgets: [] as { id: string; title: string; type: string; options: Record<string, unknown>; createdAt: string; updatedAt: string }[],
}

vi.mock('@/store/index', () => ({
  useDashboardStore: (selector: (state: typeof mockStore) => unknown) =>
    selector(mockStore),
}))

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'zh-CN',
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const defaultWidget = {
  id: 'widget-1',
  type: 'clock' as const,
  title: 'Test Widget',
  options: {},
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

describe('WidgetShell', () => {
  beforeEach(() => {
    mockStore.editMode = false
    mockStore.removeWidget.mockClear()
    mockStore.updateWidget.mockClear()
  })

  it('should render children in view mode', () => {
    render(
      <WidgetShell widget={defaultWidget}>
        <div data-testid="child-content">Content</div>
      </WidgetShell>,
    )

    expect(screen.getByTestId('child-content')).toBeDefined()
    expect(screen.getByText('Content')).toBeDefined()
  })

  it('should not show title in view mode', () => {
    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.queryByText('Test Widget')).toBeNull()
  })

  it('should render the widget body wrapper in view mode', () => {
    const { container } = render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const body = container.querySelector('.widget-body')
    expect(body).toBeDefined()
    expect(body?.classList.contains('h-full')).toBe(true)
  })

  it('should show title in edit mode', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const titleDiv = screen.getByLabelText('widgetShell.editControls')
    expect(titleDiv).toBeDefined()
  })

  it('should show drag handle in edit mode', () => {
    mockStore.editMode = true

    const { container } = render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const dragHandle = container.querySelector('.drag-handle')
    expect(dragHandle).toBeDefined()
  })

  it('should render children in edit mode too', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div data-testid="child-content">Content</div>
      </WidgetShell>,
    )

    expect(screen.getByTestId('child-content')).toBeDefined()
  })
})
