import { isIP } from "node:net";
import { parseHttpUrl } from "./outbound.js";

export interface RegisteredTarget {
  id: string;
  url: string;
  addresses?: string[];
}

export function registeredTargets(
  variable: string,
  originOnly = false,
): RegisteredTarget[] {
  const parsed: unknown = JSON.parse(process.env[variable] || "[]");
  if (!Array.isArray(parsed)) throw new Error(`${variable} must be an array`);
  const ids = new Set<string>();
  return parsed.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error(`Invalid ${variable} target`);
    const entry = value as Record<string, unknown>;
    if (
      typeof entry.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(entry.id) ||
      ids.has(entry.id) ||
      ["__proto__", "constructor", "prototype"].includes(entry.id) ||
      typeof entry.url !== "string"
    )
      throw new Error(`Invalid ${variable} target ID or URL`);
    ids.add(entry.id);
    const url = parseHttpUrl(entry.url);
    if (
      originOnly &&
      (url.protocol !== "https:" || url.pathname !== "/" || url.search)
    ) {
      throw new Error(`${variable} requires HTTPS origins`);
    }
    if (
      entry.addresses !== undefined &&
      (!Array.isArray(entry.addresses) ||
        !entry.addresses.length ||
        entry.addresses.some(
          (address: unknown) => typeof address !== "string" || !isIP(address),
        ))
    ) {
      throw new Error(`Invalid ${variable} addresses`);
    }
    if (!isIP(url.hostname.replace(/^\[|\]$/g, "")) && !entry.addresses)
      throw new Error(
        `${variable}: hostname targets require an explicit addresses allowlist`,
      );
    return {
      id: entry.id,
      url: originOnly ? url.origin : url.href,
      addresses: entry.addresses as string[] | undefined,
    };
  });
}
