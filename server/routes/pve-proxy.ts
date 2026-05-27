import { Hono } from 'hono';
import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

interface TokensConfig {
  default?: string;
  hosts?: Record<string, string>;
}

const TOKENS_PATH = path.resolve(process.cwd(), 'server/config/pve-tokens.json');

async function loadTokens(): Promise<TokensConfig | null> {
  if (!existsSync(TOKENS_PATH)) return null;
  try {
    const raw = await readFile(TOKENS_PATH, 'utf-8');
    return JSON.parse(raw) as TokensConfig;
  } catch {
    return null;
  }
}

function getToken(tokens: TokensConfig | null, host: string): string | undefined {
  // Priority: host-specific > default > env fallback
  if (tokens?.hosts?.[host]) return tokens.hosts[host];
  if (tokens?.default) return tokens.default;
  return process.env.PVE_API_TOKEN;
}

function normalizeHost(host: string): string {
  return host.replace(/\/+$/, '');
}

const pveProxy = new Hono();

// ── Token management API ──

/**
 * Mask a token for safe display.
 * "monitor@pve!dashboard=abc123xyz" → "monit****xyz"
 */
function maskToken(token: string): string {
  if (token.length <= 8) return '****';
  const head = token.slice(0, 5);
  const tail = token.slice(-4);
  return `${head}****${tail}`;
}

// GET /api/pve/tokens — query token status (masked)
pveProxy.get('/tokens', async (c) => {
  const host = normalizeHost(c.req.query('host') || c.req.header('X-PVE-Host') || '');
  const tokens = await loadTokens();

  const token = tokens?.hosts?.[host] || tokens?.default || '';
  if (token) {
    return c.json({
      hasToken: true,
      masked: maskToken(token),
      source: tokens?.hosts?.[host] ? 'host' : 'default',
    });
  }
  return c.json({ hasToken: false });
});

// PUT /api/pve/tokens — save a token
pveProxy.put('/tokens', async (c) => {
  const body = await c.req.json();
  const host = normalizeHost(body.host || 'default');
  const token = body.token;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  const tokens = (await loadTokens()) || {};
  if (host === 'default') {
    tokens.default = token;
  } else {
    if (!tokens.hosts) tokens.hosts = {};
    tokens.hosts[host] = token;
  }

  // Atomic write: tmp → rename
  const tmp = TOKENS_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(tokens, null, 2), 'utf-8');
  await rename(tmp, TOKENS_PATH);

  return c.json({ masked: maskToken(token) });
});

// DELETE /api/pve/tokens — remove a host-specific token
pveProxy.delete('/tokens', async (c) => {
  const host = normalizeHost(c.req.query('host') || '');
  if (!host || host === 'default') {
    return c.json({ error: 'Must specify a host name to delete' }, 400);
  }

  const tokens = await loadTokens();
  if (tokens?.hosts?.[host]) {
    delete tokens.hosts[host];
    const tmp = TOKENS_PATH + '.tmp';
    await writeFile(tmp, JSON.stringify(tokens, null, 2), 'utf-8');
    await rename(tmp, TOKENS_PATH);
  }

  return c.json({ success: true });
});

pveProxy.all('*', async (c) => {
  const hostHeader = c.req.header('X-PVE-Host');
  let target = hostHeader || 'pve.lan:8006';
  if (!target.startsWith('http')) target = `https://${target}`;
  target = normalizeHost(target);

  const tokens = await loadTokens();
  const token = getToken(tokens, hostHeader ? normalizeHost(hostHeader) : '');

  if (!token) {
    return c.json({ error: 'No PVE API token configured' }, 502);
  }

  const pvePath = '/api2/json' + c.req.path.replace(/^\/api\/pve/, '');
  const query = c.req.query();
  const queryStr = Object.keys(query).length > 0
    ? '?' + new URLSearchParams(query as Record<string, string>).toString()
    : '';
  const pveUrl = `${target}${pvePath}${queryStr}`;

  console.log(`[PVE proxy] ${c.req.method} ${pveUrl}`);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(pveUrl, {
      method: c.req.method,
      signal: controller.signal,
      headers: {
        'Authorization': `PVEAPIToken=${token}`,
        'Accept': 'application/json',
      },
    });

    clearTimeout(timer);

    const body = await response.json();
    if (!response.ok) {
      console.error(`[PVE proxy] ${response.status} ${response.statusText}:`, JSON.stringify(body).slice(0, 300));
    }
    return c.json(body, response.status as any);
  } catch (err: any) {
    console.error(`[PVE proxy] fetch error:`, err?.message || err);
    if (err.name === 'AbortError') {
      return c.json({ error: 'Request to PVE timed out' }, 504);
    }
    return c.json({
      error: 'Bad Gateway',
      detail: err?.message || 'Cannot reach PVE host',
    }, 502);
  }
});

export default pveProxy;
