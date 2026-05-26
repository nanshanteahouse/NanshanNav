import { useEffect } from 'react'
import { useDashboardStore } from './store'
import { AppLayout } from './components/layout/AppLayout'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useDashboardStore(s => s.settings.darkMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return <>{children}</>
}

export default function App() {
  useKeyboardShortcut()

  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  )
}
