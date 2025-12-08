import type { ThemeOptions } from '@mui/material/styles'
import colors from 'tailwindcss/colors'
import { pxToRem } from '~/utils/convert-px-to-unit.utils'
import { normalizeTailwindColor } from '~/utils/tailwind.utils'

export const baseOptions: ThemeOptions = {
  customLayout: {
    openSideBarSide: pxToRem(255),
    closeSideBarSide: pxToRem(64),
    closePaddingSideBar: `${pxToRem(12)} ${pxToRem(12)}`,
    openPaddingSideBar: `${pxToRem(12)} ${pxToRem(2)}`
  },
  customBackgroundColor: {
    main: 'linear-gradient(to right, #16a34a, #eab308)',
    hoverListItemColor: normalizeTailwindColor(colors.green[200], 0.5)
  },
  cssVariables: {
    colorSchemeSelector: '.theme-%s'
  },
  palette: {
    common: {
      black: '#1f2937',
      white: '#fffffff2'
    }
  },
  colorSchemes: {
    light: true,
    dark: true
  }
}
