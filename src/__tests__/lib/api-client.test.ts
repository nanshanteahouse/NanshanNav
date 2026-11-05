// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});
it("forwards requests without adding app credentials from a legacy session", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response("{}"));
  vi.stubGlobal("fetch", fetch);
  sessionStorage.setItem("nanshan-admin-session", "obsolete-session");
  await apiFetch("/api/dashboard");
  const init = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  };
  await apiFetch("/api/admin/dashboard", init);
  expect(fetch).toHaveBeenNthCalledWith(1, "/api/dashboard", undefined);
  expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/dashboard", init);
  expect(
    new Headers(fetch.mock.calls[1][1]?.headers).has("Authorization"),
  ).toBe(false);
});
