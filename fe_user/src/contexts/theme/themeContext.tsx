import { createContext, useContext } from 'react'
import type { ThemeContextType } from '~/types/theme'

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeContextProvider')
  }
  return context
}






















