import { normalizeUrl } from "@/lib/utils/url";
import { useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useLocalSearch } from "@/components/widgets/SearchBoxWidget/useLocalSearch";
import { useTranslation } from "@/i18n";

export function GlobalSearch() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const results = useLocalSearch(query);
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.children[selected]?.scrollIntoView?.({ block: "nearest" });
  }, [selected]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        setQuery("");
        setSelected(0);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const go = (url: string, newTab = false) => {
    try {
      url = new URL(normalizeUrl(url), window.location.href).href;
    } catch {
      return;
    }
    if (!/^https?:\/\//i.test(url)) return;
    setOpen(false);
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  };
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={t("review.globalSearch")}
    >
      <input
        autoFocus
        role="combobox"
        aria-label={t("common.search")}
        aria-expanded={results.length > 0}
        aria-controls={id}
        aria-activedescendant={
          results[selected] ? `${id}-${selected}` : undefined
        }
        placeholder={t("review.searchEmpty")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(0);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((i) =>
              Math.max(
                0,
                Math.min(
                  results.length - 1,
                  i + (e.key === "ArrowDown" ? 1 : -1),
                ),
              ),
            );
          }
          if (e.key === "Enter" && results[selected]) {
            e.preventDefault();
            go(results[selected].url, e.ctrlKey || e.metaKey);
          }
        }}
        className="w-full rounded-lg border p-3 bg-[var(--bg-input)] border-[var(--border-default)]"
      />
      <ul
        ref={list}
        id={id}
        role="listbox"
        className="mt-3 max-h-72 overflow-auto"
      >
        {results.map((link, i) => (
          <li
            key={`${link.id}-${i}`}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === selected}
            className="rounded-lg"
            style={{
              background: i === selected ? "var(--bg-widget-hover)" : undefined,
            }}
          >
            <button
              type="button"
              tabIndex={-1}
              className="w-full p-3 text-left"
              onClick={(e) => go(link.url, e.ctrlKey || e.metaKey)}
            >
              <span className="block truncate font-medium">{link.name}</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">
                {link.url}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {query && !results.length && (
        <p role="status" className="py-4 text-sm">
          {t("review.noResults")}
        </p>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("review.shortcutHint")}
      </p>
    </Modal>
  );
}
