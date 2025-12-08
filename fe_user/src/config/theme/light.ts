import { createTheme } from "@mui/material/styles"
import { baseOptions } from "./base"
import type { ThemeOptions } from "@mui/material/styles"

const light = createTheme(
  {
    ...baseOptions
  },
  {
    colorSchemes: {
      light: {
        palette: {
          mode: "light"
        }
      } satisfies Partial<ThemeOptions>
    }
  }
)

export default light






















