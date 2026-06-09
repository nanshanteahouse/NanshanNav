import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { ColorPicker } from '@/components/common/ColorPicker';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useDashboardStore } from '@/store';
import { useTranslation } from '@/i18n';
import { DEFAULT_COLORS } from '@/types/dashboard';
import type { ColorTheme } from '@/types/dashboard';

const COLOR_FIELDS: { key: keyof ColorTheme; i18nKey: string }[] = [
  { key: 'bgPrimary', i18nKey: 'colorEditor.bgPrimary' },
  { key: 'bgSecondary', i18nKey: 'colorEditor.bgSecondary' },
  { key: 'bgWidget', i18nKey: 'colorEditor.bgWidget' },
  { key: 'bgWidgetHover', i18nKey: 'colorEditor.bgWidgetHover' },
  { key: 'bgInput', i18nKey: 'colorEditor.bgInput' },
  { key: 'textPrimary', i18nKey: 'colorEditor.textPrimary' },
  { key: 'textSecondary', i18nKey: 'colorEditor.textSecondary' },
  { key: 'textMuted', i18nKey: 'colorEditor.textMuted' },
  { key: 'textAccent', i18nKey: 'colorEditor.textAccent' },
  { key: 'borderDefault', i18nKey: 'colorEditor.borderDefault' },
  { key: 'borderFocus', i18nKey: 'colorEditor.borderFocus' },
  { key: 'statusOnline', i18nKey: 'colorEditor.statusOnline' },
  { key: 'statusOffline', i18nKey: 'colorEditor.statusOffline' },
  { key: 'statusWarning', i18nKey: 'colorEditor.statusWarning' },
  { key: 'accentPrimary', i18nKey: 'colorEditor.accentPrimary' },
  { key: 'accentPrimaryHover', i18nKey: 'colorEditor.accentPrimaryHover' },
];

interface ColorThemeEditorProps {
  open: boolean;
  onClose: () => void;
}

export function ColorThemeEditor({ open, onClose }: ColorThemeEditorProps) {
  const { t } = useTranslation();
  const colors = useDashboardStore((s) => s.settings.colors);
  const glassEnabled = useDashboardStore((s) => s.settings.glassEnabled);
  const glassBlur = useDashboardStore((s) => s.settings.glassBlur);
  const updateSettings = useDashboardStore((s) => s.updateSettings);
  const [tab, setTab] = useState<'light' | 'dark'>('light');

  const currentColors = colors || DEFAULT_COLORS;
  const theme = currentColors[tab];

  const updateColor = (mode: 'light' | 'dark', key: keyof ColorTheme, value: string) => {
    updateSettings({
      colors: {
        ...currentColors,
        [mode]: { ...currentColors[mode], [key]: value },
      },
    });
  };

  const resetToDefaults = () => {
    updateSettings({ colors: DEFAULT_COLORS });
  };

  return (
    <Modal open={open} onClose={onClose} title={t('colorEditor.title')} glassEnabled={glassEnabled} glassBlur={glassBlur}>
      {/* Tab buttons */}
      <div className="flex gap-1 mb-4 rounded-md p-1" style={{ backgroundColor: 'var(--bg-input)' }}>
        <button
          type="button"
          onClick={() => setTab('light')}
          className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'light' ? 'var(--bg-widget)' : 'transparent',
            color: tab === 'light' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {t('colorEditor.lightTheme')}
        </button>
        <button
          type="button"
          onClick={() => setTab('dark')}
          className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'dark' ? 'var(--bg-widget)' : 'transparent',
            color: tab === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'dark' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {t('colorEditor.darkTheme')}
        </button>
      </div>

      {/* Color fields */}
      <div className="flex flex-col gap-2.5 max-h-[50vh] max-sm:max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin [scrollbar-gutter:stable]">
        {COLOR_FIELDS.map(({ key, i18nKey }) => (
          <ColorPicker
            key={key}
            label={t(i18nKey)}
            value={theme[key]}
            onChange={(v) => updateColor(tab, key, v)}
          />
        ))}
      </div>

      {/* Glass effect section */}
      <div className="mt-5 pt-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border-default)' }}>
        <h4 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t('colorEditor.glassSection')}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('colorEditor.glassEnabled')}
          </span>
          <Switch
            checked={glassEnabled ?? false}
            onCheckedChange={(v) => updateSettings({ glassEnabled: v })}
          />
        </div>
        {glassEnabled && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('colorEditor.glassBlur')}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {glassBlur ?? 10}px
              </span>
            </div>
            <Slider
              min={8}
              max={12}
              step={1}
              value={glassBlur ?? 10}
              onChange={(v) => updateSettings({ glassBlur: v })}
            />
          </div>
        )}
      </div>

      {/* Reset and close buttons */}
      <div className="mt-5 flex gap-2 max-sm:flex-col pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {t('colorEditor.resetDefault')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors flex-1"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
          }}
        >
          {t('common.close')}
        </button>
      </div>
    </Modal>
  );
}
