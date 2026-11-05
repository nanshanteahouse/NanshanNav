import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export function parseHttpUrl(value: string): URL {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error(
      "Only HTTP(S) URLs without credentials or fragments are allowed",
    );
  }
  return url;
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 168].includes(b)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && [18, 19].includes(b))
    );
  }
  // Only global unicast IPv6; excludes loopback, mapped IPv4, ULA, link-local and multicast.
  return (
    isIP(address) === 6 &&
    /^[23][0-9a-f]{3}:/i.test(address) &&
    !/^2001:(db8|0):/i.test(address)
  );
}

export interface OutboundOptions {
  privateAllowed?: boolean;
  addresses?: string[];
  method?: "GET" | "HEAD";
  headers?: Record<string, string>;
  maxBytes?: number;
  timeoutMs?: number;
}

/** Resolve once, validate every address and pin the socket to that result. Never follow redirects. */
export async function outbound(
  value: string | URL,
  options: OutboundOptions = {},
) {
  const url = parseHttpUrl(value.toString());
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const records = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise<never>((_resolve, reject) => {
          dnsTimer = setTimeout(
            () => reject(new Error("DNS lookup timeout")),
            3000,
          );
        }),
      ]).finally(() => clearTimeout(dnsTimer));
  if (
    !records.length ||
    records.some(
      ({ address }) =>
        (!options.privateAllowed && !isPublicAddress(address)) ||
        (options.addresses && !options.addresses.includes(address)),
    )
  )
    throw new Error("Destination address is not allowed");
  const pinned = records[0];
  const pinnedLookup: LookupFunction = (_hostname, lookupOptions, callback) => {
    if (lookupOptions.all) callback(null, [pinned]);
    else callback(null, pinned.address, pinned.family);
  };
  return new Promise<{
    status: number;
    headers: import("node:http").IncomingHttpHeaders;
    body: Buffer;
  }>((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: options.method || "GET",
        headers: options.headers,
        lookup: pinnedLookup,
        // An absolute deadline below also covers a stalled response body.
        agent: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > (options.maxBytes ?? 2 * 1024 * 1024))
            request.destroy(new Error("Response too large"));
          else chunks.push(chunk);
        });
        response.on("end", () => {
          clearTimeout(timer);
          resolve({
            status: response.statusCode || 502,
            headers: response.headers,
            body: Buffer.concat(chunks),
          });
        });
        response.on("error", reject);
      },
    );
    const timer = setTimeout(
      () => request.destroy(new Error("Upstream timeout")),
      options.timeoutMs ?? 5000,
    );
    request.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    request.end();
  });
}
