import type { AppConfig, Category, Settings } from './types';

const API_BASE = '/api';

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
  return res.json();
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Failed to save config: ${res.status}`);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  const res = await fetch(`${API_BASE}/config/categories`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) throw new Error(`Failed to save categories: ${res.status}`);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const res = await fetch(`${API_BASE}/config/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);
}

export async function fetchStatus(): Promise<Record<string, 'online' | 'offline' | 'checking'>> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json();
}

export async function fetchPveStatus() {
  const res = await fetch(`${API_BASE}/pve/status`);
  if (!res.ok) throw new Error(`Failed to fetch PVE status: ${res.status}`);
  return res.json();
}

export function getFaviconUrl(url: string): string {
  return `${API_BASE}/favicon?url=${encodeURIComponent(url)}`;
}

export async function uploadIcon(file: File, serviceId: string): Promise<string> {
  const formData = new FormData();
  formData.append('icon', file);
  formData.append('serviceId', serviceId);

  const res = await fetch(`${API_BASE}/icon/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload icon: ${res.status}`);
  const data = await res.json();
  return data.path;
}
