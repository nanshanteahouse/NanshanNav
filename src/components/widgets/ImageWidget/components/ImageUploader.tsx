import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { apiFetch } from "@/lib/api/client";

export interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}
export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = async (selected: File) => {
    setFile(selected);
    setError("");
    if (
      selected.size > 20 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
        selected.type,
      )
    ) {
      setError(t("review.imageTypes"));
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("image", selected);
      const response = await apiFetch("/api/admin/upload", { method: "POST", body });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (typeof data.url !== "string") throw new Error();
      onChange(data.url);
      setFile(null);
    } catch {
      setError(t("review.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-2 text-sm">
        {t("widget.webLink.url")}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="rounded-lg border p-3 bg-[var(--bg-input)] border-[var(--border-default)]"
        />
      </label>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          e.target.value = "";
          if (selected) void upload(selected);
        }}
      />
      <button
        type="button"
        disabled={busy}
        className="flex w-full min-h-24 items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 border-[var(--border-default)] text-sm"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy && e.dataTransfer.files[0])
            void upload(e.dataTransfer.files[0]);
        }}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        {t(busy ? "common.loading" : "review.customUpload")}
      </button>
      <p className="text-xs text-[var(--text-muted)]">
        {t("review.imageTypes")}
      </p>
      {error && (
        <div role="alert" className="text-sm text-[var(--status-offline)]">
          {error}{" "}
          {file && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void upload(file)}
            >
              {t("common.retry")}
            </Button>
          )}
        </div>
      )}
      {value && (
        <img
          src={value}
          alt={t("review.customIcon")}
          className="max-h-32 rounded object-contain"
        />
      )}
    </div>
  );
}
