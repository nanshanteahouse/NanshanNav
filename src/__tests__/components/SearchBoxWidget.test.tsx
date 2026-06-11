/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBoxWidget from '@/components/widgets/SearchBoxWidget'

const mockStore = {
  editMode: false,
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

const widgetProps = {
  widgetId: 'test-sb-1',
  options: { defaultEngine: 'google', placeholder: 'Search...', enableLocalSearch: false },
  isEditMode: false,
  width: 400,
  height: 100,
}

describe('SearchBoxWidget - edit mode guards', () => {
  let hrefSetter: (v: string) => void

  beforeEach(() => {
    hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return ''
        },
        set href(v: string) {
          hrefSetter(v)
        },
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should suppress navigation when search button is clicked in edit mode', async () => {
    mockStore.editMode = true
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />)

    const input = screen.getByPlaceholderText('Search...')
    await userEvent.type(input, 'test query')

    const searchButton = screen.getByLabelText('common.search')
    await userEvent.click(searchButton)

    expect(hrefSetter).not.toHaveBeenCalled()
  })

  it('should suppress navigation when Enter key is pressed in edit mode', async () => {
    mockStore.editMode = true
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />)

    const input = screen.getByPlaceholderText('Search...')
    await userEvent.type(input, 'test query')

    await userEvent.keyboard('{Enter}')

    expect(hrefSetter).not.toHaveBeenCalled()
  })

  it('should still allow typing in input in edit mode', async () => {
    mockStore.editMode = true
    render(<SearchBoxWidget {...widgetProps} isEditMode={true} />)

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await userEvent.type(input, 'hello')

    expect(input.value).toBe('hello')
  })

  it('should navigate on search button click in view mode', async () => {
    mockStore.editMode = false
    render(<SearchBoxWidget {...widgetProps} isEditMode={false} />)

    const input = screen.getByPlaceholderText('Search...')
    await userEvent.type(input, 'test query')

    const searchButton = screen.getByLabelText('common.search')
    await userEvent.click(searchButton)

    expect(hrefSetter).toHaveBeenCalledWith('https://www.google.com/search?q=test%20query')
  })
})
