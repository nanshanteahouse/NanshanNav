import { useEffect, useState, useCallback, Component } from 'react'
import type { ReactNode } from 'react'
import { useDashboardStore } from './store'
import { AppLayout } from './components/layout/AppLayout'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useAutoEditMode } from './hooks/useAutoEditMode'
import { I18nProvider } from './i18n'
import type { ColorTheme } from './types/dashboard'

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('RootErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '1rem',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary, #f5f5f7)',
            color: 'var(--text-primary, #1a1a2e)',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'var(--accent-primary, #2563eb)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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
        <RootErrorBoundary>
          <AppLayout />
        </RootErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  )
}
