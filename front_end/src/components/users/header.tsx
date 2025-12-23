import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PeopleIcon from '@mui/icons-material/People'

export default function HeaderUsers() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        py: '3.2rem',
        textAlign: 'center'
      }}
    >
      <PeopleIcon
        sx={{
          fontSize: '4rem',
          color: 'common.black',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))'
        }}
      />
      <Typography
        component="h2"
        sx={{
          fontSize: '3.2rem',
          fontWeight: 800
        }}
      >
        Quản lý Users
      </Typography>
      <Typography
        sx={{
          fontSize: '1.8rem',
          fontWeight: 600,
          maxWidth: 640,
          color: 'text.secondary'
        }}
      >
        Xem và quản lý tài khoản người dùng trong hệ thống
      </Typography>
    </Box>
  )
}
