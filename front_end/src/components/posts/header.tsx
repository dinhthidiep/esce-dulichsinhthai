import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PostAddIcon from '@mui/icons-material/PostAdd'

export default function HeaderPosts() {
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
      <PostAddIcon
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
        Quản lý Bài viết
      </Typography>
      <Typography
        sx={{
          fontSize: '1.8rem',
          fontWeight: 600,
          maxWidth: 640,
          color: 'text.secondary'
        }}
      >
        Xem và đăng bài viết mới
      </Typography>
    </Box>
  )
}
