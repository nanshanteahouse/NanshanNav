import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAuthConfig } from './render-auth-config.mjs';

const env = {
  NAV_PUBLIC_URL: 'https://nav.example.com', NAV_DOMAIN: 'nav.example.com',
  JWT_SECRET: 'b'.repeat(64), SESSION_SECRET: 'c'.repeat(64),
  STORAGE_ENCRYPTION_KEY: 'd'.repeat(64), AUTHELIA_USER: 'admin', AUTHELIA_EMAIL: 'admin@example.com',
  AUTHELIA_PASSWORD: '$argon2id$v=19$m=65536,t=3,p=4$SYNTHETIC$SYNTHETIC',
};
test('renders cookie domain, public login URL, secrets and literal password hashes into private files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'nav-auth-config-'));
  try {
    await renderAuthConfig({ env, templateDir: fileURLToPath(new URL('../authelia/config', import.meta.url)), outputDir: directory });
    const config = await readFile(path.join(directory, 'configuration.yml'), 'utf8');
    const users = await readFile(path.join(directory, 'users.yml'), 'utf8');
    assert.ok(config.includes('https://nav.example.com/auth'));
    assert.ok(config.includes("'^/admin([/?].*)?$'"));
    assert.ok(config.includes("'^/api/admin([/?].*)?$'"));
    assert.ok(config.includes("- 'group:admins'"));
    assert.ok(config.includes('default_policy: deny'));
    assert.ok(config.includes('encryption_key: "' + 'd'.repeat(64) + '"'));
    assert.ok(users.includes(env.AUTHELIA_PASSWORD));
    assert.ok(!config.includes('${') && !users.includes('${'));
    assert.equal((await stat(path.join(directory, 'users.yml'))).mode & 0o777, 0o600);
    await assert.rejects(renderAuthConfig({ env: { ...env, NAV_PUBLIC_URL: 'http://nav.example.com' }, outputDir: directory }), /HTTPS/);
    await assert.rejects(renderAuthConfig({ env: { ...env, AUTHELIA_PASSWORD: 'plain-password' }, outputDir: directory }), /hash/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

// Verify both boundaries: protecting only /admin leaves management fetches public.
test('optional proxy protects exact management roots and descendants without serving files directly', async () => {
  for (const name of ['../nginx/conf.d/nav.conf', '../nginx/nginx.conf.example']) {
    const config = await readFile(new URL(name, import.meta.url), 'utf8');
    for (const route of ['= /admin', '^~ /admin/', '= /api/admin', '^~ /api/admin/']) {
      const block = config.split(`location ${route} {`)[1]?.split('\n    }')[0];
      assert.ok(block, `${name}: missing ${route}`);
      assert.match(block, /auth_request \/authelia;/);
      assert.match(block, /proxy_pass http:\/\/backend;/);
      if (route.includes('/api/')) assert.doesNotMatch(block, /error_page 401/);
    }
    assert.doesNotMatch(config, /(?:^|\n)\s*(?:root|alias|try_files)\s/);
  }
});

test('Authelia policy matches management roots, descendants and queries, only for admins', async () => {
  const template = await readFile(new URL('../authelia/config/configuration.yml', import.meta.url), 'utf8');
  const resources = [...template.matchAll(/- '(\^\/[^']+)'/g)].map((match) => new RegExp(match[1]));
  for (const route of ['/admin', '/admin/', '/admin/settings', '/admin?tab=1', '/api/admin', '/api/admin/', '/api/admin/dashboard?revision=2']) {
    assert.ok(resources.some((resource) => resource.test(route)), `unprotected ${route}`);
  }
  for (const route of ['/', '/administrator', '/api/administrator', '/api/dashboard', '/api/status']) {
    assert.ok(resources.every((resource) => !resource.test(route)), `unexpected management route ${route}`);
  }
  assert.match(template, /subject:\s*\n\s*- 'group:admins'/);
  assert.match(template, /default_policy: deny/);
});

test('standalone publishes backend; optional authenticated stack does not publish backend', async () => {
  const standalone = await readFile(new URL('../docker/docker-compose.yml', import.meta.url), 'utf8');
  const optional = await readFile(new URL('../docker/docker-compose.authelia.yml', import.meta.url), 'utf8');
  assert.match(standalone, /ports:[\s\S]+NAV_BIND_ADDRESS:-0\.0\.0\.0/);
  assert.doesNotMatch(standalone, /NAV_DOMAIN|NAV_PUBLIC_URL|authelia/);
  assert.match(standalone, /NAV_READ_ONLY/);
  assert.doesNotMatch(optional.split('\n  nginx:')[0], /\n\s+ports:/);
  assert.match(optional, /127\.0\.0\.1/);
});
