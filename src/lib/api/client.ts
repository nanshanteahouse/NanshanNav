/** Same-origin proxy sessions are handled by the browser and deployment gateway. */
export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, init);
}
