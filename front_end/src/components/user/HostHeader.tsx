import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  BellIcon, 
  UserIcon, 
  ChevronDownIcon, 
  LogOutIcon,
  GridIcon,
  SettingsIcon
} from '~/components/user/icons'
import NotificationDropdown from '~/components/user/NotificationDropdown'
import { getNotifications } from '~/api/user/NotificationApi'
import './HostHeader.css'

const HostHeader = React.memo(() => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Memoize location.pathname để tránh re-render không cần thiết
  const currentPath = useMemo(() => location.pathname, [location.pathname])
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Kiểm tra đăng nhập - chỉ check khi location thay đổi hoặc khi mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      
      if (token && userInfoStr) {
        try {
          const parsedUserInfo = JSON.parse(userInfoStr)
          // Chỉ update state nếu userInfo thay đổi
          setUserInfo(prev => {
            const prevStr = JSON.stringify(prev)
            const newStr = JSON.stringify(parsedUserInfo)
            if (prevStr !== newStr) {
              return parsedUserInfo
            }
            return prev
          })
        } catch (e) {
          console.error('Error parsing userInfo:', e)
          setUserInfo(null)
        }
      } else {
        setUserInfo(null)
      }
    }

    checkAuth()
    
    // Listen storage changes từ tab/window khác
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' || e.key === 'token') {
        checkAuth()
      }
    }
    
    // Listen custom event từ cùng tab (khi ProfilePage cập nhật)
    const handleUserStorageChange = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userStorageChange', handleUserStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userStorageChange', handleUserStorageChange)
    }
  }, []) // Chỉ chạy khi mount, không phụ thuộc vào location

  // Load unread notifications count
  useEffect(() => {
    if (userInfo) {
      const loadUnreadCount = async () => {
        try {
          const notifications = await getNotifications()
          const unread = notifications.filter(
            n => !(n.IsRead || n.isRead)
          )
          setUnreadCount(unread.length)
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [userInfo])

  // Xử lý scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.host-header-user-menu-container') && 
          !target.closest('.host-header-notification-bell-container')) {
        setIsUserMenuOpen(false)
        setIsNotificationOpen(false)
      }
    }

    if (isUserMenuOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen, isNotificationOpen])

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userInfo')
    setIsUserMenuOpen(false)
    navigate('/')
    window.location.reload()
  }

  // Memoize getUserAvatar để tránh tính toán lại
  const getUserAvatar = useCallback(() => {
    const avatar = userInfo?.Avatar || userInfo?.avatar
    if (avatar) return avatar
    
    const name = userInfo?.Name || userInfo?.name || 'U'
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return initials
  }, [userInfo])
  
  // Kiểm tra avatar có phải là URL hoặc base64 không
  const isAvatarImage = useCallback((avatar: string) => {
    if (!avatar || typeof avatar !== 'string') return false
    // Kiểm tra URL (http/https) hoặc base64 (data:image)
    return avatar.startsWith('http') || avatar.startsWith('data:image')
  }, [])

  // Memoize isActive function để tránh tính toán lại không cần thiết
  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return currentPath === '/' && 
             !currentPath.startsWith('/services') && 
             !currentPath.startsWith('/forum') && 
             !currentPath.startsWith('/news') && 
             !currentPath.startsWith('/policy')
    }
    if (path === '/services') {
      return currentPath === '/services' || currentPath.startsWith('/services/')
    }
    if (path === '/host-dashboard') {
      return currentPath === '/host-dashboard'
    }
    // Cho các route quản lý, kiểm tra exact match hoặc startsWith
    return currentPath === path || currentPath.startsWith(path + '/')
  }, [currentPath])

  // Memoize nav items để tránh re-create mỗi lần render
  const commonNavItems = useMemo(() => [
    { path: '/', label: 'Trang chủ', exact: true },
    { path: '/services', label: 'Dịch vụ' },
    { path: '/forum', label: 'Diễn đàn' },
    { path: '/news', label: 'Tin tức' },
    { path: '/policy', label: 'Chính sách' },
  ], [])


  return (
    <header className={`host-header ${isScrolled ? 'host-header-scrolled' : ''}`}>
      <div className="host-header-container">
        {/* Logo */}
        <Link to="/host-dashboard" className="host-header-logo-section">
          <img src="/img/logo_esce.png" alt="ESCE Logo" className="host-header-logo" />
          <div className="host-header-logo-text">
            <div className="host-header-logo-text-main">Host Dashboard</div>
            <div className="host-header-logo-text-sub">Quản lý dịch vụ</div>
          </div>
        </Link>

        {/* Navigation - Chỉ hiển thị các link chung */}
        <nav className="host-header-nav">
          {commonNavItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`host-header-nav-link ${active ? 'host-header-active' : ''}`}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="host-header-actions">
          {/* Host Management Button - Link to Dashboard */}
          <Link
            to="/host-dashboard"
            className={`host-header-management-button ${isActive('/host-dashboard') ? 'host-header-management-active' : ''}`}
            aria-label="Quản lý Host"
          >
            <GridIcon className="host-header-management-icon" />
            <span>Quản lý</span>
          </Link>

          {/* Notification Bell */}
          <div className="host-header-notification-bell-container" style={{ position: 'relative' }}>
            <button
              className="host-header-notification-bell"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen)
                setIsUserMenuOpen(false)
              }}
              aria-label="Thông báo"
            >
              <BellIcon className="host-header-bell-icon" />
              {unreadCount > 0 && (
                <span className="host-header-notification-badge">{unreadCount}</span>
              )}
            </button>
            {isNotificationOpen && (
              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onUnreadCountChange={(count) => setUnreadCount(count)}
              />
            )}
          </div>

          {/* User Menu */}
          <div className="host-header-user-menu-container" style={{ position: 'relative' }}>
            <button
              className="host-header-user-menu-trigger"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen)
                setIsNotificationOpen(false)
              }}
              aria-label="Menu người dùng"
            >
              <div className="host-header-user-avatar">
                {(() => {
                  const avatar = getUserAvatar()
                  return userInfo && isAvatarImage(avatar) ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="host-header-user-avatar-img"
                    />
                  ) : (
                    <span className="host-header-user-avatar-initials">
                      {userInfo ? avatar : 'H'}
                    </span>
                  )
                })()}
              </div>
              {userInfo && (
                <div className="host-header-user-info-inline">
                  <span className="host-header-user-name-inline">
                    {userInfo?.Name || userInfo?.name || 'Host'}
                  </span>
                  <span className="host-header-user-role-inline">Host</span>
                </div>
              )}
              <ChevronDownIcon 
                className={`host-header-user-menu-chevron ${isUserMenuOpen ? 'host-header-open' : ''}`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="host-header-user-menu-dropdown">
                <Link
                  to="/profile"
                  className="host-header-user-menu-item"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <UserIcon style={{ width: '18px', height: '18px' }} />
                  <span>Hồ sơ của tôi</span>
                </Link>
                {/* <Link
                  to="/host-dashboard"
                  className="host-header-user-menu-item"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <SettingsIcon style={{ width: '18px', height: '18px' }} />
                  <span>Cài đặt Dashboard</span>
                </Link> */}
                <div className="host-header-user-menu-divider" />
                <button
                  className="host-header-user-menu-item host-header-user-menu-item-logout"
                  onClick={handleLogout}
                >
                  <LogOutIcon style={{ width: '18px', height: '18px' }} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
})

HostHeader.displayName = 'HostHeader'

export default HostHeader






