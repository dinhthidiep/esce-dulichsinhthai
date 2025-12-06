import React, { useState, useEffect, useRef, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserIcon, LogOutIcon, SettingsIcon, ChevronDownIcon, BellIcon, CrownIcon } from './icons'
import './Header.css'

// Sử dụng đường dẫn public URL thay vì import
const logoEsce = '/img/logo_esce.png'

// UserInfo interface khớp với UserProfileDto từ backend (PascalCase)
// Backend trả về: Id, Email, Name, Avatar, Phone, Dob, Gender, Address, RoleId
interface UserInfo {
  // Backend trả về PascalCase
  Id?: number
  id?: number
  Email?: string
  email?: string
  Name?: string
  name?: string
  Avatar?: string
  avatar?: string
  Phone?: string
  phone?: string
  Dob?: string
  dob?: string
  Gender?: string
  gender?: string
  Address?: string
  address?: string
  RoleId?: number
  roleId?: number
  IsActive?: boolean
  isActive?: boolean
  CreatedAt?: string
  createdAt?: string
  UpdatedAt?: string
  updatedAt?: string
  // Có thể có từ API khác
  Role?: { Name?: string }
  role?: { name?: string }
  RoleName?: string
  roleName?: string
  [key: string]: unknown
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Kiểm tra trạng thái đăng nhập - cập nhật tự động
  useEffect(() => {
    const checkLoginStatus = () => {
      // Kiểm tra cả localStorage và sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')

      if (token && userInfoStr) {
        try {
          const user = JSON.parse(userInfoStr) as UserInfo
          // Chỉ log trong development mode để tránh spam console
          if (import.meta.env.DEV && !isLoggedIn) {
            console.log('🔍 [Header] Đã tìm thấy userInfo:', {
              id: user.Id || user.id,
              name: user.Name || user.name,
              email: user.Email || user.email,
              roleId: user.RoleId || user.roleId,
            })
          }
          setIsLoggedIn(true)
          setUserInfo(user)
        } catch (error) {
          console.error('❌ [Header] Error parsing userInfo:', error)
          setIsLoggedIn(false)
          setUserInfo(null)
        }
      } else {
        setIsLoggedIn(false)
        setUserInfo(null)
      }
    }

    // Kiểm tra ngay lập tức
    checkLoginStatus()

    // Tạo custom event để listen khi storage thay đổi trong cùng tab
    const handleCustomStorageChange = () => {
      if (import.meta.env.DEV) {
        console.log('📢 [Header] Nhận được custom storage change event, đang cập nhật...')
      }
      setTimeout(checkLoginStatus, 100) // Delay nhỏ để đảm bảo storage đã được cập nhật
    }

    // Lắng nghe custom event từ cùng tab (khi login/logout)
    window.addEventListener('userStorageChange', handleCustomStorageChange)

    // Lắng nghe storage event (cho các tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userInfo') {
        if (import.meta.env.DEV) {
          console.log('📢 [Header] Nhận được storage change event từ tab khác')
        }
        checkLoginStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Polling: Kiểm tra mỗi 500ms để đảm bảo cập nhật kịp thời (không quá nặng)
    const intervalId = setInterval(() => {
      checkLoginStatus()
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userStorageChange', handleCustomStorageChange)
      clearInterval(intervalId)
    }
  }, [location]) // Chỉ trigger khi location thay đổi

  // Xử lý click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside as unknown as EventListener)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    // Xóa token và userInfo từ cả localStorage và sessionStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userInfo')
    
    // Trigger custom event để Header tự động cập nhật
    window.dispatchEvent(new CustomEvent('userStorageChange'))
    
    setIsLoggedIn(false)
    setUserInfo(null)
    setShowUserMenu(false)
    navigate('/')
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  // Lấy avatar hoặc initials
  const getUserDisplay = () => {
    if (userInfo?.Avatar || userInfo?.avatar) {
      return (
        <img
          src={(userInfo.Avatar || userInfo.avatar) as string}
          alt="Avatar"
          className="user-avatar-img"
        />
      )
    }

    const name =
      (userInfo?.Name as string) ||
      (userInfo?.name as string) ||
      (userInfo?.Email as string) ||
      (userInfo?.email as string) ||
      'U'
    const initials = name.substring(0, 2).toUpperCase()
    return <span className="user-avatar-initials">{initials}</span>
  }

  // Lấy role name từ backend response
  // Backend trả về UserProfileDto với RoleId (int), không có Role object
  // Cần map RoleId sang role name theo database ROLES table
  const getRoleName = () => {
    // Ưu tiên: Role object (nếu có - từ API khác)
    if (userInfo?.Role?.Name || userInfo?.role?.name) {
      const roleName = (userInfo.Role?.Name || userInfo.role?.name) as string
      // Map role names theo database
      if (roleName === 'Customer' || roleName === 'Tourist') return 'Tourist'
      if (roleName === 'Agency') return 'Agency'
      if (roleName === 'Host') return 'Host'
      if (roleName === 'Admin') return 'Admin'
      return roleName
    }
    
    // Thứ hai: RoleName field (nếu có)
    if (userInfo?.RoleName || userInfo?.roleName) {
      const roleName = (userInfo.RoleName || userInfo.roleName) as string
      if (roleName === 'Customer' || roleName === 'Tourist') return 'Tourist'
      if (roleName === 'Agency') return 'Agency'
      if (roleName === 'Host') return 'Host'
      if (roleName === 'Admin') return 'Admin'
      return roleName
    }
    
    // Cuối cùng: Map từ RoleId (theo database ROLES table)
    // Database: ID 1=Admin, ID 2=Host, ID 3=Agency, ID 4=Tourist
    const roleId = userInfo?.RoleId || userInfo?.roleId
    if (roleId === 1) return 'Admin'
    if (roleId === 2) return 'Host'
    if (roleId === 3) return 'Agency'
    if (roleId === 4) return 'Tourist'
    
    return 'User'
  }

  // Handler cho logo click - luôn navigate về trang chủ
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      // Nếu đang ở trang chủ, reload trang để hiển thị lại từ đầu
      e.preventDefault()
      window.location.href = '/'
    }
    // Nếu đang ở trang khác, để Link component xử lý navigation
  }

  // Handler cho "Trang chủ" link click - luôn navigate về trang chủ
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      // Nếu đang ở trang chủ, reload trang để hiển thị lại từ đầu
      e.preventDefault()
      window.location.href = '/'
    }
    // Nếu đang ở trang khác, để Link component xử lý navigation
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo-section" onClick={handleLogoClick}>
          <img src={logoEsce} alt="ESCE Logo" className="logo" />
          <div className="logo-text">
            <div className="logo-text-main">Du Lịch Sinh thái</div>
            <div className="logo-text-sub">Đà Nẵng</div>
          </div>
        </Link>

        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={handleHomeClick}
          >
            Trang chủ
          </Link>
          <Link
            to="/services"
            className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}
          >
            Dịch vụ
          </Link>
          <Link
            to="/forum"
            className={`nav-link ${location.pathname === '/forum' ? 'active' : ''}`}
          >
            Diễn đàn
          </Link>
          <Link
            to="/news"
            className={`nav-link ${location.pathname === '/news' ? 'active' : ''}`}
          >
            Tin tức
          </Link>
          <Link
            to="/policy"
            className={`nav-link ${location.pathname === '/policy' ? 'active' : ''}`}
          >
            Chính sách
          </Link>
        </nav>

        <div className="header-actions">
          {isLoggedIn && userInfo ? (
            <>
              {/* Notification Bell */}
              <button className="notification-bell" aria-label="Notifications">
                <BellIcon className="bell-icon" />
                <span className="notification-badge">3</span>
              </button>

              {/* User Menu */}
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  className="user-menu-trigger"
                  onClick={toggleUserMenu}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="user-avatar">{getUserDisplay()}</div>
                  <div className="user-info-inline">
                    <div className="user-name-inline">
                      {(userInfo.Name || userInfo.name || 'Người dùng') as string}
                    </div>
                    <div className="user-role-inline">{getRoleName()}</div>
                  </div>
                  <ChevronDownIcon className={`user-menu-chevron ${showUserMenu ? 'open' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <Link
                      to="/profile"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserIcon className="user-menu-icon" />
                      <span>Thông tin cá nhân</span>
                    </Link>

                    <Link
                      to="/settings"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <SettingsIcon className="user-menu-icon" />
                      <span>Cài đặt</span>
                    </Link>

                    <div className="user-menu-divider"></div>

                    <Link
                      to="/upgrade"
                      className="user-menu-item user-menu-item-upgrade"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CrownIcon className="user-menu-icon" />
                      <span>Nâng cấp tài khoản</span>
                    </Link>

                    <div className="user-menu-divider"></div>

                    <button className="user-menu-item user-menu-item-logout" onClick={handleLogout}>
                      <LogOutIcon className="user-menu-icon" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

