import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import ChatButton from './ChatButton'
import SupportModal from './SupportModal'
import AdminChat from './AdminChat'
import AIChatbot from './AIChatbot'
import axiosInstance from '~/utils/axiosInstance'

// Helper function để check Admin ngay lập tức (không cần state)
const checkIsAdminUser = (): boolean => {
  try {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (!userInfoStr) return false
    const user = JSON.parse(userInfoStr)
    const roleId = user.RoleId || user.roleId
    const roleName = user.Role?.Name || user.role?.name || user.RoleName || user.roleName || ''
    return roleId === 1 || String(roleId) === '1' || roleName.toLowerCase() === 'admin'
  } catch {
    return false
  }
}

// Helper function để check đăng nhập
const checkIsLoggedIn = (): boolean => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return !!token
}

const Support: React.FC = () => {
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showAdminChat, setShowAdminChat] = useState(false)
  const [showAIChatbot, setShowAIChatbot] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name?: string; role?: string }>({})
  const [unreadCount, setUnreadCount] = useState(0)
  // State để track login và admin status - cần update khi user login/logout
  const [isLoggedIn, setIsLoggedIn] = useState(() => checkIsLoggedIn())
  const [isAdmin, setIsAdmin] = useState(() => checkIsAdminUser())
  // Sử dụng ref để ngăn click liên tục (không gây re-render)
  const isProcessingClickRef = useRef(false)

  // Check login status periodically (để detect login/logout)
  useEffect(() => {
    const checkAuthStatus = () => {
      const newIsLoggedIn = checkIsLoggedIn()
      const newIsAdmin = checkIsAdminUser()
      
      setIsLoggedIn(prev => prev !== newIsLoggedIn ? newIsLoggedIn : prev)
      setIsAdmin(prev => prev !== newIsAdmin ? newIsAdmin : prev)
    }

    // Check ngay khi mount
    checkAuthStatus()

    // Check mỗi 2 giây để detect login/logout
    const interval = setInterval(checkAuthStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await axiosInstance.get('/chat/UnreadCount')
      const newCount = response.data?.count || 0
      // Chỉ update nếu count thay đổi
      setUnreadCount(prev => prev !== newCount ? newCount : prev)
    } catch (err) {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    // Nếu không đăng nhập hoặc là Admin, không cần làm gì
    if (!isLoggedIn || isAdmin) return

    // Get user info from localStorage/sessionStorage
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr)
        setUserInfo({
          name: user.Name || user.name || 'Nguyễn Văn A',
          role: getRoleName(user),
        })
      } catch (e) {
        console.error('Error parsing userInfo:', e)
      }
    }

    // Fetch unread count on mount
    fetchUnreadCount()

    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount, isLoggedIn, isAdmin])

  const getRoleName = (user: any): string => {
    if (user.Role?.Name || user.role?.name) {
      const roleName = user.Role?.Name || user.role?.name
      if (roleName === 'User') return 'Du khách'
      if (roleName === 'Host') return 'Host'
      if (roleName === 'Agency') return 'Agency'
      return roleName
    }
    if (user.RoleName || user.roleName) {
      const roleName = user.RoleName || user.roleName
      if (roleName === 'User') return 'Du khách'
      return roleName
    }
    const roleId = user.RoleId || user.roleId
    if (roleId === 1) return 'Admin'
    if (roleId === 2) return 'Host'
    if (roleId === 3) return 'Agency'
    if (roleId === 4) return 'Du khách'
    return 'Du khách'
  }

  const handleChatButtonClick = useCallback(() => {
    // Ngăn click liên tục bằng ref (không gây re-render)
    if (isProcessingClickRef.current) {
      return
    }
    
    isProcessingClickRef.current = true
    
    // Nếu có bất kỳ modal nào đang mở, đóng tất cả
    if (showAdminChat || showAIChatbot || showSupportModal) {
      setShowAdminChat(false)
      setShowAIChatbot(false)
      setShowSupportModal(false)
    } else {
      // Mở SupportModal
      setShowSupportModal(true)
    }
    
    // Reset flag sau 500ms
    setTimeout(() => {
      isProcessingClickRef.current = false
    }, 500)
  }, [showAdminChat, showAIChatbot, showSupportModal])

  const handleCloseSupportModal = () => {
    setShowSupportModal(false)
  }

  const handleSelectAdminChat = () => {
    setShowSupportModal(false)
    setShowAdminChat(true)
  }

  const handleSelectAIChat = () => {
    setShowSupportModal(false)
    setShowAIChatbot(true)
  }

  const handleBackFromAdminChat = () => {
    setShowAdminChat(false)
    setShowSupportModal(true)
  }

  const handleBackFromAIChatbot = () => {
    setShowAIChatbot(false)
    setShowSupportModal(true)
  }

  const handleCloseAdminChat = () => {
    setShowAdminChat(false)
  }

  const handleCloseAIChatbot = () => {
    setShowAIChatbot(false)
  }

  // Refresh unread count when chat is closed
  const handleCloseAdminChatWithRefresh = () => {
    setShowAdminChat(false)
    fetchUnreadCount()
  }

  // Ẩn Support chat widget khi:
  // 1. Chưa đăng nhập
  // 2. Đăng nhập bằng tài khoản Admin (Admin đã có mục Chat riêng)
  if (!isLoggedIn || isAdmin) {
    return null
  }

  return (
    <>
      <ChatButton onClick={handleChatButtonClick} unreadCount={unreadCount} />
      <SupportModal
        isOpen={showSupportModal}
        onClose={handleCloseSupportModal}
        onSelectAdminChat={handleSelectAdminChat}
        onSelectAIChat={handleSelectAIChat}
      />
      <AdminChat
        isOpen={showAdminChat}
        onClose={handleCloseAdminChatWithRefresh}
        onBack={handleBackFromAdminChat}
        userName={userInfo.name}
        userRole={userInfo.role}
        onRefreshUnread={fetchUnreadCount}
      />
      <AIChatbot
        isOpen={showAIChatbot}
        onClose={handleCloseAIChatbot}
        onBack={handleBackFromAIChatbot}
      />
    </>
  )
}

export default Support






