/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { WebLinkOptions, LinkItem } from '@/types/widget';

vi.mock('@/store', () => ({
  useDashboardStore: () => ({ widgets: [] }),
}));

vi.mock('@/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  PointerSensor: {},
  closestCenter: {},
  useSensor: () => ({}),
  useSensors: () => [{}],
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock('lucide-react', () => {
  const MockIcon = () => null;
  return {
    Plus: MockIcon,
    GripVertical: MockIcon,
    Trash2: MockIcon,
    Search: MockIcon,
    X: MockIcon,
    icons: {},
  };
});

// We must use a dynamic import for Settings because it imports lucide-react,
// which needs to be mocked before the module is loaded.
async function loadSettings() {
  const mod = await import('@/components/widgets/WebLinkWidget/Settings');
  return mod.default;
}

const baseOptions: WebLinkOptions = {
  links: [],
  openInNewTab: true,
  healthCheckEnabled: false,
  healthCheckInterval: 60,
  showName: true,
  showUrl: true,
  showDescription: true,
};

function makeLink(id: string, name: string): LinkItem {
  return { id, name, url: `https://${id}.example.com`, icon: 'Globe', description: `${name} description` };
}

describe('WebLinkSettings', () => {
  it('shows "No links yet" message when there are 0 links', async () => {
    const Settings = await loadSettings();
    const onChange = vi.fn();
    render(<Settings widgetId="test-widget" options={baseOptions as unknown as Record<string, unknown>} onChange={onChange} />);

    expect(screen.getByText(/No links yet/i)).toBeDefined();
  });

  it('renders 1 link card with GripVertical present', async () => {
    const Settings = await loadSettings();
    const onChange = vi.fn();
    const options: WebLinkOptions = {
      ...baseOptions,
      links: [makeLink('link-1', 'Link #1')],
    };
    const { container } = render(
      <Settings widgetId="test-widget" options={options as unknown as Record<string, unknown>} onChange={onChange} />,
    );

    expect(screen.getByText('Link #1')).toBeDefined();
    // GripVertical is rendered inside a button with aria-label (uses i18n key)
    expect(screen.getByLabelText('widget.webLink.dragToReorder')).toBeDefined();
    // Verify the component rendered sortable structure
    expect(container.querySelector('.cursor-grab')).toBeDefined();
  });

  it('renders 3 link cards — Link #1, Link #2, Link #3 all appear', async () => {
    const Settings = await loadSettings();
    const onChange = vi.fn();
    const options: WebLinkOptions = {
      ...baseOptions,
      links: [
        makeLink('link-1', 'Link #1'),
        makeLink('link-2', 'Link #2'),
        makeLink('link-3', 'Link #3'),
      ],
    };
    render(
      <Settings widgetId="test-widget" options={options as unknown as Record<string, unknown>} onChange={onChange} />,
    );

    expect(screen.getByText('Link #1')).toBeDefined();
    expect(screen.getByText('Link #2')).toBeDefined();
    expect(screen.getByText('Link #3')).toBeDefined();
  });

  it('does not show empty state message when links exist', async () => {
    const Settings = await loadSettings();
    const onChange = vi.fn();
    const options: WebLinkOptions = {
      ...baseOptions,
      links: [makeLink('link-1', 'Link #1')],
    };
    render(
      <Settings widgetId="test-widget" options={options as unknown as Record<string, unknown>} onChange={onChange} />,
    );

    expect(screen.queryByText(/No links yet/i)).toBeNull();
  });
});
