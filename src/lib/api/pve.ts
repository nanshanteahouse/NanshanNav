import type { PveNodeStatus, PveClusterResource, PveNodeListItem } from '@/types/pve.ts';

async function pveFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json() as { errors?: string; message?: string };
      message = body.errors ?? body.message ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new Error(`PVE API error (${response.status}): ${message}`);
  }

  const json = await response.json() as { data: T };
  return json.data;
}

export async function fetchPveNodeStatus(
  host: string,
  nodeName: string,
): Promise<PveNodeStatus> {
  void host;
  return pveFetch<PveNodeStatus>(`/api/pve/nodes/${encodeURIComponent(nodeName)}/status`);
}

export async function fetchPveNodes(host: string): Promise<PveNodeListItem[]> {
  void host;
  return pveFetch<PveNodeListItem[]>('/api/pve/nodes');
}

export async function fetchPveClusterResources(
  host: string,
): Promise<PveClusterResource[]> {
  void host;
  return pveFetch<PveClusterResource[]>('/api/pve/cluster/resources');
}
