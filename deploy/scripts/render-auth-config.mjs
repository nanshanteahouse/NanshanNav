import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function renderAuthConfig({ env = process.env, templateDir = '/templates', outputDir = '/output' } = {}) {
  const required = ['NAV_PUBLIC_URL', 'NAV_DOMAIN', 'JWT_SECRET', 'SESSION_SECRET', 'STORAGE_ENCRYPTION_KEY', 'AUTHELIA_USER', 'AUTHELIA_PASSWORD', 'AUTHELIA_EMAIL'];
  for (const key of required) if (!env[key]) throw new Error(`Set ${key}`);
  for (const key of ['JWT_SECRET', 'SESSION_SECRET', 'STORAGE_ENCRYPTION_KEY']) {
    if (!/^[A-Za-z0-9_-]{32,}$/.test(env[key])) throw new Error(`${key} must contain at least 32 safe random characters; use openssl rand -hex 32`);
  }
  const publicUrl = new URL(env.NAV_PUBLIC_URL);
  if (publicUrl.protocol !== 'https:' || publicUrl.origin !== env.NAV_PUBLIC_URL || publicUrl.hostname !== env.NAV_DOMAIN
    || publicUrl.username || publicUrl.password || isIP(publicUrl.hostname) || !publicUrl.hostname.includes('.')) {
    throw new Error('NAV_PUBLIC_URL must be an exact HTTPS origin matching the non-IP NAV_DOMAIN (for example https://nav.example.com)');
  }
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(env.AUTHELIA_USER)) throw new Error('Invalid AUTHELIA_USER');
  if (!/^\$(argon2id|argon2i|2[aby]|pbkdf2-sha512)\$/.test(env.AUTHELIA_PASSWORD)) throw new Error('AUTHELIA_PASSWORD must be a supported password hash');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.AUTHELIA_EMAIL)) throw new Error('Invalid AUTHELIA_EMAIL');
  const variables = { ...env, AUTHELIA_URL: `${publicUrl.origin}/auth` };
  await mkdir(outputDir, { recursive: true });
  for (const name of ['configuration.yml', 'users.yml']) {
    const template = await readFile(path.join(templateDir, name), 'utf8');
    // Replace complete quoted scalars (and keys) with JSON-escaped YAML scalars.
    // Dollar signs in password hashes remain literal; no shell evaluation occurs.
    const rendered = template.replace(/"\$\{([A-Z_]+)\}"/g, (_match, key) => {
      if (!variables[key]) throw new Error(`Missing template variable ${key}`);
      return JSON.stringify(variables[key]);
    });
    if (/\$\{[A-Z_]+\}/.test(rendered)) throw new Error(`Unrendered variable in ${name}`);
    const temporary = path.join(outputDir, `${name}.${randomUUID()}.tmp`);
    await writeFile(temporary, rendered, { mode: 0o600 });
    await rename(temporary, path.join(outputDir, name));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  renderAuthConfig().then(() => console.log('Authelia configuration rendered')).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
