import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../API/SocialMediaApi';

// Default avatar from Firebase Storage
const DEFAULT_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1';

const Header = ({ showMenuButton = false, onMenuToggle, sidebarActive = false }) => {
  const [userName, setUserName] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // Load user info on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      // First try to get from localStorage (fast)
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const user = JSON.parse(storedUserInfo);
          setUserInfo(user);
          setUserName(user.Name || user.name || 'User');
        } catch (err) {
          console.error('Error parsing user info:', err);
        }
      }

      // Then fetch fresh data from API to ensure we have the latest avatar
      // getCurrentUser already handles errors internally and returns null, so no try-catch needed
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserInfo(currentUser);
        setUserName(currentUser.Name || currentUser.name || 'User');
        // Update localStorage with fresh data
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
      }
      // If getCurrentUser returns null, we keep using localStorage data (already set above)
    };

    loadUserInfo();
  }, []);

  return (
    <header className="header" role="banner">
      {showMenuButton && (
        <button
          className="menu-button"
          onClick={onMenuToggle}
          aria-label="Mở/đóng menu"
          aria-expanded={sidebarActive}
        >
          <span aria-hidden="true">☰</span>
        </button>
      )}
      <div className="header-logo">
        <img src="/img/esce_logo.png" alt="Logo ESCE" width="60" height="auto" loading="lazy" />
        <h1>Du lịch sinh thái</h1>
      </div>
      <nav className="header-menu" role="navigation" aria-label="Menu điều hướng chính">
        <a href="#" className="header-menu-select">Trang chủ</a>
        <a href="#" className="header-menu-select">Giới thiệu</a>
        <a href="#" className="header-menu-select">Dịch vụ phổ biến</a>
        <a href="#" className="header-menu-select">Liên lạc</a>
      </nav>
      <div className="header-menu-user">
        <img 
          src={(() => {
            // Process avatar - backend returns filename, not base64
            const backendUrl = import.meta.env.VITE_API_URL
              ? import.meta.env.VITE_API_URL.replace('/api', '')
              : window.location.origin;
            const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
            if (avatarFileName && avatarFileName.trim() !== '') {
              // Skip base64 avatars (old data) - they are no longer supported
              if (!avatarFileName.startsWith('data:image') && avatarFileName.length <= 200) {
                // Construct URL from filename (same as post/comment images)
                return `${backendUrl}/images/${avatarFileName}`;
              }
            }
            return DEFAULT_AVATAR_URL;
          })()}
          alt="Ảnh đại diện người dùng" 
          width="32" 
          height="32" 
          loading="lazy"
          onError={(e) => {
            // Extract just the filename from the URL (last part after /)
            const currentSrc = e.target.src;
            const urlParts = currentSrc.split('/');
            const filename = urlParts[urlParts.length - 1];
            
            // Only try fallback if we have a valid filename (not a full URL, not the default)
            if (filename && filename !== 'stock_nimg.jpg' && !filename.includes('http://') && !filename.includes('://') && filename.length < 100) {
              const candidates = [
                `${(import.meta.env.VITE_API_URL || '/api').replace('/api', '')}/img/uploads/${filename}`,
                `/img/uploads/${filename}`,
                DEFAULT_AVATAR_URL
              ];
              const currentIdx = candidates.findIndex(c => currentSrc === c || currentSrc.includes(c));
              const nextIdx = currentIdx + 1;
              if (nextIdx < candidates.length) {
                e.target.src = candidates[nextIdx];
              } else {
                e.target.src = DEFAULT_AVATAR_URL;
              }
            } else {
              e.target.src = DEFAULT_AVATAR_URL;
            }
          }}
        />
        <p>{userName}</p>
      </div>
    </header>
  );
};

export default Header;

