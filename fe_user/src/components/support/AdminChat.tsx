import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, XIcon } from '~/components/icons'
import axiosInstance from '~/utils/axiosInstance'
import './AdminChat.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface AdminChatProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  userName?: string
  userRole?: string
}

const AdminChat: React.FC<AdminChatProps> = ({
  isOpen,
  onClose,
  onBack,
  userName = 'Nguyễn Văn A',
  userRole = 'Du khách',
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [chattedUsers, setChattedUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get userId helper
  const getUserId = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const userId = userInfo.Id || userInfo.id
        if (userId) {
          return String(userId)
        }
      }
      return null
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }

  // Fetch chatted users on mount
  useEffect(() => {
    if (isOpen) {
      fetchChattedUsers()
    }
  }, [isOpen])

  // Fetch chat history when user is selected
  useEffect(() => {
    if (isOpen && selectedUserId) {
      fetchChatHistory(selectedUserId)
    } else if (isOpen && !selectedUserId && chattedUsers.length > 0) {
      // Auto-select first user if available
      setSelectedUserId(chattedUsers[0].userId || chattedUsers[0].UserId)
    }
  }, [isOpen, selectedUserId, chattedUsers])

  const fetchChattedUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/chat/GetChattedUser')
      const users = response.data || []
      setChattedUsers(users)
      
      // Auto-select first user if available
      if (users.length > 0 && !selectedUserId) {
        const firstUserId = users[0].userId || users[0].UserId || users[0].Id
        if (firstUserId) {
          setSelectedUserId(String(firstUserId))
        }
      }
    } catch (err) {
      console.error('Error fetching chatted users:', err)
      // Set default welcome message if no users
      setMessages([{
        id: '1',
        text: 'Xin chào! Tôi là Admin Support. Bạn cần hỗ trợ gì ạ?',
        isUser: false,
        timestamp: new Date(),
      }])
    }
  }

  const fetchChatHistory = async (toUserId: string) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/api/chat/GetHistory/${toUserId}`)
      const history = response.data || []
      
      // Transform backend messages to frontend format
      const transformedMessages: Message[] = history.map((msg: any) => ({
        id: String(msg.Id || msg.id || Date.now()),
        text: msg.Content || msg.content || msg.Message || msg.message || '',
        isUser: (msg.SenderId || msg.senderId || msg.UserId || msg.userId) === getUserId(),
        timestamp: new Date(msg.CreatedAt || msg.createdAt || msg.Timestamp || msg.timestamp || Date.now()),
      }))
      
      if (transformedMessages.length === 0) {
        // Show welcome message if no history
        setMessages([{
          id: '1',
          text: 'Xin chào! Tôi là Admin Support. Bạn cần hỗ trợ gì ạ?',
          isUser: false,
          timestamp: new Date(),
        }])
      } else {
        setMessages(transformedMessages)
      }
    } catch (err) {
      console.error('Error fetching chat history:', err)
      // Show default message on error
      setMessages([{
        id: '1',
        text: 'Xin chào! Tôi là Admin Support. Bạn cần hỗ trợ gì ạ?',
        isUser: false,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputValue
    setInputValue('')
    setLoading(true)

    try {
      // TODO: Implement send message API when backend is ready
      // For now, show auto-response
      setTimeout(() => {
        const adminMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.',
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, adminMessage])
        setLoading(false)
      }, 1000)
    } catch (err) {
      console.error('Error sending message:', err)
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'Du khách' || role === 'Tourist') return 'badge-tourist'
    if (role === 'Host') return 'badge-host'
    if (role === 'Agency') return 'badge-agency'
    return 'badge-default'
  }

  if (!isOpen) return null

  return (
    <div className="admin-chat-overlay">
      <div className="admin-chat-container">
        {/* Header */}
        <div className="admin-chat-header">
          <div className="admin-chat-header-left">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Chat với Admin</span>
          </div>
          <button className="admin-chat-close" onClick={onClose} aria-label="Đóng">
            <XIcon className="admin-chat-close-icon" />
          </button>
        </div>

        {/* User Info */}
        <div className="admin-chat-user-info">
          <button className="admin-chat-back-btn" onClick={onBack}>
            <ArrowLeftIcon className="admin-chat-back-icon" />
            <span>Quay lại</span>
          </button>
          <div className="admin-chat-user-details">
            <div className="admin-chat-user-label">Tài khoản của bạn</div>
            <div className="admin-chat-user-name-row">
              <span className="admin-chat-user-name">{userName}</span>
              <span className={`admin-chat-user-badge ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="admin-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`admin-chat-message ${message.isUser ? 'admin-chat-message-user' : 'admin-chat-message-admin'}`}
            >
              {!message.isUser && (
                <div className="admin-chat-avatar">
                  <span>A</span>
                </div>
              )}
              <div className="admin-chat-message-content">
                <div className="admin-chat-message-bubble">{message.text}</div>
                <div className="admin-chat-message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="admin-chat-input-container">
          <input
            type="text"
            className="admin-chat-input"
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="admin-chat-send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            aria-label="Gửi tin nhắn"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="admin-chat-input-hint">Nhấn Enter để gửi</div>
      </div>
    </div>
  )
}

export default AdminChat

