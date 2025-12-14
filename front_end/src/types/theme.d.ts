import type { Theme } from '@mui/material/styles'

/** Theme mode cho MUI */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Mode thực tế hiển thị (không có 'system') */
export type CurrentThemeMode = 'light' | 'dark'

/** Props cho ThemeProvider */
export interface ThemeContextProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
}

export interface ThemeContextType {
  mode: ThemeMode | undefined
  setMode: (mode: ThemeMode) => void
  currentMode: CurrentThemeMode | undefined
  theme: Theme
}






















