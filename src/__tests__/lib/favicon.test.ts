import { describe, it, expect } from 'vitest';
import { getFaviconUrl } from '@/lib/api/favicon';

describe('getFaviconUrl', () => {
  it('should encode a normal HTTPS URL', () => {
    expect(getFaviconUrl('https://example.com')).toBe(
      '/api/favicon?url=https%3A%2F%2Fexample.com',
    );
  });

  it('should prepend https:// and encode a bare hostname', () => {
    const result = getFaviconUrl('192.0.2.1');
    expect(result).toBe(
      '/api/favicon?url=https%3A%2F%2F192.0.2.1',
    );
  });

  it('should normalizeUrl keeps protocol-relative URL as-is then encode it', () => {
    // normalizeUrl('//cdn.example.com') → '//cdn.example.com' (kept as-is)
    // encodeURIComponent('//cdn.example.com') → '%2F%2Fcdn.example.com'
    expect(getFaviconUrl('//cdn.example.com')).toBe(
      '/api/favicon?url=%2F%2Fcdn.example.com',
    );
  });

  it('should handle empty string without throwing', () => {
    expect(() => getFaviconUrl('')).not.toThrow();
    expect(getFaviconUrl('')).toBe('/api/favicon?url=');
  });

  it('should properly encode special characters like spaces', () => {
    expect(getFaviconUrl('https://example.com/path?q=a b')).toBe(
      '/api/favicon?url=https%3A%2F%2Fexample.com%2Fpath%3Fq%3Da%20b',
    );
  });

  it.each([
    ['https://example.com/#/dashboard?tab=home', 'https://example.com/'],
    ['http://example.com/app?view=all#settings', 'http://example.com/app?view=all'],
    ['example.com/app#settings', 'https://example.com/app'],
    ['https://example.com/path%23part?q=%23value#route', 'https://example.com/path%23part?q=%23value'],
    ['https://example.com/path%23part?q=%23value', 'https://example.com/path%23part?q=%23value'],
    ['https://example.com/app#', 'https://example.com/app'],
  ])('should request the favicon for %s without its fragment', (url, expected) => {
    const link = { url };

    const request = new URL(getFaviconUrl(link.url), 'https://dashboard.example');

    expect(request.searchParams.get('url')).toBe(expected);
    expect(link.url).toBe(url);
  });
});
