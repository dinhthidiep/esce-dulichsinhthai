import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import SideBar from '~/components/layout/sidebar'
import { Outlet } from 'react-router-dom'
import './main-layout.css'
const MainLayout = () => {
  const [open, setOpen] = useState(true)

  const theme = useTheme()
  const sidebarWidth = open
    ? theme.customLayout.openSideBarSide
    : theme.customLayout.closeSideBarSide
  return (
    <Container
      disableGutters
      maxWidth={false}
      className="admin-layout min-h-screen"
      sx={{
        display: 'grid',
        gridTemplateColumns: `${sidebarWidth} 1fr`,
        gridTemplateRows: '1fr',
        height: '100vh',
        overflow: 'hidden',
        transition: (theme) =>
          theme.transitions.create('grid-template-columns', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          })
      }}
    >
      {/* SIDEBAR */}
      <SideBar open={open} setOpen={setOpen} />

      {/* MAIN CONTENT */}
      <Box
        component="main"
        className="admin-main"
        sx={{ overflowY: 'auto', minHeight: '100vh' }}
      >
        <div className="admin-main-inner">
          <div className="admin-main-container">
            <div className="admin-main-stack">{<Outlet />}</div>
          </div>
        </div>
      </Box>
    </Container>
  )
}
export default MainLayout
