import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { WidgetComponentProps, SearchBoxOptions } from '@/types/widget.ts';
import { useLocalSearch } from './useLocalSearch.ts';
import SearchSuggestions from './SearchSuggestions.tsx';
import { Search, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n';

const ENGINE_URLS: Record<string, string> = {
  google: 'https://www.google.com/search?q={query}',
  baidu: 'https://www.baidu.com/s?wd={query}',
  bing: 'https://www.bing.com/search?q={query}',
  duckduckgo: 'https://duckduckgo.com/?q={query}',
};

const ENGINE_NAMES: Record<string, string> = {
  google: 'G',
  baidu: '百',
  bing: 'B',
  duckduckgo: 'D',
  custom: 'C',
};

export default function SearchBoxWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as SearchBoxOptions;
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<string>(opts.defaultEngine);
  const [isFocused, setIsFocused] = useState(false);
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [suggestionsRect, setSuggestionsRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineBtnRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const suggestions = useLocalSearch(query);
  const engines = engine === 'custom' && opts.customEngineUrl
    ? ['custom', ...Object.keys(ENGINE_URLS)]
    : Object.keys(ENGINE_URLS);

  useEffect(() => {
    if (!opts.ctrlKEnabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts.ctrlKEnabled]);

  useEffect(() => {
    if (!showEngineMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (engineBtnRef.current?.contains(target)) return;
      if (target.closest('.search-engine-menu')) return;
      setShowEngineMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEngineMenu]);

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    let url: string;
    if (engine === 'custom' && opts.customEngineUrl) {
      url = opts.customEngineUrl.replace('{query}', encodeURIComponent(trimmed));
    } else {
      const template = ENGINE_URLS[engine] || ENGINE_URLS.google;
      url = template.replace('{query}', encodeURIComponent(trimmed));
    }
    window.location.href = url;
  }, [query, engine, opts.customEngineUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleSelect = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const handleEngineSelect = (key: string) => {
    setEngine(key);
    setShowEngineMenu(false);
    inputRef.current?.focus();
  };

  const handleToggleEngineMenu = () => {
    if (!showEngineMenu && engineBtnRef.current) {
      const rect = engineBtnRef.current.getBoundingClientRect();

      const menuWidth = 144; // w-36 = 9rem = 144px
      const estimatedMenuHeight = engines.length * 36 + 8;
      let left = rect.left;
      let top = rect.bottom + 4;

      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top + estimatedMenuHeight > window.innerHeight) {
        top = rect.top - estimatedMenuHeight - 4;
      }

      setMenuPosition({ top, left });
    }
    setShowEngineMenu(!showEngineMenu);
  };

  const borderColor = isFocused ? 'var(--border-focus)' : 'var(--border-default)';

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-3"
      data-widget-type="search-box"
    >
      <div className="relative w-full max-w-xl">
        <div className="flex items-stretch">
          <button
            ref={engineBtnRef}
            type="button"
            className="rounded-l-lg cursor-pointer shrink-0"
            style={{
              width: '36px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-input)',
              border: `1px solid ${borderColor}`,
              borderRight: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
            onClick={handleToggleEngineMenu}
            aria-label={t('widget.searchBox.defaultEngine')}
          >
            {ENGINE_NAMES[engine] || <Globe className="h-3.5 w-3.5" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 py-2 px-3 text-sm outline-none border-y-0"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderTop: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
              borderLeft: 'none',
              borderRight: 'none',
            }}
            placeholder={opts.placeholder || t('widget.searchBox.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (inputRef.current) {
                setSuggestionsRect(inputRef.current.getBoundingClientRect());
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!engineBtnRef.current?.contains(document.activeElement)) {
                  setIsFocused(false);
                }
              }, 200);
            }}
          />

          <button
            type="button"
            className="rounded-r-lg cursor-pointer shrink-0"
            style={{
              width: '36px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-input)',
              border: `1px solid ${borderColor}`,
              borderLeft: 'none',
              color: 'var(--text-muted)',
            }}
            onClick={handleSearch}
            aria-label={t('common.search')}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {opts.enableLocalSearch && (
          <SearchSuggestions
            suggestions={suggestions}
            query={query}
            onSelect={handleSelect}
            visible={isFocused}
            anchorRect={suggestionsRect}
          />
        )}
      </div>

      {showEngineMenu && menuPosition &&
        createPortal(
          <div
            className="search-engine-menu fixed z-[9999] w-36 rounded-lg border py-1 shadow-lg"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              backgroundColor: 'var(--bg-widget)',
              borderColor: 'var(--border-default)',
            }}
          >
            {engines.map((key) => (
              <button
                key={key}
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-widget-hover)]"
                style={{
                  color: engine === key ? 'var(--text-accent)' : 'var(--text-primary)',
                  fontWeight: engine === key ? 600 : 400,
                }}
                onClick={() => handleEngineSelect(key)}
              >
                {t(`widget.searchBox.engines.${key}`)}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
