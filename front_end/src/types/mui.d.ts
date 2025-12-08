import "@mui/material/styles"
declare module "@mui/material/styles" {
  interface Theme {
    customLayout: {
      openSideBarSide: string
      openPaddingSideBar: string
      closeSideBarSide: string
      closePaddingSideBar: string
    }
    customBackgroundColor: {
      main: string
      hoverListItemColor: main
    }
  }
  interface ThemeOptions {
    customLayout: {
      openSideBarSide: string
      closeSideBarSide: string
      closePaddingSideBar: string
      openPaddingSideBar: string
    }
    customBackgroundColor: {
      main: string
      hoverListItemColor: main
    }
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    "outline-danger": true
    ghost: true
    gradient: true
  }

  interface ButtonPropsSizeOverrides {
    extraLarge: true
    icon: true
  }
}
