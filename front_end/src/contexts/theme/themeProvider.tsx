import { ThemeProvider } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { lightTheme, darkTheme } from '~/config'
import type { CurrentThemeMode, ThemeContextProviderProps, ThemeMode } from '~/types/theme'
import { ThemeContext } from './themeContext'

export function ThemeContextProvider({
  children,
  defaultMode = 'light'
}: ThemeContextProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)
  const [systemMode, setSystemMode] = useState<CurrentThemeMode>('light')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemMode = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemMode(event.matches ? 'dark' : 'light')
    }

    updateSystemMode(mediaQuery)
    const listener = (event: MediaQueryListEvent) => updateSystemMode(event)
    mediaQuery.addEventListener('change', listener)

    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  const currentMode = mode === 'system' ? systemMode : mode
  const theme = useMemo(() => (currentMode === 'dark' ? darkTheme : lightTheme), [currentMode])

  const themeContextValue = useMemo(
    () => ({
      mode,
      setMode,
      currentMode,
      theme
    }),
    [mode, currentMode, theme]
  )

  return (
    <ThemeProvider theme={theme}>
      <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>
    </ThemeProvider>
  )
}






















