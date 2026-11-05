// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePveStatus } from "@/components/widgets/PveStatusWidget/usePveStatus";
const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiFetch }));
afterEach(() => {
  cleanup();
  apiFetch.mockReset();
});
it("loads public monitoring without discovering admin hosts or token configuration", async () => {
  apiFetch.mockImplementation(
    async () => new Response(JSON.stringify({ data: [] })),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      usePveStatus({
        proxmoxHost: "node-id",
        proxmoxUrl: "https://pve.lan:8006",
        nodeName: "pve",
        refreshInterval: 60,
      }),
    { wrapper },
  );
  await waitFor(() =>
    expect(result.current.nodeStatusQuery.isSuccess).toBe(true),
  );
  expect(apiFetch.mock.calls.map(([url]) => url).sort()).toEqual([
    "/api/pve/cluster/resources",
    "/api/pve/nodes/pve/status",
  ]);
  expect(result.current.hostOrigin).toBe("https://pve.lan:8006");
  client.clear();
});
