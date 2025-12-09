import React, { useEffect, useState, useRef } from 'react'
import { getNotifications, markNotificationAsRead, type NotificationDto } from '~/API/NotificationApi'
import './NotificationDropdown.css'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      loadNotifications()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Load notifications
  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  // Đánh dấu đã đọc
  const handleMarkAsRead = async (notification: NotificationDto) => {
    const notificationId = notification.Id || notification.id
    if (!notificationId) return

    try {
      await markNotificationAsRead(notificationId)
      // Cập nhật local state
      setNotifications(prev =>
        prev.map(n => {
          const id = n.Id || n.id
          if (id === notificationId) {
            return { ...n, IsRead: true, isRead: true }
          }
          return n
        })
      )
    } catch (err) {
      console.error('Error marking notification as notif-read:', err)
      alert('Không thể đánh dấu thông báo là đã đọc')
    }
  }


  // Format ngày tháng
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
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
    } catch {
      return dateString
    }
  }

  if (!isOpen) return null

  return (
    <div className="notif-notification-dropdown" ref={dropdownRef}>
      <div className="notif-notification-dropdown-header">
        <h3>Thông báo</h3>
        <button className="notif-notification-close-btn" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>

      <div className="notif-notification-dropdown-content">
        {loading ? (
          <div className="notif-notification-loading">Đang tải...</div>
        ) : error ? (
          <div className="notif-notification-error">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="notif-notification-empty">Bạn chưa có thông báo nào</div>
        ) : (
          <div className="notif-notification-list">
            {notifications.map((notification) => {
              const notificationId = notification.Id || notification.id
              const isRead = notification.IsRead || notification.isRead || false
              const title = notification.Title || notification.title || 'Thông báo'
              const message = notification.Message || notification.message || ''
              const createdAt = notification.CreatedAt || notification.createdAt

              return (
                <div
                  key={notificationId}
                  className={`notif-notification-item ${isRead ? 'notif-read' : 'notif-unread'}`}
                  onClick={() => {
                    if (!isRead) {
                      handleMarkAsRead(notification)
                    }
                  }}
                  style={{ cursor: !isRead ? 'pointer' : 'default' }}
                >
                  <div className="notif-notification-item-content">
                    <div className="notif-notification-item-header">
                      <h4 className="notif-notification-item-title">{title}</h4>
                      {!isRead && <span className="notif-notification-unread-badge">Mới</span>}
                    </div>
                    <p className="notif-notification-item-message">{message}</p>
                    {createdAt && (
                      <span className="notif-notification-item-time">{formatDate(createdAt)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationDropdown



