import { useTranslation } from "@/i18n";
interface HealthIndicatorProps {
  reachable: boolean | null;
}

export default function HealthIndicator({ reachable }: HealthIndicatorProps) {
  const { t } = useTranslation();
  const baseClasses = "inline-block h-2.5 w-2.5 rounded-full flex-shrink-0";

  if (reachable === null) {
    return (
      <span
        className={`${baseClasses} animate-pulse`}
        style={{ backgroundColor: "var(--text-muted)" }}
        title={t("widget.webLink.checking")}
      />
    );
  }

  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: reachable
          ? "var(--status-online)"
          : "var(--status-offline)",
      }}
      title={
        reachable ? t("widget.webLink.online") : t("widget.webLink.offline")
      }
    />
  );
}
