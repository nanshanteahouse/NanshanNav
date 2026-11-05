import { apiFetch } from "./client";
import type {
  PveNodeStatus,
  PveClusterResource,
  PveNodeListItem,
} from "@/types/pve.ts";

async function pveFetch<T>(url: string, host: string): Promise<T> {
  const response = await apiFetch(url, {
    headers: {
      [/^[a-zA-Z0-9_-]+$/.test(host) ? "X-PVE-Host-ID" : "X-PVE-Host"]: host,
    },
  });

  if (!response.ok) {
    let message: string;
    try {
      const body = (await response.json()) as {
        errors?: string;
        message?: string;
      };
      message = body.errors ?? body.message ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new Error(`PVE API error (${response.status}): ${message}`);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

export async function fetchPveNodeStatus(
  host: string,
  nodeName: string,
): Promise<PveNodeStatus> {
  return pveFetch<PveNodeStatus>(
    `/api/pve/nodes/${encodeURIComponent(nodeName)}/status`,
    host,
  );
}

export async function fetchPveNodes(host: string): Promise<PveNodeListItem[]> {
  return pveFetch<PveNodeListItem[]>("/api/pve/nodes", host);
}

export async function fetchPveClusterResources(
  host: string,
): Promise<PveClusterResource[]> {
  return pveFetch<PveClusterResource[]>("/api/pve/cluster/resources", host);
}
