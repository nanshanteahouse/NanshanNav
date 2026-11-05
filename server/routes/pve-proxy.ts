import { Hono } from "hono";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  encryptToken,
  decryptToken,
  loadEncryptionKey,
  isEncryptedPayload,
} from "../lib/crypto.js";
import { registeredTargets } from "../lib/targets.js";
import { outbound } from "../lib/outbound.js";

const TOKENS_PATH = path.resolve(
  process.cwd(),
  "server/config/pve-tokens.json",
);
type TokenMap = Record<string, string>;

async function loadTokens(): Promise<TokenMap> {
  try {
    const config = JSON.parse(await readFile(TOKENS_PATH, "utf8"));
    const tokens: TokenMap = {};
    // Legacy host-specific entries migrate only when the exact origin is registered.
    for (const target of registeredTargets("NAV_PVE_HOSTS_JSON", true)) {
      const value =
        config.hosts?.[target.id] ??
        config.hosts?.[target.url] ??
        config.hosts?.[new URL(target.url).host];
      if (isEncryptedPayload(value))
        tokens[target.id] = decryptToken(value, loadEncryptionKey());
    }
    return tokens;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function saveTokens(tokens: TokenMap) {
  const hosts = Object.fromEntries(
    Object.entries(tokens).map(([id, token]) => [
      id,
      encryptToken(token, loadEncryptionKey()),
    ]),
  );
  await mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  const temporary = `${TOKENS_PATH}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify({ hosts }, null, 2), {
    mode: 0o600,
  });
  await rename(temporary, TOKENS_PATH);
}

let writes: Promise<unknown> = Promise.resolve();
function updateTokens(update: (tokens: TokenMap) => void) {
  const operation = writes.then(async () => {
    const tokens = await loadTokens();
    update(tokens);
    await saveTokens(tokens);
  });
  writes = operation.catch(() => undefined);
  return operation;
}

function findTarget(id?: string, legacy?: string) {
  const targets = registeredTargets("NAV_PVE_HOSTS_JSON", true);
  if (id) return targets.find((target) => target.id === id);
  if (legacy)
    return targets.find(
      (target) =>
        target.id === legacy ||
        target.url === legacy ||
        new URL(target.url).host === legacy,
    );
  return undefined;
}

const pveProxy = new Hono();
export const pveAdminRoutes = new Hono();
pveAdminRoutes.get("/hosts", (c) =>
  c.json(
    registeredTargets("NAV_PVE_HOSTS_JSON", true).map((target) => ({
      id: target.id,
      label: target.id,
      origin: target.url,
    })),
  ),
);

pveAdminRoutes.get("/tokens", async (c) => {
  const target = findTarget(c.req.query("hostId"), c.req.query("host"));
  if (!target) return c.json({ error: "Unknown registered PVE host ID" }, 400);
  const token = (await loadTokens())[target.id];
  return c.json(
    token
      ? { hasToken: true, masked: "********", source: "host" }
      : { hasToken: false },
  );
});

pveAdminRoutes.put("/tokens", async (c) => {
  const body = await c.req.json();
  const target = findTarget(body.hostId, body.host);
  if (
    !target ||
    typeof body.token !== "string" ||
    body.token.length > 4096 ||
    !/^[^\s=]+@[^\s=]+![^\s=]+=[^\s]+$/.test(body.token)
  ) {
    return c.json(
      { error: "Registered hostId and valid PVE API token required" },
      400,
    );
  }
  await updateTokens((tokens) => {
    tokens[target.id] = body.token;
  });
  return c.json({ masked: "********" });
});

pveAdminRoutes.delete("/tokens", async (c) => {
  const target = findTarget(c.req.query("hostId"), c.req.query("host"));
  if (!target) return c.json({ error: "Unknown registered PVE host ID" }, 400);
  await updateTokens((tokens) => {
    delete tokens[target.id];
  });
  return c.json({ success: true });
});

pveProxy.all("*", async (c) => {
  if (c.req.method !== "GET")
    return c.json({ error: "PVE monitoring is read-only" }, 405);
  const target = findTarget(
    c.req.header("X-PVE-Host-ID"),
    c.req.header("X-PVE-Host"),
  );
  if (!target) return c.json({ error: "Unknown registered PVE host ID" }, 400);
  const suffix = c.req.path.replace(/^\/api\/pve/, "");
  if (
    !/^\/(nodes|cluster\/resources)$/.test(suffix) &&
    !/^\/nodes\/[a-zA-Z0-9_-]+\/status$/.test(suffix)
  ) {
    return c.json({ error: "PVE route is not permitted" }, 403);
  }
  const token = (await loadTokens())[target.id];
  if (!token)
    return c.json(
      { error: "No token configured for this registered PVE host" },
      502,
    );
  const upstream = new URL(`/api2/json${suffix}`, target.url);
  const type = c.req.query("type");
  if (
    type &&
    ["vm", "storage", "node"].includes(type) &&
    suffix === "/cluster/resources"
  )
    upstream.searchParams.set("type", type);
  try {
    const response = await outbound(upstream, {
      privateAllowed: true,
      addresses: target.addresses,
      timeoutMs: 10000,
      headers: {
        Authorization: `PVEAPIToken=${token}`,
        Accept: "application/json",
      },
    });
    if (response.status >= 300)
      return c.json(
        { error: "PVE upstream rejected the request or attempted a redirect" },
        502,
      );
    return c.json(JSON.parse(response.body.toString()));
  } catch {
    return c.json(
      {
        error:
          "Cannot reach registered PVE host; check TLS trust and configuration",
      },
      502,
    );
  }
});

export default pveProxy;
