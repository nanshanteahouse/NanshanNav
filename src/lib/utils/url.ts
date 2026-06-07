/**
 * Normalizes a URL by ensuring it has a protocol prefix.
 *
 * - If URL already has a protocol (http://, https://, //, ftp://, etc.), returns as-is
 * - Otherwise prepends "https://"
 * - Trims whitespace
 *
 * @example
 *   normalizeUrl('192.168.64.1')       → 'https://192.168.64.1'
 *   normalizeUrl('http://192.168.64.1') → 'http://192.168.64.1'
 *   normalizeUrl('//cdn.example.com')   → '//cdn.example.com'
 *   normalizeUrl('  example.com  ')     → 'https://example.com'
 *   normalizeUrl('')                    → ''
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Already has a scheme (http://, https://, ftp://, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  // Protocol-relative URL (starting with //)
  if (trimmed.startsWith('//')) {
    return trimmed;
  }

  // Default: prepend https://
  return `https://${trimmed}`;
}
