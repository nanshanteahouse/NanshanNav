import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { WidgetComponentProps, WebPageOptions } from "@/types/widget";
import { apiFetch } from "@/lib/api/client";
import { useTranslation } from "@/i18n";

export default function WebPageWidget({ options }: WidgetComponentProps) {
  const { t } = useTranslation();
  const url = (options as unknown as WebPageOptions).url?.trim() || "";
  const [origins, setOrigins] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState("");
  useEffect(() => {
    let active = true;
    apiFetch("/api/embed-policy")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (active) setOrigins(data.origins);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  let origin = "";
  try {
    const parsed = new URL(url);
    if (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    )
      origin = parsed.origin;
  } catch {
    /* invalid addresses never reach an iframe */
  }
  const allowed = Boolean(
    origin &&
    origins &&
    (origin === window.location.origin || origins.includes(origin)),
  );
  if (!url)
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-[var(--text-muted)]">
        {t("review.noUrl")}
      </div>
    );
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-default)] p-2 text-xs">
        <span className="text-[var(--text-secondary)]">
          {allowed
            ? t("review.embedHint")
            : failed
              ? t("review.loadFailed")
              : origins
                ? t("review.embedBlocked")
                : t("common.loading")}
        </span>
        {origin && (
          <a
            className="flex min-h-11 shrink-0 items-center gap-1 text-[var(--text-accent)]"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            {t("review.openExternal")}
          </a>
        )}
      </div>
      {allowed && (
        <>
          {loadedUrl !== url && (
            <span role="status" className="px-3 text-xs">
              {t("common.loading")}
            </span>
          )}
          <iframe
            src={url}
            title={t("widget.webPage.name")}
            className="min-h-0 flex-1 w-full border-none"
            sandbox="allow-scripts allow-forms allow-popups"
            referrerPolicy="no-referrer"
            onLoad={() => setLoadedUrl(url)}
          />
        </>
      )}
    </div>
  );
}
