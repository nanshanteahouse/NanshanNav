import { useCallback, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export function ExportImportButtons() {
  const editMode = useDashboardStore((s) => s.editMode);
  const settings = useDashboardStore((s) => s.settings);
  const layouts = useDashboardStore((s) => s.layouts);
  const widgets = useDashboardStore((s) => s.widgets);
  const setSettings = useDashboardStore((s) => s.updateSettings);
  const setLayouts = useDashboardStore((s) => s.setLayouts);
  const setWidgets = useDashboardStore((s) => s.setWidgets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleExport = useCallback(() => {
    const config = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      layouts,
      widgets,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanshan-nav-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings, layouts, widgets]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          if (config.settings) setSettings(config.settings);
          if (config.layouts) setLayouts(config.layouts);
          if (config.widgets) setWidgets(config.widgets);
        } catch {
          alert(t('toolbar.importError'));
        }
      };
      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setSettings, setLayouts, setWidgets, t],
  );

  if (!editMode) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('toolbar.exportConfig')}
        title={t('toolbar.exportConfig')}
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('toolbar.importConfig')}
        title={t('toolbar.importConfig')}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        aria-label={t('toolbar.importConfig')}
        onChange={handleImport}
      />
    </>
  );
}
