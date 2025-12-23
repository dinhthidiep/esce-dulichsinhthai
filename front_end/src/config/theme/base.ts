import type { ThemeOptions } from '@mui/material/styles'

// Extend MUI theme to include custom properties
declare module '@mui/material/styles' {
  interface Theme {
    customLayout: {
      openSideBarSide: string
      closeSideBarSide: string
      openPaddingSideBar: string
      closePaddingSideBar: string
    }
    customBackgroundColor: {
      main: string
      hoverListItemColor: string
      activeListItemColor: string
    }
  }
  interface ThemeOptions {
    customLayout?: {
      openSideBarSide?: string
      closeSideBarSide?: string
      openPaddingSideBar?: string
      closePaddingSideBar?: string
    }
    customBackgroundColor?: {
      main?: string
      hoverListItemColor?: string
      activeListItemColor?: string
    }
  }
}

export const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: ['Inter', 'Noto Sans', 'Roboto', 'Arial', 'sans-serif'].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  customLayout: {
    openSideBarSide: '240px',
    closeSideBarSide: '64px',
    openPaddingSideBar: '8px 12px',
    closePaddingSideBar: '8px',
  },
  customBackgroundColor: {
    main: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    hoverListItemColor: 'rgba(5, 150, 105, 0.08)',
    activeListItemColor: 'rgba(5, 150, 105, 0.16)',
  },
}






















