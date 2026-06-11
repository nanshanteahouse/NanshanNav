import { normalizeUrl } from '@/lib/utils/url';

export function getFaviconUrl(url: string): string {
  return `/api/favicon?url=${encodeURIComponent(normalizeUrl(url))}`;
}
