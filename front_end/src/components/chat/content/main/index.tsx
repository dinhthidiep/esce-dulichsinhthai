import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import {
  Typography,
  Avatar,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Chip,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import ImageIcon from '@mui/icons-material/Image'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'
import AddCommentIcon from '@mui/icons-material/AddComment'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import {
  getUsersForChat,
  getChattedUsers,
  getChatHistory,
  sendChatMessage,
  type ChatUser,
  type ChatMessage,
  deleteConversation
} from '~/api/instances/ChatApi'
import { onReceiveMessage } from '~/api/instances/chatSignalR'
import { uploadImageToFirebase } from '~/firebaseClient'
import MessageBubble, { getMessageDisplayInfo } from './MessageBubble'

type Reaction = {
  emoji: string
  userId: number
  userName: string
}

type Message = {
  id: number
  senderId: number
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isRead: boolean
  reactions?: Reaction[]
  image?: string // Base64 image data
  createdAt?: string
  createdAtMs?: number
}

type Conversation = {
  id: number
  participantId: number
  participantName: string
  participantAvatar: string
  participantRole: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
  lastActivity: number
  isHistoryLoaded: boolean
}

/**
 * Parse và normalize timestamp từ backend
 * Backend gửi UTC time, cần đảm bảo parse đúng
 */
const parseTimestamp = (value?: string): number => {
  if (!value) return Date.now()

  try {
    // Nếu là string, đảm bảo có timezone indicator
    let timestampStr = value
    if (typeof timestampStr === 'string') {
      // Nếu không có timezone indicator, thêm 'Z' (UTC)
      // Kiểm tra xem có phải là ISO format không (có T)
      if (timestampStr.includes('T')) {
        // Nếu không có timezone indicator (Z, +, hoặc - với offset)
        if (!timestampStr.includes('Z') && !timestampStr.match(/[+-]\d{2}:\d{2}$/)) {
          timestampStr = timestampStr + 'Z'
        }
      }
    }

    const date = new Date(timestampStr)
    const timeMs = date.getTime()

    if (Number.isNaN(timeMs)) {
      console.warn('[parseTimestamp] Invalid date, using current time:', { value, timestampStr })
      return Date.now()
    }

    return timeMs
  } catch (error) {
    console.warn('[parseTimestamp] Error parsing timestamp, using current time:', { value, error })
    return Date.now()
  }
}

/**
 * Format timestamp để hiển thị cho user
 */
const formatTimestamp = (value?: string): string => {
  if (!value) return 'Vừa xong'

  const messageTime = parseTimestamp(value)
  const now = Date.now()
  const diffMs = now - messageTime

  // Nếu diffMs âm (tin nhắn trong tương lai), có thể do timezone issue
  // Hoặc nếu chênh lệch quá lớn (> 1 ngày trong tương lai), có thể do lỗi
  if (diffMs < -24 * 60 * 60 * 1000) {
    console.warn('[formatTimestamp] Message time is too far in the future:', {
      value,
      messageTime: new Date(messageTime).toISOString(),
      now: new Date(now).toISOString(),
      diffMs,
      diffHours: Math.floor(diffMs / (60 * 60 * 1000))
    })
    return 'Vừa xong'
  }

  // Nếu tin nhắn trong tương lai nhưng < 1 ngày, có thể do clock skew nhỏ, vẫn hiển thị "Vừa xong"
  if (diffMs < 0) {
    return 'Vừa xong'
  }

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'Vừa xong'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`

  // Nếu > 7 ngày, hiển thị ngày tháng đầy đủ
  return new Date(messageTime).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const mapChatMessage = (
  payload: ChatMessage,
  participantName: string,
  currentUserId: number,
  currentUserName: string
): Message => {
  // Đảm bảo senderId và currentUserId đều là number để so sánh chính xác
  const senderIdNum = Number(payload.senderId)
  const currentUserIdNum = Number(currentUserId)

  // Validation: đảm bảo không có NaN
  if (Number.isNaN(senderIdNum)) {
    console.error('[mapChatMessage] Invalid senderId:', payload.senderId, payload)
    throw new Error(`Invalid senderId: ${payload.senderId}`)
  }
  if (Number.isNaN(currentUserIdNum)) {
    console.error('[mapChatMessage] Invalid currentUserId:', currentUserId)
    throw new Error(`Invalid currentUserId: ${currentUserId}`)
  }

  // Xác định senderName: nếu senderId === currentUserId thì là currentUser, ngược lại là participant
  const isFromCurrentUser = senderIdNum === currentUserIdNum
  const senderName = isFromCurrentUser ? currentUserName : participantName

  // Parse timestamp một cách nhất quán
  const createdAt = payload.createdAt ?? new Date().toISOString()
  const createdAtMs = parseTimestamp(createdAt)

  // Debug log cho các trường hợp có vấn đề
  if (senderIdNum !== payload.senderId || currentUserIdNum !== currentUserId) {
    console.log('[mapChatMessage] Type conversion:', {
      originalSenderId: payload.senderId,
      convertedSenderId: senderIdNum,
      originalCurrentUserId: currentUserId,
      convertedCurrentUserId: currentUserIdNum,
      isFromCurrentUser,
      senderName,
      participantName,
      currentUserName
    })
  }

  return {
    id: payload.id,
    senderId: senderIdNum, // Đảm bảo là number
    senderName: senderName, // Đã được xác định ở trên
    senderAvatar: '',
    content: payload.content,
    image: payload.imageUrl, // URL ảnh từ Firebase Storage
    timestamp: formatTimestamp(createdAt),
    isRead: payload.isRead ?? false,
    createdAt,
    createdAtMs // Đã được parse đúng
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Travel agency':
      return 'primary'
    case 'Host':
      return 'secondary'
    default:
      return 'default'
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'Travel agency':
      return 'Travel Agency'
    case 'Host':
      return 'Host'
    case 'Tourist':
      return 'Tourist'
    default:
      return role
  }
}

export default function ChatMainContent() {
  // Lấy thông tin user từ localStorage
  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        return JSON.parse(userInfoStr)
      }
    } catch (error) {
      console.error('Error parsing userInfo:', error)
    }
    return {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'Admin'
    }
  }

  const userInfo = getUserInfo()
  // Đảm bảo currentUser.id luôn là number và hợp lệ
  // Backend trả về PascalCase (Id), frontend có thể lưu camelCase (id)
  const currentUserId = Number(userInfo.Id ?? userInfo.id ?? userInfo.userId ?? 1)
  if (Number.isNaN(currentUserId) || currentUserId <= 0) {
    console.error('[ChatMainContent] Invalid currentUserId:', currentUserId, userInfo)
  }
  const currentUser = {
    id: currentUserId,
    name: userInfo.Name || userInfo.name || userInfo.fullName || userInfo.FullName || 'Admin',
    email: userInfo.Email || userInfo.email || 'admin@example.com'
  }

  // Debug log để kiểm tra
  console.log('[ChatMainContent] Current user:', {
    id: currentUser.id,
    idType: typeof currentUser.id,
    name: currentUser.name
  })

  const [conversations, setConversations] = useState<Conversation[]>([])
  // Lưu selectedConversationId vào localStorage để persist qua reload
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('chat_selectedConversationId')
      return saved ? Number(saved) : null
    } catch {
      return null
    }
  })
  const [messageText, setMessageText] = useState('')
  const [searchText, setSearchText] = useState('')
  const messagesStartRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef<number>(0)
  const [reactionAnchorEl, setReactionAnchorEl] = useState<{
    [key: number]: HTMLElement | null
  }>({})
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false)
  const [availableChatUsers, setAvailableChatUsers] = useState<ChatUser[]>([])
  const [selectedChatUser, setSelectedChatUser] = useState<ChatUser | null>(null)
  const [isLoadingChatUsers, setIsLoadingChatUsers] = useState(false)
  const [createChatError, setCreateChatError] = useState<string | null>(null)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [conversationError, setConversationError] = useState<string | null>(null)
  const [loadingHistoryFor, setLoadingHistoryFor] = useState<number | null>(null)
  const [initialMessage, setInitialMessage] = useState('')
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const mapApiMessageToUi = useCallback(
    (payload: ChatMessage, participantName: string) =>
      mapChatMessage(payload, participantName, currentUser.id, currentUser.name),
    [currentUser.id, currentUser.name]
  )

  const upsertConversationWithMessage = useCallback(
    (participantMeta: { id: number; name: string; role: string }, apiMessage: ChatMessage) => {
      setConversations((prev) => {
        const formatted = mapApiMessageToUi(apiMessage, participantMeta.name)
        let updated = false

        const next = prev.map((conv) => {
          if (conv.participantId !== participantMeta.id) {
            return conv
          }

          updated = true

          // Kiểm tra xem message đã có chưa (tránh duplicate)
          const messageExists = conv.messages.some((msg) => {
            // Nếu cả hai đều có ID > 0, so sánh bằng ID
            if (formatted.id > 0 && msg.id > 0) {
              return msg.id === formatted.id
            }
            // Nếu không có ID, so sánh bằng content, senderId và timestamp (trong vòng 5 giây)
            return (
              msg.content === formatted.content &&
              msg.senderId === formatted.senderId &&
              Math.abs((msg.createdAtMs ?? 0) - (formatted.createdAtMs ?? 0)) < 5000
            )
          })

          if (messageExists) {
            // Message đã có, cập nhật nếu cần (ví dụ: thay optimistic message bằng message có ID thật)
            if (formatted.id > 0) {
              const updatedMessages = conv.messages.map((msg) => {
                // Nếu là optimistic message (id = 0) và match với formatted, thay thế
                if (
                  msg.id === 0 &&
                  msg.content === formatted.content &&
                  msg.senderId === formatted.senderId &&
                  Math.abs((msg.createdAtMs ?? 0) - (formatted.createdAtMs ?? 0)) < 5000
                ) {
                  return formatted
                }
                return msg
              })

              // Sắp xếp lại theo thời gian
              updatedMessages.sort((a, b) => {
                const timeA = a.createdAtMs ?? parseTimestamp(a.createdAt)
                const timeB = b.createdAtMs ?? parseTimestamp(b.createdAt)
                return timeA - timeB
              })

              const lastMessage = updatedMessages[updatedMessages.length - 1]
              return {
                ...conv,
                participantName: participantMeta.name,
                participantRole: participantMeta.role,
                messages: updatedMessages,
                lastMessage: lastMessage?.content || formatted.content,
                lastMessageTime: lastMessage?.timestamp || formatted.timestamp,
                lastActivity: lastMessage?.createdAtMs ?? formatted.createdAtMs ?? Date.now(),
                unreadCount: 0,
                isHistoryLoaded: true
              }
            }

            // Message đã có và không cần update, giữ nguyên
            return conv
          }

          // Thêm message mới và sắp xếp lại theo thời gian
          const messages = [...conv.messages, formatted].sort((a, b) => {
            const timeA = a.createdAtMs ?? parseTimestamp(a.createdAt)
            const timeB = b.createdAtMs ?? parseTimestamp(b.createdAt)
            return timeA - timeB
          })

          const lastMessage = messages[messages.length - 1]
          return {
            ...conv,
            participantName: participantMeta.name,
            participantRole: participantMeta.role,
            messages,
            lastMessage: lastMessage?.content || formatted.content,
            lastMessageTime: lastMessage?.timestamp || formatted.timestamp,
            lastActivity: lastMessage?.createdAtMs ?? formatted.createdAtMs ?? Date.now(),
            unreadCount: 0,
            isHistoryLoaded: true
          }
        })

        if (updated) {
          return next
        }

        return [
          {
            id: participantMeta.id,
            participantId: participantMeta.id,
            participantName: participantMeta.name,
            participantAvatar: '',
            participantRole: participantMeta.role,
            lastMessage: formatted.content,
            lastMessageTime: formatted.timestamp,
            unreadCount: 0,
            messages: [formatted],
            lastActivity: formatted.createdAtMs ?? Date.now(),
            isHistoryLoaded: true
          },
          ...prev
        ]
      })
    },
    [mapApiMessageToUi]
  )

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    setConversationError(null)
    try {
      const users = await getChattedUsers()

      // Tạo danh sách conversations ban đầu
      const initialConversations = users.map((user) => {
        const participantId = Number(user.userId)
        return {
          id: participantId,
          participantId,
          participantName: user.fullName,
          participantAvatar: '',
          participantRole: user.role,
          lastMessage: 'Đang tải...',
          lastMessageTime: '',
          unreadCount: 0,
          messages: [] as Message[],
          lastActivity: 0,
          isHistoryLoaded: false
        }
      })

      // Set conversations trước để hiển thị danh sách
      setConversations(initialConversations)

      // Load chat history cho tất cả conversations song song
      const conversationsWithHistory = await Promise.all(
        initialConversations.map(async (conv) => {
          try {
            const history = await getChatHistory(conv.participantId.toString())
            if (history.length > 0) {
              // Sắp xếp messages theo thời gian
              const sortedHistory = [...history].sort((a, b) => {
                const timeA = parseTimestamp(a.createdAt)
                const timeB = parseTimestamp(b.createdAt)
                return timeA - timeB
              })

              // Map messages
              const messages = sortedHistory.map((msg) =>
                mapChatMessage(msg, conv.participantName, currentUser.id, currentUser.name)
              )

              const lastMsg = messages[messages.length - 1]
              return {
                ...conv,
                messages,
                lastMessage: lastMsg?.content || 'Chưa có tin nhắn',
                lastMessageTime: lastMsg?.timestamp || '',
                lastActivity: lastMsg?.createdAtMs || 0,
                isHistoryLoaded: true
              }
            }
            return {
              ...conv,
              lastMessage: 'Chưa có tin nhắn',
              isHistoryLoaded: true
            }
          } catch {
            return {
              ...conv,
              lastMessage: 'Chưa có tin nhắn',
              isHistoryLoaded: true
            }
          }
        })
      )

      // Sắp xếp theo thời gian tin nhắn cuối cùng
      conversationsWithHistory.sort((a, b) => {
        const scoreA = getConversationActivityScore(a)
        const scoreB = getConversationActivityScore(b)

        if (scoreA > 0 && scoreB > 0) {
          return scoreB - scoreA
        }
        if (scoreA === 0 && scoreB > 0) return 1
        if (scoreB === 0 && scoreA > 0) return -1
        return 0
      })

      setConversations(conversationsWithHistory)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách đoạn chat.'
      setConversationError(message)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [currentUser.id, currentUser.name])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Setup SignalR để nhận tin nhắn realtime (lazy initialization - chỉ khi cần)
  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    // Chỉ khởi tạo SignalR connection khi user đã đăng nhập và có token
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('[ChatMainContent] No token found, skipping SignalR setup')
      return
    }

    // Khởi tạo SignalR listener (không throw error nếu fail)
    try {
      unsubscribe = onReceiveMessage((signalRMessage) => {
        if (!isMounted) return

        console.log('[ChatMainContent] Received message via SignalR:', signalRMessage)

        // Parse message từ SignalR format: { senderId, receiverId, content, timestamp }
        // senderId và receiverId từ SignalR có thể là string hoặc number, cần convert sang number
        const senderId = Number(signalRMessage.senderId)
        const receiverId = Number(signalRMessage.receiverId)
        const currentUserIdNum = Number(currentUser.id)

        // Validation
        if (Number.isNaN(senderId) || Number.isNaN(receiverId) || Number.isNaN(currentUserIdNum)) {
          console.error('[ChatMainContent] Invalid IDs from SignalR:', {
            senderId: signalRMessage.senderId,
            receiverId: signalRMessage.receiverId,
            currentUserId: currentUser.id,
            convertedSenderId: senderId,
            convertedReceiverId: receiverId,
            convertedCurrentUserId: currentUserIdNum
          })
          return
        }

        // Xác định participant (người còn lại trong cuộc chat)
        // Đảm bảo so sánh chính xác bằng cách dùng number
        const participantId = senderId === currentUserIdNum ? receiverId : senderId

        // Kiểm tra xem tin nhắn này đã có trong conversation chưa (tránh duplicate)
        // Nếu là tin nhắn từ chính mình gửi và đã có optimistic update, sẽ được cập nhật lại

        // Tìm conversation tương ứng từ state hiện tại
        setConversations((prevConversations) => {
          const conversation = prevConversations.find(
            (conv) => conv.participantId === participantId
          )

          if (conversation) {
            // Tạo ChatMessage từ SignalR message
            // Xử lý timestamp: đảm bảo là ISO string format
            let timestampStr: string
            if (signalRMessage.timestamp) {
              if (typeof signalRMessage.timestamp === 'string') {
                timestampStr = signalRMessage.timestamp
                // Đảm bảo timestamp là ISO format (có thể backend gửi UTC nhưng không có 'Z')
                if (
                  timestampStr.includes('T') &&
                  !timestampStr.includes('Z') &&
                  !timestampStr.match(/[+-]\d{2}:\d{2}$/)
                ) {
                  timestampStr = timestampStr + 'Z'
                }
              } else {
                // Nếu timestamp là object hoặc number, convert sang ISO string
                timestampStr = new Date(signalRMessage.timestamp).toISOString()
              }
            } else {
              // Nếu không có timestamp, dùng thời gian hiện tại
              timestampStr = new Date().toISOString()
            }

            const apiMessage: ChatMessage = {
              id: 0, // Backend sẽ có ID thật, nhưng SignalR message không có
              senderId: senderId, // Đảm bảo là number
              receiverId: receiverId, // Đảm bảo là number
              content: signalRMessage.content,
              imageUrl: signalRMessage.imageUrl ?? undefined,
              createdAt: timestampStr,
              isRead: false
            }

            console.log('[ChatMainContent] Processing SignalR message:', {
              senderId,
              receiverId,
              currentUserId: currentUserIdNum,
              participantId,
              participantName: conversation.participantName,
              isFromCurrentUser: senderId === currentUserIdNum
            })

            // Map message sang UI format với đúng tên người gửi
            const formatted = mapApiMessageToUi(apiMessage, conversation.participantName)

            // Cập nhật conversation với tin nhắn mới
            return prevConversations.map((conv) => {
              if (conv.participantId !== participantId) {
                return conv
              }

              // Kiểm tra xem tin nhắn này đã có chưa (tránh duplicate khi nhận từ SignalR)
              // So sánh bằng ID (nếu có), hoặc content + timestamp để tránh duplicate
              const messageExists = conv.messages.some((msg) => {
                // Nếu formatted có ID > 0 và message cũ cũng có ID > 0, so sánh bằng ID
                if (formatted.id > 0 && msg.id > 0) {
                  return msg.id === formatted.id
                }
                // Nếu không có ID, so sánh bằng content và timestamp (trong vòng 5 giây)
                return (
                  msg.content === formatted.content &&
                  msg.senderId === formatted.senderId &&
                  Math.abs((msg.createdAtMs ?? 0) - (formatted.createdAtMs ?? 0)) < 5000
                )
              })

              if (messageExists) {
                // Tin nhắn đã có (từ optimistic update hoặc đã load từ API), cập nhật nếu cần
                // Nếu formatted có ID > 0 và message cũ có ID = 0 (optimistic), thay thế
                const existingIndex = conv.messages.findIndex((msg) => {
                  if (formatted.id > 0 && msg.id === 0) {
                    return (
                      msg.content === formatted.content &&
                      msg.senderId === formatted.senderId &&
                      Math.abs((msg.createdAtMs ?? 0) - (formatted.createdAtMs ?? 0)) < 5000
                    )
                  }
                  return false
                })

                if (existingIndex >= 0 && formatted.id > 0) {
                  // Thay thế optimistic message bằng message có ID thật
                  const updatedMessages = [...conv.messages]
                  updatedMessages[existingIndex] = formatted
                  // Sắp xếp lại theo thời gian
                  updatedMessages.sort((a, b) => {
                    const timeA = a.createdAtMs ?? parseTimestamp(a.createdAt)
                    const timeB = b.createdAtMs ?? parseTimestamp(b.createdAt)
                    return timeA - timeB
                  })
                  return {
                    ...conv,
                    messages: updatedMessages,
                    lastMessage: formatted.content,
                    lastMessageTime: formatted.timestamp,
                    lastActivity: formatted.createdAtMs ?? Date.now(),
                    unreadCount: selectedConversationId === participantId ? 0 : conv.unreadCount
                  }
                }

                // Tin nhắn đã có và không cần update, giữ nguyên conversation
                return conv
              }

              // Thêm tin nhắn mới và sắp xếp lại theo thời gian
              const messages = [...conv.messages, formatted].sort((a, b) => {
                const timeA = a.createdAtMs ?? parseTimestamp(a.createdAt)
                const timeB = b.createdAtMs ?? parseTimestamp(b.createdAt)
                return timeA - timeB // Từ cũ đến mới
              })

              return {
                ...conv,
                messages,
                lastMessage: formatted.content,
                lastMessageTime: formatted.timestamp,
                lastActivity: formatted.createdAtMs ?? Date.now(),
                unreadCount: selectedConversationId === participantId ? 0 : conv.unreadCount + 1
              }
            })
          } else {
            // Nếu chưa có conversation, reload danh sách conversations để có thông tin user mới
            console.log('[ChatMainContent] New conversation detected, reloading conversations list')
            setTimeout(() => {
              if (isMounted) {
                loadConversations()
              }
            }, 100)
            return prevConversations
          }
        })

        // Nếu đang xem conversation này, scroll xuống dưới
        if (selectedConversationId === participantId && messagesContainerRef.current) {
          setTimeout(() => {
            if (messagesContainerRef.current && isMounted) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
            }
          }, 100)
        }
      })
      console.log('[ChatMainContent] SignalR listener registered')
    } catch (error) {
      // Không throw error để không làm crash component
      console.warn(
        '[ChatMainContent] Failed to setup SignalR listener (chat will still work, but not realtime):',
        error
      )
    }

    // Cleanup khi component unmount
    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser.id, selectedConversationId, mapApiMessageToUi, loadConversations])

  const ensureConversationHistory = useCallback(
    async (participantId: number, participantName: string) => {
      setLoadingHistoryFor(participantId)
      try {
        const history = await getChatHistory(participantId.toString())
        const currentUserIdNum = Number(currentUser.id)
        const currentUserName = currentUser.name

        console.log('[ensureConversationHistory] Loading history:', {
          participantId,
          participantName,
          currentUserId: currentUser.id,
          currentUserIdNum,
          currentUserName,
          historyLength: history.length,
          sampleMessages: history.slice(0, 3).map((msg) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderIdType: typeof msg.senderId,
            receiverId: msg.receiverId,
            receiverIdType: typeof msg.receiverId,
            content: msg.content?.substring(0, 20),
            isFromCurrentUser: Number(msg.senderId) === currentUserIdNum
          }))
        })

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.participantId !== participantId) {
              return conv
            }

            // Map messages với đúng participantName
            // participantName là tên của người đối diện trong conversation (không phải currentUser)
            // Logic trong mapChatMessage sẽ tự động xác định senderName dựa trên senderId

            // Sắp xếp messages theo thời gian (từ cũ đến mới) để đảm bảo thứ tự đúng
            // Backend đã sắp xếp theo OrderBy(m => m.CreatedAt), nhưng đảm bảo frontend cũng sắp xếp lại
            const sortedHistory = [...history].sort((a, b) => {
              const timeA = parseTimestamp(a.createdAt)
              const timeB = parseTimestamp(b.createdAt)
              return timeA - timeB // Từ cũ đến mới
            })

            // Map messages và loại bỏ duplicate dựa trên id
            const messageMap = new Map<number, Message>()
            sortedHistory.forEach((msg) => {
              const msgSenderId = Number(msg.senderId)
              const msgReceiverId = Number(msg.receiverId)

              // Debug log cho từng message
              const isFromCurrentUser = msgSenderId === currentUserIdNum
              if (sortedHistory.indexOf(msg) < 3) {
                console.log('[ensureConversationHistory] Mapping message:', {
                  msgId: msg.id,
                  msgSenderId,
                  msgReceiverId,
                  currentUserIdNum,
                  isFromCurrentUser,
                  participantName,
                  currentUserName,
                  expectedSenderName: isFromCurrentUser ? currentUserName : participantName,
                  createdAt: msg.createdAt
                })
              }

              // Gọi mapApiMessageToUi với participantName (tên người đối diện)
              // mapChatMessage sẽ tự động xác định senderName dựa trên senderId
              const mappedMessage = mapApiMessageToUi(msg, participantName)

              // Chỉ thêm message nếu chưa có (tránh duplicate)
              if (!messageMap.has(mappedMessage.id) || mappedMessage.id === 0) {
                // Nếu id = 0 (optimistic update), vẫn thêm nhưng có thể bị ghi đè bởi message có id thật
                messageMap.set(mappedMessage.id, mappedMessage)
              } else if (mappedMessage.id !== 0) {
                // Nếu đã có message với id này, giữ message cũ (không update)
                console.log(
                  '[ensureConversationHistory] Duplicate message detected, keeping existing:',
                  mappedMessage.id
                )
              }
            })

            // Chuyển Map thành Array và sắp xếp lại theo thời gian
            const messages = Array.from(messageMap.values()).sort((a, b) => {
              // Sử dụng createdAtMs nếu có, nếu không thì parse từ createdAt
              const timeA = a.createdAtMs ?? parseTimestamp(a.createdAt)
              const timeB = b.createdAtMs ?? parseTimestamp(b.createdAt)
              return timeA - timeB // Từ cũ đến mới
            })

            console.log('[ensureConversationHistory] Final messages:', {
              totalMessages: messages.length,
              firstMessage: messages[0]
                ? {
                    id: messages[0].id,
                    senderId: messages[0].senderId,
                    senderName: messages[0].senderName,
                    content: messages[0].content?.substring(0, 20),
                    createdAt: messages[0].createdAt
                  }
                : null,
              lastMessage: messages[messages.length - 1]
                ? {
                    id: messages[messages.length - 1].id,
                    senderId: messages[messages.length - 1].senderId,
                    senderName: messages[messages.length - 1].senderName,
                    content: messages[messages.length - 1].content?.substring(0, 20),
                    createdAt: messages[messages.length - 1].createdAt
                  }
                : null
            })

            const lastMessage = messages[messages.length - 1]
            return {
              ...conv,
              messages,
              lastMessage: lastMessage?.content || 'Chưa có tin nhắn',
              lastMessageTime: lastMessage?.timestamp || '',
              lastActivity: lastMessage?.createdAtMs ?? conv.lastActivity,
              isHistoryLoaded: true
            }
          })
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải lịch sử chat.'
        setSnackbarSeverity('error')
        setSnackbarMessage(message)
      } finally {
        setLoadingHistoryFor((prev) => (prev === participantId ? null : prev))
      }
    },
    [mapApiMessageToUi, currentUser.id, currentUser.name]
  )

  // Tự động load history khi có selectedConversationId và conversations đã được load
  // Chỉ load khi component mount hoặc khi conversations list thay đổi (không load khi selectedConversationId thay đổi vì handleSelectConversation đã xử lý)
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const selectedConv = conversations.find((conv) => conv.id === selectedConversationId)
      if (selectedConv && (!selectedConv.isHistoryLoaded || selectedConv.messages.length === 0)) {
        // Chỉ auto-load nếu chưa có history (ví dụ: khi reload page)
        // Không load lại nếu đã có history (tránh load lại không cần thiết)
        console.log(
          '[ChatMainContent] Auto-loading history for selected conversation:',
          selectedConversationId
        )
        ensureConversationHistory(selectedConv.participantId, selectedConv.participantName)
          .then(() => {
            // Scroll sau khi history đã load xong
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
              }
            }, 100)
          })
          .catch((err) => {
            console.error('[ChatMainContent] Failed to auto-load history:', err)
          })
      }
    }
    // Chỉ trigger khi conversations list thay đổi (load lần đầu), không trigger khi selectedConversationId thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, ensureConversationHistory])

  const loadChatUsers = async () => {
    setIsLoadingChatUsers(true)
    setCreateChatError(null)
    try {
      console.log('[ChatMainContent] Loading chat users...')
      const users = await getUsersForChat()
      console.log('[ChatMainContent] Loaded chat users:', users.length)
      setAvailableChatUsers(users)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.'
      console.error('[ChatMainContent] Error loading chat users:', error)
      setCreateChatError(message)
      setSnackbarSeverity('error')
      setSnackbarMessage(message)
    } finally {
      setIsLoadingChatUsers(false)
    }
  }

  const handleOpenCreateChatDialog = () => {
    setCreateChatError(null)
    setSelectedChatUser(null)
    setInitialMessage('')
    setIsCreateChatOpen(true)
    if (!availableChatUsers.length) {
      loadChatUsers()
    }
  }

  const handleCloseCreateChatDialog = () => {
    setIsCreateChatOpen(false)
    setSelectedChatUser(null)
    setCreateChatError(null)
    setInitialMessage('')
  }

  // Mở dialog xác nhận xóa đoạn chat
  const handleDeleteConversation = (
    e: React.MouseEvent,
    conversationId: number,
    participantName: string
  ) => {
    e.stopPropagation() // Ngăn không cho click vào conversation
    setDeleteTarget({ id: conversationId, name: participantName })
    setDeleteDialogOpen(true)
  }

  // Xác nhận xóa đoạn chat
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      // Gọi API xóa trong database
      await deleteConversation(deleteTarget.id.toString())

      // Xóa khỏi UI
      setConversations((prev) => prev.filter((conv) => conv.id !== deleteTarget.id))

      // Nếu đang xem conversation này, bỏ chọn
      if (selectedConversationId === deleteTarget.id) {
        setSelectedConversationId(null)
      }

      setSnackbarSeverity('success')
      setSnackbarMessage(`Đã xóa đoạn chat với ${deleteTarget.name}`)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[Chat] Failed to delete conversation:', error)
      setSnackbarSeverity('error')
      setSnackbarMessage('Không thể xóa đoạn chat. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Đóng dialog xóa
  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleCreateChatConversation = async () => {
    if (!selectedChatUser) {
      setCreateChatError('Vui lòng chọn người dùng để bắt đầu đoạn chat.')
      return
    }

    if (!initialMessage.trim()) {
      setCreateChatError('Vui lòng nhập tin nhắn đầu tiên.')
      return
    }

    const participantId = Number(selectedChatUser.userId)
    if (Number.isNaN(participantId)) {
      setCreateChatError('ID người dùng không hợp lệ.')
      return
    }

    setIsCreatingChat(true)
    try {
      const apiMessage = await sendChatMessage({
        receiverId: selectedChatUser.userId,
        content: initialMessage.trim()
      })
      upsertConversationWithMessage(
        { id: participantId, name: selectedChatUser.fullName, role: selectedChatUser.role },
        apiMessage
      )
      setSelectedConversationId(participantId)
      setSnackbarSeverity('success')
      setSnackbarMessage(`Đã tạo đoạn chat với ${selectedChatUser.fullName}`)
      handleCloseCreateChatDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đoạn chat.'
      setCreateChatError(message)
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbarMessage(null)
  }

  // Common emoji reactions
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  // Emoji picker emojis
  const emojiPickerEmojis = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '🙃',
    '😉',
    '😊',
    '😇',
    '🥰',
    '😍',
    '🤩',
    '😘',
    '😗',
    '😚',
    '😙',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '🤥',
    '😌',
    '😔',
    '😪',
    '🤤',
    '😴',
    '😷',
    '🤒',
    '🤕',
    '🤢',
    '🤮',
    '🤧',
    '🥵',
    '🥶',
    '😶‍🌫️',
    '😵',
    '😵‍💫',
    '🤯',
    '🤠',
    '🥳',
    '😎',
    '🤓',
    '🧐',
    '😕',
    '😟',
    '🙁',
    '☹️',
    '😮',
    '😯',
    '😲',
    '😳',
    '🥺',
    '😦',
    '😧',
    '😨',
    '😰',
    '😥',
    '😢',
    '😭',
    '😱',
    '😖',
    '😣',
    '😞',
    '😓',
    '😩',
    '😫',
    '🥱',
    '😤',
    '😡',
    '😠',
    '🤬',
    '😈',
    '👿',
    '💀',
    '☠️',
    '💩',
    '🤡',
    '👹',
    '👺',
    '👻',
    '👽',
    '👾',
    '🤖',
    '😺',
    '😸',
    '😹',
    '😻',
    '😼',
    '😽',
    '🙀',
    '😿',
    '😾',
    '🙈',
    '🙉',
    '🙊',
    '💋',
    '💌',
    '💘',
    '💝',
    '💖',
    '💗',
    '💓',
    '💞',
    '💕',
    '💟',
    '❣️',
    '💔',
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💯',
    '💢',
    '💥',
    '💫',
    '💦',
    '💨',
    '🕳️',
    '💣',
    '💬',
    '👁️‍🗨️',
    '🗨️',
    '🗯️',
    '💭',
    '💤',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💪',
    '🦾',
    '🦿',
    '🦵',
    '🦶',
    '👂',
    '🦻',
    '👃',
    '🧠',
    '🫀',
    '🫁',
    '🦷',
    '🦴',
    '👀',
    '👁️',
    '👅',
    '👄'
  ]

  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId)
  const isHistoryLoading =
    selectedConversation && loadingHistoryFor === selectedConversation.participantId
  const canSendMessage =
    Boolean(messageText.trim() || imagePreview) && !isSendingMessage && !uploadingImage

  // Reset scroll position when conversation changes (chỉ khi conversation thực sự thay đổi)
  useEffect(() => {
    if (!selectedConversationId || !selectedConversation) {
      return
    }

    // Reset image preview when conversation changes
    setImagePreview(null)
    setSelectedImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Chỉ scroll sau khi messages đã được load (tránh scroll khi messages đang loading)
    if (selectedConversation.isHistoryLoaded && selectedConversation.messages.length > 0) {
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã render xong
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          prevMessagesLengthRef.current = selectedConversation.messages.length
        }
      })
    } else {
      // Nếu chưa load history, reset prevMessagesLengthRef
      prevMessagesLengthRef.current = 0
    }
  }, [selectedConversationId, selectedConversation?.isHistoryLoaded])

  // Scroll to bottom when new messages are added (chỉ khi đang xem conversation này)
  useEffect(() => {
    if (!selectedConversationId || !selectedConversation) {
      return
    }

    const currentLength = selectedConversation.messages.length || 0
    // Chỉ scroll nếu có message mới và đang xem conversation này
    if (
      messagesContainerRef.current &&
      currentLength > prevMessagesLengthRef.current &&
      currentLength > 0
    ) {
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã render xong
      requestAnimationFrame(() => {
        if (messagesContainerRef.current && selectedConversationId) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      })
    }
    prevMessagesLengthRef.current = currentLength
  }, [selectedConversation?.messages, selectedConversationId])

  /**
   * Tính điểm activity của conversation để sắp xếp
   * Sử dụng thời gian của tin nhắn cuối cùng (gửi hoặc nhận)
   * Conversation có tin nhắn mới nhất sẽ ở trên cùng
   *
   * @returns Timestamp (milliseconds) của tin nhắn cuối cùng, hoặc 0 nếu không có tin nhắn
   */
  const getConversationActivityScore = (conv: Conversation): number => {
    // Ưu tiên 1: Sử dụng thời gian của tin nhắn cuối cùng trong messages
    if (conv.messages && conv.messages.length > 0) {
      // Messages đã được sắp xếp từ cũ đến mới, nên message cuối cùng là mới nhất
      const lastMessage = conv.messages[conv.messages.length - 1]

      if (lastMessage) {
        // Ưu tiên createdAtMs (đã được parse sẵn)
        if (lastMessage.createdAtMs && lastMessage.createdAtMs > 0) {
          return lastMessage.createdAtMs
        }

        // Nếu không có createdAtMs, parse từ createdAt
        if (lastMessage.createdAt) {
          const parsedTime = parseTimestamp(lastMessage.createdAt)
          if (parsedTime > 0) {
            return parsedTime
          }
        }
      }
    }

    // Ưu tiên 2: Sử dụng lastActivity nếu có (được cập nhật khi có tin nhắn mới)
    if (conv.lastActivity && conv.lastActivity > 0) {
      return conv.lastActivity
    }

    // Nếu không có tin nhắn nào, trả về 0 (sẽ ở cuối danh sách)
    return 0
  }

  const conversationUserIds = new Set(conversations.map((conv) => conv.participantId.toString()))

  // Filter conversations by search text and sort by last activity (newest first)
  // QUAN TRỌNG: Sắp xếp theo thời gian tin nhắn cuối cùng, KHÔNG phải theo tên
  // Conversation có tin nhắn mới nhất (timestamp lớn nhất) sẽ ở trên cùng
  // Lưu ý: conversations đã được sắp xếp trong loadConversations, nhưng vẫn sắp xếp lại ở đây
  // để đảm bảo luôn đúng khi có tin nhắn mới hoặc khi filter
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv) =>
      conv.participantName.toLowerCase().includes(searchText.toLowerCase().trim())
    )

    // Sắp xếp lại để đảm bảo thứ tự đúng (đặc biệt khi có tin nhắn mới)
    // Sắp xếp theo thời gian tin nhắn cuối cùng, KHÔNG phải theo tên
    return filtered.sort((a, b) => {
      const scoreA = getConversationActivityScore(a)
      const scoreB = getConversationActivityScore(b)

      // Nếu cả hai đều có score > 0, sắp xếp theo score (thời gian tin nhắn cuối cùng)
      if (scoreA > 0 && scoreB > 0) {
        return scoreB - scoreA // Giảm dần: mới nhất trước
      }

      // Nếu một trong hai có score = 0 (chưa có tin nhắn), đặt nó xuống dưới
      if (scoreA === 0 && scoreB > 0) return 1 // a xuống dưới
      if (scoreB === 0 && scoreA > 0) return -1 // b xuống dưới

      // Nếu cả hai đều = 0 (chưa có tin nhắn), giữ nguyên thứ tự
      // KHÔNG sắp xếp theo tên
      return 0
    })
  }, [conversations, searchText])

  const handleSelectConversation = (conversationId: number) => {
    // Nếu đang chọn conversation đã được chọn, không làm gì
    if (selectedConversationId === conversationId) {
      return
    }

    // Set selectedConversationId trước
    setSelectedConversationId(conversationId)

    // Lưu vào localStorage để persist qua reload
    try {
      localStorage.setItem('chat_selectedConversationId', conversationId.toString())
    } catch (err) {
      console.warn('[ChatMainContent] Failed to save selectedConversationId:', err)
    }

    const selected = conversations.find((conv) => conv.id === conversationId)
    if (selected) {
      // Reset unread count ngay lập tức
      // QUAN TRỌNG: Không cập nhật lastActivity khi click vào conversation
      // lastActivity chỉ được cập nhật khi có tin nhắn mới (gửi hoặc nhận)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map((msg) => ({ ...msg, isRead: true }))
              // KHÔNG cập nhật lastActivity ở đây
            }
          }
          return conv
        })
      )

      // Chỉ load history nếu chưa load hoặc chưa có messages
      // Tránh load lại không cần thiết khi chuyển đổi giữa các conversation
      if (!selected.isHistoryLoaded || selected.messages.length === 0) {
        console.log('[ChatMainContent] Loading history for conversation:', conversationId)
        ensureConversationHistory(selected.participantId, selected.participantName)
          .then(() => {
            // Scroll sau khi history đã load xong
            setTimeout(() => {
              if (messagesContainerRef.current && selectedConversationId === conversationId) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
              }
            }, 100)
          })
          .catch((err) => {
            console.error('[ChatMainContent] Failed to load history:', err)
          })
      } else {
        // Nếu đã có messages, scroll ngay
        requestAnimationFrame(() => {
          if (messagesContainerRef.current && selectedConversationId === conversationId) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        })
      }
    }
  }

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !imagePreview) || !selectedConversationId || isSendingMessage)
      return

    const selected = conversations.find((conv) => conv.id === selectedConversationId)
    if (!selected) return

    const content = messageText.trim()
    setIsSendingMessage(true)
    setUploadingImage(true)

    let imageUrl: string | undefined = undefined

    // Upload ảnh lên Firebase nếu có
    if (selectedImageFile) {
      try {
        console.log('[ChatMainContent] Uploading image to Firebase...', {
          fileName: selectedImageFile.name,
          fileSize: (selectedImageFile.size / 1024).toFixed(2) + ' KB'
        })

        // Upload với compression để tăng tốc độ
        imageUrl = await uploadImageToFirebase(selectedImageFile, 'chat', true)
        console.log('[ChatMainContent] Image uploaded successfully:', imageUrl)
      } catch (error) {
        let errorMessage = 'Không thể upload ảnh'
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'Upload ảnh quá lâu. Vui lòng thử lại với ảnh nhỏ hơn.'
          } else if (
            error.message.includes('permission') ||
            error.message.includes('unauthorized')
          ) {
            errorMessage = 'Không có quyền upload ảnh. Vui lòng kiểm tra cấu hình Firebase.'
          } else {
            errorMessage = error.message || errorMessage
          }
        }
        console.error('[ChatMainContent] Failed to upload image:', error)
        setSnackbarSeverity('error')
        setSnackbarMessage(errorMessage)
        setIsSendingMessage(false)
        setUploadingImage(false)
        return
      }
    }

    setUploadingImage(false)

    // Optimistic update: Cập nhật UI ngay với tin nhắn mới (trước khi gửi lên server)
    const optimisticMessage: ChatMessage = {
      id: 0, // Tạm thời, sẽ được cập nhật khi nhận từ SignalR
      senderId: currentUser.id, // Đúng ID người gửi
      receiverId: selected.participantId,
      content: content || (imageUrl ? '[Ảnh]' : ''),
      imageUrl: imageUrl,
      createdAt: new Date().toISOString(),
      isRead: false
    }

    // Cập nhật UI ngay lập tức
    upsertConversationWithMessage(
      {
        id: selected.participantId,
        name: selected.participantName,
        role: selected.participantRole
      },
      optimisticMessage
    )

    // Clear input và image preview ngay
    setMessageText('')
    setImagePreview(null)
    setSelectedImageFile(null)

    // Scroll xuống dưới để hiển thị tin nhắn mới
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)

    try {
      // Gửi tin nhắn qua SignalR (realtime)
      await sendChatMessage({
        receiverId: selected.participantId.toString(),
        content: content || '',
        imageUrl: imageUrl
      })
      // SignalR sẽ tự động cập nhật lại UI khi nhận được ReceiveMessage event
      // Nên không cần gọi upsertConversationWithMessage lại ở đây
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi tin nhắn.'
      setSnackbarSeverity('error')
      setSnackbarMessage(message)

      // Nếu gửi fail, xóa tin nhắn optimistic update
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.participantId === selected.participantId) {
            return {
              ...conv,
              messages: conv.messages.filter(
                (msg) =>
                  msg.id !== 0 || msg.content !== (content || '[Ảnh]') || msg.image !== imageUrl
              )
            }
          }
          return conv
        })
      )
    } finally {
      setIsSendingMessage(false)
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSendingMessage) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiPickerAnchor(event.currentTarget)
  }

  const handleEmojiClose = () => {
    setEmojiPickerAnchor(null)
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji)
    setEmojiPickerAnchor(null)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setSnackbarSeverity('error')
        setSnackbarMessage('Kích thước file phải nhỏ hơn 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setSnackbarSeverity('error')
        setSnackbarMessage('Vui lòng chọn file ảnh')
        return
      }

      // Lưu file để upload sau
      setSelectedImageFile(file)

      // Hiển thị preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setSelectedImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReactionClick = (messageId: number, event: React.MouseEvent<HTMLElement>) => {
    setReactionAnchorEl((prev) => ({
      ...prev,
      [messageId]: event.currentTarget
    }))
  }

  const handleReactionClose = (messageId: number) => {
    setReactionAnchorEl((prev) => ({
      ...prev,
      [messageId]: null
    }))
  }

  const handleAddReaction = (messageId: number, emoji: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedConversationId) {
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id === messageId) {
                const existingReactions = msg.reactions || []
                // Check if user already reacted with this emoji
                const existingReactionIndex = existingReactions.findIndex(
                  (r) => r.emoji === emoji && r.userId === currentUser.id
                )

                let newReactions: Reaction[]
                if (existingReactionIndex >= 0) {
                  // Remove reaction if already exists
                  newReactions = existingReactions.filter(
                    (_, index) => index !== existingReactionIndex
                  )
                } else {
                  // Add new reaction
                  newReactions = [
                    ...existingReactions,
                    {
                      emoji,
                      userId: currentUser.id,
                      userName: currentUser.name
                    }
                  ]
                }

                return {
                  ...msg,
                  reactions: newReactions
                }
              }
              return msg
            })
          }
        }
        return conv
      })
    )

    handleReactionClose(messageId)
  }

  const getReactionCounts = (reactions: Reaction[] = []) => {
    const counts: { [key: string]: number } = {}
    reactions.forEach((reaction) => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1
    })
    return counts
  }

  return (
    <>
      <Box
        sx={{
          bgcolor: 'common.white',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
        }}
        className="rounded-3xl shadow-3xl overflow-hidden"
      >
        <Box className="flex h-[calc(100vh-28rem)]">
          {/* Conversations List */}
          <Box
            sx={{
              width: '32rem',
              borderRight: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent, rgba(25, 118, 210, 0.2), transparent)'
              }
            }}
          >
            {/* Search Bar */}
            <Box
              className="p-[1.6rem]!"
              sx={{
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexDirection: { xs: 'column', md: 'row' }
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          fontSize="small"
                          sx={{
                            color: 'primary.main',
                            opacity: 0.7
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1.2rem',
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '1.4rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.08)',
                        borderWidth: '1.5px'
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                        '& fieldset': {
                          borderColor: 'primary.main'
                        }
                      },
                      '&.Mui-focused': {
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                        '& fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: '2px'
                        }
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddCommentIcon />}
                  onClick={handleOpenCreateChatDialog}
                  disabled={isLoadingChatUsers}
                  sx={{
                    minWidth: { xs: '100%', md: '18rem' },
                    borderRadius: '1.2rem',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)'
                    },
                    '&.Mui-disabled': {
                      background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                      boxShadow: 'none',
                      color: 'rgba(0,0,0,0.4)'
                    }
                  }}
                >
                  {isLoadingChatUsers ? 'Đang tải...' : 'Tạo đoạn chat'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />

            {/* Conversations */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.2)'
                  }
                }
              }}
            >
              {isLoadingConversations ? (
                <Box className="p-[2.4rem]! flex justify-center!">
                  <CircularProgress />
                </Box>
              ) : conversationError ? (
                <Box className="p-[2.4rem]!">
                  <Alert severity="error">{conversationError}</Alert>
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Box className="p-[2.4rem]! text-center!">
                  <Typography
                    className="text-[1.4rem]!"
                    sx={{
                      color: 'text.secondary',
                      opacity: 0.7
                    }}
                  >
                    Không tìm thấy cuộc trò chuyện nào
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredConversations.map((conversation) => (
                    <ListItem
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        bgcolor:
                          selectedConversationId === conversation.id
                            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.12) 0%, rgba(25, 118, 210, 0.08) 100%)'
                            : 'transparent',
                        '&::before':
                          selectedConversationId === conversation.id
                            ? {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                background: 'linear-gradient(180deg, #1976d2 0%, #42a5f5 100%)',
                                borderRadius: '0 4px 4px 0'
                              }
                            : {},
                        '&:hover': {
                          bgcolor:
                            selectedConversationId === conversation.id
                              ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(25, 118, 210, 0.1) 100%)'
                              : 'rgba(25, 118, 210, 0.04)',
                          transform: 'translateX(2px)',
                          transition: 'all 0.2s ease'
                        },
                        borderBottom: '1px solid',
                        borderColor: 'rgba(0, 0, 0, 0.05)',
                        py: 1.5,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                            }
                          }}
                        >
                          {conversation.participantName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box className="flex items-center justify-between!">
                            <Typography
                              className="text-[1.4rem]! font-semibold!"
                              sx={{
                                color:
                                  selectedConversationId === conversation.id
                                    ? 'primary.main'
                                    : 'text.primary',
                                fontWeight: conversation.unreadCount > 0 ? 700 : 600,
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {conversation.participantName}
                            </Typography>
                            {conversation.unreadCount > 0 && (
                              <Chip
                                label={conversation.unreadCount}
                                size="small"
                                sx={{
                                  height: '2.2rem',
                                  fontSize: '1rem',
                                  minWidth: '2.2rem',
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)',
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': {
                                      opacity: 1
                                    },
                                    '50%': {
                                      opacity: 0.8
                                    }
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box className="flex items-center justify-between! mt-0.5!">
                            <Typography
                              className="text-[1.2rem]!"
                              sx={{
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '20rem',
                                fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                                opacity: conversation.unreadCount > 0 ? 1 : 0.7
                              }}
                            >
                              {conversation.lastMessage}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                className="text-[1.1rem]!"
                                sx={{
                                  color: 'text.secondary',
                                  opacity: 0.6,
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                              >
                                {conversation.lastMessageTime}
                              </Typography>
                              <Tooltip title="Xóa đoạn chat" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleDeleteConversation(
                                      e,
                                      conversation.id,
                                      conversation.participantName
                                    )
                                  }
                                  sx={{
                                    opacity: 0.4,
                                    width: 24,
                                    height: 24,
                                    color: 'error.main',
                                    '&:hover': {
                                      opacity: 1,
                                      bgcolor: 'rgba(211, 47, 47, 0.1)'
                                    }
                                  }}
                                >
                                  <DeleteOutlineIcon sx={{ fontSize: '1.4rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Chat Interface */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'common.white',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(25, 118, 210, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.03) 0%, transparent 50%)
              `,
                pointerEvents: 'none'
              }
            }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    background:
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 255, 0.95) 100%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    position: 'relative',
                    zIndex: 1
                  }}
                  className="flex items-center justify-between!"
                >
                  <Box className="flex items-center gap-[1.2rem]!">
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        border: '3px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      {selectedConversation.participantName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        className="text-[1.6rem]! font-semibold!"
                        sx={{
                          background: (theme) => theme.customBackgroundColor.main,
                          backgroundClip: 'text',
                          color: 'transparent',
                          mb: 0.5
                        }}
                      >
                        {selectedConversation.participantName}
                      </Typography>
                      <Chip
                        label={getRoleLabel(selectedConversation.participantRole)}
                        size="small"
                        color={getRoleColor(selectedConversation.participantRole) as any}
                        sx={{
                          height: '2.2rem',
                          fontSize: '1rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box
                  ref={messagesContainerRef}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 3,
                    position: 'relative',
                    zIndex: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    '&::-webkit-scrollbar': {
                      width: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.2)'
                      }
                    }
                  }}
                >
                  {/* Spacer để đẩy tin nhắn xuống dưới */}
                  <Box sx={{ flexGrow: 1 }} />
                  <div ref={messagesStartRef} />
                  {isHistoryLoading ? (
                    <Box className="flex justify-center items-center h-full">
                      <CircularProgress />
                    </Box>
                  ) : selectedConversation.messages.length === 0 ? (
                    <Box className="flex justify-center items-center h-full">
                      <Typography
                        className="text-[1.4rem]!"
                        sx={{ color: 'text.secondary', opacity: 0.7 }}
                      >
                        Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.
                      </Typography>
                    </Box>
                  ) : (
                    selectedConversation.messages.map((message, index) => {
                      // Đảm bảo so sánh chính xác bằng cách convert cả hai về number
                      const messageSenderId = Number(message.senderId)
                      const currentUserIdNum = Number(currentUser.id)
                      // So sánh bằng String để tránh lỗi type mismatch
                      const isCurrentUser = String(messageSenderId) === String(currentUserIdNum)
                      
                      // Debug log để kiểm tra
                      if (index === selectedConversation.messages.length - 1) {
                        console.log('[ChatMainContent] Last message debug:', {
                          messageSenderId,
                          currentUserIdNum,
                          isCurrentUser,
                          messageContent: message.content
                        })
                      }

                      // Lấy thông tin hiển thị cho message (Facebook/Zalo style)
                      const displayInfo = getMessageDisplayInfo(
                        selectedConversation.messages,
                        currentUser.id,
                        index
                      )

                      return (
                        <Box key={message.id || `msg-${index}`}>
                          <MessageBubble
                            message={message}
                            isCurrentUser={isCurrentUser}
                            showAvatar={displayInfo.showAvatar}
                            showName={displayInfo.showName}
                            showTimestamp={displayInfo.showTimestamp}
                            isFirstInGroup={displayInfo.isFirstInGroup}
                            isLastInGroup={displayInfo.isLastInGroup}
                            onReactionClick={(e, msgId) => handleReactionClick(msgId, e)}
                          />

                          {/* Reactions Display */}
                          {!isCurrentUser &&
                            message.reactions &&
                            message.reactions.length > 0 && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 0.5,
                                  mt: 0.5,
                                  ml: 5,
                                  flexWrap: 'wrap'
                                }}
                              >
                                {Object.entries(getReactionCounts(message.reactions)).map(
                                  ([emoji, count]) => {
                                    const hasUserReaction = message.reactions?.some(
                                      (r) => r.emoji === emoji && r.userId === currentUser.id
                                    )
                                    return (
                                      <Chip
                                        key={emoji}
                                        label={`${emoji} ${count}`}
                                        size="small"
                                        onClick={() => handleAddReaction(message.id, emoji)}
                                        sx={{
                                          height: '2.4rem',
                                          fontSize: '1.2rem',
                                          bgcolor: hasUserReaction
                                            ? 'rgba(25, 118, 210, 0.15)'
                                            : 'rgba(0, 0, 0, 0.06)',
                                          border: hasUserReaction
                                            ? '1.5px solid rgba(25, 118, 210, 0.3)'
                                            : '1px solid rgba(0, 0, 0, 0.1)',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: hasUserReaction
                                              ? 'rgba(25, 118, 210, 0.25)'
                                              : 'rgba(0, 0, 0, 0.1)',
                                            transform: 'scale(1.05)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                          },
                                          '& .MuiChip-label': {
                                            px: 1,
                                            fontWeight: hasUserReaction ? 600 : 500
                                          }
                                        }}
                                      />
                                    )
                                  }
                                )}
                              </Box>
                            )}

                          {/* Reaction Picker Popover */}
                          {!isCurrentUser && (
                            <Popover
                              open={Boolean(reactionAnchorEl[message.id])}
                              anchorEl={reactionAnchorEl[message.id]}
                              onClose={() => handleReactionClose(message.id)}
                              anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'left'
                              }}
                              transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left'
                              }}
                              PaperProps={{
                                sx: {
                                  p: 1,
                                  borderRadius: '1.6rem',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                  background:
                                    'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 255, 0.98) 100%)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(0, 0, 0, 0.08)'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 0.5
                                }}
                              >
                                {commonReactions.map((emoji) => {
                                  const hasReaction = message.reactions?.some(
                                    (r) => r.emoji === emoji && r.userId === currentUser.id
                                  )
                                  return (
                                    <Tooltip
                                      key={emoji}
                                      title={hasReaction ? 'Gỡ cảm xúc' : 'Thả cảm xúc'}
                                      arrow
                                    >
                                      <IconButton
                                        onClick={() => handleAddReaction(message.id, emoji)}
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          fontSize: '2rem',
                                          bgcolor: hasReaction
                                            ? 'rgba(25, 118, 210, 0.15)'
                                            : 'transparent',
                                          border: hasReaction
                                            ? '2px solid rgba(25, 118, 210, 0.3)'
                                            : '1px solid transparent',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: hasReaction
                                              ? 'rgba(25, 118, 210, 0.25)'
                                              : 'rgba(0, 0, 0, 0.05)',
                                            transform: 'scale(1.15)',
                                            borderColor: 'rgba(25, 118, 210, 0.4)'
                                          }
                                        }}
                                      >
                                        {emoji}
                                      </IconButton>
                                    </Tooltip>
                                  )
                                })}
                              </Box>
                            </Popover>
                          )}
                        </Box>
                      )
                    })
                  )}
                </Box>

                {/* Message Input */}
                <Box
                  sx={{
                    p: 2.5,
                    borderTop: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    background:
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 255, 0.95) 100%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {/* Image Preview */}
                  {imagePreview && (
                    <Box
                      sx={{
                        mb: 2,
                        position: 'relative',
                        display: 'inline-block',
                        borderRadius: '1.2rem',
                        overflow: 'hidden',
                        maxWidth: '300px'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          maxHeight: '200px',
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        onClick={handleRemoveImage}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                      >
                        ×
                      </IconButton>
                    </Box>
                  )}

                  <Box className="flex items-center gap-[1.2rem]!">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <Tooltip title="Chọn ảnh" arrow>
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          color: 'primary.main',
                          width: 44,
                          height: 44,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <ImageIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chọn emoji" arrow>
                      <IconButton
                        onClick={handleEmojiClick}
                        sx={{
                          color: 'primary.main',
                          width: 44,
                          height: 44,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <InsertEmoticonIcon />
                      </IconButton>
                    </Tooltip>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Nhập tin nhắn..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '1.6rem',
                          fontSize: '1.4rem',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.3s ease',
                          '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.08)',
                            borderWidth: '1.5px'
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                            '& fieldset': {
                              borderColor: 'primary.main'
                            }
                          },
                          '&.Mui-focused': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                            '& fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: '2px'
                            }
                          }
                        }
                      }}
                    />
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!canSendMessage}
                      sx={{
                        background: canSendMessage
                          ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                          : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                        color: 'common.white',
                        width: 52,
                        height: 52,
                        boxShadow: canSendMessage ? '0 4px 16px rgba(25, 118, 210, 0.4)' : 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: canSendMessage
                            ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
                            : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                          transform: 'scale(1.05)',
                          boxShadow: canSendMessage ? '0 6px 20px rgba(25, 118, 210, 0.5)' : 'none'
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        },
                        '&.Mui-disabled': {
                          background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                          color: 'rgba(0, 0, 0, 0.4)'
                        }
                      }}
                    >
                      {uploadingImage ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </Box>

                  {/* Emoji Picker Popover */}
                  <Popover
                    open={Boolean(emojiPickerAnchor)}
                    anchorEl={emojiPickerAnchor}
                    onClose={handleEmojiClose}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center'
                    }}
                    transformOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center'
                    }}
                    sx={{ zIndex: 9999 }}
                    PaperProps={{
                      sx: {
                        p: 2,
                        borderRadius: '1.6rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        background:
                          'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 255, 0.98) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        maxWidth: '400px',
                        maxHeight: '400px',
                        overflow: 'auto'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 1,
                        width: '100%'
                      }}
                    >
                      {emojiPickerEmojis.map((emoji, index) => (
                        <Tooltip key={index} title={emoji} arrow>
                          <IconButton
                            onClick={() => handleEmojiSelect(emoji)}
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: '2rem',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.1)',
                                transform: 'scale(1.2)'
                              }
                            }}
                          >
                            {emoji}
                          </IconButton>
                        </Tooltip>
                      ))}
                    </Box>
                  </Popover>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                  position: 'relative',
                  zIndex: 0
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: 1
                      },
                      '50%': {
                        transform: 'scale(1.05)',
                        opacity: 0.8
                      }
                    }
                  }}
                >
                  <SearchIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                      opacity: 0.5
                    }}
                  />
                </Box>
                <Typography
                  className="text-[2rem]! font-semibold!"
                  sx={{
                    background: (theme) => theme.customBackgroundColor.main,
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Chọn một cuộc trò chuyện để bắt đầu
                </Typography>
                <Typography
                  className="text-[1.4rem]!"
                  sx={{
                    color: 'text.secondary',
                    opacity: 0.7
                  }}
                >
                  Hoặc tìm kiếm cuộc trò chuyện trong danh sách bên trái
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog open={isCreateChatOpen} onClose={handleCloseCreateChatDialog} fullWidth maxWidth="sm">
        <DialogTitle className="text-[2rem]! font-semibold!">Tạo đoạn chat mới</DialogTitle>
        <DialogContent dividers>
          <Typography className="text-[1.4rem]!" sx={{ color: 'text.secondary', mb: 2 }}>
            Chọn người dùng trong hệ thống để bắt đầu trò chuyện riêng tư.
          </Typography>
          <Autocomplete
            options={availableChatUsers}
            loading={isLoadingChatUsers}
            value={selectedChatUser}
            onChange={(_, value) => {
              setCreateChatError(null)
              setSelectedChatUser(value)
            }}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            isOptionEqualToValue={(option, value) => option.userId === value?.userId}
            noOptionsText={isLoadingChatUsers ? 'Đang tải...' : 'Không tìm thấy người dùng'}
            renderOption={(props, option) => {
              const isExisting = conversationUserIds.has(option.userId)
              return (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography className="text-[1.4rem]! font-semibold!">
                      {option.fullName}
                    </Typography>
                    <Typography className="text-[1.2rem]!" sx={{ color: 'text.secondary' }}>
                      {option.email}
                    </Typography>
                  </Box>
                  {isExisting && (
                    <Chip
                      label="Đã có đoạn chat"
                      size="small"
                      sx={{ fontSize: '1rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
              )
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Người dùng"
                placeholder="Nhập tên hoặc email"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingChatUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          <TextField
            label="Tin nhắn đầu tiên"
            placeholder="Nhập tin nhắn mở đầu"
            margin="normal"
            multiline
            minRows={2}
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
          />
          {createChatError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {createChatError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseCreateChatDialog}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateChatConversation}
            disabled={isLoadingChatUsers || !selectedChatUser || isCreatingChat}
          >
            {isCreatingChat ? 'Đang tạo...' : 'Bắt đầu chat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: '1.6rem',
            minWidth: '400px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ff5252 0%, #f44336 100%)',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: '2.4rem', color: 'white' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: 'white'
            }}
          >
            Xóa đoạn chat
          </Typography>
        </Box>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Typography sx={{ fontSize: '1.4rem', color: 'text.primary', mb: 2 }}>
            Bạn có chắc muốn xóa đoạn chat với{' '}
            <strong style={{ color: '#1976d2' }}>{deleteTarget?.name}</strong>?
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(244, 67, 54, 0.08)',
              borderRadius: '1rem',
              p: 2,
              border: '1px solid rgba(244, 67, 54, 0.2)'
            }}
          >
            <Typography
              sx={{
                fontSize: '1.3rem',
                color: 'error.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ⚠️ Tất cả tin nhắn trong đoạn chat này sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={isDeleting}
            sx={{
              borderRadius: '1rem',
              px: 3,
              py: 1,
              fontSize: '1.3rem',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            variant="contained"
            color="error"
            sx={{
              borderRadius: '1rem',
              px: 3,
              py: 1,
              fontSize: '1.3rem',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)'
              }
            }}
          >
            {isDeleting ? (
              <>
                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                Đang xóa...
              </>
            ) : (
              'Xóa đoạn chat'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}
