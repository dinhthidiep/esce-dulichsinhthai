// import Box from "@mui/material/Box"
// import Typography from "@mui/material/Typography"
import { pxToRem } from '~/utils/convert-px-to-unit.utils'
import Drawer from '@mui/material/Drawer'
import { sidebarConfig } from './siderBarConfig'
import SideBarItem from './siderBarItem'
import List from '@mui/material/List'
import SideBarHeader from './sideBarHeader'
import { type Dispatch, type SetStateAction } from 'react'
import { alpha, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { cn } from '~/utils/tailwind.utils'
import { useAdminBadges } from '~/hooks/useAdminBadges'

interface SideBarProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}
const SideBar = ({ open, setOpen }: SideBarProps) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const badges = useAdminBadges()

  const handleLogout = () => {
    // Xóa token và userInfo từ localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    // Chuyển đến trang login
    navigate('/login')
  }

  return (
    <Drawer
      open={true}
      variant="persistent"
      anchor="left"
      sx={{
        width: open ? '100%' : theme.customLayout.closeSideBarSide,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? theme.customLayout.openSideBarSide : theme.customLayout.closeSideBarSide,
          transition: (theme) => theme.transitions.create('width'),
          overflowX: 'hidden',
          background: 'linear-gradient(180deg, #ecfdf5 0%, #f9fafb 40%, #ffffff 100%)',
          borderRight: '1px solid',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          boxShadow: '0 10px 30px rgba(15, 118, 110, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* HEADER */}
      <SideBarHeader open={open} setOpen={setOpen} />

      {/* LIST */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <List sx={{ px: pxToRem(16), pt: pxToRem(16), flex: 1, overflowY: 'auto' }}>
          {sidebarConfig.map((item) => {
            let dynamicBadge = item.badge ?? 0
            switch (item.path) {
              case '/admin/chat':
                dynamicBadge = badges.unreadMessages
                break
              case '/admin/post-approvals':
                dynamicBadge = badges.pendingPosts
                break
              case '/admin/service-approvals':
                dynamicBadge = badges.pendingServices
                break
              case '/admin/role-upgrade':
                dynamicBadge = badges.pendingUpgradeRequests
                break
              default:
                break
            }
            return (
              <SideBarItem key={item.path} data={{ ...item, badge: dynamicBadge }} open={open} />
            )
          })}
        </List>

        {/* LOGOUT BUTTON - Fixed at bottom */}
        <Box
          sx={{
            px: pxToRem(16),
            pb: pxToRem(16),
            pt: pxToRem(8),
            borderTop: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              maxHeight: pxToRem(36),
              justifyContent: open ? 'initial' : 'center',
              background: 'transparent',
              color: 'error.main',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.error.light, 0.2),
                color: 'error.dark'
              },
              transition: 'all 0.2s ease-in-out',
              padding: (theme) =>
                open
                  ? theme.customLayout.openPaddingSideBar
                  : theme.customLayout.closePaddingSideBar
            }}
            className={cn('flex items-center text-2xl! font-medium! pr-[1.2rem]! py-[1.8rem]!')}
          >
            <ListItemIcon
              sx={{
                minWidth: 36,
                width: pxToRem(36),
                height: pxToRem(36),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.main',
                '& svg': {
                  fontSize: pxToRem(20),
                  transition: 'transform 0.2s ease'
                }
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Đăng xuất"
              sx={{
                opacity: open ? 1 : 0,
                width: open ? 'auto' : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s ease, width 0.2s ease',
                '& .MuiTypography-root': {
                  fontSize: pxToRem(14),
                  fontWeight: 500,
                  color: 'error.main'
                }
              }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBar
