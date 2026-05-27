import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const PORT = parseInt(process.env.PORT || '3001', 10);

const app = new Hono();

if (!existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

// Magic bytes signatures: JPEG, PNG, GIF, WebP
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return true; // SVG and BMP have no reliable fixed magic bytes
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['image'];

    if (!file) {
      return c.json({ error: 'No file uploaded. Use field name "image".' }, 400);
    }

    if (!(file instanceof File)) {
      return c.json({ error: 'Invalid file upload.' }, 400);
    }

    const mimeType = file.type;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return c.json(
        {
          error: `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        },
        415,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          error: `File too large. Max: 20 MB. Received: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
        },
        413,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return c.json({ error: 'File content does not match its MIME type.' }, 415);
    }

    const ext = path.extname(file.name) || '';
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await writeFile(filePath, buffer);

    return c.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error('Upload error:', err);
    return c.json({ error: 'Internal server error.' }, 500);
  }
});

app.get(
  '/uploads/*',
  serveStatic({
    root: UPLOAD_DIR,
    rewriteRequestPath: (p) => p.replace(/^\/uploads/, ''),
  }),
);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Upload server running on http://localhost:${info.port}`);
  },
);
