import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'

type Message = {
  id: number
  senderId: number
  senderName: string
  content: string
  timestamp: string
  image?: string
  reactions?: { emoji: string; userId: number; userName: string }[]
  createdAt?: string
  createdAtMs?: number
}

type MessageBubbleProps = {
  message: Message
  isCurrentUser: boolean
  showAvatar: boolean
  showName: boolean
  showTimestamp: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
  onReactionClick?: (event: React.MouseEvent<HTMLElement>, messageId: number) => void
}

/**
 * MessageBubble component - Giống style Facebook/Zalo
 * - Tin nhắn liên tiếp cùng người gửi được gộp lại
 * - Avatar chỉ hiện ở tin cuối cùng trong nhóm
 * - Tên người gửi chỉ hiện ở tin đầu tiên trong nhóm
 * - Timestamp chỉ hiện khi cách nhau > 5 phút
 * - Border radius thay đổi theo vị trí trong nhóm
 */
export default function MessageBubble({
  message,
  isCurrentUser,
  showAvatar,
  showName,
  showTimestamp,
  isFirstInGroup,
  isLastInGroup,
  onReactionClick
}: MessageBubbleProps) {
  // Border radius theo vị trí trong nhóm tin nhắn
  const getBorderRadius = () => {
    const baseRadius = '1.8rem'
    const smallRadius = '0.4rem'

    if (isCurrentUser) {
      // Tin nhắn của mình - bên phải
      if (isFirstInGroup && isLastInGroup) {
        // Tin nhắn đơn lẻ
        return `${baseRadius} ${baseRadius} ${smallRadius} ${baseRadius}`
      } else if (isFirstInGroup) {
        // Tin đầu tiên trong nhóm
        return `${baseRadius} ${baseRadius} ${smallRadius} ${baseRadius}`
      } else if (isLastInGroup) {
        // Tin cuối cùng trong nhóm
        return `${baseRadius} ${smallRadius} ${smallRadius} ${baseRadius}`
      } else {
        // Tin ở giữa nhóm
        return `${baseRadius} ${smallRadius} ${smallRadius} ${baseRadius}`
      }
    } else {
      // Tin nhắn của người khác - bên trái
      if (isFirstInGroup && isLastInGroup) {
        return `${baseRadius} ${baseRadius} ${baseRadius} ${smallRadius}`
      } else if (isFirstInGroup) {
        return `${baseRadius} ${baseRadius} ${baseRadius} ${smallRadius}`
      } else if (isLastInGroup) {
        return `${smallRadius} ${baseRadius} ${baseRadius} ${smallRadius}`
      } else {
        return `${smallRadius} ${baseRadius} ${baseRadius} ${smallRadius}`
      }
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: isLastInGroup ? 1 : 0.2,
        px: 1
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 1
        }}
      >
        {/* Avatar - chỉ hiện ở tin cuối trong nhóm */}
        {!isCurrentUser && (
          <Box sx={{ width: 32, height: 32, flexShrink: 0 }}>
            {showAvatar && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '1.2rem',
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
                }}
              >
                {message.senderName.charAt(0).toUpperCase()}
              </Avatar>
            )}
          </Box>
        )}

        <Box 
          sx={{ 
            position: 'relative', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
            '&:hover .reaction-btn': { opacity: 1 } 
          }}
        >
          {/* Tên người gửi - chỉ hiện ở tin đầu trong nhóm */}
          {showName && !isCurrentUser && (
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'text.secondary',
                ml: 1.5,
                mb: 0.3
              }}
            >
              {message.senderName}
            </Typography>
          )}

          {/* Message bubble */}
          <Box
            sx={{
              px: 1.5,
              py: 0.8,
              background: isCurrentUser
                ? 'linear-gradient(135deg, #0084ff 0%, #0099ff 100%)'
                : '#e4e6eb',
              color: isCurrentUser ? '#fff' : '#050505',
              borderRadius: getBorderRadius(),
              maxWidth: '100%',
              wordBreak: 'break-word',
              position: 'relative',
              transition: 'transform 0.1s ease',
              boxShadow: isCurrentUser
                ? '0 1px 2px rgba(0, 0, 0, 0.1)'
                : '0 1px 2px rgba(0, 0, 0, 0.05)',
              '&:hover': {
                transform: 'scale(1.01)'
              }
            }}
          >
            {/* Ảnh đính kèm */}
            {message.image && (
              <Box
                sx={{
                  mb: message.content ? 0.5 : 0,
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  maxWidth: '300px'
                }}
              >
                <img
                  src={message.image}
                  alt="attachment"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            )}

            {/* Nội dung tin nhắn */}
            {message.content && (
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.content}
              </Typography>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: isCurrentUser ? 'auto' : 8,
                  left: isCurrentUser ? 8 : 'auto',
                  display: 'flex',
                  gap: 0.2,
                  bgcolor: '#fff',
                  borderRadius: '1rem',
                  px: 0.5,
                  py: 0.2,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                }}
              >
                {message.reactions.slice(0, 3).map((r, i) => (
                  <span key={i} style={{ fontSize: '1.2rem' }}>{r.emoji}</span>
                ))}
                {message.reactions.length > 3 && (
                  <Typography sx={{ fontSize: '1rem', color: 'text.secondary' }}>
                    +{message.reactions.length - 3}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Reaction button */}
          <Tooltip title="Thêm biểu cảm" placement={isCurrentUser ? 'left' : 'right'}>
            <IconButton
              className="reaction-btn"
              size="small"
              onClick={(e) => onReactionClick?.(e, message.id)}
              sx={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [isCurrentUser ? 'left' : 'right']: -32,
                opacity: 0,
                transition: 'opacity 0.2s',
                bgcolor: 'rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
              }}
            >
              <InsertEmoticonIcon sx={{ fontSize: '1.6rem' }} />
            </IconButton>
          </Tooltip>

          {/* Timestamp - chỉ hiện khi cần */}
          {showTimestamp && (
            <Typography
              sx={{
                fontSize: '1rem',
                color: 'text.secondary',
                mt: 0.5,
                ml: isCurrentUser ? 0 : 1.5,
                mr: isCurrentUser ? 1.5 : 0,
                textAlign: isCurrentUser ? 'right' : 'left',
                opacity: 0.7
              }}
            >
              {message.timestamp}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Helper function để xác định cách hiển thị tin nhắn trong danh sách
 * Trả về thông tin về việc hiển thị avatar, tên, timestamp cho mỗi tin nhắn
 */
export function getMessageDisplayInfo(
  messages: Message[],
  currentUserId: number,
  index: number
): {
  showAvatar: boolean
  showName: boolean
  showTimestamp: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
} {
  const message = messages[index]
  const prevMessage = index > 0 ? messages[index - 1] : null
  const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

  const isCurrentUser = message.senderId === currentUserId
  const isSameSenderAsPrev = prevMessage && prevMessage.senderId === message.senderId
  const isSameSenderAsNext = nextMessage && nextMessage.senderId === message.senderId

  // Kiểm tra khoảng cách thời gian (5 phút = 300000ms)
  const TIME_GAP = 5 * 60 * 1000
  const getTimestampMs = (msg: Message) => {
    // Ưu tiên dùng createdAtMs nếu có, sau đó là createdAt (ISO string)
    if (msg.createdAtMs) return msg.createdAtMs
    if (msg.createdAt) {
      const time = new Date(msg.createdAt).getTime()
      return Number.isNaN(time) ? 0 : time
    }
    return 0
  }

  const timeDiffWithPrev = prevMessage
    ? getTimestampMs(message) - getTimestampMs(prevMessage)
    : Infinity
  const timeDiffWithNext = nextMessage
    ? getTimestampMs(nextMessage) - getTimestampMs(message)
    : Infinity

  const isTimeGapWithPrev = timeDiffWithPrev > TIME_GAP
  const isTimeGapWithNext = timeDiffWithNext > TIME_GAP

  // Xác định vị trí trong nhóm
  const isFirstInGroup = !isSameSenderAsPrev || isTimeGapWithPrev
  const isLastInGroup = !isSameSenderAsNext || isTimeGapWithNext

  return {
    showAvatar: isLastInGroup && !isCurrentUser,
    showName: isFirstInGroup && !isCurrentUser,
    showTimestamp: isLastInGroup || isTimeGapWithNext,
    isFirstInGroup,
    isLastInGroup
  }
}
