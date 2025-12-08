import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, Alert, List, ListItem, ListItemText, Divider } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const GoogleOAuthHelper: React.FC = () => {
  const [origin, setOrigin] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = origin
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          maxWidth: 700,
          width: '100%',
          padding: 4,
          borderRadius: 3
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          🔧 Fix Google OAuth Error
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Xác định URL và thêm vào Google Cloud Console
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            URL cần thêm vào Google Cloud Console:
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              border: '2px solid',
              borderColor: 'primary.main'
            }}
          >
            <Typography
              variant="h6"
              fontFamily="monospace"
              color="primary"
              sx={{ wordBreak: 'break-all', textAlign: 'center' }}
            >
              {origin || 'Đang kiểm tra...'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
            onClick={copyToClipboard}
            fullWidth
            sx={{ mt: 2 }}
          >
            {copied ? 'Đã copy!' : '📋 Copy URL'}
          </Button>
        </Alert>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📝 Các bước thực hiện:
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="1. Copy URL ở trên"
              secondary="Click nút 'Copy URL' để copy URL vào clipboard"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="2. Mở Google Cloud Console"
              secondary="Click nút bên dưới hoặc vào: console.cloud.google.com/apis/credentials"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="3. Tìm OAuth 2.0 Client ID"
              secondary="Tìm client có ID: 289291166935-o3fvel5dqb8mac1tfsvbsq5b7c7jdajg"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="4. Click vào để chỉnh sửa"
              secondary="Click vào tên client hoặc icon edit (✏️)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="5. Thêm URL vào Authorized JavaScript origins"
              secondary="Scroll xuống phần 'Authorized JavaScript origins', click '+ ADD URI', paste URL đã copy"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="6. Lưu và đợi"
              secondary="Click SAVE, đợi 2-5 phút để Google cập nhật"
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            ⚠️ Lưu ý quan trọng:
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>URL phải khớp 100% với URL hiển thị ở trên</li>
              <li>Không có dấu <code>/</code> ở cuối URL</li>
              <li>Phải bắt đầu bằng <code>http://</code> hoặc <code>https://</code></li>
              <li>Sau khi SAVE, phải đợi 2-5 phút mới test lại</li>
            </ul>
          </Typography>
        </Alert>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<OpenInNewIcon />}
            onClick={openGoogleConsole}
            fullWidth
            size="large"
          >
            🚀 Mở Google Cloud Console
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default GoogleOAuthHelper

