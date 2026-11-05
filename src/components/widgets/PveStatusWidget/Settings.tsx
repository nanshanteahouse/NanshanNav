import { apiFetch } from "@/lib/api/client";
import { useState, useEffect } from "react";
import type { WidgetSettingsProps, PveStatusOptions } from "@/types/widget.ts";
import { useTranslation } from "@/i18n";

export default function PveStatusSettings({
  widgetId: _widgetId,
  options,
  onChange,
}: WidgetSettingsProps) {
  const { t } = useTranslation();
  const opts = options as unknown as PveStatusOptions;

  const update = (patch: Partial<PveStatusOptions>) => {
    onChange({ ...opts, ...patch });
  };

  // ── Token management (API-direct, not via Zustand) ──
  const [tokenInput, setTokenInput] = useState("");
  const [maskedToken, setMaskedToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [tokenSaving, setTokenSaving] = useState(false);
  const [error, setError] = useState("");
  const [hosts, setHosts] = useState<
    { id: string; label: string; origin: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    apiFetch("/api/admin/pve/hosts")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (active) setHosts(data);
      })
      .catch(() => {
        if (active) setError(t("review.loadFailed"));
      });
    return () => {
      active = false;
    };
  }, [t]);
  useEffect(() => {
    let active = true;
    apiFetch(
      `/api/admin/pve/tokens?host=${encodeURIComponent(opts.proxmoxHost)}`,
    )
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (active) {
          setHasToken(data.hasToken);
          setMaskedToken(data.masked || "");
        }
      })
      .catch(() => {
        if (active) {
          setHasToken(false);
          setMaskedToken("");
        }
      });
    return () => {
      active = false;
    };
  }, [opts.proxmoxHost]);
  const updateToken = async (remove = false) => {
    if (!opts.proxmoxHost || (!remove && !tokenInput.trim())) return;
    setTokenSaving(true);
    setError("");
    try {
      const response = await apiFetch(
        remove
          ? `/api/admin/pve/tokens?host=${encodeURIComponent(opts.proxmoxHost)}`
          : "/api/admin/pve/tokens",
        {
          method: remove ? "DELETE" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: remove
            ? undefined
            : JSON.stringify({
                host: opts.proxmoxHost,
                token: tokenInput.trim(),
              }),
        },
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      setHasToken(!remove);
      setMaskedToken(data.masked || "");
      setTokenInput("");
    } catch {
      setError(t("review.tokenFailed"));
    } finally {
      setTokenSaving(false);
    }
  };
  const handleSaveToken = () => updateToken();
  const handleClearToken = () => updateToken(true);

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="text-sm text-[var(--status-offline)]">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("review.pveHost")}
        </span>
        <select
          className="rounded-md border px-4 py-3 text-sm bg-[var(--bg-input)] border-[var(--border-default)]"
          value={
            hosts.find(
              (host) =>
                host.id === opts.proxmoxHost ||
                host.origin === opts.proxmoxHost ||
                new URL(host.origin).host === opts.proxmoxHost,
            )?.id ?? ""
          }
          onChange={(e) => {
            update({
              proxmoxHost: e.target.value,
              proxmoxUrl:
                hosts.find((host) => host.id === e.target.value)?.origin ?? "",
            });
            setTokenInput("");
            setHasToken(false);
            setMaskedToken("");
          }}
        >
          <option value="">{t("review.selectHost")}</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.label} — {host.origin}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-muted)]">
          {t("review.pveHostHelp")}
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.pveStatus.nodeName")}
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={opts.nodeName}
          onChange={(e) => update({ nodeName: e.target.value })}
          placeholder="e.g., pve"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.pveStatus.name")} API Token
        </span>
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-1 rounded-md border px-4 py-2.5 text-sm font-mono"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: hasToken
                ? "var(--status-online)"
                : "var(--border-default)",
              color: "var(--text-primary)",
            }}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveToken();
            }}
            placeholder={hasToken ? maskedToken : "monitor@pve!dashboard=..."}
            disabled={tokenSaving}
          />
          {hasToken && !tokenInput && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--status-offline)",
                color: "#fff",
              }}
              onClick={handleClearToken}
              disabled={tokenSaving}
            >
              {t("common.delete")}
            </button>
          )}
          {tokenInput.trim() && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#fff",
              }}
              onClick={handleSaveToken}
              disabled={tokenSaving}
            >
              {tokenSaving ? "..." : t("common.save")}
            </button>
          )}
        </div>
        {hasToken && !tokenInput && (
          <p className="text-[11px]" style={{ color: "var(--status-online)" }}>
            {t("review.tokenConfigured")}
          </p>
        )}
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {t("review.tokenHelp")}
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
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showCpu")}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showMemory}
            onChange={(e) => update({ showMemory: e.target.checked })}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showMemory")}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showUptime}
            onChange={(e) => update({ showUptime: e.target.checked })}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showUptime")}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showStorage}
            onChange={(e) => update({ showStorage: e.target.checked })}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showStorage")}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showVmCounts}
            onChange={(e) => update({ showVmCounts: e.target.checked })}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showVmCounts")}
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showTitleLink ?? true}
            onChange={(e) => update({ showTitleLink: e.target.checked })}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("widget.pveStatus.showTitleLink")}
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("widget.pveStatus.refreshInterval")}
        </span>
        <input
          type="number"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          min={5}
          max={3600}
          value={opts.refreshInterval}
          onChange={(e) =>
            update({ refreshInterval: Number(e.target.value) || 15 })
          }
        />
      </label>
    </div>
  );
}
