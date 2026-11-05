import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import path from "node:path";
import pveProxy, { pveAdminRoutes } from "./routes/pve-proxy.js";
import { createDashboardRoutes } from "./routes/dashboard.js";
import { createMediaRoutes } from "./routes/media.js";
import { healthRoutes } from "./routes/health.js";
import { managementBoundary, readOnlySetting } from "./lib/access.js";
import { registeredTargets } from "./lib/targets.js";

interface AppOptions {
  dataDir?: string;
  uploadDir?: string;
  distDir?: string;
  readOnly?: boolean;
}

export function createApp(options: AppOptions = {}) {
  const UPLOAD_DIR =
    options.uploadDir ?? path.resolve(process.env.UPLOAD_DIR || "./uploads");
  const DIST_DIR = options.distDir ?? path.resolve(process.cwd(), "dist");
  const readOnly = options.readOnly ?? readOnlySetting();
  // Fail startup on malformed allowlists and unsafe inherited TLS settings.
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0")
    throw new Error(
      "Remove NODE_TLS_REJECT_UNAUTHORIZED=0; configure NODE_EXTRA_CA_CERTS instead",
    );
  registeredTargets("NAV_PVE_HOSTS_JSON", true);
  registeredTargets("NAV_HEALTH_TARGETS_JSON");
  const embedOrigins = (process.env.NAV_EMBED_ORIGINS || "")
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const url = new URL(entry.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.origin !== entry.trim()
      )
        throw new Error("NAV_EMBED_ORIGINS requires exact HTTP(S) origins");
      return url.origin;
    });

  const app = new Hono();
  app.use("*", managementBoundary(readOnly));
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    if (
      !c.req.path.startsWith("/api/") &&
      !c.req.path.startsWith("/uploads/")
    ) {
      c.header(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; connect-src 'self'; font-src 'self' data:; frame-src 'self' ${embedOrigins.join(" ")}; object-src 'none'; base-uri 'self'; form-action 'self'`,
      );
    }
  });
  app.get("/api/embed-policy", (c) => c.json({ origins: embedOrigins }));
  app.get("/api/capabilities", (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ readOnly });
  });
  app.get("/api/status", (c) => c.json({ ok: true }));
  app.route("/api/pve", pveProxy);
  app.route("/api/admin/pve", pveAdminRoutes);
  app.route("/", healthRoutes);
  app.route("/", createMediaRoutes(UPLOAD_DIR));
  app.route(
    "/",
    createDashboardRoutes({
      dataDir: options.dataDir ?? path.resolve(process.cwd(), "server/config"),
      uploadsDir: UPLOAD_DIR,
    }),
  );
  app.all("/api/*", (c) => c.json({ error: "API route not found" }, 404));

  // SPA static assets and client-side routing fallback.
  // Nginx proxies these routes too, preserving the same CSP and image validation.

  app.get("/theme.js", serveStatic({ root: DIST_DIR }));
  app.get("/favicon.svg", serveStatic({ root: DIST_DIR }));
  app.get(
    "/assets/*",
    serveStatic({
      root: DIST_DIR,
      // Assets have content hashes — cache forever
      onFound: (_path, c) => {
        c.header("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
  app.get(
    "*",
    serveStatic({
      root: DIST_DIR,
      path: "index.html",
      // index.html must never be cached — it references hashed assets
      onFound: (_path, c) => {
        c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      },
    }),
  );

  return app;
}
