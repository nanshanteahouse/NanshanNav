import { Hono } from 'hono';
import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { encryptToken, decryptToken, loadEncryptionKey, isEncryptedPayload } from '../lib/crypto.js';
import type { EncryptedPayload } from '../lib/crypto.js';

interface TokensConfig {
  default?: string;
  hosts?: Record<string, string>;
}

interface RawTokensConfig {
  default?: string | EncryptedPayload;
  hosts?: Record<string, string | EncryptedPayload>;
}

const TOKENS_PATH = path.resolve(process.cwd(), 'server/config/pve-tokens.json');

function tryDecryptValue(value: unknown): string | null {
  if (typeof value === 'string') return null; // old plaintext, skip
  if (isEncryptedPayload(value)) {
    try {
      return decryptToken(value, loadEncryptionKey());
    } catch {
      return null; // tampered or wrong key
    }
  }
  return null;
}

async function loadTokens(): Promise<TokensConfig | null> {
  if (!existsSync(TOKENS_PATH)) return null;
  try {
    const raw = await readFile(TOKENS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as RawTokensConfig;
    const result: TokensConfig = {};

    if (parsed.default) {
      const decrypted = tryDecryptValue(parsed.default);
      if (decrypted !== null) result.default = decrypted;
    }

    if (parsed.hosts) {
      result.hosts = {};
      for (const [host, val] of Object.entries(parsed.hosts)) {
        const decrypted = tryDecryptValue(val);
        if (decrypted !== null) result.hosts[host] = decrypted;
      }
    }

    return result;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: TokensConfig): Promise<void> {
  const key = loadEncryptionKey();
  const raw: RawTokensConfig = {};

  if (tokens.default) {
    raw.default = encryptToken(tokens.default, key);
  }

  if (tokens.hosts && Object.keys(tokens.hosts).length > 0) {
    raw.hosts = {};
    for (const [host, token] of Object.entries(tokens.hosts)) {
      raw.hosts[host] = encryptToken(token, key);
    }
  }

  const tmp = TOKENS_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(raw, null, 2), 'utf-8');
  await rename(tmp, TOKENS_PATH);
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

  await saveTokens(tokens);

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
    await saveTokens(tokens);
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

    let body: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      body = await response.json();
    } else {
      const text = await response.text();
      body = { raw: text.substring(0, 500) };
    }

    if (!response.ok) {
      console.error(`[PVE proxy] ${response.status} ${response.statusText}:`, JSON.stringify(body).slice(0, 300));
      if (response.status === 401) {
        return c.json({ error: 'PVE API authentication failed — check your token' }, 502);
      }
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
