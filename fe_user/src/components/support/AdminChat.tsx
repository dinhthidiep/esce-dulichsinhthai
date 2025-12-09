import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, XIcon } from '~/components/icons'
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là Admin Support. Bạn cần hỗ trợ gì ạ?',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    // Simulate admin response after a delay
    setTimeout(() => {
      const adminMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, adminMessage])
    }, 1000)
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

