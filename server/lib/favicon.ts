import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile, rename } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.resolve(
  process.env.UPLOAD_DIR || "./uploads",
  "favicons-v2",
);
const CACHE_TTL = 7 * 24 * 3600 * 1000;
function cachePath(origin: string) {
  return path.join(
    CACHE_DIR,
    `${createHash("sha256").update(origin).digest("hex")}.webp`,
  );
}
export async function getCachedFavicon(origin: string): Promise<Buffer | null> {
  try {
    const file = cachePath(origin);
    if (Date.now() - (await stat(file)).mtimeMs > CACHE_TTL) return null;
    return await readFile(file);
  } catch {
    return null;
  }
}
export async function cacheFavicon(origin: string, data: Buffer) {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = cachePath(origin);
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, data);
  await rename(temporary, file);
}
