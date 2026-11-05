import type { MiddlewareHandler } from "hono";

export function readOnlySetting(value = process.env.NAV_READ_ONLY): boolean {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  throw new Error("NAV_READ_ONLY must be true or false");
}

function within(path: string, root: string) {
  return path === root || path.startsWith(`${root}/`);
}

// Route separation and request integrity, not identity/authentication.
// Deployments may protect these same two prefixes at their reverse proxy.
export function managementBoundary(readOnly: boolean): MiddlewareHandler {
  return async (c, next) => {
    const adminApi = within(c.req.path, "/api/admin");
    const adminPage = within(c.req.path, "/admin");
    if (adminApi || adminPage) {
      c.header("Cache-Control", "no-store");
      if (readOnly)
        return c.json(
          { error: "Management is disabled in read-only mode" },
          404,
        );
    }
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(c.req.method);
    if (within(c.req.path, "/api") && mutation) {
      if (!adminApi) return c.json({ error: "Public APIs are read-only" }, 405);
      // A LAN app without login should still reject writes from unrelated sites.
      const origin = c.req.header("Origin");
      const host = c.req.header("Host") || new URL(c.req.url).host;
      let foreignOrigin = false;
      if (origin) {
        try {
          const parsed = new URL(origin);
          foreignOrigin =
            !["http:", "https:"].includes(parsed.protocol) ||
            parsed.host !== host;
        } catch {
          foreignOrigin = true;
        }
      }
      if (foreignOrigin || c.req.header("Sec-Fetch-Site") === "cross-site") {
        return c.json({ error: "Cross-origin write rejected" }, 403);
      }
    }
    await next();
  };
}
