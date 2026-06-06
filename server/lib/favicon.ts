import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const CACHE_DIR = path.resolve(UPLOAD_DIR, 'favicons');
const CACHE_TTL = 7 * 24 * 3600 * 1000; // 7 days

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

export function getCachedFavicon(host: string): Buffer | null {
  ensureCacheDir();
  const cachePath = getCachePath(host);
  if (!existsSync(cachePath)) return null;
  const age = Date.now() - statSync(cachePath).mtimeMs;
  if (age > CACHE_TTL) return null;
  return readFileSync(cachePath);
}

export function cacheFavicon(host: string, data: Buffer): void {
  ensureCacheDir();
  const cachePath = getCachePath(host);
  writeFileSync(cachePath, data);
}
