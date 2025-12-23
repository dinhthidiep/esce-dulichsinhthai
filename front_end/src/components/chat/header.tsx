import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { useAdminBadges } from '~/hooks/useAdminBadges'

export default function HeaderChat() {
  const { chat } = useAdminBadges()

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
      <ChatBubbleOutlineIcon
        sx={{
          fontSize: '4rem',
          color: 'common.black',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))'
        }}
      />
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography
          component="h2"
          sx={{
            fontSize: '3.2rem',
            fontWeight: 800
          }}
        >
          Tin nhắn
        </Typography>
        {chat > 0 && (
          <Chip
            label={`${chat} mới`}
            color="error"
            sx={{
              bgcolor: 'rgba(248, 113, 113, 0.95)',
              color: 'white',
              fontWeight: 600,
              borderRadius: '999px'
            }}
          />
        )}
      </Stack>
      <Typography
        sx={{
          fontSize: '1.8rem',
          fontWeight: 600,
          maxWidth: 640,
          color: 'text.secondary'
        }}
      >
        Quản lý tin nhắn và hỗ trợ người dùng
      </Typography>
    </Box>
  )
}
