import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices'
import ServiceApprovalsContent from './content'

const ServiceApprovals = () => {
  return (
    <>
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
        <MiscellaneousServicesIcon
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
          Phê duyệt Dịch vụ
        </Typography>
        <Typography
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            maxWidth: 640,
            color: 'text.secondary'
          }}
        >
          Xem xét và phê duyệt các dịch vụ combo từ Host trước khi hiển thị cho người dùng
        </Typography>
      </Box>
      <Box sx={{ px: 3, pb: 3 }}>
        <ServiceApprovalsContent />
      </Box>
    </>
  )
}

export default ServiceApprovals
