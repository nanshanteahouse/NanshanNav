import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const enabledEngines = settings.searchEngines.filter((e) => e.enabled);
  const defaultEngine = enabledEngines.find((e) => e.isDefault) ?? enabledEngines[0];

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
      handleSearch();
    }
    if (e.key === 'Escape') {
      setQuery('');
      setIsLocalMode(false);
      onLocalFilter('');
      inputRef.current?.blur();
    }
  }, [handleSearch, onLocalFilter]);

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

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-search-bg)] border border-[var(--color-search-border)] focus-within:border-[var(--color-accent)] transition-colors duration-200`}>
        <Search size={18} className="text-[var(--color-text-secondary)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setSuggestions([]); }, 200)}
          placeholder={isLocalMode ? '搜索服务...' : '搜索... (Ctrl+K)'}
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

      <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
        {enabledEngines.map((engine) => (
          <button
            key={engine.id}
            onClick={() => switchEngine(engine.id)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors duration-200 ${
              activeEngine === engine.id && !isLocalMode
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-card-border)] hover:border-[var(--color-accent)]'
            }`}
          >
            {engine.name}
          </button>
        ))}
        {settings.enableLocalFilter && (
          <button
            onClick={() => switchEngine('__local__')}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors duration-200 ${
              isLocalMode
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-card-border)] hover:border-[var(--color-accent)]'
            }`}
          >
            🔍 内网
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
