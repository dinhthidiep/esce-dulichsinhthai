import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { useAdminBadges } from '~/hooks/useAdminBadges'

export default function HeaderRoleUpgrade() {
  const { roleUpgrade } = useAdminBadges()

  return (
    <Box
      className="text-center! py-[3.2rem]!"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <WorkspacePremiumIcon
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
          Nâng cấp vai trò
        </Typography>
        {roleUpgrade > 0 && (
          <Chip
            label={`${roleUpgrade} yêu cầu mới`}
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
          maxWidth: 640
        }}
      >
        Cho phép người dùng gửi phiếu yêu cầu đến Admin để nâng cấp vai trò lên Host hoặc Travel
        Agency
      </Typography>
    </Box>
  )
}
