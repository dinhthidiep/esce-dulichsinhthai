import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { useAdminBadges } from '~/hooks/useAdminBadges'

export default function HeaderChat() {
  const { chat } = useAdminBadges()

  return (
    <Box className="text-center! py-[3.2rem]!">
      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
        <Typography component="h2" className="text-[3.6rem]! font-bold! drop-shadow-2xl! mb-2!">
          Tin nhắn
        </Typography>
        {chat > 0 && (
          <Chip
            icon={<ChatBubbleOutlineIcon />}
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
    </Box>
  )
}
