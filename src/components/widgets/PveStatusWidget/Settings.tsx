import { useState, useEffect } from 'react';
import type { WidgetSettingsProps, PveStatusOptions } from '@/types/widget.ts';
import { useTranslation } from '@/i18n';

export default function PveStatusSettings({ widgetId: _widgetId, options, onChange }: WidgetSettingsProps) {
  const { t } = useTranslation();
  const opts = options as unknown as PveStatusOptions;

  const update = (patch: Partial<PveStatusOptions>) => {
    onChange({ ...opts, ...patch });
  };

  // ── Token management (API-direct, not via Zustand) ──
  const [tokenInput, setTokenInput] = useState('');
  const [maskedToken, setMaskedToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [tokenSource, setTokenSource] = useState<'host' | 'default' | null>(null);
  const [tokenSaving, setTokenSaving] = useState(false);

  useEffect(() => {
    const host = opts.proxmoxHost;
    if (!host) {
      setHasToken(false);
      setMaskedToken('');
      setTokenSource(null);
      return;
    }
    fetch(`/api/pve/tokens?host=${encodeURIComponent(host)}`)
      .then((r) => r.json())
      .then((data: { hasToken: boolean; masked?: string; source?: string }) => {
        setHasToken(data.hasToken);
        if (data.masked) setMaskedToken(data.masked);
        setTokenSource(data.source as 'host' | 'default' | null);
      })
      .catch(() => {});
  }, [opts.proxmoxHost]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim() || !opts.proxmoxHost) return;
    setTokenSaving(true);
    try {
      const res = await fetch('/api/pve/tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: opts.proxmoxHost, token: tokenInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json() as { masked: string };
      setHasToken(true);
      setMaskedToken(data.masked);
      setTokenSource('host');
      setTokenInput('');
    } catch {
    } finally {
      setTokenSaving(false);
    }
  };

  const handleClearToken = async () => {
    if (!opts.proxmoxHost) return;
    setTokenSaving(true);
    try {
      await fetch(`/api/pve/tokens?host=${encodeURIComponent(opts.proxmoxHost)}`, {
        method: 'DELETE',
      });
      setHasToken(false);
      setMaskedToken('');
      setTokenSource(null);
    } catch {
    } finally {
      setTokenSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('widget.pveStatus.proxmoxHost')}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.proxmoxHost}
          onChange={(e) => update({ proxmoxHost: e.target.value })}
          placeholder="e.g., pve.lan:8006"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('widget.pveStatus.nodeName')}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.nodeName}
          onChange={(e) => update({ nodeName: e.target.value })}
          placeholder="e.g., pve"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('widget.pveStatus.name')} API Token
        </span>
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-1 rounded-md border px-4 py-2.5 text-sm font-mono"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: hasToken ? 'var(--status-online)' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveToken(); }}
            placeholder={hasToken ? maskedToken : 'monitor@pve!dashboard=...'}
            disabled={tokenSaving}
          />
          {hasToken && !tokenInput && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--status-offline)', color: '#fff' }}
              onClick={handleClearToken}
              disabled={tokenSaving}
            >
              {t('common.delete')}
            </button>
          )}
          {tokenInput.trim() && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
              onClick={handleSaveToken}
              disabled={tokenSaving}
            >
              {tokenSaving ? '...' : t('common.save')}
            </button>
          )}
        </div>
        {hasToken && !tokenInput && (
          <p className="text-[11px]" style={{ color: 'var(--status-online)' }}>
            {tokenSource === 'default' ? 'Using default token' : 'Token configured'}
          </p>
        )}
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Format: user@realm!tokenid=secret. Stored server-side only.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showCpu}
            onChange={(e) => update({ showCpu: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showCpu')}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showMemory}
            onChange={(e) => update({ showMemory: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showMemory')}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showUptime}
            onChange={(e) => update({ showUptime: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showUptime')}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showStorage}
            onChange={(e) => update({ showStorage: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showStorage')}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showVmCounts}
            onChange={(e) => update({ showVmCounts: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showVmCounts')}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showTitleLink ?? true}
            onChange={(e) => update({ showTitleLink: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('widget.pveStatus.showTitleLink')}
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('widget.pveStatus.refreshInterval')}
        </span>
        <input
          type="number"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          min={5}
          max={3600}
          value={opts.refreshInterval}
          onChange={(e) => update({ refreshInterval: Number(e.target.value) || 15 })}
        />
      </label>
    </div>
  );
}
