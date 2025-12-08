import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import { useAdminBadges } from '~/hooks/useAdminBadges'

export default function HeaderSupportApprovals() {
  const { supportApprovals } = useAdminBadges()

  return (
    <Box className="text-center! py-[3.2rem]!">
      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
        <Typography
          component="h2"
          className="text-[3.6rem]! font-bold! text-white! drop-shadow-2xl! mb-2!"
        >
          Phê duyệt yêu cầu
        </Typography>
        {supportApprovals > 0 && (
          <Chip
            icon={<PendingActionsIcon />}
            label={`${supportApprovals} yêu cầu mới`}
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
        className="text-[2rem]! font-semibold! text-white! drop-shadow-xl!"
        sx={{
          textShadow:
            'rgba(0, 0, 0, 0.7) 1px 1px 3px, rgba(34, 197, 94, 0.4) 0px 0px 8px'
        }}
      >
        Duyệt và cập nhật trạng thái các yêu cầu mới (combo dịch vụ, bài viết...) từ người dùng
      </Typography>
    </Box>
  )
}


