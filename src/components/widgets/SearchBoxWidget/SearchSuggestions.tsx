import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Globe } from "lucide-react";
import type { LinkItem } from "@/types/widget";

interface Props {
  id: string;
  suggestions: LinkItem[];
  selectedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (url: string) => void;
  anchorRect: DOMRect | null;
}
export default function SearchSuggestions({
  id,
  suggestions,
  selectedIndex,
  onHighlight,
  onSelect,
  anchorRect,
}: Props) {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.children[selectedIndex]?.scrollIntoView?.({
      block: "nearest",
    });
  }, [selectedIndex]);
  if (!anchorRect || !suggestions.length) return null;
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const below = Math.max(0, viewportBottom - anchorRect.bottom - 8);
  const above = Math.max(0, anchorRect.top - viewportTop - 8);
  const flip = below < 180 && above > below;
  const maxHeight = Math.min(240, flip ? above : below);
  return createPortal(
    <ul
      id={id}
      ref={list}
      role="listbox"
      className="fixed z-[60] max-h-60 overflow-auto rounded-lg border py-1 shadow-lg bg-[var(--bg-widget)] border-[var(--border-default)]"
      style={{
        top: flip ? anchorRect.top - maxHeight - 4 : anchorRect.bottom + 4,
        left: anchorRect.left,
        width: anchorRect.width,
        maxHeight,
      }}
    >
      {suggestions.map((link, index) => (
        <li
          key={`${link.id}-${index}`}
          id={`${id}-${index}`}
          role="option"
          aria-selected={selectedIndex === index}
          className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm"
          style={{
            background:
              selectedIndex === index ? "var(--bg-widget-hover)" : undefined,
          }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => onHighlight(index)}
          onClick={() => onSelect(link.url)}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <div className="truncate">{link.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">
              {link.url}
            </div>
          </div>
        </li>
      ))}
    </ul>,
    document.body,
  );
}
