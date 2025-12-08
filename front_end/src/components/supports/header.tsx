import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import { useAdminBadges } from '~/hooks/useAdminBadges'

export default function HeaderSupports() {
  const { supports } = useAdminBadges()

  return (
    <Box className="text-center! py-[3.2rem]!">
      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
        <Typography component="h2" className="text-[3.6rem]! font-bold! drop-shadow-2xl! mb-2!">
          Quản lý Hỗ trợ
        </Typography>
        {supports > 0 && (
          <Chip
            icon={<HeadphonesIcon />}
            label={`${supports} ticket mới`}
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
      <Typography className="text-[2rem]! font-semibold! text-[#00000] drop-shadow-xl!">
        Xem và phản hồi các phiếu hỗ trợ từ người dùng
      </Typography>
    </Box>
  )
}
