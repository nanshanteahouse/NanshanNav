/// <reference types="node" />
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Hono } from "hono";
import { createDashboardRoutes } from "../../../server/routes/dashboard";
import { DEFAULT_SETTINGS } from "@/types/dashboard";
import { parseDashboard } from "@/lib/dashboard-schema";
import { parseDashboardBackup } from "@/lib/dashboard-backup";

const document = () => ({
  schemaVersion: 1,
  settings: { ...DEFAULT_SETTINGS },
  layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
  widgets: [],
});
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { force: true, recursive: true })),
  );
});
async function setup() {
  const dir = await mkdtemp(path.join(tmpdir(), "nanshan-dashboard-"));
  directories.push(dir);
  const app = new Hono();
  app.route(
    "/",
    createDashboardRoutes({ dataDir: dir, uploadsDir: dir }),
  );
  const save = (body: unknown, revision = '"0"') =>
    app.request("/api/admin/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-Match": revision },
      body: JSON.stringify(body),
    });
  return { app, dir, save };
}
describe("dashboard validation and durable concurrency boundary", () => {
  it("rejects malformed options, unknown widgets, dangling and duplicate layout references", () => {
    expect(() => parseDashboard({ ...document(), widgets: {} })).toThrow();
    const widget = {
      id: "a",
      type: "web-link",
      title: "",
      options: { links: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(() => parseDashboard({ ...document(), widgets: [widget] })).toThrow(
      "links",
    );
    expect(() =>
      parseDashboard({
        ...document(),
        widgets: [{ ...widget, type: "missing", options: {} }],
      }),
    ).toThrow();
    expect(() =>
      parseDashboard({
        ...document(),
        layouts: {
          ...document().layouts,
          lg: [{ i: "missing", x: 0, y: 0, w: 2, h: 2 }],
        },
      }),
    ).toThrow("reference");
  });
  it("normalizes missing render options and rejects invalid timezones or link tags", () => {
    const widget = {
      id: "a",
      type: "title-header",
      title: "",
      options: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(
      parseDashboard({ ...document(), widgets: [widget] }).widgets[0].options
        .headingLevel,
    ).toBe("h2");
    expect(() =>
      parseDashboard({
        ...document(),
        widgets: [
          { ...widget, type: "clock", options: { timezone: "Mars/Unknown" } },
        ],
      }),
    ).toThrow("timezone");
    expect(() =>
      parseDashboard({
        ...document(),
        widgets: [
          {
            ...widget,
            type: "web-link",
            options: {
              links: [
                {
                  id: "link",
                  name: "a",
                  url: "https://example.com",
                  icon: "",
                  description: "",
                  tags: "bad",
                },
              ],
            },
          },
        ],
      }),
    ).toThrow("tags");
  });
  it("rejects incomplete image backups before any uploads can happen", () => {
    const doc = document();
    const withImage = {
      ...doc,
      widgets: [
        {
          id: "a",
          type: "image",
          title: "",
          options: { url: "/uploads/image.webp" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    expect(() =>
      parseDashboardBackup({ ...withImage, backupVersion: 1, assets: [] }),
    ).toThrow("missing");
    expect(parseDashboardBackup(withImage).assets).toEqual([]); // legacy configuration remains importable
  });
  it("rejects oversized streamed bodies even without Content-Length", async () => {
    const { app } = await setup();
    const oversized = await app.request("/api/admin/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "If-Match": '"0"' },
      body: "x".repeat(20 * 1024 * 1024 + 1),
    });
    expect(oversized.status).toBe(413);
    expect((await app.request("/api/dashboard")).status).toBe(404);
  });
  it("serializes concurrent device saves and rejects the stale writer", async () => {
    const { app, dir, save } = await setup();
    const initial = await app.request("/api/dashboard");
    expect(initial.status).toBe(404);
    const results = await Promise.all([
      save(document()),
      save({
        ...document(),
        settings: { ...DEFAULT_SETTINGS, dashboardTitle: "other device" },
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 412]);
    const current = await app.request("/api/dashboard");
    expect(current.status).toBe(200);
    expect(current.headers.get("ETag")).toBeTruthy();
    expect(
      parseDashboard(
        JSON.parse(
          await readFile(path.join(dir, "dashboard-state.json"), "utf8"),
        ),
      ),
    ).toEqual(document());
    expect((await readdir(dir)).some((name) => name.endsWith(".tmp"))).toBe(
      false,
    );
  });
  it("keeps the valid dashboard after invalid input and restores an archived version with a new revision", async () => {
    const { app, save } = await setup();
    const first = await save(document());
    const revision = first.headers.get("ETag")!;
    expect((await save({ ...document(), widgets: {} }, revision)).status).toBe(
      400,
    );
    const second = await save(
      {
        ...document(),
        settings: { ...DEFAULT_SETTINGS, dashboardTitle: "new title" },
      },
      revision,
    );
    expect(second.status).toBe(200);
    const versions = await (
      await app.request("/api/admin/dashboard/versions")
    ).json();
    expect(versions.versions[0].revision).toBe(revision);
    const restore = await app.request("/api/admin/dashboard/rollback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "If-Match": second.headers.get("ETag")!,
      },
      body: JSON.stringify({ revision }),
    });
    expect(restore.status).toBe(200);
    expect((await restore.json()).settings.dashboardTitle).toBe(
      DEFAULT_SETTINGS.dashboardTitle,
    );
    expect(restore.headers.get("ETag")).not.toBe(revision);
  });
  it("retains ten recent versions and rejects an outdated rollback", async () => {
    const { app, save } = await setup();
    let revision = '"0"';
    let firstRevision = "";
    for (let index = 0; index < 14; index++) {
      const response = await save(
        {
          ...document(),
          settings: { ...DEFAULT_SETTINGS, dashboardTitle: `version ${index}` },
        },
        revision,
      );
      expect(response.status).toBe(200);
      revision = response.headers.get("ETag")!;
      if (index === 10) firstRevision = revision;
    }
    const versions = (
      await (await app.request("/api/admin/dashboard/versions")).json()
    ).versions;
    expect(versions).toHaveLength(10);
    expect(versions[0].title).toBe("version 12");
    expect(versions[9].title).toBe("version 3");
    const outdated = await app.request("/api/admin/dashboard/rollback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "If-Match": firstRevision,
      },
      body: JSON.stringify({ revision: versions[0].revision }),
    });
    expect(outdated.status).toBe(412);
  });
  it("recovers a corrupt current file from a valid recent version", async () => {
    const { app, dir, save } = await setup();
    const first = await save(document());
    const revision = first.headers.get("ETag")!;
    await save(
      {
        ...document(),
        settings: { ...DEFAULT_SETTINGS, dashboardTitle: "new" },
      },
      revision,
    );
    await writeFile(path.join(dir, "dashboard-state.json"), "{interrupted");
    expect((await app.request("/api/dashboard")).status).toBe(500);
    const restored = await app.request("/api/admin/dashboard/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "If-Match": '"0"' },
      body: JSON.stringify({ revision }),
    });
    expect(restored.status).toBe(200);
  });
});
