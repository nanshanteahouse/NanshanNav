import type { LinkItem } from "@/types/widget";
import { generateId } from "@/lib/utils/generate-id";

export interface BookmarkGroup {
  name: string;
  links: LinkItem[];
}
export function normalizeBookmarkUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}
export function parseBookmarks(
  html: string,
  existing: string[] = [],
): { groups: BookmarkGroup[]; duplicates: number; count: number } {
  if (new TextEncoder().encode(html).length > 5 * 1024 * 1024)
    throw new Error("File too large");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const duplicateKey = (raw: string) => {
    const normalized = normalizeBookmarkUrl(raw);
    if (!normalized) return null;
    const url = new URL(normalized);
    url.hash = "";
    return url.toString();
  };
  const seen = new Set(existing.map(duplicateKey).filter(Boolean));
  const groups = new Map<string, LinkItem[]>();
  let duplicates = 0,
    count = 0;
  for (const anchor of doc.querySelectorAll("a[href]")) {
    const url = normalizeBookmarkUrl(anchor.getAttribute("href") ?? "");
    if (!url) continue;
    if (seen.has(duplicateKey(url))) {
      duplicates++;
      continue;
    }
    if (count >= 1000) throw new Error("Too many bookmarks");
    seen.add(duplicateKey(url));
    count++;
    let parent = anchor.parentElement;
    const folders: string[] = [];
    while (parent) {
      if (parent.tagName === "DL") {
        const heading =
          parent.previousElementSibling?.tagName === "H3"
            ? parent.previousElementSibling
            : null;
        if (heading?.textContent?.trim())
          folders.unshift(heading.textContent.trim());
      }
      parent = parent.parentElement;
    }
    const name = folders.join(" / ") || "Bookmarks";
    const links = groups.get(name) ?? [];
    links.push({
      id: generateId(),
      name: anchor.textContent?.trim().slice(0, 200) || new URL(url).hostname,
      url,
      description: "",
      icon: "Globe",
      iconSource: "lucide",
      tags: folders.slice(0, 20).map((folder) => folder.slice(0, 100)),
    });
    groups.set(name, links);
  }
  return {
    groups: [...groups].map(([name, links]) => ({ name, links })),
    duplicates,
    count,
  };
}
