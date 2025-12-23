import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ArticleIcon from '@mui/icons-material/Article'
import PostApprovalsContent from './content'

const PostApprovals = () => {
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
        <ArticleIcon
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
          Phê duyệt Bài viết
        </Typography>
        <Typography
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            maxWidth: 640,
            color: 'text.secondary'
          }}
        >
          Xem xét và phê duyệt các bài viết từ người dùng trước khi hiển thị công khai
        </Typography>
      </Box>
      <Box sx={{ px: 3, pb: 3 }}>
        <PostApprovalsContent />
      </Box>
    </>
  )
}

export default PostApprovals
