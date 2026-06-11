/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebLinkWidget from '@/components/widgets/WebLinkWidget'

const mockStore = {
  editMode: false,
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

const mockWidget = {
  widgetId: 'test-wl-1',
  options: {
    links: [
      { id: 'l1', name: 'Test', url: 'https://example.com', iconSource: 'lucide', icon: 'Link' },
    ],
    openInNewTab: true,
    showName: true,
    showUrl: false,
    showDescription: false,
  },
  isEditMode: false,
  width: 400,
  height: 200,
}

describe('WebLinkWidget', () => {
  beforeEach(() => {
    mockStore.editMode = false
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should suppress navigation when link is clicked in edit mode', async () => {
    const user = userEvent.setup()
    render(<WebLinkWidget {...mockWidget} isEditMode={true} />)

    const linkButton = screen.getByRole('button', { name: /Test/i })
    await user.click(linkButton)

    expect(window.open).not.toHaveBeenCalled()
  })

  it('should open link in new tab when openInNewTab is true in view mode', async () => {
    const user = userEvent.setup()
    render(
      <WebLinkWidget
        {...mockWidget}
        isEditMode={false}
        options={{ ...mockWidget.options, openInNewTab: true }}
      />,
    )

    const linkButton = screen.getByRole('button', { name: /Test/i })
    await user.click(linkButton)

    expect(window.open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('should navigate in same tab when openInNewTab is false in view mode', async () => {
    const assignSpy = vi.fn()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: { ...originalLocation, assign: assignSpy },
      writable: true,
    })

    try {
      const user = userEvent.setup()
      render(
        <WebLinkWidget
          {...mockWidget}
          isEditMode={false}
          options={{ ...mockWidget.options, openInNewTab: false }}
        />,
      )

      const linkButton = screen.getByRole('button', { name: /Test/i })
      await user.click(linkButton)

      expect(assignSpy).toHaveBeenCalledWith('https://example.com')
      expect(window.open).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: originalLocation,
        writable: true,
      })
    }
  })
})
