import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '@/lib/utils/url';

describe('normalizeUrl', () => {
  it('should return URL as-is if it already has https://', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should prepend https:// to a bare hostname', () => {
    expect(normalizeUrl('192.168.64.1')).toBe('https://192.168.64.1');
  });

  it('should trim whitespace and prepend https://', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
  });

  it('should return protocol-relative URL as-is', () => {
    expect(normalizeUrl('//cdn.example.com')).toBe('//cdn.example.com');
  });
});
