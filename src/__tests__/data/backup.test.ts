// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDashboardBackup,
  parseDashboardBackup,
  restoreDashboardBackup,
} from "@/lib/dashboard-backup";
import { DEFAULT_SETTINGS } from "@/types/dashboard";
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiFetch: fetchMock }));
const document = () => ({
  schemaVersion: 1,
  settings: { ...DEFAULT_SETTINGS },
  layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
  widgets: [
    {
      id: "image",
      type: "image",
      title: "",
      options: {
        url: "/uploads/source.webp",
        caption: "https://example.com/uploads/source.webp",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
});
beforeEach(() => fetchMock.mockReset());
describe("portable image backups", () => {
  it("embeds uploaded image bytes and keeps external URLs as references", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      blob: async () =>
        new Blob([new Uint8Array([0, 1, 2])], { type: "image/webp" }),
    });
    const backup = await createDashboardBackup(document());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/uploads/source.webp");
    expect(backup.assets).toEqual([
      { path: "/uploads/source.webp", mime: "image/webp", data: "AAEC" },
    ]);
  });
  it("restores through the image upload contract and replaces only local references", async () => {
    const original = document();
    const backup = parseDashboardBackup({
      ...original,
      backupVersion: 1,
      assets: [
        { path: "/uploads/source.webp", mime: "image/webp", data: "AAEC" },
      ],
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: "/uploads/restored.webp" })),
    );
    const restored = await restoreDashboardBackup(backup);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/upload",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock.mock.calls[0][1].body.get("image")).toBeInstanceOf(File);
    expect(restored.widgets[0].options.url).toBe("/uploads/restored.webp");
    expect(restored.widgets[0].options.caption).toBe(
      "https://example.com/uploads/source.webp",
    );
    expect(original.widgets[0].options.url).toBe("/uploads/source.webp");
  });
  it("leaves the imported document unchanged if image upload fails", async () => {
    const backup = parseDashboardBackup({
      ...document(),
      backupVersion: 1,
      assets: [
        { path: "/uploads/source.webp", mime: "image/webp", data: "AAEC" },
      ],
    });
    const before = JSON.stringify(backup.document);
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    await expect(restoreDashboardBackup(backup)).rejects.toThrow("500");
    expect(JSON.stringify(backup.document)).toBe(before);
  });
});
