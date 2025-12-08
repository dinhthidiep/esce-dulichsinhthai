import './Notification.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { getCurrentUser } from '../api/SocialMediaApi';
import { useNotification } from '../contexts/NotificationContext';
import { markNotificationAsRead, deleteNotification } from '../api/NotificationApi';

const Notification = () => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notifications, isConnected, removeNotification, markAsRead } = useNotification();
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // Try to get from localStorage first
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
          try {
            const user = JSON.parse(storedUserInfo);
            setUserInfo(user);
          } catch (err) {
            console.error('Error parsing user info:', err);
          }
        }

        // Fetch current user from API
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUserInfo(currentUser);
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
          }
        } catch (err) {
          console.error('Error fetching current user:', err);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserInfo();
  }, []);

  // Format date - convert UTC from backend to local time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Parse the date string from backend (assumed to be UTC)
      // If the string doesn't have timezone info, append 'Z' to treat it as UTC
      let dateStr = dateString;
      if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        // No timezone indicator - assume UTC
        dateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
      }
      
      // Parse as UTC - JavaScript will automatically convert to local time
      const date = new Date(dateStr);
      const now = new Date();
      
      // Calculate difference (both are in milliseconds since epoch, so comparison is correct)
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      // Format date in local timezone (JavaScript automatically converts UTC to local)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Handle mark as read and remove from view (not from database)
  const handleMarkAsReadAndRemove = async (notificationId) => {
    try {
      // Mark as read in database
      await markNotificationAsRead(notificationId);
      markAsRead(notificationId);
      
      // Remove from view only (not from database)
      removeNotification(notificationId);
    } catch (err) {
      console.error('Error processing notification:', err);
      alert('Không thể xử lý thông báo: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  // Don't render if still loading
  if (loading) {
    return (
      <div className="create-tour-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="create-tour-page notification-page">
      {/* Sidebar Navigation */}
      <Sidebar 
        sidebarActive={sidebarActive} 
        userInfo={userInfo}
      />

      {/* Header */}
      <Header 
        showMenuButton={true}
        onMenuToggle={toggleSidebar}
        sidebarActive={sidebarActive}
      />

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="notification-header">
            <h3>Thông báo của bạn</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>Bạn chưa có thông báo nào.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                const notificationId = notification.Id || notification.id;
                const isRead = notification.IsRead || notification.isRead || false;
                const title = notification.Title || notification.title || 'Thông báo';
                const message = notification.Message || notification.message || '';
                const createdAt = notification.CreatedAt || notification.createdAt;

                return (
                  <div 
                    key={notificationId} 
                    className={`notification-item ${isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <div className="notification-header-item">
                        <h4 className="notification-title">{title}</h4>
                        {!isRead && <span className="unread-badge">Mới</span>}
                      </div>
                      <p className="notification-message">{message}</p>
                      {createdAt && (
                        <span className="notification-time">
                          {formatDate(createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="notification-actions">
                      <button
                        className="notification-btn notification-btn-complete"
                        onClick={() => handleMarkAsReadAndRemove(notificationId)}
                        title="Đánh dấu đã đọc và xóa"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notification;

