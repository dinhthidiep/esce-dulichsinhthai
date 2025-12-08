import { createRoot } from 'react-dom/client'
import '~/styles/global.css'
import '~/styles/index.css'
import App from '~/App.tsx'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeContextProvider } from './contexts/theme/themeProvider'
createRoot(document.getElementById('root')!).render(
  <ThemeContextProvider>
    <CssBaseline />
    <App />
  </ThemeContextProvider>
)
