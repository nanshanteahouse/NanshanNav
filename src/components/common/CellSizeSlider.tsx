import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { CELL_SIZE_MIN, CELL_SIZE_MAX } from '@/lib/constants';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';

export function CellSizeSlider({ showLabel = false }: { showLabel?: boolean }) {
  const editMode = useDashboardStore((s) => s.editMode);
  const rowHeight = useDashboardStore((s) => s.settings.cellSize);
  const updateSettings = useDashboardStore((s) => s.updateSettings);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const [alignTop, setAlignTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!editMode) return null;

  const pct = ((rowHeight - CELL_SIZE_MIN) / (CELL_SIZE_MAX - CELL_SIZE_MIN)) * 100;

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size={showLabel ? 'sm' : 'icon'}
        aria-label={t('toolbar.rowHeight')}
        title={t('toolbar.rowHeight')}
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Check right overflow: container right edge + 192px popover width > viewport width
            setAlignLeft(rect.right + 192 > window.innerWidth);
            // Check bottom overflow: container bottom + ~200px popover height > viewport height
            setAlignTop(rect.bottom + 200 > window.innerHeight);
          }
          setOpen(nextOpen);
        }}
        className={showLabel ? 'justify-start gap-2' : ''}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {showLabel && <span>{t('toolbar.cellSize')}</span>}
      </Button>
      {open && (
        <div className={`absolute ${alignLeft ? 'left-0' : 'right-0'} ${alignTop ? 'bottom-full mb-1' : 'top-full mt-1'} z-50 w-48 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-widget)] shadow-[var(--shadow-md)]`}>
          <label className="block text-xs text-[var(--text-secondary)] mb-2">
            {t('toolbar.rowLabel', { px: rowHeight })}
          </label>
          <input
            type="range"
            min={CELL_SIZE_MIN}
            max={CELL_SIZE_MAX}
            value={rowHeight}
            aria-label={t('toolbar.rowHeight')}
            onChange={(e) => updateSettings({ cellSize: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: 'var(--accent-primary)',
              background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--bg-input) ${pct}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
