import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BellIcon, UserIcon, ChevronDownIcon, StarIcon, CrownIcon, LogOutIcon } from '~/components/icons'
import NotificationDropdown from '~/components/NotificationDropdown'
import { getNotifications } from '~/API/NotificationApi'
import type { NotificationDto } from '~/API/NotificationApi'
import './Header.css'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Kiểm tra đăng nhập
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      
      if (token && userInfoStr) {
        setIsLoggedIn(true)
        try {
          setUserInfo(JSON.parse(userInfoStr))
        } catch (e) {
          console.error('Error parsing userInfo:', e)
        }
      } else {
        setIsLoggedIn(false)
        setUserInfo(null)
      }
    }

    checkAuth()
    window.addEventListener('storage', checkAuth)
    const interval = setInterval(checkAuth, 1000)

    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [location])

  // Load unread notifications count
  useEffect(() => {
    if (isLoggedIn) {
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
      // Refresh every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

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
      if (!target.closest('.header-user-menu-container') && !target.closest('.notification-bell-container')) {
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
    setIsLoggedIn(false)
    setUserInfo(null)
    setIsUserMenuOpen(false)
    navigate('/')
    window.location.reload()
  }

  // Lấy tên role
  const getRoleName = (): string => {
    if (!userInfo) return 'User'
    
    if (userInfo.Role?.Name || userInfo.role?.name) {
      const roleName = userInfo.Role?.Name || userInfo.role?.name
      if (roleName === 'User') return 'Tourist'
      return roleName
    }
    if (userInfo.RoleName || userInfo.roleName) {
      const roleName = userInfo.RoleName || userInfo.roleName
      if (roleName === 'User') return 'Tourist'
      return roleName
    }
    
    const roleId = userInfo.RoleId || userInfo.roleId
    if (roleId === 1) return 'Admin'
    if (roleId === 2) return 'Host'
    if (roleId === 3) return 'Agency'
    if (roleId === 4) return 'Tourist'
    return 'User'
  }

  // Lấy avatar hoặc initials
  const getUserAvatar = () => {
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
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header-header className={`header-header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-header-container">
        {/* Logo */}
        <Link to="/" className="header-logo-section">
          <img src="/img/logo_esce.png" alt="ESCE Logo" className="header-logo" />
          <div className="header-logo-text">
            <div className="header-logo-text-main">Du Lịch Sinh thái</div>
            <div className="header-logo-text-sub">Đà Nẵng</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="header-header-nav">
          <Link 
            to="/" 
            className={`header-nav-link ${isActive('/') && location.pathname !== '/services' && location.pathname !== '/forum' && location.pathname !== '/news' && location.pathname !== '/policy' ? 'header-active' : ''}`}
          >
            Trang chủ
          </Link>
          <Link 
            to="/services" 
            className={`header-nav-link ${isActive('/services') ? 'header-active' : ''}`}
          >
            Dịch vụ
          </Link>
          <Link 
            to="/forum" 
            className={`header-nav-link ${isActive('/forum') ? 'header-active' : ''}`}
          >
            Diễn đàn
          </Link>
          <Link 
            to="/news" 
            className={`header-nav-link ${isActive('/news') ? 'header-active' : ''}`}
          >
            Tin tức
          </Link>
          <Link 
            to="/policy" 
            className={`header-nav-link ${isActive('/policy') ? 'header-active' : ''}`}
          >
            Chính sách
          </Link>
        </nav>

        {/* Actions */}
        <div className="header-header-actions">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="notification-bell-container" style={{ position: 'relative' }}>
                <button
                  className="header-notification-bell"
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen)
                    setIsUserMenuOpen(false)
                  }}
                  aria-label="Thông báo"
                >
                  <BellIcon className="header-bell-icon" />
                  {unreadCount > 0 && (
                    <span className="header-notification-badge">{unreadCount}</span>
                  )}
                </button>
                {isNotificationOpen && (
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                )}
              </div>

              {/* User Menu */}
              <div className="header-user-menu-container" style={{ position: 'relative' }}>
                <button
                  className="header-user-menu-trigger"
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen)
                    setIsNotificationOpen(false)
                  }}
                  aria-label="Menu người dùng"
                >
                  <div className="header-user-avatar">
                    {typeof getUserAvatar() === 'string' && getUserAvatar().startsWith('http') ? (
                      <img 
                        src={getUserAvatar()} 
                        alt="Avatar" 
                        className="header-user-avatar-img"
                      />
                    ) : (
                      <span className="header-user-avatar-initials">{getUserAvatar()}</span>
                    )}
                  </div>
                  <div className="header-user-info-inline">
                    <span className="header-user-name-inline">
                      {userInfo?.Name || userInfo?.name || 'Người dùng'}
                    </span>
                    <span className="header-user-role-inline">
                      {getRoleName()}
                    </span>
                  </div>
                  <ChevronDownIcon 
                    className={`header-user-menu-chevron ${isUserMenuOpen ? 'header-open' : ''}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="header-user-menu-dropdown">
                    <Link
                      to="/profile"
                      className="header-user-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon style={{ width: '18px', height: '18px' }} />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                    <div className="header-user-menu-divider" />
                    <Link
                      to="/subscription-packages"
                      className="header-user-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <StarIcon style={{ width: '18px', height: '18px' }} />
                      <span>Cấp độ của bạn</span>
                    </Link>
                    <Link
                      to="/upgrade"
                      className="header-user-menu-item header-user-menu-item-upgrade"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <CrownIcon style={{ width: '18px', height: '18px' }} />
                      <span>Nâng cấp tài khoản</span>
                    </Link>
                    <div className="header-user-menu-divider" />
                    <button
                      className="header-user-menu-item header-user-menu-item-logout"
                      onClick={handleLogout}
                    >
                      <LogOutIcon style={{ width: '18px', height: '18px' }} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header-btn-login">
                Đăng nhập
              </Link>
              <Link to="/register" className="header-btn-register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header-header>
  )
}

export default Header

