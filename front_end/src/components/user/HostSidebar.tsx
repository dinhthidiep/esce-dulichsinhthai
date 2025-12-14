import React from 'react';
import Badge from './ui/Badge';
import { 
  GridIcon,
  CalendarIcon,
  StarIcon,
  DollarSignIcon
} from './icons/index';

interface HostSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  avatarUrl: string;
  displayName: string;
  displayEmail: string;
  roleName: string;
}

const HostSidebar: React.FC<HostSidebarProps> = ({
  activeTab,
  onTabChange,
  avatarUrl,
  displayName,
  displayEmail,
  roleName
}) => {
  return (
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
          {roleName}
        </Badge>
      </div>

      <nav className="sidebar-menu">
        <button
          onClick={() => onTabChange('services')}
          className={`sidebar-menu-item ${activeTab === 'services' ? 'active' : ''}`}
        >
          <GridIcon className="sidebar-menu-icon" />
          <span>Dịch vụ thêm</span>
        </button>
        <button
          onClick={() => onTabChange('coupons')}
          className={`sidebar-menu-item ${activeTab === 'coupons' ? 'active' : ''}`}
        >
          <GridIcon className="sidebar-menu-icon" />
          <span>Mã giảm giá</span>
        </button>
        <button
          onClick={() => onTabChange('service-combos')}
          className={`sidebar-menu-item ${activeTab === 'service-combos' ? 'active' : ''}`}
        >
          <GridIcon className="sidebar-menu-icon" />
          <span>Gói dịch vụ</span>
        </button>
        <button
          onClick={() => onTabChange('promotions')}
          className={`sidebar-menu-item ${activeTab === 'promotions' ? 'active' : ''}`}
        >
          <GridIcon className="sidebar-menu-icon" />
          <span>Ưu đãi<br />(Dịch vụ tặng kèm)</span>
        </button>
        <button
          onClick={() => onTabChange('bookings')}
          className={`sidebar-menu-item ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          <CalendarIcon className="sidebar-menu-icon" />
          <span>Quản lý đặt hàng</span>
        </button>
        <button
          onClick={() => onTabChange('reviews')}
          className={`sidebar-menu-item ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          <StarIcon className="sidebar-menu-icon" />
          <span>Nhận xét</span>
        </button>
        <button
          onClick={() => onTabChange('revenue')}
          className={`sidebar-menu-item ${activeTab === 'revenue' ? 'active' : ''}`}
        >
          <DollarSignIcon className="sidebar-menu-icon" />
          <span>Doanh thu</span>
        </button>
      </nav>
    </aside>
  );
};

export default HostSidebar;






