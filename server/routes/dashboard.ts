import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { parseDashboard } from "../../src/lib/dashboard-schema.ts";
import type { DashboardDocument } from "../../src/lib/dashboard-schema.ts";

interface StoredDocument extends DashboardDocument {
  revision: string;
  updatedAt: string;
}
interface Options {
  dataDir: string;
  uploadsDir: string;
}
const VERSION_LIMIT = 10;
function recoverable(error: unknown) {
  return (
    error instanceof SyntaxError ||
    (error instanceof Error && error.message.startsWith("Invalid dashboard:"))
  );
}
export function createDashboardRoutes({ dataDir }: Options) {
  const app = new Hono();
  for (const route of ["/api/admin/dashboard", "/api/admin/dashboard/*"]) {
    app.use(
      route,
      bodyLimit({
        maxSize: 20 * 1024 * 1024,
        onError: (c) =>
          c.json({ error: "Dashboard payload exceeds 20 MiB" }, 413),
      }),
    );
  }
  const filename = path.join(dataDir, "dashboard-state.json");
  const versionsDir = path.join(dataDir, "dashboard-versions");
  let pending: Promise<unknown> = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = pending.then(operation, operation);
    pending = result.catch(() => undefined);
    return result;
  };
  async function load(file = filename): Promise<StoredDocument | null> {
    try {
      const raw = await readFile(file, "utf8");
      const value = JSON.parse(raw);
      const document = parseDashboard(value);
      const revision =
        typeof value.revision === "string" &&
        /^"[a-zA-Z0-9-]+"$/.test(value.revision)
          ? value.revision
          : `"${createHash("sha256").update(raw).digest("hex")}"`;
      return {
        ...document,
        revision,
        updatedAt:
          typeof value.updatedAt === "string" &&
          Number.isFinite(Date.parse(value.updatedAt))
            ? value.updatedAt
            : new Date(0).toISOString(),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async function atomicWrite(file: string, value: unknown) {
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(JSON.stringify(value, null, 2), "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(temporary, file);
      const directory = await open(path.dirname(file), "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    } finally {
      await rm(temporary, { force: true }).catch(() => undefined);
    }
  }
  async function save(
    document: DashboardDocument,
    previous: StoredDocument | null,
  ) {
    if (previous)
      await atomicWrite(
        path.join(versionsDir, `${previous.revision.slice(1, -1)}.json`),
        previous,
      );
    const stored = {
      ...document,
      revision: `"${randomUUID()}"`,
      updatedAt: new Date(
        Math.max(Date.now(), previous ? Date.parse(previous.updatedAt) + 1 : 0),
      ).toISOString(),
    };
    await atomicWrite(filename, stored);
    // Cleanup never changes the confirmed result of the durable save.
    try {
      const entries = await listVersions();
      for (const entry of entries.slice(VERSION_LIMIT))
        await rm(
          path.join(versionsDir, `${entry.revision.slice(1, -1)}.json`),
          { force: true },
        );
    } catch {
      /* Retain extra backups if pruning fails. */
    }
    return stored;
  }
  async function listVersions() {
    let names: string[];
    try {
      names = await readdir(versionsDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const values = await Promise.all(
      names
        .filter((name) => /^[a-zA-Z0-9-]+\.json$/.test(name))
        .map(async (name) => {
          try {
            const document = await load(path.join(versionsDir, name));
            return (
              document && {
                revision: document.revision,
                updatedAt: document.updatedAt,
                title: document.settings.dashboardTitle,
              }
            );
          } catch {
            return null;
          }
        }),
    );
    return values
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  app.get("/api/dashboard", async (c) => {
    try {
      const current = await load();
      c.header("Cache-Control", "no-store");
      c.header("ETag", current?.revision ?? '"0"');
      return current
        ? c.json(current)
        : c.json({ error: "No dashboard config yet" }, 404);
    } catch (error) {
      if (recoverable(error)) c.header("X-Dashboard-Recovery", "available");
      return c.json(
        {
          error:
            "Saved dashboard is invalid. Restore a recent version from the editor.",
        },
        500,
      );
    }
  });
  app.put("/api/admin/dashboard", async (c) => {
    if (!c.req.header("If-Match"))
      return c.json({ error: "If-Match is required" }, 428);
    let document: DashboardDocument;
    try {
      document = parseDashboard(await c.req.json());
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Invalid dashboard" },
        400,
      );
    }
    return serialize(async () => {
      try {
        const previous = await load();
        if (c.req.header("If-Match") !== (previous?.revision ?? '"0"'))
          return c.json({ error: "Dashboard changed on another device" }, 412);
        const stored = await save(document, previous);
        c.header("ETag", stored.revision);
        return c.json({
          success: true,
          revision: stored.revision,
          updatedAt: stored.updatedAt,
        });
      } catch {
        return c.json(
          {
            error:
              "Save confirmation failed; reload latest revision before retrying",
          },
          500,
        );
      }
    });
  });
  app.get("/api/admin/dashboard/versions", async (c) => {
    try {
      return c.json({ versions: await listVersions() });
    } catch {
      return c.json({ error: "Failed to list saved versions" }, 500);
    }
  });
  app.post("/api/admin/dashboard/rollback", async (c) => {
    if (!c.req.header("If-Match"))
      return c.json({ error: "If-Match is required" }, 428);
    let revision: string;
    try {
      const body = await c.req.json();
      if (
        typeof body.revision !== "string" ||
        !/^"[a-zA-Z0-9-]+"$/.test(body.revision)
      )
        return c.json({ error: "Invalid revision" }, 400);
      revision = body.revision;
    } catch {
      return c.json({ error: "Invalid revision" }, 400);
    }
    return serialize(async () => {
      try {
        let previous: StoredDocument | null;
        try {
          previous = await load();
        } catch (error) {
          if (!recoverable(error)) throw error;
          previous = null;
        }
        if (c.req.header("If-Match") !== (previous?.revision ?? '"0"'))
          return c.json({ error: "Dashboard changed on another device" }, 412);
        const restored = await load(
          path.join(versionsDir, `${revision.slice(1, -1)}.json`),
        );
        if (!restored) return c.json({ error: "Version not found" }, 404);
        const stored = await save(parseDashboard(restored), previous);
        c.header("ETag", stored.revision);
        return c.json(stored);
      } catch {
        return c.json({ error: "Failed to restore version" }, 500);
      }
    });
  });
  return app;
}
