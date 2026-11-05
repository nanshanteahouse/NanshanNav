import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLinkHealth } from "@/lib/api/link-health";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkLinkHealth", () => {
  it.each([
    ["https://example.com/#/dashboard?tab=home", "https://example.com/"],
    ["http://example.com/app?view=all#settings", "http://example.com/app?view=all"],
    ["example.com/app#settings", "https://example.com/app"],
    ["https://example.com/path%23part?q=%23value#route", "https://example.com/path%23part?q=%23value"],
    ["https://example.com/path%23part?q=%23value", "https://example.com/path%23part?q=%23value"],
    ["https://example.com/app#", "https://example.com/app"],
  ])("checks %s without its fragment", async (url, expected) => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ reachable: true, statusCode: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    const link = { url };

    const result = await checkLinkHealth(link.url);

    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      `/api/health-check?url=${encodeURIComponent(expected)}`,
    );
    expect(result).toEqual({ reachable: true, statusCode: 200 });
    expect(link.url).toBe(url);
  });
});
