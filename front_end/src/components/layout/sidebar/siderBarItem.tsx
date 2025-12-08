import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SideBarItemProps } from '~/types/menu'
import { pxToRem } from '~/utils/convert-px-to-unit.utils'
import { cn } from '~/utils/tailwind.utils'

const SideBarItem = ({
  data,
  onClick,
  renderIcon,
  renderText,
  open,
  ...props
}: SideBarItemProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === data.path

  const handleClick = () => {
    onClick?.()
    navigate(data.path)
  }

  // --- icon render logic ---
  const iconNode = renderIcon ? renderIcon(data, isActive) : data.icon

  // --- text render logic ---
  const textNode = renderText ? renderText(data, isActive) : data.title

  return (
    <ListItemButton
      {...props}
      onClick={handleClick}
      sx={{
        borderRadius: 2,
        mb: 1,
        maxHeight: pxToRem(36),
        justifyContent: open ? 'initial' : 'center',
        background: (theme) => (isActive ? theme.customBackgroundColor.main : 'transparent'),
        color: (theme) => (isActive ? theme.palette.common.white : 'inherit'),
        '&:hover': {
          background: (theme) =>
            isActive
              ? theme.customBackgroundColor.main
              : theme.customBackgroundColor.hoverListItemColor,
          filter: 'brightness(1.1)',
          color: (theme) => theme.palette.success.dark
        },
        transition: 'all 0.2s ease-in-out',
        padding: (theme) =>
          open ? theme.customLayout.openPaddingSideBar : theme.customLayout.closePaddingSideBar,
        ...(props.sx || {})
      }}
      className={cn(
        'flex items-center text-2xl! font-medium! pr-[1.2rem]! py-[1.8rem]!',
        props.className
      )}
    >
      {/* --- Left side: icon + text --- */}
      <Box
        className="flex items-center gap-2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: open ? 2 : 0,
          width: '100%',
          justifyContent: open ? 'flex-start' : 'center'
        }}
      >
        {/* Icon */}
        <ListItemIcon
          sx={{
            minWidth: 36,
            width: pxToRem(36),
            height: pxToRem(36),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: (theme) => (isActive ? theme.palette.common.white : 'inherit'),
            '& svg': {
              fontSize: pxToRem(20),
              transition: 'transform 0.2s ease',
              transform: isActive ? 'scale(1.1)' : 'scale(1.0)'
            }
          }}
        >
          {iconNode}
        </ListItemIcon>

        {/* TEXT – ẨN KHI MINI */}
        <ListItemText
          primary={textNode}
          sx={{
            opacity: open ? 1 : 0,
            width: open ? 'auto' : 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s ease, width 0.2s ease',
            '& .MuiTypography-root': {
              fontSize: pxToRem(14),
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'common.white' : 'inherit'
            }
          }}
        />
      </Box>
      {/* === RIGHT: BADGE – Chỉ hiện khi open === */}
      {open && Number(data.badge) > 0 && (
        <Badge
          badgeContent={data.badge}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              position: 'relative',
              right: 0,
              fontSize: pxToRem(11),
              minWidth: pxToRem(20),
              height: pxToRem(20),
              borderRadius: pxToRem(8),
              px: pxToRem(8),
              py: pxToRem(2),
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }
          }}
        />
      )}
    </ListItemButton>
  )
}

export default SideBarItem
