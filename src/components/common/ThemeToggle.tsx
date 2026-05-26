import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';

export function ThemeToggle() {
  const toggleDarkMode = useDashboardStore((s) => s.toggleDarkMode);
  const darkMode = useDashboardStore((s) => s.settings.darkMode);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
