import React, { useEffect, useRef } from 'react'
import { XIcon, ArrowLeftIcon } from '~/components/user/icons'
import './SupportModal.css'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAdminChat: () => void
  onSelectAIChat: () => void
}

const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  onSelectAdminChat,
  onSelectAIChat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      // Kiểm tra xem click có phải vào ChatButton không
      const target = e.target as HTMLElement
      if (target.closest('.support-chat-button')) {
        return // Không đóng nếu click vào ChatButton
      }
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose()
      }
    }

    // Delay để tránh trigger ngay khi mở
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="support-modal-container" ref={containerRef}>
        <div className="support-modal-header">
          <div className="support-modal-header-left">
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
            <span>Hỗ trợ trực tuyến</span>
          </div>
          <button className="support-modal-close" onClick={onClose} aria-label="Đóng">
            <XIcon className="support-modal-close-icon" />
          </button>
        </div>

        <div className="support-modal-content">
          <div className="support-modal-icon-large">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h3 className="support-modal-title">Chúng tôi có thể giúp gì cho bạn?</h3>
          <p className="support-modal-subtitle">Chọn loại hỗ trợ bạn muốn sử dụng</p>

          <div className="support-modal-options">
            {/* Chat với mọi người */}
            <div className="support-modal-option-card" onClick={onSelectAdminChat}>
              <div className="support-modal-option-icon admin-icon">
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="support-modal-option-content">
                <h4 className="support-modal-option-title">Chat với mọi người</h4>
                <p className="support-modal-option-description">
                  Nhắn tin trực tiếp với Host, Agency và người dùng khác
                </p>
                <div className="support-modal-option-tags">
                  <span className="support-modal-tag tag-tourist">Tourist</span>
                  <span className="support-modal-tag tag-host">Host</span>
                  <span className="support-modal-tag tag-agency">Agency</span>
                </div>
              </div>
            </div>

            {/* AI Chatbot */}
            <div className="support-modal-option-card" onClick={onSelectAIChat}>
              <div className="support-modal-option-icon ai-icon">
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
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="support-modal-option-content">
                <h4 className="support-modal-option-title">AI Chatbot</h4>
                <p className="support-modal-option-description">
                  Trả lời tức thì 24/7 bởi trợ lý AI thông minh
                </p>
                <div className="support-modal-option-status">
                  <span className="support-modal-status-dot"></span>
                  <span className="support-modal-status-text">Luôn sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default SupportModal






