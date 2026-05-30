import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  encrypted: string;
}

const KEY_FILE = path.resolve(process.cwd(), 'server/config/.pve-key');

let cachedKey: Buffer | null = null;

/**
 * Load the encryption key with the following priority:
 *   1. PVE_ENCRYPTION_KEY env var (hex-encoded 32 bytes)
 *   2. server/config/.pve-key file (auto-generated on first run)
 *
 * Resets the cached key — call this during server startup or after config reload.
 */
export function loadEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const envKey = process.env.PVE_ENCRYPTION_KEY;
  if (envKey) {
    const buf = Buffer.from(envKey, 'hex');
    if (buf.length !== KEY_LENGTH) {
      throw new Error(
        `PVE_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (got ${envKey.length})`,
      );
    }
    cachedKey = buf;
    return buf;
  }

  if (existsSync(KEY_FILE)) {
    const hex = readFileSync(KEY_FILE, 'utf-8').trim();
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== KEY_LENGTH) {
      throw new Error(
        `Encryption key file ${KEY_FILE} is invalid — expected ${KEY_LENGTH * 2} hex chars`,
      );
    }
    cachedKey = buf;
    return buf;
  }

  const newKey = randomBytes(KEY_LENGTH);
  writeFileSync(KEY_FILE, newKey.toString('hex') + '\n', { mode: 0o600 });
  console.warn(`[PVE] No PVE_ENCRYPTION_KEY or key file found.`);
  console.warn(`[PVE] Auto-generated encryption key saved to ${KEY_FILE}`);
  console.warn(`[PVE] ⚠  BACKUP THIS KEY — without it, encrypted tokens are unrecoverable.`);
  cachedKey = newKey;
  return newKey;
}

/**
 * Encrypt a plaintext token using AES-256-GCM.
 * Returns a hex-encoded payload that can be safely stored in JSON.
 */
export function encryptToken(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), authTag, encrypted };
}

/**
 * Decrypt a payload previously produced by encryptToken().
 * Throws if the auth tag is invalid (tampered data or wrong key).
 */
export function decryptToken(payload: EncryptedPayload, key: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  const plaintext = decipher.update(payload.encrypted, 'hex', 'utf8') + decipher.final('utf8');
  return plaintext;
}

export function resetKeyCache(): void {
  cachedKey = null;
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.iv === 'string' &&
    typeof v.authTag === 'string' &&
    typeof v.encrypted === 'string'
  );
}
