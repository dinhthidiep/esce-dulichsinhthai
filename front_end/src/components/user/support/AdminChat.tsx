import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { ArrowLeftIcon, XIcon } from '~/components/user/icons'
import axiosInstance from '~/utils/axiosInstance'
import './AdminChat.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  senderId?: string
  receiverId?: string
}

interface ChatUser {
  UserId?: string
  userId?: string
  FullName?: string
  fullName?: string
  Role?: string
  role?: string
  RoleId?: number
  roleId?: number
  Avatar?: string
  avatar?: string
  LastMessage?: string
  lastMessage?: string
  LastMessageTime?: string
  lastMessageTime?: string
}

interface AdminChatProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  userName?: string
  userRole?: string
  onRefreshUnread?: () => void
}

// Common emojis
const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '🎉', '✨', '🙏', '👋', '🤝', '💪', '🌟']

// Helper function to parse server timestamp (UTC) to local Date
const parseServerTimestamp = (dateStr?: string): Date => {
  if (!dateStr) return new Date()
  // If the date string doesn't have timezone info, treat it as UTC
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    return new Date(dateStr + 'Z')
  }
  return new Date(dateStr)
}

const AdminChat: React.FC<AdminChatProps> = ({
  isOpen,
  onClose,
  onBack,
  userName = 'Nguyễn Văn A',
  userRole = 'Du khách',
  onRefreshUnread,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<ChatUser[]>([])
  const [chattedUsers, setChattedUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ChatUser | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get userId helper
  const getUserId = useCallback(() => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const id = userInfo.Id || userInfo.id
        if (id) return String(id)
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Setup SignalR connection
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token || !isOpen) return

    const apiUrl = import.meta.env.VITE_API_URL || ''
    const hubUrl = apiUrl.replace('/api', '') + '/chathub'

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build()

    newConnection.on('ReceiveMessage', (message: any) => {
      const currentUserId = getUserId()
      const senderId = String(message.senderId || message.SenderId || '')
      const receiverId = String(message.receiverId || message.ReceiverId || '')

      // Only add message if it's from someone else (not our own message)
      if (senderId !== currentUserId) {
        const newMsg: Message = {
          id: Date.now().toString(),
          text: message.content || message.Content || '',
          isUser: false,
          timestamp: new Date(message.timestamp || Date.now()),
          senderId,
          receiverId
        }
        setMessages(prev => [...prev, newMsg])
      }
    })

    newConnection.onclose(() => setIsConnected(false))
    newConnection.onreconnected(() => setIsConnected(true))

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected')
        setIsConnected(true)
      })
      .catch(err => console.error('SignalR Error:', err))

    setConnection(newConnection)

    return () => {
      newConnection.stop()
    }
  }, [isOpen, getUserId])

  // Fetch users on mount
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  // Fetch chat history when user is selected + auto-refresh every 3 seconds
  useEffect(() => {
    if (isOpen && selectedUser) {
      const userId = selectedUser.UserId || selectedUser.userId
      if (userId) {
        fetchChatHistory(userId)
        
        // Auto-refresh every 3 seconds to get new messages
        const interval = setInterval(() => {
          fetchChatHistorySilent(userId)
        }, 3000)
        
        return () => clearInterval(interval)
      }
    }
  }, [isOpen, selectedUser])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const [allRes, chattedRes] = await Promise.all([
        axiosInstance.get('/chat/GetUserForChat'),
        axiosInstance.get('/chat/GetChattedUser')
      ])
      setAllUsers(Array.isArray(allRes.data) ? allRes.data : [])
      setChattedUsers(Array.isArray(chattedRes.data) ? chattedRes.data : [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async (toUserId: string) => {
    setLoading(true)
    try {
      const response = await axiosInstance.get(`/chat/GetHistory/${toUserId}`)
      const history = response.data || []
      const currentUserId = getUserId()

      const transformedMessages: Message[] = history.map((msg: any, index: number) => ({
        id: String(msg.Id || msg.id || index),
        text: msg.Content || msg.content || '',
        isUser: String(msg.SenderId || msg.senderId) === currentUserId,
        timestamp: parseServerTimestamp(msg.CreatedAt || msg.createdAt),
        senderId: String(msg.SenderId || msg.senderId || ''),
        receiverId: String(msg.ReceiverId || msg.receiverId || '')
      }))

      setMessages(transformedMessages)
    } catch (err) {
      console.error('Error fetching chat history:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // Silent fetch - no loading indicator, only update if there are new messages
  const fetchChatHistorySilent = async (toUserId: string) => {
    try {
      const response = await axiosInstance.get(`/chat/GetHistory/${toUserId}`)
      const history = response.data || []
      const currentUserId = getUserId()

      const transformedMessages: Message[] = history.map((msg: any, index: number) => ({
        id: String(msg.Id || msg.id || index),
        text: msg.Content || msg.content || '',
        isUser: String(msg.SenderId || msg.senderId) === currentUserId,
        timestamp: parseServerTimestamp(msg.CreatedAt || msg.createdAt),
        senderId: String(msg.SenderId || msg.senderId || ''),
        receiverId: String(msg.ReceiverId || msg.receiverId || '')
      }))

      // Only update if message count changed (new messages)
      setMessages(prev => {
        if (transformedMessages.length !== prev.length) {
          return transformedMessages
        }
        return prev
      })
    } catch (err) {
      // Silent fail - don't show error
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectUser = async (user: ChatUser) => {
    setSelectedUser(user)
    setMessages([])
    
    // Mark messages as read when selecting a user
    const userId = user.UserId || user.userId
    if (userId) {
      try {
        await axiosInstance.post(`/chat/MarkAsRead/${userId}`)
        onRefreshUnread?.()
      } catch (err) {
        // Silent fail
      }
    }
  }

  const handleBackToList = () => {
    setSelectedUser(null)
    setMessages([])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedUser) return

    const toUserId = selectedUser.UserId || selectedUser.userId
    if (!toUserId) return

    const messageText = inputValue
    const currentUserId = getUserId()
    const msgId = Date.now().toString()
    
    // Optimistic update - show message immediately
    const newMsg: Message = {
      id: msgId,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      senderId: currentUserId || '',
      receiverId: toUserId
    }
    setMessages(prev => [...prev, newMsg])
    setInputValue('')
    setShowEmojiPicker(false)

    // Save to database via API
    try {
      await axiosInstance.post('/chat/SendMessage', {
        toUserId,
        content: messageText
      })
      
      // Cập nhật danh sách lịch sử chat ngay lập tức
      const updateUserInList = (users: ChatUser[]) => {
        const userId = selectedUser.UserId || selectedUser.userId
        const existingIndex = users.findIndex(u => (u.UserId || u.userId) === userId)
        
        if (existingIndex >= 0) {
          // User đã có trong danh sách - cập nhật tin nhắn mới nhất và đưa lên đầu
          const updatedUser = {
            ...users[existingIndex],
            LastMessage: messageText,
            lastMessage: messageText,
            LastMessageTime: new Date().toISOString(),
            lastMessageTime: new Date().toISOString()
          }
          const newList = users.filter((_, i) => i !== existingIndex)
          return [updatedUser, ...newList]
        } else {
          // User chưa có trong danh sách - thêm mới vào đầu
          const newUser: ChatUser = {
            ...selectedUser,
            LastMessage: messageText,
            lastMessage: messageText,
            LastMessageTime: new Date().toISOString(),
            lastMessageTime: new Date().toISOString()
          }
          return [newUser, ...users]
        }
      }
      
      setChattedUsers(prev => updateUserInList(prev))
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove message from UI if failed
      setMessages(prev => prev.filter(m => m.id !== msgId))
      setInputValue(messageText)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteClick = (user: ChatUser, e: React.MouseEvent) => {
    e.stopPropagation()
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    
    const userId = userToDelete.UserId || userToDelete.userId
    if (!userId) return

    try {
      await axiosInstance.delete(`/chat/DeleteConversation/${userId}`)
      // Remove from chatted users list
      setChattedUsers(prev => prev.filter(u => (u.UserId || u.userId) !== userId))
      setShowDeleteDialog(false)
      setUserToDelete(null)
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setInputValue(prev => prev + emoji)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateOrStr?: Date | string) => {
    if (!dateOrStr) return ''
    let date: Date
    if (dateOrStr instanceof Date) {
      date = dateOrStr
    } else {
      // Parse string từ server - nếu không có timezone info thì coi như UTC
      date = parseServerTimestamp(dateOrStr)
    }
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const getRoleBadgeColor = (roleId?: number) => {
    if (roleId === 1) return 'badge-admin'
    if (roleId === 2) return 'badge-host'
    if (roleId === 3) return 'badge-agency'
    if (roleId === 4) return 'badge-tourist'
    return 'badge-default'
  }

  const getRoleName = (user: ChatUser) => {
    const role = user.Role || user.role
    if (role) return role
    const roleId = user.RoleId || user.roleId
    if (roleId === 1) return 'Admin'
    if (roleId === 2) return 'Host'
    if (roleId === 3) return 'Agency'
    if (roleId === 4) return 'Customer'
    return 'User'
  }

  // Filter users by search
  const filteredUsers = allUsers.filter(user => {
    const name = user.FullName || user.fullName || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!isOpen) return null

  return (
    <div className="admin-chat-overlay">
      <div className="admin-chat-container">
        {/* Header */}
        <div className="admin-chat-header">
          <div className="admin-chat-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{selectedUser ? (selectedUser.FullName || selectedUser.fullName) : 'Chat với mọi người'}</span>
          </div>
          <button className="admin-chat-close" onClick={onClose} aria-label="Đóng">
            <XIcon className="admin-chat-close-icon" />
          </button>
        </div>

        {selectedUser ? (
          <>
            {/* Chat Header with selected user */}
            <div className="admin-chat-user-info">
              <button className="admin-chat-back-btn" onClick={handleBackToList}>
                <ArrowLeftIcon className="admin-chat-back-icon" />
                <span>Danh sách</span>
              </button>
              <div className="admin-chat-user-details">
                <div className="admin-chat-user-name-row">
                  <span className="admin-chat-user-name">{selectedUser.FullName || selectedUser.fullName}</span>
                  <span className={`admin-chat-user-badge ${getRoleBadgeColor(selectedUser.RoleId || selectedUser.roleId)}`}>
                    {getRoleName(selectedUser)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="admin-chat-messages">
              {loading ? (
                <div className="admin-chat-loading">Đang tải...</div>
              ) : messages.length === 0 ? (
                <div className="admin-chat-empty">Bắt đầu cuộc trò chuyện!</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`admin-chat-message ${message.isUser ? 'admin-chat-message-user' : 'admin-chat-message-admin'}`}
                  >
                    {!message.isUser && (
                      <div className="admin-chat-avatar">
                        <span>{(selectedUser.FullName || selectedUser.fullName || 'U')[0]}</span>
                      </div>
                    )}
                    <div className="admin-chat-message-content">
                      <div className="admin-chat-message-bubble">{message.text}</div>
                      <div className="admin-chat-message-time">{formatRelativeTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="admin-chat-emoji-picker">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    className="admin-chat-emoji-btn"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="admin-chat-input-container">
              <button
                className="admin-chat-action-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji"
              >
                😊
              </button>
              <input
                type="text"
                className="admin-chat-input"
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="admin-chat-send-btn"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                aria-label="Gửi tin nhắn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="admin-chat-input-hint">Nhấn Enter để gửi</div>
          </>
        ) : (
          <>
            {/* User List View */}
            <div className="admin-chat-user-info">
              <button className="admin-chat-back-btn" onClick={onBack}>
                <ArrowLeftIcon className="admin-chat-back-icon" />
                <span>Quay lại</span>
              </button>
              <div className="admin-chat-user-details">
                <div className="admin-chat-user-label">Tài khoản của bạn</div>
                <div className="admin-chat-user-name-row">
                  <span className="admin-chat-user-name">{userName}</span>
                  <span className={`admin-chat-user-badge ${getRoleBadgeColor(userRole === 'Host' ? 2 : userRole === 'Agency' ? 3 : 4)}`}>
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="admin-chat-search">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-chat-search-input"
              />
            </div>

            {/* User List */}
            <div className="admin-chat-user-list">
              {loading ? (
                <div className="admin-chat-loading">Đang tải...</div>
              ) : (
                <>
                  {chattedUsers.length > 0 && (
                    <div className="admin-chat-section">
                      <div className="admin-chat-section-title">Lịch sử đoạn chat</div>
                      {chattedUsers
                        .filter(u => (u.FullName || u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((user) => (
                          <div
                            key={user.UserId || user.userId}
                            className="admin-chat-user-item"
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="admin-chat-user-avatar-small">
                              {(user.FullName || user.fullName || 'U')[0]}
                            </div>
                            <div className="admin-chat-user-item-info">
                              <div className="admin-chat-user-item-header">
                                <span className="admin-chat-user-item-name">{user.FullName || user.fullName}</span>
                                <span className="admin-chat-user-item-time">
                                  {formatRelativeTime(user.LastMessageTime || user.lastMessageTime)}
                                </span>
                              </div>
                              <div className="admin-chat-user-item-preview">
                                <span className={`admin-chat-user-badge-small ${getRoleBadgeColor(user.RoleId || user.roleId)}`}>
                                  {getRoleName(user)}
                                </span>
                                <span className="admin-chat-last-message">
                                  {user.LastMessage || user.lastMessage || 'Chưa có tin nhắn'}
                                </span>
                              </div>
                            </div>
                            <button
                              className="admin-chat-delete-btn"
                              onClick={(e) => handleDeleteClick(user, e)}
                              title="Xóa đoạn chat"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Chỉ hiện kết quả tìm kiếm khi user nhập search */}
                  {searchQuery.trim() && (
                    <div className="admin-chat-section">
                      <div className="admin-chat-section-title">Kết quả tìm kiếm</div>
                      {filteredUsers.length === 0 ? (
                        <div className="admin-chat-empty">Không tìm thấy người dùng</div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.UserId || user.userId}
                            className="admin-chat-user-item"
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="admin-chat-user-avatar-small">
                              {(user.FullName || user.fullName || 'U')[0]}
                            </div>
                            <div className="admin-chat-user-item-info">
                              <span className="admin-chat-user-item-name">{user.FullName || user.fullName}</span>
                              <span className={`admin-chat-user-badge-small ${getRoleBadgeColor(user.RoleId || user.roleId)}`}>
                                {getRoleName(user)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {/* Hiện gợi ý khi chưa có lịch sử chat và chưa search */}
                  {!searchQuery.trim() && chattedUsers.length === 0 && (
                    <div className="admin-chat-empty">
                      Nhập tên để tìm kiếm người dùng
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="admin-chat-dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="admin-chat-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-chat-dialog-title">Xóa đoạn chat?</div>
            <div className="admin-chat-dialog-message">
              Bạn có chắc muốn xóa toàn bộ tin nhắn với {userToDelete.FullName || userToDelete.fullName}? Hành động này không thể hoàn tác.
            </div>
            <div className="admin-chat-dialog-actions">
              <button
                className="admin-chat-dialog-btn admin-chat-dialog-btn-cancel"
                onClick={() => setShowDeleteDialog(false)}
              >
                Hủy
              </button>
              <button
                className="admin-chat-dialog-btn admin-chat-dialog-btn-delete"
                onClick={handleConfirmDelete}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminChat






