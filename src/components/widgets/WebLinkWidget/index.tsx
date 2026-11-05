import { useTranslation } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import type {
  WidgetComponentProps,
  WebLinkOptions,
  LinkItem,
} from "@/types/widget.ts";
import { checkLinkHealth } from "@/lib/api/link-health.ts";
import { normalizeUrl } from "@/lib/utils/url.ts";
import LinkItemCard from "./LinkItem.tsx";

export default function WebLinkWidget({
  widgetId: _widgetId,
  options,
  isEditMode,
  width: _width,
  height: _height,
}: WidgetComponentProps) {
  const { t } = useTranslation();
  const opts = options as unknown as WebLinkOptions;
  const links: LinkItem[] = Array.isArray(opts.links) ? opts.links : [];
  const healthEnabled = opts.healthCheckEnabled;
  const interval = (opts.healthCheckInterval || 60) * 1000;
  const showName = opts.showName ?? true;
  const showUrl = opts.showUrl ?? true;
  const showDescription = opts.showDescription ?? true;
  const isNameOnly = showName && !showUrl && !showDescription;

  const hasLinks = links.length > 0;

  if (!hasLinks) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: "var(--text-muted)" }}
        data-widget-type="web-link"
      >
        <p className="text-sm italic">{t("widget.webLink.emptyMessage")}</p>
      </div>
    );
  }

  const handleClick = (url: string) => {
    if (isEditMode) return;
    const targetUrl = normalizeUrl(url);
    if (opts.openInNewTab) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(targetUrl);
    }
  };

  return (
    <div
      className={`flex h-full w-full flex-col gap-0 overflow-auto scrollbar-thin ${isNameOnly ? "p-0 justify-center" : "p-3"}`}
      data-widget-type="web-link"
    >
      {links.map((link, index) => (
        <div key={link.id || index}>
          {healthEnabled ? (
            <LinkHealthWrapper
              link={link}
              interval={interval}
              onClick={() => handleClick(link.url)}
              showName={showName}
              showUrl={showUrl}
              showDescription={showDescription}
              compact={isNameOnly}
            />
          ) : (
            <LinkItemCard
              link={link}
              reachable={null}
              onClick={() => handleClick(link.url)}
              showName={showName}
              showUrl={showUrl}
              showDescription={showDescription}
              compact={isNameOnly}
              showHealthIndicator={false}
            />
          )}
          {index < links.length - 1 && (
            <div
              className="mx-3"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function LinkHealthWrapper({
  link,
  interval,
  onClick,
  showName,
  showUrl,
  showDescription,
  compact,
}: {
  link: LinkItem;
  interval: number;
  onClick: () => void;
  showName: boolean;
  showUrl: boolean;
  showDescription: boolean;
  compact?: boolean;
}) {
  const { t, locale } = useTranslation();
  const { data: result } = useQuery({
    queryKey: ["link-health", link.url],
    queryFn: () => checkLinkHealth(link.url),
    refetchInterval: Math.max(15000, interval),
    refetchIntervalInBackground: false,
    staleTime: interval * 0.8,
    enabled: !!link.url,
  });

  return (
    <>
      <LinkItemCard
        link={link}
        reachable={result ? result.reachable : null}
        onClick={onClick}
        showName={showName}
        showUrl={showUrl}
        showDescription={showDescription}
        compact={compact}
      />
      {result?.reachable === null && (
        <p className="px-3 pb-2 text-xs text-[var(--text-muted)]">
          {t("review.healthUnknown")}
        </p>
      )}
      {result?.history?.length ? (
        <details className="px-3 pb-2 text-xs text-[var(--text-muted)]">
          <summary className="cursor-pointer py-2">
            {t("review.healthHistory")}
            {result.lastSuccessAt
              ? ` · ${t("review.lastSuccess")} ${new Date(result.lastSuccessAt).toLocaleTimeString(locale)}`
              : ""}
          </summary>
          <p>{t("review.healthHistoryHint")}</p>
          <ol className="mt-2 space-y-1">
            {[...result.history].reverse().map((check, i) => (
              <li key={`${check.checkedAt}-${i}`}>
                <time dateTime={check.checkedAt}>
                  {new Date(check.checkedAt).toLocaleString(locale)}
                </time>{" "}
                ·{" "}
                {t(
                  check.reachable
                    ? "widget.webLink.online"
                    : "widget.webLink.offline",
                )}{" "}
                {check.statusCode ? `HTTP ${check.statusCode}` : ""}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </>
  );
}
