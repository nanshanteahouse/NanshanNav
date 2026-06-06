export function getFaviconUrl(url: string): string {
  return `/api/favicon?url=${encodeURIComponent(url)}`;
}

export async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const res = await fetch(getFaviconUrl(url));
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
