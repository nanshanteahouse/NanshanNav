import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LinkItem } from '@/types/widget.ts';
import { Globe } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: LinkItem[];
  query: string;
  onSelect: (url: string) => void;
  visible: boolean;
  anchorRect: DOMRect | null;
}

export default function SearchSuggestions({ suggestions, query, onSelect, visible, anchorRect }: SearchSuggestionsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const scrollToSelected = useCallback((idx: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    if (idx >= 0 && items[idx]) {
      (items[idx] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, []);

  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, suggestions.length - 1);
          scrollToSelected(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.max(-1, prev - 1);
          scrollToSelected(next);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev >= 0) {
            const selected = suggestions[prev];
            if (selected) onSelect(selected.url);
          }
          return prev;
        });
      }
    },
    [visible, suggestions, onSelect, scrollToSelected],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [suggestions]);

  if (!visible || !query.trim() || suggestions.length === 0 || !anchorRect) return null;

  return createPortal(
    <ul
      ref={listRef}
      className="fixed z-[9998] max-h-48 overflow-auto rounded-lg border py-1 shadow-lg"
      style={{
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        width: anchorRect.width,
        backgroundColor: 'var(--bg-widget)',
        borderColor: 'var(--border-default)',
      }}
      role="listbox"
    >
      {suggestions.map((link, index) => (
        <li
          key={link.id || index}
          role="option"
          aria-selected={selectedIndex === index}
          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
          style={{
            backgroundColor:
              selectedIndex === index ? 'var(--bg-widget-hover)' : 'transparent',
          }}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => onSelect(link.url)}
        >
          <Globe className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="min-w-0 flex-1">
            <div className="truncate" style={{ color: 'var(--text-primary)' }}>
              {link.name}
            </div>
            <div className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {link.url}
            </div>
          </div>
        </li>
      ))}
    </ul>,
    document.body,
  );
}
