import { useEffect, useState, useCallback } from 'react'
import { useDashboardStore } from './store'
import { AppLayout } from './components/layout/AppLayout'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useAutoEditMode } from './hooks/useAutoEditMode'
import { I18nProvider } from './i18n'
import type { ColorTheme } from './types/dashboard'

function resolveTheme(themeMode: string): 'light' | 'dark' {
  if (themeMode === 'dark') return 'dark'
  if (themeMode === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const CSS_VAR_MAP: Record<keyof ColorTheme, string> = {
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgWidget: '--bg-widget',
  bgWidgetHover: '--bg-widget-hover',
  bgInput: '--bg-input',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  textAccent: '--text-accent',
  borderDefault: '--border-default',
  borderFocus: '--border-focus',
  statusOnline: '--status-online',
  statusOffline: '--status-offline',
  statusWarning: '--status-warning',
  accentPrimary: '--accent-primary',
  accentPrimaryHover: '--accent-primary-hover',
}

function applyColors(colors: ColorTheme) {
  for (const [key, varName] of Object.entries(CSS_VAR_MAP)) {
    document.documentElement.style.setProperty(varName, colors[key as keyof ColorTheme])
  }
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useDashboardStore(s => s.settings.themeMode)
  const colors = useDashboardStore(s => s.settings.colors)
  const dashboardTitle = useDashboardStore(s => s.settings.dashboardTitle)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(themeMode))

  const handleSystemChange = useCallback((e: MediaQueryListEvent) => {
    setResolvedTheme(e.matches ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (themeMode !== 'system') {
      setResolvedTheme(themeMode)
      return
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    setResolvedTheme(mql.matches ? 'dark' : 'light')
    mql.addEventListener('change', handleSystemChange)
    return () => mql.removeEventListener('change', handleSystemChange)
  }, [themeMode, handleSystemChange])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (colors) {
      applyColors(colors[resolvedTheme])
    }
  }, [colors, resolvedTheme])

  useEffect(() => {
    document.title = dashboardTitle
  }, [dashboardTitle])

  return <>{children}</>
}

export default function App() {
  useKeyboardShortcut()
  useAutoEditMode()

  return (
    <ThemeProvider>
      <I18nProvider>
        <AppLayout />
      </I18nProvider>
    </ThemeProvider>
  )
}
