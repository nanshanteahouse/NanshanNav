import { useQuery } from '@tanstack/react-query';
import type { PveNodeStatus, PveClusterResource } from '@/types/pve.ts';

interface PveStatusOptions {
  proxmoxHost: string;
  nodeName: string;
  apiToken: string;
  refreshInterval: number;
}

function authHeaders(token: string, host: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) headers['X-PVE-Token'] = token;
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
        headers: authHeaders(options.apiToken, host),
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
        headers: authHeaders(options.apiToken, host),
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
