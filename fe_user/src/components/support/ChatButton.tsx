import React from 'react'
import './ChatButton.css'

interface ChatButtonProps {
  onClick: () => void
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <button className="support-chat-button" onClick={onClick} aria-label="Mở hỗ trợ trực tuyến">
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
      <div className="support-chat-notification-dot"></div>
    </button>
  )
}

export default ChatButton

