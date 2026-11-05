import { Hono } from "hono";
import { registeredTargets } from "../lib/targets.js";
import { outbound, parseHttpUrl } from "../lib/outbound.js";

export const healthRoutes = new Hono();
interface Check {
  checkedAt: string;
  reachable: boolean;
  statusCode?: number;
}
interface HealthResult {
  reachable: boolean;
  statusCode?: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  history: Check[];
}
let inFlight = 0;
const cache = new Map<string, { at: number; result: HealthResult }>();
let allowance = 60;
let previous = Date.now();
healthRoutes.get("/api/health-check", async (c) => {
  const targets = registeredTargets("NAV_HEALTH_TARGETS_JSON");
  const id = c.req.query("serviceId");
  let legacy: string | undefined;
  try {
    if (c.req.query("url")) legacy = parseHttpUrl(c.req.query("url")!).href;
  } catch {
    /* Rejected below. */
  }
  const target = targets.find((entry) =>
    id ? entry.id === id : entry.url === legacy,
  );
  if (!target) return c.json({ error: "Unknown registered service ID" }, 400);
  const cached = cache.get(target.id);
  if (cached && Date.now() - cached.at < 15000) return c.json(cached.result);
  const now = Date.now();
  allowance = Math.min(60, allowance + (now - previous) / 1000);
  previous = now;
  if (inFlight >= 4 || allowance < 1)
    return c.json({ error: "Health check rate limit reached" }, 429);
  allowance -= 1;
  inFlight += 1;
  let reachable = false;
  let statusCode: number | undefined;
  try {
    const response = await outbound(target.url, {
      privateAllowed: true,
      addresses: target.addresses,
      method: "HEAD",
      maxBytes: 0,
    });
    statusCode = response.status;
    // Any HTTP response proves reachability, including redirects; never follow Location.
    reachable = true;
  } catch {
    /* Unreachable/TLS/DNS/timeout errors return no upstream details. */
  } finally {
    inFlight -= 1;
  }
  const checkedAt = new Date().toISOString();
  const result: HealthResult = {
    reachable,
    ...(statusCode === undefined ? {} : { statusCode }),
    lastSuccessAt: reachable ? checkedAt : cached?.result.lastSuccessAt,
    lastFailureAt: reachable ? cached?.result.lastFailureAt : checkedAt,
    history: [
      ...(cached?.result.history || []),
      {
        checkedAt,
        reachable,
        ...(statusCode === undefined ? {} : { statusCode }),
      },
    ].slice(-20),
  };
  cache.set(target.id, { at: Date.now(), result });
  return c.json(result);
});
