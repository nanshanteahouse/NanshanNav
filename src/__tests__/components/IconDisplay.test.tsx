/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconDisplay } from '@/components/common/IconDisplay';

describe('IconDisplay - favicon mode', () => {
  it('should render img when favicon loads successfully', () => {
    const { container } = render(
      <IconDisplay
        iconSource="favicon"
        url="https://example.com"
        name="Example"
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toContain('/api/favicon?url=');
  });

  it('should show initial letter on favicon load failure', () => {
    const { container } = render(
      <IconDisplay
        iconSource="favicon"
        url="https://example.com"
        name="Example"
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(screen.getByText('E')).toBeDefined();
    expect(container.querySelector('img')).toBeNull();
  });

  it('should not apply favicon error logic for lucide icon source', () => {
    const { container } = render(
      <IconDisplay
        iconSource="lucide"
        iconValue="Globe"
        name="Example"
      />,
    );
    // Lucide icons render as SVGs, not <img> elements
    expect(container.querySelector('img')).toBeNull();
    // No initial letter fallback should appear either
    expect(screen.queryByText('E')).toBeNull();
  });
});
