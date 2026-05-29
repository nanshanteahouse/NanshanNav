import { useDashboardStore } from '@/store';

const SUPPORTED_LOCALES = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
] as const;

export function LanguageSelect() {
  const locale = useDashboardStore((s) => s.settings.locale);
  const updateSettings = useDashboardStore((s) => s.updateSettings);

  return (
    <select
      value={locale}
      onChange={(e) => updateSettings({ locale: e.target.value })}
      className="h-8 rounded-md border px-2.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-primary)',
      }}
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
