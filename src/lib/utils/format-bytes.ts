const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';

  if (bytes < 0) return `-${formatBytes(-bytes, decimals)}`;

  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedIndex = Math.min(i, UNITS.length - 1);
  const value = bytes / Math.pow(k, clampedIndex);

  return `${value.toFixed(decimals)} ${UNITS[clampedIndex]}`;
}
