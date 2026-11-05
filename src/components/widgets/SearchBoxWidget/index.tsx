import { normalizeUrl } from "@/lib/utils/url";
import { useState, useRef, useEffect, useId } from "react";
import { Search } from "lucide-react";
import type { WidgetComponentProps, SearchBoxOptions } from "@/types/widget";
import { useTranslation } from "@/i18n";
import { useLocalSearch } from "./useLocalSearch";
import SearchSuggestions from "./SearchSuggestions";

const ENGINES: Record<string, string> = {
  google: "https://www.google.com/search?q={query}",
  baidu: "https://www.baidu.com/s?wd={query}",
  bing: "https://www.bing.com/search?q={query}",
  duckduckgo: "https://duckduckgo.com/?q={query}",
};
export default function SearchBoxWidget({
  options,
  isEditMode,
}: WidgetComponentProps) {
  const opts = options as unknown as SearchBoxOptions;
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState({
    source: opts.defaultEngine,
    value: opts.defaultEngine as string,
  });
  if (choice.source !== opts.defaultEngine)
    setChoice({ source: opts.defaultEngine, value: opts.defaultEngine });
  const engine =
    choice.source === opts.defaultEngine ? choice.value : opts.defaultEngine;
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const suggestions = useLocalSearch(query);
  const visible = Boolean(
    focused && opts.enableLocalSearch && query.trim() && suggestions.length,
  );
  useEffect(() => {
    if (!focused) return;
    const update = () =>
      setRect(input.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [focused]);
  const navigate = (url: string, newTab = false) => {
    if (isEditMode) return;
    try {
      url = new URL(normalizeUrl(url), window.location.href || document.baseURI)
        .href;
    } catch {
      return;
    }
    if (!/^https?:\/\//i.test(url)) return;
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  };
  const search = (newTab = false) => {
    if (!query.trim()) return;
    const template =
      engine === "custom" ? opts.customEngineUrl : ENGINES[engine];
    if (template)
      navigate(
        template.replace("{query}", encodeURIComponent(query.trim())),
        newTab,
      );
  };
  return (
    <div
      className="flex h-full items-center justify-center p-3"
      data-widget-type="search-box"
    >
      <div className="flex w-full max-w-xl items-center rounded-lg border bg-[var(--bg-input)] border-[var(--border-default)] focus-within:border-[var(--border-focus)]">
        <select
          aria-label={t("widget.searchBox.defaultEngine")}
          className="min-h-11 max-w-28 rounded-l-lg bg-transparent px-2 text-sm"
          value={engine}
          onChange={(e) =>
            setChoice({ source: opts.defaultEngine, value: e.target.value })
          }
        >
          {Object.keys(ENGINES).map((key) => (
            <option key={key} value={key}>
              {t(`widget.searchBox.engines.${key}`)}
            </option>
          ))}
          {opts.customEngineUrl && (
            <option value="custom">
              {t("widget.searchBox.engines.custom")}
            </option>
          )}
        </select>
        <input
          ref={input}
          role="combobox"
          aria-label={t("common.search")}
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? id : undefined}
          aria-activedescendant={
            visible && selected >= 0 ? `${id}-${selected}` : undefined
          }
          className="min-h-11 min-w-0 flex-1 bg-transparent px-2 outline-none"
          placeholder={opts.placeholder || t("widget.searchBox.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setRect(input.current?.getBoundingClientRect() ?? null);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Escape") {
              setFocused(false);
              setSelected(-1);
            }
            if (visible && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              setSelected((i) =>
                Math.max(
                  -1,
                  Math.min(
                    suggestions.length - 1,
                    i + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const link =
                visible && selected >= 0 ? suggestions[selected] : undefined;
              if (link) navigate(link.url, e.ctrlKey || e.metaKey);
              else search(e.ctrlKey || e.metaKey);
            }
          }}
        />
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center"
          aria-label={t("common.search")}
          onClick={() => search()}
        >
          <Search className="h-5 w-5" />
        </button>
        {visible && (
          <SearchSuggestions
            id={id}
            suggestions={suggestions}
            selectedIndex={selected}
            onHighlight={setSelected}
            onSelect={navigate}
            anchorRect={rect}
          />
        )}
      </div>
    </div>
  );
}
