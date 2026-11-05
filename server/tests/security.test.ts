import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { Hono } from "hono";
import sharp from "sharp";
import { managementBoundary, readOnlySetting } from "../lib/access.js";
import { safeImage } from "../lib/images.js";
import { outbound } from "../lib/outbound.js";
import { registeredTargets } from "../lib/targets.js";

let directory: string;
const previousDirectory = process.cwd();
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "nav-security-"));
  await mkdir(path.join(directory, "server/config"), { recursive: true });
  process.chdir(directory);
});
after(async () => {
  process.chdir(previousDirectory);
  await rm(directory, { recursive: true, force: true });
});

test("management is available without identity, public routes reject mutations, and cross-origin writes fail", async () => {
  const app = new Hono();
  app.use("*", managementBoundary(false));
  app.get("/api/dashboard", (c) => c.json({ public: true }));
  app.put("/api/admin/dashboard", (c) => c.json({ saved: true }));
  assert.equal((await app.request("/api/dashboard")).status, 200);
  assert.equal(
    (await app.request("/api/dashboard", { method: "PUT" })).status,
    405,
  );
  assert.equal(
    (await app.request("/api/admin/dashboard", { method: "PUT" })).status,
    200,
  );
  for (const headers of [
    { Origin: "https://evil.example" },
    { Origin: "null" },
    { "Sec-Fetch-Site": "cross-site" },
    { Origin: "http://evil.example", "X-Forwarded-Host": "evil.example" },
  ]) {
    assert.equal(
      (
        await app.request("http://nav.lan/api/admin/dashboard", {
          method: "PUT",
          headers,
        })
      ).status,
      403,
    );
  }
  assert.equal(
    (
      await app.request("http://192.168.1.10:3001/api/admin/dashboard", {
        method: "PUT",
        headers: { Origin: "http://192.168.1.10:3001" },
      })
    ).status,
    200,
  );
});

test("read-only setting is explicit and rejects invalid deployment values", () => {
  assert.equal(readOnlySetting("true"), true);
  assert.equal(readOnlySetting("false"), false);
  assert.equal(readOnlySetting(""), false);
  assert.throws(() => readOnlySetting("treu"));
});

test("full application separates management paths and read-only mode closes every management entry", async () => {
  const { createApp } = await import("../app.js");
  const { DEFAULT_SETTINGS } = await import("../../src/types/dashboard.ts");
  const { readdir, readFile } = await import("node:fs/promises");
  const dataDir = path.join(directory, "dashboard-data");
  const distDir = path.join(directory, "dist");
  await mkdir(distDir);
  await writeFile(
    path.join(distDir, "index.html"),
    "<!doctype html><title>Fixture</title>",
  );
  const options = { dataDir, uploadDir: directory, distDir };
  const app = createApp({ ...options, readOnly: false });
  assert.equal((await app.request("/admin")).status, 200);
  assert.deepEqual(await (await app.request("/api/capabilities")).json(), {
    readOnly: false,
  });
  const saved = await app.request("/api/admin/dashboard", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": '"0"' },
    body: JSON.stringify({
      schemaVersion: 1,
      settings: DEFAULT_SETTINGS,
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      widgets: [],
    }),
  });
  assert.equal(saved.status, 200);
  assert.equal((await app.request("/api/dashboard")).status, 200);
  assert.equal(
    (await app.request("/api/admin/dashboard/versions")).status,
    200,
  );
  assert.equal((await app.request("/api/admin/pve/hosts")).status, 200);
  for (const oldPath of [
    "/api/dashboard/versions",
    "/api/dashboard/rollback",
    "/api/upload",
    "/api/session",
  ]) {
    assert.equal((await app.request(oldPath)).status, 404);
  }
  for (const oldPath of ["/api/dashboard", "/api/upload", "/api/pve/tokens"]) {
    assert.equal((await app.request(oldPath, { method: "PUT" })).status, 405);
  }
  const snapshot = await readFile(
    path.join(dataDir, "dashboard-state.json"),
    "utf8",
  );
  const files = await readdir(directory);
  const display = createApp({ ...options, readOnly: true });
  assert.deepEqual(await (await display.request("/api/capabilities")).json(), {
    readOnly: true,
  });
  for (const route of [
    "/admin",
    "/admin/",
    "/admin/nested",
    "/api/admin",
    "/api/admin/",
    "/api/admin/dashboard",
    "/api/admin/dashboard/versions",
    "/api/admin/dashboard/rollback",
    "/api/admin/upload",
    "/api/admin/pve/hosts",
    "/api/admin/pve/tokens",
  ]) {
    for (const method of ["GET", "HEAD", "POST", "PUT", "DELETE"]) {
      const response = await display.request(route, { method });
      assert.equal(response.status, 404, `${method} ${route}`);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  }
  assert.equal((await display.request("/")).status, 200);
  assert.equal((await display.request("/api/dashboard")).status, 200);
  assert.equal((await display.request("/api/status")).status, 200);
  assert.equal(
    await readFile(path.join(dataDir, "dashboard-state.json"), "utf8"),
    snapshot,
  );
  assert.deepEqual(await readdir(directory), files);
});

test("raster images are decoded and reencoded; disguised HTML/SVG and invalid WebP are rejected", async () => {
  const input = await sharp({
    create: { width: 10, height: 10, channels: 4, background: "#fa8123" },
  })
    .png()
    .toBuffer();
  const encoded = await safeImage(input);
  assert.equal((await sharp(encoded).metadata()).format, "webp");
  await assert.rejects(
    safeImage(Buffer.from("<html><script>alert(1)</script></html>")),
  );
  await assert.rejects(
    safeImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
      ),
    ),
  );
  await assert.rejects(safeImage(Buffer.from("RIFFgarbWEBPinvalid")));
});

test("outbound pins allowlisted addresses, blocks private targets by default and never follows redirects", async () => {
  let requests = 0;
  const server = createServer((_request, response) => {
    requests++;
    response.writeHead(302, { Location: "http://127.0.0.1/secret" });
    response.end("redirect");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as import("node:net").AddressInfo).port}/`;
  try {
    await assert.rejects(outbound(url));
    await assert.rejects(
      outbound(url, { privateAllowed: true, addresses: ["192.168.1.2"] }),
    );
    const response = await outbound(url, {
      privateAllowed: true,
      addresses: ["127.0.0.1"],
    });
    assert.equal(response.status, 302);
    assert.equal(requests, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("PVE requires a registered HTTPS origin, rejects arbitrary host, mutation and unapproved paths", async () => {
  process.env.NAV_PVE_HOSTS_JSON =
    '[{"id":"home","url":"https://pve.example:8006","addresses":["192.168.1.2"]}]';
  const { default: pve, pveAdminRoutes } =
    await import("../routes/pve-proxy.js");
  const app = new Hono()
    .route("/api/pve", pve)
    .route("/api/admin/pve", pveAdminRoutes);
  assert.equal(
    (
      await app.request("/api/pve/nodes", {
        headers: { "X-PVE-Host": "evil.example" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await app.request("/api/pve/nodes", {
        method: "POST",
        headers: { "X-PVE-Host-ID": "home" },
      })
    ).status,
    405,
  );
  assert.equal(
    (
      await app.request("/api/pve/nodes/node/qemu", {
        headers: { "X-PVE-Host-ID": "home" },
      })
    ).status,
    403,
  );
  const saved = await app.request("/api/admin/pve/tokens", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hostId: "home",
      token: "monitor@pve!synthetic=SYNTHETIC_SECRET",
    }),
  });
  assert.equal(saved.status, 200);
  assert.equal(
    (
      await app.request("/api/pve/nodes", {
        headers: { "X-PVE-Host": "evil.example" },
      })
    ).status,
    400,
  );
  const { readFile } = await import("node:fs/promises");
  assert.ok(
    !(
      await readFile(
        path.join(directory, "server/config/pve-tokens.json"),
        "utf8",
      )
    ).includes("SYNTHETIC_SECRET"),
  );
  const hosts = await (await app.request("/api/admin/pve/hosts")).json();
  assert.equal(hosts[0].id, "home");
  process.env.NAV_PVE_HOSTS_JSON =
    '[{"id":"bad","url":"http://pve.example:8006"}]';
  assert.throws(() => registeredTargets("NAV_PVE_HOSTS_JSON", true));
  process.env.NAV_PVE_HOSTS_JSON =
    '[{"id":"bad","url":"https://pve.example:8006"}]';
  assert.throws(() => registeredTargets("NAV_PVE_HOSTS_JSON", true));
  process.env.NAV_PVE_HOSTS_JSON = "[]";
});

test("health checking accepts registered exact URL only and never falls back to GET", async () => {
  let method = "";
  const server = createServer((request, response) => {
    method = request.method || "";
    response.writeHead(405);
    response.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as import("node:net").AddressInfo).port}/`;
  process.env.NAV_HEALTH_TARGETS_JSON = JSON.stringify([
    { id: "synthetic", url },
  ]);
  const { healthRoutes } = await import("../routes/health.js");
  try {
    assert.equal(
      (
        await healthRoutes.request(
          "/api/health-check?url=http://127.0.0.1/admin",
        )
      ).status,
      400,
    );
    const response = await healthRoutes.request(
      "/api/health-check?serviceId=synthetic",
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).statusCode, 405);
    assert.equal(method, "HEAD");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("uploaded filename cannot turn HTML into a same-origin page, legacy HTML is not served", async () => {
  const { createMediaRoutes } = await import("../routes/media.js");
  const app = createMediaRoutes(directory);
  const form = new FormData();
  form.set(
    "image",
    new File(["<html><script>alert(1)</script></html>"], "attack.html", {
      type: "image/svg+xml",
    }),
  );
  assert.equal(
    (await app.request("/api/admin/upload", { method: "POST", body: form }))
      .status,
    415,
  );
  const valid = new FormData();
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  valid.set(
    "image",
    new File([new Uint8Array(png)], "attack.html", { type: "text/html" }),
  );
  const response = await app.request("/api/admin/upload", {
    method: "POST",
    body: valid,
  });
  const { url } = await response.json();
  assert.match(url, /\.webp$/);
  const image = await app.request(url);
  assert.equal(image.headers.get("content-type"), "image/webp");
  await writeFile(
    path.join(directory, "a".repeat(36) + ".html"),
    "<html>evil</html>",
  );
  assert.equal(
    (await app.request("/uploads/" + "a".repeat(36) + ".html")).status,
    404,
  );
});

test("favicon HTML is never served and valid remote raster content becomes same-origin WebP", async () => {
  let valid = false;
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  const server = createServer((_request, response) => {
    response.setHeader("Content-Type", valid ? "image/png" : "text/html");
    response.end(
      valid ? png : "<html><script>alert(document.domain)</script></html>",
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as import("node:net").AddressInfo).port}/`;
  process.env.NAV_HEALTH_TARGETS_JSON = JSON.stringify([
    { id: "favicon-fixture", url },
  ]);
  const { createMediaRoutes } = await import("../routes/media.js");
  const app = createMediaRoutes(directory);
  try {
    const malicious = await app.request(
      `/api/favicon?url=${encodeURIComponent(url)}`,
    );
    assert.equal(malicious.status, 404);
    assert.doesNotMatch(await malicious.text(), /<script>/);
    valid = true;
    const response = await app.request(
      `/api/favicon?url=${encodeURIComponent(url)}`,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(
      (await sharp(Buffer.from(await response.arrayBuffer())).metadata())
        .format,
      "webp",
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
