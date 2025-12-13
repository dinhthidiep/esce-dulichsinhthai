import React, { useState, useEffect, useCallback } from 'react'
import ChatButton from './ChatButton'
import SupportModal from './SupportModal'
import AdminChat from './AdminChat'
import AIChatbot from './AIChatbot'
import axiosInstance from '~/utils/axiosInstance'

const Support: React.FC = () => {
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showAdminChat, setShowAdminChat] = useState(false)
  const [showAIChatbot, setShowAIChatbot] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name?: string; role?: string }>({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      setIsLoggedIn(false)
      return
    }
    
    setIsLoggedIn(true)
    try {
      const response = await axiosInstance.get('/chat/UnreadCount')
      setUnreadCount(response.data?.count || 0)
    } catch (err) {
      // Silent fail
    }
  }, [])

  useEffect(() => {
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

    // Poll for unread count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

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

  const handleChatButtonClick = () => {
    setShowSupportModal(true)
  }

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

