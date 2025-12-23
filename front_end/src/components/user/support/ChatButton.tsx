import React from 'react'
import './ChatButton.css'

interface ChatButtonProps {
  onClick: () => void
  unreadCount?: number
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, unreadCount = 0 }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    console.log('[ChatButton] Click event triggered')
    onClick()
  }
  
  return (
    <button 
      className="support-chat-button" 
      onClick={handleClick} 
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      aria-label="Mở hỗ trợ trực tuyến"
    >
      <div className="support-chat-button-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      {unreadCount > 0 && (
        <div className="support-chat-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  )
}

export default ChatButton






