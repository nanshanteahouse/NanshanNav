import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const CACHE_DIR = path.resolve(UPLOAD_DIR, 'favicons');
const CACHE_TTL = 7 * 24 * 3600 * 1000; // 7 days

export interface FaviconCacheEntry {
  data: Buffer;
  contentType: string;
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getHostHash(host: string): string {
  return createHash('md5').update(host).digest('hex');
}

function getCachePath(host: string): string {
  return path.join(CACHE_DIR, `${getHostHash(host)}.ico`);
}

function getMetaPath(host: string): string {
  return path.join(CACHE_DIR, `${getHostHash(host)}.meta.json`);
}

export function getCachedFavicon(host: string): FaviconCacheEntry | null {
  ensureCacheDir();
  const cachePath = getCachePath(host);
  if (!existsSync(cachePath)) return null;
  const age = Date.now() - statSync(cachePath).mtimeMs;
  if (age > CACHE_TTL) return null;

  const data = readFileSync(cachePath);

  // Read metadata file for contentType, fall back to image/x-icon for backward compat
  let contentType = 'image/x-icon';
  const metaPath = getMetaPath(host);
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      if (meta.contentType) contentType = meta.contentType;
    } catch {
      // malformed meta file, use default
    }
  }

  return { data, contentType };
}

export function cacheFavicon(host: string, data: Buffer, contentType: string): void {
  ensureCacheDir();
  const cachePath = getCachePath(host);
  writeFileSync(cachePath, data);

  const metaPath = getMetaPath(host);
  writeFileSync(metaPath, JSON.stringify({
    contentType,
    cachedAt: Date.now(),
  }));
}
