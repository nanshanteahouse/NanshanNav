export interface LinkHealthResult {
  reachable: boolean | null;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  history?: { checkedAt: string; reachable: boolean; statusCode?: number }[];
  statusCode?: number;
  error?: string;
}

export async function checkLinkHealth(url: string): Promise<LinkHealthResult> {
  try {
    const response = await fetch(
      `/api/health-check?url=${encodeURIComponent(url)}`,
    );
    if (!response.ok) {
      return { reachable: null, statusCode: response.status };
    }
    return await response.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { reachable: null, error: message };
  }
}
