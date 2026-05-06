import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

export function getLucideIcon(name: string): IconComponent {
  const key = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const icons = LucideIcons as unknown as Record<string, IconComponent>;
  return icons[key] ?? LucideIcons.HelpCircle;
}
