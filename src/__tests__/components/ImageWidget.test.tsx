/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImageWidget from '@/components/widgets/ImageWidget/index'

// ── Mocks ────────────────────────────────────────────────────────
// Follow WidgetShell mock pattern even though ImageWidget uses props
// for isEditMode (not the store) — kept for consistency.

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

// ── Fixtures ─────────────────────────────────────────────────────

const previewProps = {
  widgetId: 'test-img-1',
  options: {
    sourceType: 'url' as const,
    url: 'https://via.placeholder.com/150',
    scaleMode: 'contain',
    onClick: 'preview' as const,
  },
  isEditMode: false,
  width: 300,
  height: 200,
}

const linkProps = {
  ...previewProps,
  options: {
    ...previewProps.options,
    onClick: 'link' as const,
    linkUrl: 'https://example.com',
  },
}

const noneProps = {
  ...previewProps,
  options: {
    ...previewProps.options,
    onClick: 'none' as const,
  },
}

// ── Suite ────────────────────────────────────────────────────────

describe('ImageWidget – click suppression in edit mode', () => {
  beforeEach(() => {
    mockStore.editMode = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Preview mode ─────────────────────────────────────────

  it('does NOT open preview Modal when clicking image in edit mode (onClick=preview)', () => {
    const { container } = render(<ImageWidget {...previewProps} isEditMode />)

    const img = container.querySelector('img')!
    expect(img).not.toBeNull()
    fireEvent.click(img)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('OPENS preview Modal when clicking image in view mode (onClick=preview)', () => {
    const { container } = render(<ImageWidget {...previewProps} />)

    const img = container.querySelector('img')!
    expect(img).not.toBeNull()
    fireEvent.click(img)

    expect(screen.getByRole('dialog')).toBeDefined()
  })

  // ── Link mode ───────────────────────────────────────────

  it('does NOT render link wrapper in edit mode (onClick=link) – no navigation', () => {
    const { container } = render(<ImageWidget {...linkProps} isEditMode />)

    // No <a> tag should wrap the image
    expect(container.querySelector('a')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()

    // The bare <img> should still be present
    const img = container.querySelector('img')!
    expect(img).not.toBeNull()
    expect(img.closest('a')).toBeNull()
  })

  it('RENDERS link wrapper in view mode (onClick=link) with correct href', () => {
    const { container } = render(<ImageWidget {...linkProps} />)

    const link = screen.getByRole('link')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://example.com')

    // The image should be nested inside the <a> element
    const img = container.querySelector('img')!
    expect(img.closest('a')).not.toBeNull()
  })

  // ── Additional guard: non-interactive value ─────────────

  it('renders neither Modal nor link for onClick=none in any mode', () => {
    const viewContainer = render(<ImageWidget {...noneProps} />).container
    const img = viewContainer.querySelector('img')!
    fireEvent.click(img)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()

    // Rerender in edit mode
    const editContainer = render(<ImageWidget {...noneProps} isEditMode />).container
    expect(editContainer.querySelector('a')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
