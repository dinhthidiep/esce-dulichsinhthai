import { createTheme } from "@mui/material/styles"
import type { ThemeOptions } from "@mui/material/styles"
import { baseOptions } from "./base"

const dark = createTheme(
  {
    ...baseOptions
  },
  {
    colorSchemes: {
      dark: {
        palette: { mode: "dark" }
      } satisfies Partial<ThemeOptions>
    }
  }
)

export default dark
export { dark }






















