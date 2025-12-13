import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import DashboardIcon from '@mui/icons-material/Dashboard'

export default function HeaderDashboard() {
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
      <DashboardIcon
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
        Admin Dashboard
      </Typography>
      <Typography
        sx={{
          fontSize: '1.8rem',
          fontWeight: 600,
          maxWidth: 640,
          color: 'text.secondary'
        }}
      >
        Hệ thống quản trị Du lịch Sinh thái
      </Typography>
    </Box>
  )
}
