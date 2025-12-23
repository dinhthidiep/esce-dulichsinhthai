import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, XIcon, SparklesIcon } from '~/components/user/icons'
import axiosInstance from '~/utils/axiosInstance'
import './AIChatbot.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Tôi có thể giúp bạn:
• Hướng dẫn đặt phòng
• Giải đáp chính sách
• Gợi ý địa điểm du lịch
• Và nhiều thông tin khác!
Bạn cần hỗ trợ gì nhé? 🤓`,
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    'Làm sao để đặt phòng?',
    'Chính sách hủy phòng?',
    'Phương thức thanh toán?',
    'Các địa điểm du lịch hot?',
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getAIResponseFromAPI = async (question: string): Promise<string> => {
    try {
      const response = await axiosInstance.post('/api/Chatbox/ask', {
        Question: question,
      })
      return response.data?.Answer || response.data?.answer || generateAIResponse(question)
    } catch (err) {
      console.error('Error calling Chatbox API:', err)
      // Fallback to local response
      return generateAIResponse(question)
    }
  }

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('đặt phòng') || lowerMessage.includes('booking')) {
      return `Để đặt phòng, bạn có thể:
1. Chọn dịch vụ từ trang "Dịch vụ"
2. Nhấn "Đặt ngay" trên trang chi tiết dịch vụ
3. Điền thông tin và thanh toán
4. Xác nhận đặt phòng qua email

Bạn cần hỗ trợ thêm gì không? 😊`
    }

    if (lowerMessage.includes('hủy') || lowerMessage.includes('cancel')) {
      return `Chính sách hủy phòng:
• Hủy trước 24h: Hoàn tiền 100%
• Hủy trước 12h: Hoàn tiền 50%
• Hủy sau 12h: Không hoàn tiền

Bạn có câu hỏi gì khác không? 🤔`
    }

    if (lowerMessage.includes('thanh toán') || lowerMessage.includes('payment')) {
      return `Chúng tôi hỗ trợ các phương thức thanh toán:
• Thẻ tín dụng/ghi nợ
• Ví điện tử (MoMo, ZaloPay)
• Chuyển khoản ngân hàng
• Thanh toán khi nhận dịch vụ (một số dịch vụ)

Bạn muốn biết thêm gì? 💳`
    }

    if (lowerMessage.includes('địa điểm') || lowerMessage.includes('du lịch') || lowerMessage.includes('tour')) {
      return `Một số địa điểm du lịch hot hiện tại:
• Bà Nà Hills - Đà Nẵng
• Cù Lao Chàm - Hội An
• Sơn Trà - Đà Nẵng
• Bán đảo Sơn Trà

Bạn muốn tìm hiểu về địa điểm nào? 🗺️`
    }

    return `Tôi hiểu bạn đang hỏi về "${userMessage}". Để tôi có thể hỗ trợ tốt hơn, bạn có thể hỏi cụ thể về:
• Đặt phòng
• Chính sách hủy
• Thanh toán
• Địa điểm du lịch

Hoặc bạn có thể chat với Admin để được hỗ trợ chi tiết hơn! 💬`
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call Chatbox API
      const aiResponse = await getAIResponseFromAPI(text)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error('Error getting AI response:', err)
      // Fallback to local response
      const aiResponse = generateAIResponse(text)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
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

  if (!isOpen) return null

  return (
    <div className="ai-chatbot-overlay">
      <div className="ai-chatbot-container">
        {/* Header */}
        <div className="ai-chatbot-header">
          <div className="ai-chatbot-header-left">
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
            <span>AI Chatbot</span>
          </div>
          <button className="ai-chatbot-close" onClick={onClose} aria-label="Đóng">
            <XIcon className="ai-chatbot-close-icon" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="ai-chatbot-status-bar">
          <button className="ai-chatbot-back-btn" onClick={onBack}>
            <ArrowLeftIcon className="ai-chatbot-back-icon" />
            <span>Quay lại</span>
          </button>
            <div className="ai-chatbot-status">
            <span className={`ai-chatbot-status-dot ${isLoading ? 'ai-chatbot-status-dot-pulsing' : ''}`}></span>
            <span className="ai-chatbot-status-text">
              {isLoading ? 'AI đang suy nghĩ...' : 'AI đang trực tuyến - Phản hồi tức thì'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-chatbot-message ${message.isUser ? 'ai-chatbot-message-user' : 'ai-chatbot-message-ai'}`}
            >
              <div className="ai-chatbot-message-content">
                <div className="ai-chatbot-message-bubble">{message.text}</div>
                <div className="ai-chatbot-message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="ai-chatbot-suggestions">
              <div className="ai-chatbot-suggestions-title">Câu hỏi gợi ý:</div>
              <div className="ai-chatbot-suggestions-grid">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="ai-chatbot-suggestion-btn"
                    onClick={() => handleSendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-chatbot-input-container">
          <input
            type="text"
            className="ai-chatbot-input"
            placeholder="Hỏi AI bất cứ điều gì..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="ai-chatbot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
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
        <div className="ai-chatbot-footer">
          <SparklesIcon className="ai-chatbot-footer-icon" />
          <span>Được hỗ trợ bởi AI thông minh</span>
        </div>
      </div>
    </div>
  )
}

export default AIChatbot






