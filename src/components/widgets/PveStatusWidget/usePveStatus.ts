import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import type { PveNodeStatus, PveClusterResource } from "@/types/pve.ts";

interface PveStatusOptions {
  proxmoxHost: string;
  proxmoxUrl?: string;
  nodeName: string;
  refreshInterval: number;
}

function hostHeaders(host: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (host)
    headers[/^[a-zA-Z0-9_-]+$/.test(host) ? "X-PVE-Host-ID" : "X-PVE-Host"] =
      host;
  return headers;
}

export function usePveStatus(options: PveStatusOptions) {
  const host = options.proxmoxHost;
  const node = options.nodeName;

  const nodeStatusQuery = useQuery({
    queryKey: ["pve", "status", host, node],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/pve/nodes/${encodeURIComponent(node)}/status`,
        {
          headers: hostHeaders(host),
        },
      );
      if (!res.ok) throw new Error(`PVE API error: ${res.statusText}`);
      const json = (await res.json()) as { data: PveNodeStatus };
      return json.data;
    },
    refetchInterval: options.refreshInterval * 1000,
    enabled: !!host && !!node,
    refetchIntervalInBackground: false,
  });

  const resourcesQuery = useQuery({
    queryKey: ["pve", "resources", host],
    queryFn: async () => {
      const res = await apiFetch("/api/pve/cluster/resources", {
        headers: hostHeaders(host),
      });
      if (!res.ok) throw new Error(`PVE API error: ${res.statusText}`);
      const json = (await res.json()) as { data: PveClusterResource[] };
      return json.data;
    },
    refetchInterval: 30000,
    enabled: !!host,
  });

  let hostOrigin: string | undefined;
  try {
    const candidate =
      options.proxmoxUrl ||
      (/^https?:\/\//.test(host)
        ? host
        : host.includes(".") || host.includes(":")
          ? `https://${host}`
          : "");
    const url = new URL(candidate);
    if (["http:", "https:"].includes(url.protocol)) hostOrigin = url.origin;
  } catch {
    /* Older host IDs may not yet have a saved web interface URL. */
  }
  return { nodeStatusQuery, resourcesQuery, hostOrigin };
}
