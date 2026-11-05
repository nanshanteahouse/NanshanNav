import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { bodyLimit } from "hono/body-limit";
import { safeImage, MAX_IMAGE_BYTES } from "../lib/images.js";
import { parseHttpUrl, outbound } from "../lib/outbound.js";
import { registeredTargets } from "../lib/targets.js";
import { getCachedFavicon, cacheFavicon } from "../lib/favicon.js";

const imageHeaders = {
  "Content-Type": "image/webp",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cache-Control": "public, max-age=86400",
};

// A bounded global budget also prevents many distinct clients exhausting connections.
let active = 0;
let tokens = 30;
let refill = Date.now();
function acquire() {
  const now = Date.now();
  tokens = Math.min(30, tokens + (now - refill) / 2000);
  refill = now;
  if (active >= 4 || tokens < 1) return false;
  tokens -= 1;
  active += 1;
  return true;
}

export function createMediaRoutes(uploadDir: string) {
  const routes = new Hono();
  routes.post(
    "/api/admin/upload",
    bodyLimit({ maxSize: MAX_IMAGE_BYTES + 1024 * 1024 }),
    async (c) => {
      const body = await c.req.parseBody();
      const file = body.image;
      if (!(file instanceof File))
        return c.json({ error: "Use multipart field image" }, 400);
      if (file.size > MAX_IMAGE_BYTES)
        return c.json({ error: "Image exceeds 20 MB" }, 413);
      let encoded: Buffer;
      try {
        encoded = await safeImage(Buffer.from(await file.arrayBuffer()));
      } catch {
        return c.json(
          { error: "Invalid raster image; SVG and HTML are disabled" },
          415,
        );
      }
      const filename = `${randomUUID()}.webp`;
      await writeFile(path.join(uploadDir, filename), encoded, { flag: "wx" });
      return c.json({ url: `/uploads/${filename}` });
    },
  );
  routes.get("/api/favicon", async (c) => {
    let url: URL;
    try {
      url = parseHttpUrl(c.req.query("url") || "");
    } catch {
      return c.json({ error: "Valid HTTP(S) URL required" }, 400);
    }
    const cached = await getCachedFavicon(url.origin);
    if (cached) return c.body(new Uint8Array(cached), 200, imageHeaders);
    if (!acquire()) return c.json({ error: "Too many image requests" }, 429);
    try {
      const trusted = [
        ...registeredTargets("NAV_HEALTH_TARGETS_JSON"),
        ...registeredTargets("NAV_PVE_HOSTS_JSON", true),
      ].find((target) => new URL(target.url).origin === url.origin);
      for (const suffix of [
        "/favicon.ico",
        "/favicon.png",
        "/assets/favicon.png",
      ]) {
        try {
          const response = await outbound(new URL(suffix, url.origin), {
            privateAllowed: Boolean(trusted),
            addresses: trusted?.addresses,
            maxBytes: 2 * 1024 * 1024,
            timeoutMs: 3000,
          });
          if (response.status !== 200) continue;
          const encoded = await safeImage(response.body, true);
          await cacheFavicon(url.origin, encoded);
          return c.body(new Uint8Array(encoded), 200, imageHeaders);
        } catch {
          /* Try the next same-origin raster favicon. */
        }
      }
      return c.json({ error: "Safe raster favicon not found" }, 404);
    } finally {
      active -= 1;
    }
  });
  // Never serve arbitrary legacy uploads directly. Decode them before returning inert image content.
  routes.get("/uploads/*", async (c) => {
    const filename = c.req.path.slice("/uploads/".length);
    if (!/^[a-f0-9-]{36}\.(webp|png|jpe?g|gif|bmp)$/i.test(filename))
      return c.notFound();
    try {
      const data = await readFile(path.join(uploadDir, filename));
      return c.body(new Uint8Array(await safeImage(data)), 200, imageHeaders);
    } catch {
      return c.notFound();
    }
  });
  return routes;
}
