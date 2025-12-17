import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HostHeader from '~/components/user/HostHeader';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { 
  UserIcon, 
  CalendarIcon, 
  StarIcon,
  ArrowRightIcon,
  GridIcon,
  DollarSignIcon,
} from './icons/index';
import './HostDashboard.css'; // Dùng chung CSS với HostDashboard

interface UserInfo {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  Phone?: string;
  phone?: string;
  RoleId?: number;
  roleId?: number;
  Avatar?: string;
  avatar?: string;
}

interface DashboardStats {
  totalTours: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
}

const AgencyDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats] = useState<DashboardStats>({
    totalTours: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return false;
      }

      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        try {
          const parsed = JSON.parse(userInfoStr);
          setUserInfo(parsed);
          
          // Kiểm tra role - chỉ Agency (RoleId=3) mới được vào
          const roleId = parsed.RoleId || parsed.roleId;
          if (roleId !== 3) {
            navigate('/');
            return false;
          }
        } catch (e) {
          console.error('Error parsing userInfo:', e);
        }
      }
      return true;
    };

    if (checkAuth()) {
      setLoading(false);
      // TODO: Fetch dashboard stats từ API
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="host-dashboard-loading">
        <LoadingSpinner />
        <p>Đang tải...</p>
      </div>
    );
  }

  // Get user display info
  const displayName = userInfo?.Name || userInfo?.name || userInfo?.FullName || userInfo?.fullName || 'Agency';
  const displayEmail = userInfo?.Email || userInfo?.email || '';
  const avatarUrl = userInfo?.Avatar || userInfo?.avatar || '';

  return (
    <>
      <HostHeader dashboardType="agency" />
      <main className="host-hostdashboard-main">
        <div className="host-profile-container">
          {/* Sidebar - sử dụng đúng CSS class như HostSidebar */}
          <aside className="hostdashboard-sidebar">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
                ) : (
                  <div className="sidebar-avatar-placeholder">
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="sidebar-user-name">{displayName}</h3>
              <p className="sidebar-user-email">{displayEmail}</p>
              <Badge variant="default" className="sidebar-role-badge">
                Agency
              </Badge>
            </div>

            <nav className="sidebar-menu">
              <button
                onClick={() => setActiveTab('overview')}
                className={`sidebar-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              >
                <GridIcon className="sidebar-menu-icon" />
                <span>Tổng quan</span>
              </button>
              <button
                onClick={() => navigate('/service-combo-manager')}
                className={`sidebar-menu-item ${activeTab === 'tours' ? 'active' : ''}`}
              >
                <CalendarIcon className="sidebar-menu-icon" />
                <span>Quản lý Tour</span>
              </button>
              <button
                onClick={() => navigate('/booking-manager')}
                className={`sidebar-menu-item ${activeTab === 'bookings' ? 'active' : ''}`}
              >
                <UserIcon className="sidebar-menu-icon" />
                <span>Đặt chỗ</span>
              </button>
              <button
                onClick={() => navigate('/revenue')}
                className={`sidebar-menu-item ${activeTab === 'revenue' ? 'active' : ''}`}
              >
                <DollarSignIcon className="sidebar-menu-icon" />
                <span>Doanh thu</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className={`sidebar-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <UserIcon className="sidebar-menu-icon" />
                <span>Hồ sơ</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="host-hostdashboard-content">
            <div className="host-profile-content-header">
              <h1 className="host-profile-title">Xin chào, {displayName}!</h1>
            </div>

            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Chào mừng bạn đến với Agency Dashboard
            </p>

            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                  <CalendarIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalTours}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Tour đang hoạt động</p>
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}>
                  <UserIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalBookings}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Tổng đặt chỗ</p>
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}>
                  <GridIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.pendingBookings}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Chờ xác nhận</p>
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <DollarSignIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalRevenue.toLocaleString('vi-VN')}đ</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Doanh thu</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>Thao tác nhanh</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem'
              }}>
                <Link to="/create-service-combo" style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}>
                  <CalendarIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>Tạo Tour mới</span>
                  <ArrowRightIcon style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </Link>

                <Link to="/booking-manager" style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>Quản lý đặt chỗ</span>
                  <ArrowRightIcon style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </Link>

                <Link to="/revenue" style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}>
                  <DollarSignIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>Xem doanh thu</span>
                  <ArrowRightIcon style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </Link>

                <Link to="/profile" style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>Cập nhật hồ sơ</span>
                  <ArrowRightIcon style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AgencyDashboard;
