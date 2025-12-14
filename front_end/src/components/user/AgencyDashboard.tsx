import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '~/utils/axiosInstance';
import HostHeader from '~/components/user/HostHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { 
  UserIcon, 
  CalendarIcon, 
  StarIcon,
  ArrowRightIcon,
  GridIcon,
} from './icons/index';
import './HostDashboard.css'; // Dùng chung CSS với HostDashboard

interface UserInfo {
  Id?: number;
  id?: number;
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
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
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

  const userName = userInfo?.FullName || userInfo?.fullName || 'Agency';

  return (
    <div className="host-dashboard">
      <HostHeader />
      
      <div className="host-dashboard-container">
        {/* Sidebar */}
        <aside className="host-sidebar">
          <div className="sidebar-header">
            <h2>Agency Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <Link to="/agency-dashboard" className="sidebar-link active">
              <GridIcon className="sidebar-icon" />
              <span>Tổng quan</span>
            </Link>
            <Link to="/service-combo-manager" className="sidebar-link">
              <CalendarIcon className="sidebar-icon" />
              <span>Quản lý Tour</span>
            </Link>
            <Link to="/booking-manager" className="sidebar-link">
              <UserIcon className="sidebar-icon" />
              <span>Đặt chỗ</span>
            </Link>
            <Link to="/revenue" className="sidebar-link">
              <StarIcon className="sidebar-icon" />
              <span>Doanh thu</span>
            </Link>
            <Link to="/profile" className="sidebar-link">
              <UserIcon className="sidebar-icon" />
              <span>Hồ sơ</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="host-main-content">
          <div className="dashboard-header">
            <h1>Xin chào, {userName}!</h1>
            <p>Chào mừng bạn đến với Agency Dashboard</p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon tours">
                <CalendarIcon />
              </div>
              <div className="stat-info">
                <h3>{stats.totalTours}</h3>
                <p>Tour đang hoạt động</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bookings">
                <UserIcon />
              </div>
              <div className="stat-info">
                <h3>{stats.totalBookings}</h3>
                <p>Tổng đặt chỗ</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <GridIcon />
              </div>
              <div className="stat-info">
                <h3>{stats.pendingBookings}</h3>
                <p>Chờ xác nhận</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon revenue">
                <StarIcon />
              </div>
              <div className="stat-info">
                <h3>{stats.totalRevenue.toLocaleString('vi-VN')}đ</h3>
                <p>Doanh thu</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Thao tác nhanh</h2>
            <div className="actions-grid">
              <Link to="/create-service-combo" className="action-card">
                <CalendarIcon className="action-icon" />
                <span>Tạo Tour mới</span>
                <ArrowRightIcon className="arrow-icon" />
              </Link>

              <Link to="/booking-manager" className="action-card">
                <UserIcon className="action-icon" />
                <span>Quản lý đặt chỗ</span>
                <ArrowRightIcon className="arrow-icon" />
              </Link>

              <Link to="/revenue" className="action-card">
                <StarIcon className="action-icon" />
                <span>Xem doanh thu</span>
                <ArrowRightIcon className="arrow-icon" />
              </Link>

              <Link to="/profile" className="action-card">
                <UserIcon className="action-icon" />
                <span>Cập nhật hồ sơ</span>
                <ArrowRightIcon className="arrow-icon" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyDashboard;
