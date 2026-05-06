import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { Header } from '../components/header';
import { ClockWidget } from '../components/clock-widget';
import { SearchBar } from '../components/search-bar';
import { CategorySection } from '../components/category-section';
import { PveStatusBar } from '../components/pve-status-bar';
import { fetchConfig, fetchStatus } from '../api';
import type { Category, Card, ServiceCard } from '../types';

export function HomePage() {
  const categories = useStore((s) => s.categories);
  const settings = useStore((s) => s.settings);
  const setConfig = useStore((s) => s.setConfig);
  const setStatusMap = useStore((s) => s.setStatusMap);
  const localFilter = useStore((s) => s.localFilter);
  const setLocalFilter = useStore((s) => s.setLocalFilter);

  useEffect(() => {
    document.title = settings.pageTitle || '家庭服务导航';
  }, [settings.pageTitle]);

  useEffect(() => {
    fetchConfig()
      .then((config) => setConfig(config))
      .catch(() => {});
  }, [setConfig]);

  useEffect(() => {
    if (!settings.enableStatusMonitor) return;

    const poll = () => {
      fetchStatus()
        .then((status) => setStatusMap(status as Record<string, 'online' | 'offline' | 'checking'>))
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, settings.statusCheckInterval * 1000);

    const handleVisibility = () => {
      if (!document.hidden) {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [settings.enableStatusMonitor, settings.statusCheckInterval, setStatusMap]);

  const handleLocalFilter = useCallback((query: string) => {
    setLocalFilter(query);
  }, [setLocalFilter]);

  const filteredCategories = localFilter
    ? categories
        .map((cat: Category) => ({
          ...cat,
          cards: cat.cards.filter((card: Card) => {
            const q = localFilter.toLowerCase();
            if (card.type === 'service') {
              const svc = card as ServiceCard;
              return svc.name.toLowerCase().includes(q) || svc.description?.toLowerCase().includes(q) || svc.url.toLowerCase().includes(q);
            }
            return true;
          }),
        }))
        .filter((cat: Category) => cat.cards.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          {settings.showClock && <ClockWidget />}
          {settings.showSearchBar && <SearchBar onLocalFilter={handleLocalFilter} />}
          <PveStatusBar />
        </div>
        {filteredCategories.map((category: Category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </main>
    </div>
  );
}
