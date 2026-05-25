import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import type { Card, ServiceCard } from '../types';

interface SearchBarProps {
  onLocalFilter: (query: string) => void;
}

export function SearchBar({ onLocalFilter }: SearchBarProps) {
  const settings = useStore((s) => s.settings);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeEngine, setActiveEngine] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [suggestions, setSuggestions] = useState<(Card & { categoryName?: string })[]>([]);
  const [engineOpen, setEngineOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const enabledEngines = settings.searchEngines.filter((e) => e.enabled);
  const defaultEngine = enabledEngines.find((e) => e.isDefault) ?? enabledEngines[0];
  const activeEngineObj = enabledEngines.find((e) => e.id === activeEngine);
  const currentEngineLabel = isLocalMode ? '内网' : (activeEngineObj?.name ?? '搜索');

  useEffect(() => {
    if (!activeEngine && defaultEngine) {
      setActiveEngine(defaultEngine.id);
    }
  }, [defaultEngine, activeEngine]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    if (isLocalMode) {
      onLocalFilter(query.trim());
      return;
    }

    const engine = enabledEngines.find((e) => e.id === activeEngine);
    if (engine) {
      const url = engine.urlTemplate.replace('{query}', encodeURIComponent(query.trim()));
      window.open(url, '_blank');
    }
  }, [query, isLocalMode, activeEngine, enabledEngines, onLocalFilter]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (engineOpen) {
        setEngineOpen(false);
        return;
      }
      handleSearch();
      return;
    }
    if (e.key === 'Escape') {
      if (engineOpen) {
        setEngineOpen(false);
        e.stopPropagation();
        return;
      }
      setQuery('');
      setIsLocalMode(false);
      onLocalFilter('');
      inputRef.current?.blur();
    }
  }, [handleSearch, onLocalFilter, engineOpen]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    if (isLocalMode) {
      onLocalFilter(value);
    }

    if (isLocalMode && value.trim() && settings.enableLocalFilter) {
      const categories = useStore.getState().categories;
      const q = value.toLowerCase();
      const matches: (Card & { categoryName?: string })[] = [];
      for (const cat of categories) {
        for (const card of cat.cards) {
          if (matches.length >= 8) break;
          const searchFields = card.type === 'service'
            ? `${(card as ServiceCard).name} ${(card as ServiceCard).description} ${(card as ServiceCard).url}`
            : `${card.type === 'text' ? (card as { title: string; content: string }).title : ''} ${card.type === 'text' ? (card as { title: string; content: string }).content : ''}`;
          if (searchFields.toLowerCase().includes(q)) {
            matches.push({ ...card, categoryName: cat.name });
          }
        }
        if (matches.length >= 8) break;
      }
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [isLocalMode, settings.enableLocalFilter, onLocalFilter]);

  const switchEngine = useCallback((engineId: string) => {
    if (engineId === '__local__') {
      setIsLocalMode(true);
      onLocalFilter(query);
    } else {
      setIsLocalMode(false);
      setActiveEngine(engineId);
      onLocalFilter('');
    }
  }, [query, onLocalFilter]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === '/') {
        e.preventDefault();
        setIsLocalMode(true);
        inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!engineOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEngineOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [engineOpen]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-search-bg)] border border-[var(--color-search-border)] focus-within:border-[var(--color-accent)] transition-colors duration-200`}>
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setEngineOpen(!engineOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150 ${
              engineOpen
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                : 'border-[var(--color-search-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
            }`}
            title="切换搜索引擎"
          >
            <Search size={14} />
            <span className="max-w-[60px] truncate">{currentEngineLabel}</span>
            <ChevronDown size={12} className={`transition-transform duration-150 ${engineOpen ? 'rotate-180' : ''}`} />
          </button>

          {engineOpen && (
              <div ref={dropdownRef} className="absolute top-full left-0 mt-1 z-20 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                {enabledEngines.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => { switchEngine(engine.id); setEngineOpen(false); inputRef.current?.focus(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      activeEngine === engine.id && !isLocalMode
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-card-border)]'
                    }`}
                  >
                    <Search size={14} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{engine.name}</span>
                    {activeEngine === engine.id && !isLocalMode && (
                      <span className="text-[var(--color-accent)] text-xs">✓</span>
                    )}
                  </button>
                ))}
                {settings.enableLocalFilter && (
                  <>
                    {enabledEngines.length > 0 && (
                      <div className="h-px bg-[var(--color-card-border)]" />
                    )}
                    <button
                      type="button"
                      onClick={() => { switchEngine('__local__'); setEngineOpen(false); inputRef.current?.focus(); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        isLocalMode
                          ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-card-border)]'
                      }`}
                    >
                      <span className="flex-shrink-0 text-base">🔍</span>
                      <span className="flex-1 text-left">内网过滤</span>
                      {isLocalMode && (
                        <span className="text-[var(--color-accent)] text-xs">✓</span>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setSuggestions([]); }, 200)}
          placeholder={isLocalMode ? '搜索服务...' : `${currentEngineLabel} 搜索... (Ctrl+K)`}
          className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onLocalFilter(''); setSuggestions([]); }}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map((card) => (
            <a
              key={card.id}
              href={card.type === 'service' ? (card as ServiceCard).url : undefined}
              target={card.type === 'service' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--color-card-border)] transition-colors"
            >
              <span className="text-sm text-[var(--color-text-primary)]">{card.type === 'service' ? (card as ServiceCard).name : (card as { title: string }).title}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">{card.categoryName}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
