import { icons, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getFaviconUrl } from '@/lib/api/favicon';
import type { IconSource } from '@/types/widget';

interface IconDisplayProps {
  iconSource?: IconSource;
  iconValue?: string | null;
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function IconDisplay({ iconSource = 'initial', iconValue, url, name, size = 'md' }: IconDisplayProps) {
  const iconSize = SIZE_CLASS[size];

  // Favicon priority
  if (iconSource === 'favicon' && url) {
    const faviconUrl = getFaviconUrl(url);
    return (
      <img
        src={faviconUrl}
        alt=""
        className={`${iconSize} flex-shrink-0`}
        style={{ objectFit: 'contain' }}
        onError={(e) => {
          // Fall through to next priority
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Lucide icon priority
  if (iconSource === 'lucide' && iconValue) {
    const IconComponent: LucideIcon =
      (icons as Record<string, LucideIcon>)[iconValue] || Globe;
    return (
      <IconComponent
        className={`${iconSize} flex-shrink-0`}
        style={{ color: 'var(--accent-primary)' }}
      />
    );
  }

  // Custom upload priority
  if (iconSource === 'custom' && iconValue) {
    return (
      <img
        src={iconValue}
        alt=""
        className={`${iconSize} flex-shrink-0`}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Lucide icon fallback (from legacy icon field) OR initial letter fallback
  if (iconValue) {
    const IconComponent: LucideIcon =
      (icons as Record<string, LucideIcon>)[iconValue] || Globe;
    return (
      <IconComponent
        className={`${iconSize} flex-shrink-0`}
        style={{ color: 'var(--accent-primary)' }}
      />
    );
  }

  // Initial letter fallback
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className={`${iconSize} flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold`}
      style={{
        backgroundColor: 'var(--accent-primary)',
        color: '#ffffff',
      }}
    >
      {initial}
    </div>
  );
}
