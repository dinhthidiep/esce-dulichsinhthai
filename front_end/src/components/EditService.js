import './EditService.css';
import React, { useState, useEffect, useCallback } from 'react';
import { updateService, getServiceById } from '../API/ServiceApi';
import Header from './Header';
import { getCurrentUser } from '../API/SocialMediaApi';

const EditService = () => {
   // State management
   const [formData, setFormData] = useState({
     id: '',
     name: '',
     description: '',
     price: ''
   });

   const [errors, setErrors] = useState({});
   const [isLoading, setIsLoading] = useState(false);
   const [sidebarActive, setSidebarActive] = useState(false);
   const [userInfo, setUserInfo] = useState(null);

   // Load user info to check role
   useEffect(() => {
     const loadUserInfo = async () => {
       const storedUserInfo = localStorage.getItem('userInfo');
       if (storedUserInfo) {
         try {
           const user = JSON.parse(storedUserInfo);
           setUserInfo(user);
         } catch (err) {
           console.error('Error parsing user info:', err);
         }
       }
       try {
         const currentUser = await getCurrentUser();
         if (currentUser) {
           setUserInfo(currentUser);
           localStorage.setItem('userInfo', JSON.stringify(currentUser));
         }
       } catch (err) {
         console.error('Error fetching current user:', err);
       }
     };
     loadUserInfo();
   }, []);

  // Configuration
  const config = {
    maxDescriptionLength: 5000
  };

  // Utility functions
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
        return !value || value.trim() === '' ? 'Tên dịch vụ không được để trống' : '';
      
      case 'price':
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) return 'Giá phải là số >= 0';
        return '';
      
      default:
        return '';
    }
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check required fields first
    const requiredFields = {
      name: formData.name,
      price: formData.price
    };
    
    const emptyRequiredFields = Object.entries(requiredFields).filter(([key, value]) => {
      if (key === 'price') {
        // Handle null, undefined, empty string, or 0 (0 is valid for price)
        if (value === null || value === undefined) return true;
        const priceValue = typeof value === 'string' ? value.trim() : String(value);
        if (priceValue === '' || priceValue === 'null' || priceValue === 'undefined') return true;
        const priceNum = parseFloat(priceValue);
        // Check if it's a valid number and >= 0 (0 is valid)
        if (isNaN(priceNum)) return true;
        if (priceNum < 0) return true;
        return false; // Valid price
      }
      if (value === null || value === undefined) return true;
      const textValue = typeof value === 'string' ? value.trim() : String(value);
      return textValue === '';
    });
    
    if (emptyRequiredFields.length > 0) {
      alert('Vui lòng điền vào ô bắt buộc.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      
      // Scroll to first error
      const firstErrorField = document.querySelector('.error:not(:empty)')?.previousElementSibling;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    try {
      // Create FormData for update
      const submitData = new FormData();
      // Only include the 3 fields: name, description, price
      if (formData.name) {
        submitData.append('name', formData.name);
      }
      if (formData.description !== null && formData.description !== undefined) {
        submitData.append('description', formData.description);
      }
      if (formData.price) {
        submitData.append('price', formData.price);
      }
      // Ensure ID is included for update
      if (formData.id) {
        submitData.append('id', formData.id);
        submitData.append('Id', formData.id);
      }

      console.log('Submitting update with data:', {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        price: formData.price
      });

      // Submit to backend API
      const result = await updateService(submitData);
      
      console.log('Update result:', result);
      
      // If updateService succeeds (no error thrown), redirect
      alert('Dịch vụ đã được cập nhật thành công!');
      // Redirect to service-manager page
      window.location.href = '/service-manager';
    } catch (error) {
      console.error('Error updating service:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật dịch vụ. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    window.location.href = '/service-manager';
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  // Load service data on component mount
  useEffect(() => {
    const loadServiceData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const serviceId = urlParams.get('id');

      if (serviceId) {
        try {
          const serviceData = await getServiceById(serviceId);
          console.log('Service data loaded:', serviceData); // Debug log
          
          setFormData({
            id: serviceData.Id || serviceData.id,
            name: serviceData.Name || serviceData.name || '',
            description: serviceData.Description || serviceData.description || '',
            price: serviceData.Price !== null && serviceData.Price !== undefined ? String(serviceData.Price) : (serviceData.price !== null && serviceData.price !== undefined ? String(serviceData.price) : '')
          });
          setErrors({});
        } catch (error) {
          console.error('Error loading service data:', error);
          alert('Không thể tải dữ liệu dịch vụ. Vui lòng thử lại.');
        }
      }
    };

    loadServiceData();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarActive) {
        setSidebarActive(false);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('createServiceForm').dispatchEvent(new Event('submit'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarActive]);

  return (
    <div className="create-tour-page">
      {/* Sidebar Navigation */}
      <aside 
        className={`sidebar ${sidebarActive ? 'active' : ''}`} 
        role="navigation" 
        aria-label="Menu chính"
      >
        <nav>
          <ul>
            {userInfo && (userInfo.RoleId === 2 || userInfo.roleId === 2) ? (
              <>
                <li><a href="/" className="sidebar-select" aria-label="Trang chủ"><span>🏠</span> Trang chủ</a></li>
                <li><a href="/service-manager" className="sidebar-select" aria-label="Quản lý dịch vụ"><span>⚙️</span> Quản lý dịch vụ</a></li>
                <li><a href="/service-combo-manager" className="sidebar-select" aria-label="Quản lý combo dịch vụ"><span>📦</span> Quản lý combo dịch vụ</a></li>
                <li><a href="/social-media" className="sidebar-select" aria-label="Mạng xã hội"><span>📱</span> Mạng xã hội</a></li>
                <li><a href="#" className="sidebar-select" aria-label="Hỗ trợ"><span>👤</span> Hỗ trợ</a></li>
                <li><a href="#" className="sidebar-select" aria-label="Chat"><span>💬</span> Chat</a></li>
                <li className="sidebar-logout"><a href="#" className="sidebar-select sidebar-logout-link" aria-label="Đăng xuất" onClick={(e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('userInfo'); window.location.href = '/login'; }}><span>🔌</span> Đăng xuất</a></li>
              </>
            ) : (
              <>
                <li><a href="#" className="sidebar-select" aria-label="Thông tin cá nhân">Thông tin cá nhân</a></li>
                <li><a href="/service-combo-manager" className="sidebar-select" aria-label="Quản lý combo dịch vụ">Quản lý combo dịch vụ</a></li>
                <li><a href="/social-media" className="sidebar-select" aria-label="Mạng xã hội">Mạng xã hội</a></li>
                <li><a href="#" className="sidebar-select" aria-label="Hỗ trợ">Hỗ trợ</a></li>
                <li><a href="#" className="sidebar-select" aria-label="Chat">Chat</a></li>
                <li className="sidebar-logout"><a href="#" className="sidebar-select sidebar-logout-link" aria-label="Đăng xuất">Đăng xuất</a></li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      {/* Header */}
      <Header 
        showMenuButton={true}
        onMenuToggle={toggleSidebar}
        sidebarActive={sidebarActive}
      />

      {/* Page Title */}
      <section className="content-title-display-box">
        <div className="content-title-display-name">
          <h2>Chỉnh sửa dịch vụ</h2>
        </div>
      </section>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="disclaimer-text">
            (<span className="required-indicator">*</span>) bắt buộc
          </div>
          
          <form id="createServiceForm" onSubmit={handleSubmit} noValidate>
            {/* Service Name Field */}
            <div className="field">
              <label htmlFor="name">
                Nhập tên dịch vụ (Service Name)
                <span className="required-indicator">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                maxLength="255"
                required
                placeholder="Tên dịch vụ..."
                value={formData.name}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>


            {/* Description Field */}
            <div className="field">
              <label htmlFor="description">Mô tả về dịch vụ (Service Description)</label>
              <textarea
                id="description"
                name="description"
                maxLength="5000"
                placeholder="Mô tả ngắn về dịch vụ (tối đa 5000 ký tự)"
                value={formData.description}
                onChange={handleInputChange}
                aria-describedby="description-hint"
                rows="4"
              />
              <div id="description-hint" className="hint">
                Còn lại: <span>{config.maxDescriptionLength - formData.description.length}</span> ký tự
              </div>
            </div>

            {/* Price Field */}
            <div className="field">
              <label htmlFor="price">
                Giá (Price)
                <span className="required-indicator">*</span>
              </label>
              <input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="0.00"
                value={formData.price}
                onChange={handleInputChange}
                inputMode="decimal"
              />
            </div>

            {/* Form Actions */}
            <div className="form-action">
              <button type="submit" className="primary" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Cập nhật dịch vụ'}
              </button>
              <button type="button" className="secondary" onClick={handleGoBack}>
                Quay lại
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay" aria-hidden="false">
          <div className="loading-spinner" role="status">
            <span className="sr-only">Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditService;
