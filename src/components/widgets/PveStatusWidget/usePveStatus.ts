import { useQuery } from '@tanstack/react-query';
import type { PveNodeStatus, PveClusterResource } from '@/types/pve.ts';

interface PveStatusOptions {
  proxmoxHost: string;
  nodeName: string;
  refreshInterval: number;
}

function authHeaders(host: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (host) headers['X-PVE-Host'] = host;
  return headers;
}

export function usePveStatus(options: PveStatusOptions) {
  const host = options.proxmoxHost;
  const node = options.nodeName;

  const nodeStatusQuery = useQuery({
    queryKey: ['pve', 'status', host, node],
    queryFn: async () => {
      const res = await fetch(`/api/pve/nodes/${encodeURIComponent(node)}/status`, {
        headers: authHeaders(host),
      });
      if (!res.ok) throw new Error(`PVE API error: ${res.statusText}`);
      const json = await res.json() as { data: PveNodeStatus };
      return json.data;
    },
    refetchInterval: options.refreshInterval * 1000,
    enabled: !!host && !!node,
    refetchIntervalInBackground: false,
  });

  const resourcesQuery = useQuery({
    queryKey: ['pve', 'resources', host],
    queryFn: async () => {
      const res = await fetch('/api/pve/cluster/resources', {
        headers: authHeaders(host),
      });
      if (!res.ok) throw new Error(`PVE API error: ${res.statusText}`);
      const json = await res.json() as { data: PveClusterResource[] };
      return json.data;
    },
    refetchInterval: 30000,
    enabled: !!host,
  });

  return { nodeStatusQuery, resourcesQuery };
}
