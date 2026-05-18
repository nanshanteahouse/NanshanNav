import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, copyFileSync } from 'fs';
import { resolve, join, extname, dirname } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = resolve(__dirname, 'data');
const FAVICONS_DIR = join(DATA_DIR, 'favicons');
const SERVICES_FILE = join(DATA_DIR, 'services.json');
const SETTINGS_FILE = join(DATA_DIR, 'settings.json');
const SERVICES_TEMPLATE = join(DATA_DIR, 'services.json.example');
const SETTINGS_TEMPLATE = join(DATA_DIR, 'settings.json.example');
const DIST_DIR = resolve(__dirname, 'dist');

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const FAVICON_EXPIRE_DAYS = 7;
const STATUS_TIMEOUT_MS = 5000;
const STATUS_CONCURRENCY = 5;
const STATUS_STAGGER_MS = 2000;

interface ServiceCard {
  id: string;
  type: string;
  url?: string;
  enableStatusCheck?: boolean | null;
}

interface Category {
  id: string;
  cards: ServiceCard[];
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FAVICONS_DIR)) mkdirSync(FAVICONS_DIR, { recursive: true });
}

function readServicesFile(): { categories: Category[] } {
  if (!existsSync(SERVICES_FILE)) return { categories: [] };
  return JSON.parse(readFileSync(SERVICES_FILE, 'utf-8'));
}

function writeServicesFile(data: { categories: Category[] }) {
  writeFileSync(SERVICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readSettingsFile(): { settings: Record<string, unknown> } {
  if (!existsSync(SETTINGS_FILE)) return { settings: getDefaultSettings() };
  return JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
}

function writeSettingsFile(data: { settings: Record<string, unknown> }) {
  writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getDefaultSettings() {
  return {
    pageTitle: '家庭服务导航',
    showClock: true,
    showSearchBar: true,
    enableLocalFilter: true,
    searchEngines: [
      { id: 'engine_google', name: 'Google', urlTemplate: 'https://www.google.com/search?q={query}', enabled: true, isDefault: true },
      { id: 'engine_baidu', name: '百度', urlTemplate: 'https://www.baidu.com/s?wd={query}', enabled: true, isDefault: false },
      { id: 'engine_bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q={query}', enabled: false, isDefault: false },
      { id: 'engine_ddg', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q={query}', enabled: false, isDefault: false },
    ],
    enableStatusMonitor: false,
    statusCheckInterval: 60,
    statusCheckTimeout: 5,
    enablePveOverview: false,
    pveApiUrl: '',
    pveNodeName: '',
    pveApiToken: '',
    theme: 'system',
    colors: {
      light: { background: '#FAFAFA', card: '#FFFFFF', cardBorder: '#E5E7EB', textPrimary: '#1A1A1A', textSecondary: '#666666', accent: '#3B82F6', searchBg: '#FFFFFF', searchBorder: '#D1D5DB', categoryTitle: '#1A1A1A', statusOnline: '#22C55E', statusOffline: '#EF4444' },
      dark: { background: '#0F0F0F', card: '#1E1E1E', cardBorder: '#333333', textPrimary: '#E5E5E5', textSecondary: '#999999', accent: '#3B82F6', searchBg: '#252525', searchBorder: '#404040', categoryTitle: '#E5E5E5', statusOnline: '#22C55E', statusOffline: '#EF4444' },
    },
  };
}

function sanitizeSettings(raw: Record<string, unknown>, existing: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...raw };
  if (sanitized.pveApiToken === '********' && existing.pveApiToken) {
    sanitized.pveApiToken = existing.pveApiToken;
  }
  return sanitized;
}

function getAllServiceUrls(categories: Category[]): ServiceCard[] {
  const services: ServiceCard[] = [];
  for (const cat of categories) {
    for (const card of cat.cards) {
      if (card.type === 'service' && card.url) {
        services.push(card);
      }
    }
  }
  return services;
}

function isPrivateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

async function checkServiceStatus(url: string, timeoutMs: number): Promise<'online' | 'offline'> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('offline'), timeoutMs);
    try {
      const u = new URL(url);
      const isHttps = u.protocol === 'https:';
      const requestModule = isHttps ? https : http;
      const req = requestModule.request(
        {
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + u.search,
          method: 'HEAD',
          timeout: timeoutMs,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          rejectUnauthorized: false,
        },
        (res) => {
          clearTimeout(timer);
          resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 400 ? 'online' : 'offline');
        }
      );
      req.on('error', () => { clearTimeout(timer); resolve('offline'); });
      req.on('timeout', () => { clearTimeout(timer); req.destroy(); resolve('offline'); });
      req.end();
    } catch {
      clearTimeout(timer);
      resolve('offline');
    }
  });
}

async function checkAllStatuses(categories: Category[], timeoutMs: number): Promise<Record<string, 'online' | 'offline'>> {
  const results: Record<string, 'online' | 'offline'> = {};
  const allServices = getAllServiceUrls(categories).filter((s) => s.enableStatusCheck !== false && isPrivateUrl(s.url ?? ''));

  const limit = pLimit(STATUS_CONCURRENCY);

  const groupedByCategory: Category['cards'][][] = [];
  for (const cat of categories) {
    const catServices = cat.cards.filter((c) => c.type === 'service' && allServices.some((s) => s.id === c.id));
    if (catServices.length > 0) groupedByCategory.push(catServices);
  }

  for (const group of groupedByCategory) {
    const tasks = group.map((svc) =>
      limit(async () => {
        if (svc.type === 'service' && svc.url) {
          results[svc.id] = await checkServiceStatus(svc.url, timeoutMs);
        }
      })
    );
    await Promise.all(tasks);
    if (group !== groupedByCategory[groupedByCategory.length - 1]) {
      await new Promise((r) => setTimeout(r, STATUS_STAGGER_MS));
    }
  }

  return results;
}

async function fetchFavicon(targetUrl: string): Promise<Buffer | null> {
  const timeoutMs = 5000;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    try {
      const u = new URL(targetUrl);
      const faviconUrl = `${u.protocol}//${u.host}/favicon.ico`;
      const fu = new URL(faviconUrl);
      const isHttps = fu.protocol === 'https:';
      const requestModule = isHttps ? https : http;

      const req = requestModule.request(
        {
          hostname: fu.hostname,
          port: fu.port || (isHttps ? 443 : 80),
          path: fu.pathname,
          method: 'GET',
          timeout: timeoutMs,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            clearTimeout(timer);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
              resolve(Buffer.concat(chunks));
            } else {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => { clearTimeout(timer); resolve(null); });
      req.on('timeout', () => { clearTimeout(timer); req.destroy(); resolve(null); });
      req.end();
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

function getFaviconPath(url: string): string {
  const u = new URL(url);
  const hash = Buffer.from(u.host).toString('base64url').slice(0, 32);
  return join(FAVICONS_DIR, `${hash}.ico`);
}

function isFaviconExpired(filePath: string): boolean {
  if (!existsSync(filePath)) return true;
  const stat = statSync(filePath);
  const age = Date.now() - stat.mtimeMs;
  return age > FAVICON_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
}

async function start() {
  ensureDataDir();

  if (!existsSync(SERVICES_FILE)) {
    if (existsSync(SERVICES_TEMPLATE)) {
      copyFileSync(SERVICES_TEMPLATE, SERVICES_FILE);
    } else {
      writeFileSync(SERVICES_FILE, JSON.stringify({ categories: [] }, null, 2), 'utf-8');
    }
  }
  if (!existsSync(SETTINGS_FILE)) {
    if (existsSync(SETTINGS_TEMPLATE)) {
      copyFileSync(SETTINGS_TEMPLATE, SETTINGS_FILE);
    } else {
      writeFileSync(SETTINGS_FILE, JSON.stringify({ settings: getDefaultSettings() }, null, 2), 'utf-8');
    }
  }

  const fastify = Fastify({ logger: true });

  await fastify.register(fastifyMultipart, { limits: { fileSize: 100 * 1024 } });

  fastify.get('/api/config', async () => {
    const services = readServicesFile();
    const settingsRaw = readSettingsFile();
    const sanitized = { ...settingsRaw.settings };
    if (sanitized.pveApiToken && typeof sanitized.pveApiToken === 'string') {
      sanitized.pveApiToken = '********';
    }
    return { categories: services.categories, settings: sanitized };
  });

  fastify.put('/api/config', async (request) => {
    const body = request.body as { categories?: Category[]; settings?: Record<string, unknown> };
    if (body.categories) {
      writeServicesFile({ categories: body.categories });
    }
    if (body.settings) {
      const existing = readSettingsFile().settings;
      const sanitized = sanitizeSettings(body.settings, existing);
      writeSettingsFile({ settings: sanitized });
    }
    return { ok: true };
  });

  fastify.put('/api/config/categories', async (request) => {
    const body = request.body as { categories: Category[] };
    writeServicesFile({ categories: body.categories });
    return { ok: true };
  });

  fastify.put('/api/config/services', async (request) => {
    const body = request.body as { categories: Category[] };
    writeServicesFile({ categories: body.categories });
    return { ok: true };
  });

  fastify.put('/api/config/settings', async (request) => {
    const body = request.body as { settings: Record<string, unknown> };
    const existing = readSettingsFile().settings;
    const sanitized = sanitizeSettings(body.settings, existing);
    writeSettingsFile({ settings: sanitized });
    return { ok: true };
  });

  fastify.get('/api/status', async () => {
    const settings = readSettingsFile().settings;
    if (!settings.enableStatusMonitor) {
      return {};
    }
    const services = readServicesFile();
    const timeout = typeof settings.statusCheckTimeout === 'number' ? settings.statusCheckTimeout * 1000 : STATUS_TIMEOUT_MS;
    return await checkAllStatuses(services.categories, timeout);
  });

  fastify.get('/api/favicon', async (request) => {
    const query = request.query as { url?: string };
    if (!query.url) {
      return { error: 'Missing url parameter' };
    }

    const faviconPath = getFaviconPath(query.url);

    if (!isFaviconExpired(faviconPath)) {
      try {
        const data = await readFile(faviconPath);
        return data;
      } catch {}
    }

    const faviconData = await fetchFavicon(query.url);
    if (faviconData) {
      writeFileSync(faviconPath, faviconData);
      return faviconData;
    }

    return { error: 'Favicon not found' };
  });

  fastify.post('/api/icon/upload', async (request) => {
    const data = await request.file();
    if (!data) {
      return { error: 'No file uploaded' };
    }

    const serviceId = (data.fields as Record<string, { value: string }>)?.serviceId?.value ?? 'unknown';
    const ext = extname(data.filename).toLowerCase();
    if (!['.png', '.ico', '.svg'].includes(ext)) {
      return { error: 'Invalid file type' };
    }

    const filename = `custom_${serviceId}${ext}`;
    const filepath = join(FAVICONS_DIR, filename);

    const buffer = await data.toBuffer();
    if (buffer.length > 100 * 1024) {
      return { error: 'File too large' };
    }

    writeFileSync(filepath, buffer);
    return { path: `/favicons/${filename}` };
  });

  fastify.get('/api/pve/status', async () => {
    const settings = readSettingsFile().settings;
    if (!settings.enablePveOverview || !settings.pveApiUrl || !settings.pveNodeName || !settings.pveApiToken) {
      return { status: 'offline', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null };
    }

    try {
      const pveUrl = `${settings.pveApiUrl}/nodes/${settings.pveNodeName}/status`;
      const data = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        const u = new URL(pveUrl);
        const req = https.request(
          {
            hostname: u.hostname,
            port: u.port || 8006,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
              Authorization: settings.pveApiToken as string,
              'User-Agent': 'Mozilla/5.0',
            },
            rejectUnauthorized: false,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode ?? 500, body: Buffer.concat(chunks).toString() }));
          }
        );
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });

      if (data.statusCode === 401 || data.statusCode === 403) {
        return { status: 'unauthorized', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null };
      }

      if (data.statusCode < 200 || data.statusCode >= 400) {
        return { status: 'offline', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null };
      }

      const parsed = JSON.parse(data.body) as { data: { cpu: number; memory: { used: number; total: number }; uptime: number } };
      return {
        status: 'online',
        cpu: parsed.data.cpu,
        memoryUsed: parsed.data.memory.used,
        memoryTotal: parsed.data.memory.total,
        uptime: parsed.data.uptime,
      };
    } catch {
      return { status: 'offline', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null };
    }
  });

  if (process.env.NODE_ENV === 'production' && existsSync(DIST_DIR)) {
    await fastify.register(fastifyStatic, {
      root: DIST_DIR,
      prefix: '/',
      wildcard: true,
    });

    fastify.setNotFoundHandler(async (_request, reply) => {
      return reply.type('text/html').send(readFileSync(join(DIST_DIR, 'index.html'), 'utf-8'));
    });
  }

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
