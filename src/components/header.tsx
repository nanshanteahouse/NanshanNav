import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Link } from 'react-router-dom';
import type { ThemeMode } from '../types';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeIcon = theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />;

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={16} />, label: '亮色' },
    { mode: 'dark', icon: <Moon size={16} />, label: '暗色' },
    { mode: 'system', icon: <Monitor size={16} />, label: '跟随系统' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-[var(--color-background)]/80 border-b border-[var(--color-card-border)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate">家庭服务导航</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {themeOptions.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  theme === mode
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]'
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="sm:hidden relative" ref={dropdownRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className={`flex items-center gap-1 p-2 rounded-lg transition-colors duration-200 ${
                theme === resolvedTheme
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]'
              }`}
            >
              {activeIcon}
              <ChevronDown size={14} />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
                {themeOptions.map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => { setTheme(mode); setThemeOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      theme === mode
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-card-border)]'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/admin"
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
            title="管理"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
