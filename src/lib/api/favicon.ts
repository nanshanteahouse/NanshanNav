import { normalizeUrl } from '@/lib/utils/url';

export function getFaviconUrl(url: string): string {
  // Keep encoded hashes in paths and queries; only discard the browser fragment.
  const requestUrl = normalizeUrl(url).split('#', 1)[0];
  return `/api/favicon?url=${encodeURIComponent(requestUrl)}`;
}
