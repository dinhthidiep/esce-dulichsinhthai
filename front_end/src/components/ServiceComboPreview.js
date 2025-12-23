import './ServiceComboPreview.css';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getServiceComboById, getServicesByComboId } from '../API/ServiceComboApi';
import Header from './Header';

// Dùng cùng domain với API deploy
const backend_url = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : window.location.origin;

const ServiceComboPreview = () => {
  const location = useLocation();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [serviceCombo, setServiceCombo] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  useEffect(() => {
    const loadData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const comboId = urlParams.get('id');

      if (!comboId) {
        setError('Không tìm thấy ID combo dịch vụ');
        setLoading(false);
        return;
      }

      try {
        // Fetch service combo data
        const comboData = await getServiceComboById(comboId);
        setServiceCombo(comboData);

        // Fetch associated services
        const servicesData = await getServicesByComboId(comboId);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.search]);

  const handleGoBack = () => {
    window.location.href = '/service-combo-manager';
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getImageSrc = (image) => {
    if (!image || image.trim() === '') {
      return '/img/stock_nimg.jpg';
    }
    if (image.startsWith('data:image') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return `${backend_url}/images/${image}`;
  };

  if (loading) {
    return (
      <div className="service-combo-preview-page">
        <Header 
          showMenuButton={true}
          onMenuToggle={toggleSidebar}
          sidebarActive={sidebarActive}
        />
        <div className="container">
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error || !serviceCombo) {
    return (
      <div className="service-combo-preview-page">
        <Header 
          showMenuButton={true}
          onMenuToggle={toggleSidebar}
          sidebarActive={sidebarActive}
        />
        <div className="container">
          <div className="error-message">{error || 'Không tìm thấy combo dịch vụ'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-combo-preview-page">
      <Header 
        showMenuButton={true}
        onMenuToggle={toggleSidebar}
        sidebarActive={sidebarActive}
      />

      <main className="container">
        <div className="breadcrumbs" aria-label="đường dẫn">
          <button className="btn-back-link" onClick={handleGoBack}>
            &lt;&lt;Quay lại
          </button>
        </div>

        <div className="title-wrap">
          <h1 className="page-title">{serviceCombo.Name || serviceCombo.name || 'Combo dịch vụ'}</h1>
        </div>

        <div className="layout">
          <section>
            <div className="gallery">
              <img 
                className="hero-img" 
                alt={serviceCombo.Name || serviceCombo.name || 'Combo dịch vụ'} 
                src={getImageSrc(serviceCombo.Image || serviceCombo.image)}
                onError={(e) => {
                  e.target.src = '/img/stock_nimg.jpg';
                }}
              />
            </div>

            <div className="section">
              <h3>Giới thiệu</h3>
              <div className="description-content">
                <p>{serviceCombo.Description || serviceCombo.description || 'Chưa có mô tả'}</p>
              </div>
            </div>

            {services.length > 0 && (
              <div className="section">
                <h3>Dịch vụ</h3>
                <div className="services-table-container">
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Mô tả</th>
                        <th>Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.Id || service.id}>
                          <td>{service.Id || service.id}</td>
                          <td>{service.Name || service.name || 'N/A'}</td>
                          <td>{service.Description || service.description || 'N/A'}</td>
                          <td>{formatPrice(service.Price || service.price)} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="section">
              <h3>Chính sách hủy</h3>
              <p className="cancellation-policy">
                {serviceCombo.CancellationPolicy || serviceCombo.cancellationPolicy || 'Chưa có chính sách hủy'}
              </p>
            </div>
          </section>

          <aside>
            <div className="card" id="booking-card" aria-label="Thông tin combo">
              <div className="card-header">
                <div>
                  <div className="price-label">Giá từ</div>
                  <div className="price">{formatPrice(serviceCombo.Price || serviceCombo.price)} đ</div>
                </div>
              </div>
              <div className="kpis">
                <div className="kpi">Mã combo: <strong>{serviceCombo.Id || serviceCombo.id}</strong></div>
                <div className="kpi">Ngày sửa: <strong>{formatDate(serviceCombo.UpdatedAt || serviceCombo.Updated_At)}</strong></div>
                <div className="kpi">Ngày tạo: <strong>{formatDate(serviceCombo.CreatedAt || serviceCombo.Created_At)}</strong></div>
                <div className="kpi">Trạng thái: <strong>{serviceCombo.Status || serviceCombo.status || 'N/A'}</strong></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ServiceComboPreview;

