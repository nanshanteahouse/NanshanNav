/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetShell } from '@/components/widgets/WidgetShell'

const mockStore = {
  editMode: false,
  removeWidget: vi.fn(),
  copyWidget: vi.fn(),
  updateWidget: vi.fn(),
  removeWidgetFromLayouts: vi.fn(),
  pasteWidget: vi.fn(),
  duplicateWidget: vi.fn(),
  clipboard: null as { id: string; title: string; type: string; options: Record<string, unknown>; createdAt: string; updatedAt: string } | null,
  widgets: [] as { id: string; title: string; type: string; options: Record<string, unknown>; createdAt: string; updatedAt: string }[],
}

vi.mock('@/store/index', () => ({
  useDashboardStore: Object.assign(
    (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
    { getState: () => mockStore },
  ),
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
    mockStore.copyWidget.mockClear()
    mockStore.updateWidget.mockClear()
    mockStore.pasteWidget.mockClear()
    mockStore.duplicateWidget.mockClear()
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

  it('should render copy button in edit mode', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.getByLabelText('widgetShell.copy')).toBeDefined()
  })

  it('should not render copy button in view mode', () => {
    mockStore.editMode = false

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.queryByLabelText('widgetShell.copy')).toBeNull()
  })

  it('should call copyWidget when copy button is clicked', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const copyButton = screen.getByLabelText('widgetShell.copy')
    copyButton.click()
    expect(mockStore.copyWidget).toHaveBeenCalledWith(defaultWidget)
  })

  it('should render paste button in edit mode', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.getByLabelText('widgetShell.paste')).toBeDefined()
  })

  it('should disable paste button when clipboard is null', () => {
    mockStore.editMode = true
    mockStore.clipboard = null

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const pasteButton = screen.getByLabelText('widgetShell.paste')
    expect(pasteButton.hasAttribute('disabled')).toBe(true)
  })

  it('should render duplicate button in edit mode', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.getByLabelText('widgetShell.duplicate')).toBeDefined()
  })

  it('should call duplicateWidget when duplicate button is clicked', () => {
    mockStore.editMode = true

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    const duplicateButton = screen.getByLabelText('widgetShell.duplicate')
    duplicateButton.click()
    expect(mockStore.duplicateWidget).toHaveBeenCalledWith('widget-1', expect.any(String))
  })

  it('should not render paste button in view mode', () => {
    mockStore.editMode = false

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.queryByLabelText('widgetShell.paste')).toBeNull()
  })

  it('should not render duplicate button in view mode', () => {
    mockStore.editMode = false

    render(
      <WidgetShell widget={defaultWidget}>
        <div>Content</div>
      </WidgetShell>,
    )

    expect(screen.queryByLabelText('widgetShell.duplicate')).toBeNull()
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
