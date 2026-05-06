import { useEffect, useState } from 'react';
import { getFaviconUrl } from '../api';
import * as LucideIcons from 'lucide-react';

interface IconDisplayProps {
  iconSource: 'favicon' | 'lucide' | 'custom' | 'initial';
  iconValue: string | null;
  name: string;
  categoryColor: string;
  url?: string;
  size?: number;
}

type IconComponentType = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

function resolveLucideIcon(name: string): IconComponentType {
  const key = name.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return (LucideIcons as unknown as Record<string, IconComponentType>)[key] ?? LucideIcons.HelpCircle;
}

export function IconDisplay({ iconSource, iconValue, name, categoryColor, url, size = 32 }: IconDisplayProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);

  useEffect(() => {
    setFaviconFailed(false);
  }, [url]);

  if (iconSource === 'lucide' && iconValue) {
    const IconComponent = resolveLucideIcon(iconValue);
    return <IconComponent size={size} className="text-[var(--color-text-secondary)]" />;
  }

  if (iconSource === 'favicon' && url && !faviconFailed) {
    return (
      <img
        src={getFaviconUrl(url)}
        alt={name}
        width={size}
        height={size}
        className="rounded"
        onError={() => setFaviconFailed(true)}
      />
    );
  }

  if (iconSource === 'custom' && iconValue) {
    return (
      <img
        src={iconValue}
        alt={name}
        width={size}
        height={size}
        className="rounded"
      />
    );
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-lg font-semibold text-white"
      style={{ backgroundColor: categoryColor, width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
