// import React from 'react';
import './Sidebar.css';

const Sidebar = ({ sidebarActive, userInfo, additionalClassName = '' }) => {
  const getRoleId = (user) => {
    if (!user) return null;
    const roleId = user.RoleId ?? user.roleId;
    if (roleId === undefined || roleId === null) return null;
    return Number(roleId);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  const roleId = getRoleId(userInfo);
  const isHost = roleId === 2;

  return (
    <aside 
      className={`sidebar ${sidebarActive ? 'active' : ''} ${additionalClassName}`} 
      role="navigation" 
      aria-label="Menu chính"
    >
      <nav>
        <ul>
          {isHost ? (
            <>
              <li><a href="/" className="sidebar-select" aria-label="Trang chủ"><span>🏠</span> Trang chủ</a></li>
              <li><a href="/service-manager" className="sidebar-select" aria-label="Quản lý dịch vụ"><span>⚙️</span> Quản lý dịch vụ</a></li>
              <li><a href="/service-combo-manager" className="sidebar-select" aria-label="Quản lý combo dịch vụ"><span>📦</span> Quản lý combo dịch vụ</a></li>
              <li><a href="/booking-manager" className="sidebar-select" aria-label="Quản lý booking"><span>📋</span> Quản lý booking</a></li>
              <li><a href="/review-manager" className="sidebar-select" aria-label="Quản lý review"><span>⭐</span> Quản lý review</a></li>
              <li><a href="/revenue" className="sidebar-select" aria-label="Doanh thu"><span>💰</span> Doanh thu</a></li>
              <li><a href="/notification" className="sidebar-select" aria-label="Thông báo"><span>🔔</span> Thông báo</a></li>
              <li><a href="/social-media" className="sidebar-select" aria-label="Mạng xã hội"><span>📱</span> Mạng xã hội</a></li>
              <li><a href="#" className="sidebar-select" aria-label="Hỗ trợ"><span>👤</span> Hỗ trợ</a></li>
              <li><a href="#" className="sidebar-select" aria-label="Chat"><span>💬</span> Chat</a></li>
              <li className="sidebar-logout">
                <a 
                  href="#" 
                  className="sidebar-select sidebar-logout-link" 
                  aria-label="Đăng xuất" 
                  onClick={handleLogout}
                >
                  <span>🔌</span> Đăng xuất
                </a>
              </li>
            </>
          ) : (
            <>
              <li><a href="#" className="sidebar-select" aria-label="Thông tin cá nhân">Thông tin cá nhân</a></li>
              <li><a href="/service-combo-manager" className="sidebar-select" aria-label="Quản lý combo dịch vụ">Quản lý combo dịch vụ</a></li>
              <li><a href="/notification" className="sidebar-select" aria-label="Thông báo"><span>🔔</span> Thông báo</a></li>
              <li><a href="/social-media" className="sidebar-select" aria-label="Mạng xã hội">Mạng xã hội</a></li>
              <li><a href="#" className="sidebar-select" aria-label="Hỗ trợ">Hỗ trợ</a></li>
              <li><a href="#" className="sidebar-select" aria-label="Chat">Chat</a></li>
              <li className="sidebar-logout">
                <a 
                  href="#" 
                  className="sidebar-select sidebar-logout-link" 
                  aria-label="Đăng xuất"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

