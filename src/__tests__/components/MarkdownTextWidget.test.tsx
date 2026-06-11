/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarkdownTextWidget from '@/components/widgets/MarkdownTextWidget'

const mockStore = {
  editMode: false,
  removeWidget: vi.fn(),
  copyWidget: vi.fn(),
  updateWidget: vi.fn(),
  removeWidgetFromLayouts: vi.fn(),
  pasteWidget: vi.fn(),
  duplicateWidget: vi.fn(),
  clipboard: null as Record<string, unknown> | null,
  widgets: [] as Record<string, unknown>[],
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

const markdownContent = '[Example](https://example.com)'

const widgetProps = {
  widgetId: 'test-md-1',
  options: { content: markdownContent },
  isEditMode: false,
  width: 400,
  height: 200,
}

describe('MarkdownTextWidget', () => {
  beforeEach(() => {
    mockStore.editMode = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should suppress link href in edit mode', () => {
    const { container } = render(
      <MarkdownTextWidget {...widgetProps} isEditMode={true} />,
    )

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link!.getAttribute('href')).toBeNull()
  })

  it('should display link text in edit mode', () => {
    render(
      <MarkdownTextWidget {...widgetProps} isEditMode={true} />,
    )

    expect(screen.getByText('Example')).toBeDefined()
  })

  it('should render normal link with href in view mode', () => {
    const { container } = render(
      <MarkdownTextWidget {...widgetProps} isEditMode={false} />,
    )

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link!.getAttribute('href')).toBe('https://example.com')
  })

  it('should prevent default click behavior in edit mode', () => {
    const { container } = render(
      <MarkdownTextWidget {...widgetProps} isEditMode={true} />,
    )

    const link = container.querySelector('a')
    expect(link).not.toBeNull()

    const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault')
    fireEvent.click(link!)
    expect(preventDefaultSpy).toHaveBeenCalled()

    preventDefaultSpy.mockRestore()
  })
})
