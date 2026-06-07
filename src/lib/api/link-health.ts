export interface LinkHealthResult {
  reachable: boolean;
  statusCode?: number;
  error?: string;
}

export async function checkLinkHealth(url: string): Promise<LinkHealthResult> {
  try {
    const response = await fetch(`/api/health-check?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      return { reachable: false, statusCode: response.status };
    }
    return await response.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { reachable: false, error: message };
  }
}
