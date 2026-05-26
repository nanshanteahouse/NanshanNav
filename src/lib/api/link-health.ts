export interface LinkHealthResult {
  reachable: boolean;
  statusCode?: number;
  error?: string;
}

export async function checkLinkHealth(url: string): Promise<LinkHealthResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { reachable: response.ok, statusCode: response.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { reachable: false, error: message };
  }
}
