import React, { useState, useEffect, useRef } from 'react'
import { useTours } from '~/hooks/useTours'
import { useServices } from '~/hooks/useServices'
import { formatPrice } from '~/lib/utils'
import './Chatbox.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của ESCE. Tôi có thể giúp bạn tìm dịch vụ nổi bật, tour đang giảm giá và nhiều thông tin khác. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { tours } = useTours()
  const { services } = useServices('Approved')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Câu hỏi về dịch vụ nổi bật
    if (
      lowerMessage.includes('dịch vụ nổi bật') ||
      lowerMessage.includes('service nổi bật') ||
      lowerMessage.includes('dịch vụ hot') ||
      lowerMessage.includes('dịch vụ phổ biến')
    ) {
      if (services && services.length > 0) {
        const topServices = services.slice(0, 3)
        let response = '🌟 **Dịch vụ nổi bật hiện tại:**\n\n'
        topServices.forEach((service, index) => {
          response += `${index + 1}. **${service.Name}**\n`
          response += `   💰 Giá: ${formatPrice(service.Price)}\n`
          if (service.Description) {
            response += `   📝 ${service.Description.substring(0, 100)}...\n`
          }
          response += '\n'
        })
        response += 'Bạn có muốn xem chi tiết dịch vụ nào không?'
        return response
      }
      return 'Hiện tại chưa có dịch vụ nào trong hệ thống. Vui lòng quay lại sau!'
    }

    // Câu hỏi về tour giảm giá
    if (
      lowerMessage.includes('tour giảm giá') ||
      lowerMessage.includes('tour đang giảm giá') ||
      lowerMessage.includes('tour khuyến mãi') ||
      lowerMessage.includes('tour sale') ||
      lowerMessage.includes('tour discount')
    ) {
      if (tours && tours.length > 0) {
        // Giả sử tour có giá thấp hơn trung bình là tour đang giảm giá
        const avgPrice =
          tours.reduce((sum, tour) => sum + (tour.Price || 0), 0) / tours.length
        const discountedTours = tours
          .filter((tour) => (tour.Price || 0) < avgPrice)
          .slice(0, 3)

        if (discountedTours.length > 0) {
          let response = '🎉 **Tour đang có giá tốt:**\n\n'
          discountedTours.forEach((tour, index) => {
            response += `${index + 1}. **${tour.Name || 'Tour'}**\n`
            response += `   💰 Giá: ${formatPrice(tour.Price || 0)}\n`
            if (tour.Description) {
              response += `   📝 ${tour.Description.substring(0, 100)}...\n`
            }
            response += '\n'
          })
          response += 'Bạn có muốn đặt tour nào không?'
          return response
        }
        return 'Hiện tại chưa có tour nào đang giảm giá. Vui lòng quay lại sau!'
      }
      return 'Hiện tại chưa có tour nào trong hệ thống. Vui lòng quay lại sau!'
    }

    // Câu hỏi về tour nổi bật
    if (
      lowerMessage.includes('tour nổi bật') ||
      lowerMessage.includes('tour hot') ||
      lowerMessage.includes('tour phổ biến') ||
      lowerMessage.includes('tour recommend')
    ) {
      if (tours && tours.length > 0) {
        const topTours = tours.slice(0, 3)
        let response = '⭐ **Tour nổi bật hiện tại:**\n\n'
        topTours.forEach((tour, index) => {
          response += `${index + 1}. **${tour.Name || 'Tour'}**\n`
          response += `   💰 Giá: ${formatPrice(tour.Price || 0)}\n`
          if (tour.Description) {
            response += `   📝 ${tour.Description.substring(0, 100)}...\n`
          }
          response += '\n'
        })
        response += 'Bạn có muốn xem chi tiết tour nào không?'
        return response
      }
      return 'Hiện tại chưa có tour nào trong hệ thống. Vui lòng quay lại sau!'
    }

    // Câu hỏi về giá cả
    if (
      lowerMessage.includes('giá') ||
      lowerMessage.includes('price') ||
      lowerMessage.includes('cost')
    ) {
      if (tours && tours.length > 0) {
        const prices = tours.map((tour) => tour.Price || 0).filter((p) => p > 0)
        if (prices.length > 0) {
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
          return `💰 **Thông tin giá tour:**\n\n- Giá thấp nhất: ${formatPrice(minPrice)}\n- Giá cao nhất: ${formatPrice(maxPrice)}\n- Giá trung bình: ${formatPrice(Math.round(avgPrice))}\n\nBạn muốn tìm tour trong khoảng giá nào?`
        }
      }
      return 'Hiện tại chưa có thông tin giá tour. Vui lòng quay lại sau!'
    }

    // Câu hỏi chào hỏi
    if (
      lowerMessage.includes('xin chào') ||
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('chào')
    ) {
      return 'Xin chào! Tôi có thể giúp bạn:\n\n✨ Tìm dịch vụ nổi bật\n🎉 Tìm tour đang giảm giá\n⭐ Tìm tour nổi bật\n💰 Tư vấn về giá cả\n\nBạn cần hỗ trợ gì?'
    }

    // Câu hỏi về giúp đỡ
    if (
      lowerMessage.includes('giúp') ||
      lowerMessage.includes('help') ||
      lowerMessage.includes('hỗ trợ') ||
      lowerMessage.includes('làm gì')
    ) {
      return 'Tôi có thể giúp bạn:\n\n✨ **"Gợi ý dịch vụ nổi bật"** - Xem các dịch vụ hot nhất\n🎉 **"Tour đang giảm giá"** - Tìm tour có giá tốt\n⭐ **"Tour nổi bật"** - Xem tour phổ biến\n💰 **"Giá tour"** - Tìm hiểu về giá cả\n\nBạn muốn biết thêm gì?'
    }

    // Câu trả lời mặc định
    return 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi tôi về:\n\n✨ Dịch vụ nổi bật\n🎉 Tour đang giảm giá\n⭐ Tour nổi bật\n💰 Giá cả tour/dịch vụ\n\nHoặc gõ "giúp" để xem thêm các câu hỏi có thể hỏi!'
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
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const response = generateResponse(inputValue)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessage = (text: string) => {
    // Convert markdown-like formatting to HTML
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Bold text
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <React.Fragment key={index}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      )
    })
  }

  return (
    <div className="chat-chatbox-container">
      {isOpen && (
        <div className="chat-chatbox-window">
          <div className="chat-chatbox-header">
            <div className="chat-chatbox-header-info">
              <div className="chat-chatbox-avatar">🤖</div>
              <div>
                <div className="chat-chatbox-title">Trợ lý AI ESCE</div>
                <div className="chat-chatbox-subtitle">Thường phản hồi ngay</div>
              </div>
            </div>
            <button
              className="chat-chatbox-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chatbox"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="chat-chatbox-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-chatbox-message ${message.isUser ? 'chat-user' : 'chat-ai'}`}
              >
                <div className="chat-chatbox-message-content">
                  {formatMessage(message.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-chatbox-message chat-ai">
                <div className="chat-chatbox-message-content chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-chatbox-input-container">
            <input
              type="text"
              className="chat-chatbox-input"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="chat-chatbox-send-btn"
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
        </div>
      )}

      <button
        className="chat-chatbox-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng chatbox' : 'Mở chatbox'}
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default Chatbox


















