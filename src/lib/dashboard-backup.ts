import { apiFetch } from "./api/client";
import { isRecord, parseDashboard } from "./dashboard-schema";
import type { DashboardDocument } from "./dashboard-schema";

export interface BackupAsset {
  path: string;
  mime: string;
  data: string;
}
export interface DashboardBackup extends DashboardDocument {
  backupVersion: 1;
  exportedAt: string;
  assets: BackupAsset[];
}
const MAX_BACKUP_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
function uploadReferences(
  value: unknown,
  result = new Set<string>(),
): Set<string> {
  if (typeof value === "string") {
    for (const match of value.matchAll(
      /(?<![a-zA-Z0-9/:])\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+/g,
    ))
      result.add(match[0]);
  } else if (Array.isArray(value))
    value.forEach((entry) => uploadReferences(entry, result));
  else if (isRecord(value))
    Object.values(value).forEach((entry) => uploadReferences(entry, result));
  return result;
}
async function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Unable to read backup image"));
    reader.readAsDataURL(blob);
  });
}
export async function createDashboardBackup(
  value: unknown,
): Promise<DashboardBackup> {
  const document = parseDashboard(value);
  const assets: BackupAsset[] = [];
  let total = JSON.stringify(document).length;
  for (const path of uploadReferences(document)) {
    const response = await apiFetch(path);
    if (!response.ok)
      throw new Error(`Unable to include image ${path} (${response.status})`);
    const blob = await response.blob();
    if (!IMAGE_TYPES.includes(blob.type) || blob.size > 20 * 1024 * 1024)
      throw new Error(`Unsupported backup image: ${path}`);
    total += Math.ceil((blob.size * 4) / 3);
    if (total > MAX_BACKUP_SIZE) throw new Error("Backup exceeds 100 MB");
    assets.push({ path, mime: blob.type, data: await toBase64(blob) });
  }
  return {
    ...document,
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    assets,
  };
}
export function parseDashboardBackup(value: unknown): {
  document: DashboardDocument;
  assets: BackupAsset[];
} {
  const document = parseDashboard(value);
  if (!isRecord(value) || value.backupVersion === undefined)
    return { document, assets: [] };
  if (value.backupVersion !== 1 || !Array.isArray(value.assets))
    throw new Error("Unsupported backup format");
  const assets: BackupAsset[] = [];
  const paths = new Set<string>();
  let total = 0;
  for (const valueAsset of value.assets) {
    if (
      !isRecord(valueAsset) ||
      typeof valueAsset.path !== "string" ||
      !/^\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(valueAsset.path) ||
      paths.has(valueAsset.path) ||
      !IMAGE_TYPES.includes(valueAsset.mime as string) ||
      typeof valueAsset.data !== "string" ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        valueAsset.data,
      ) ||
      valueAsset.data.length > 28 * 1024 * 1024
    )
      throw new Error("Invalid backup image");
    total += valueAsset.data.length;
    if (total > MAX_BACKUP_SIZE) throw new Error("Backup exceeds 100 MB");
    paths.add(valueAsset.path);
    assets.push(valueAsset as unknown as BackupAsset);
  }
  for (const ref of uploadReferences(document))
    if (!paths.has(ref)) throw new Error(`Backup is missing ${ref}`);
  return { document, assets };
}
export async function restoreDashboardBackup(
  backup: ReturnType<typeof parseDashboardBackup>,
): Promise<DashboardDocument> {
  const replacements = new Map<string, string>();
  for (const asset of backup.assets) {
    const bytes = Uint8Array.from(atob(asset.data), (char) =>
      char.charCodeAt(0),
    );
    const body = new FormData();
    body.append(
      "image",
      new Blob([bytes], { type: asset.mime }),
      asset.path.split("/").pop(),
    );
    const response = await apiFetch("/api/admin/upload", { method: "POST", body });
    if (!response.ok)
      throw new Error(
        `Image restore failed (${response.status}). The current dashboard is unchanged.`,
      );
    const data = await response.json();
    if (
      typeof data.url !== "string" ||
      !/^\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(data.url)
    )
      throw new Error("Invalid uploaded image response");
    replacements.set(asset.path, data.url);
  }
  // Replacement is performed on values, never serialized keys, and committed only after every upload succeeds.
  const replace = (value: unknown): unknown => {
    if (typeof value === "string")
      return value.replace(
        /(?<![a-zA-Z0-9/:])\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+/g,
        (reference) => replacements.get(reference) ?? reference,
      );
    if (Array.isArray(value)) return value.map(replace);
    if (isRecord(value))
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, replace(entry)]),
      );
    return value;
  };
  return parseDashboard(replace(backup.document));
}
