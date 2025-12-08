import React, { useState, useCallback } from 'react';
import './CreateCoupon.css';

const CreateCoupon = () => {
  // State management
  const [formData, setFormData] = useState({
    couponCode: '',
    discountPercentage: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(false);

  // Configuration
  const config = {
    maxCouponLength: 50,
    minCouponLength: 3,
    maxDiscountPercentage: 70
  };

  // Utility functions
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'couponCode':
        if (!value || value.trim() === '') {
          return 'Mã coupon không được để trống';
        }
        if (value.trim().length < config.minCouponLength) {
          return `Mã coupon phải có ít nhất ${config.minCouponLength} ký tự`;
        }
        if (value.trim().length > config.maxCouponLength) {
          return `Mã coupon không được vượt quá ${config.maxCouponLength} ký tự`;
        }
        // Check for valid coupon format (alphanumeric and some special chars)
        const couponRegex = /^[A-Za-z0-9\-_]+$/;
        if (!couponRegex.test(value.trim())) {
          return 'Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới';
        }
        return '';
      
      case 'discountPercentage':
        const num = parseInt(value, 10);
        if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
          return 'Phần trăm giảm giá phải là số nguyên';
        }
        if (num < 0) {
          return 'Phần trăm giảm giá không thể âm';
        }
        if (num > config.maxDiscountPercentage) {
          return `Phần trăm giảm giá tối đa là ${config.maxDiscountPercentage}%`;
        }
        return '';

      default:
        return '';
    }
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    // Validate form
    const newErrors = {};
    const couponError = validateField('couponCode', formData.couponCode);
    if (couponError) {
      newErrors.couponCode = couponError;
    }

    const discountPercentageError = validateField('discountPercentage', formData.discountPercentage);
    if (discountPercentageError) {
      newErrors.discountPercentage = discountPercentageError;
    }

    setErrors(newErrors);

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstErrorField = document.querySelector('.error:not(:empty)')?.previousElementSibling;
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically make an API call to create the coupon
      console.log('Creating coupon:', {
        couponCode: formData.couponCode,
        discountType: 'percentage',
        discountValue: parseInt(formData.discountPercentage, 10)
      });
      
      // Show success message
      alert(`Coupon "${formData.couponCode}" đã được tạo thành công!`);
      
      // Reset form
      setFormData({ couponCode: '' });
      setErrors({});
      
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Có lỗi xảy ra khi tạo coupon. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại form? Tất cả dữ liệu sẽ bị xóa.')) {
      setFormData({ couponCode: '', discountPercentage: '' });
      setErrors({});
      
      // Focus first field
      const firstInput = document.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  return (
    <div className="create-coupon-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`} role="navigation" aria-label="Menu chính">
        <nav>
          <ul>
            <li>
              <a href="#" className="sidebar-select" aria-label="Thông tin cá nhân">
                Thông tin cá nhân
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Cài đặt">
                Cài đặt
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Trợ lý ảo">
                Trợ lý ảo
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Chatbot">
                Chatbot
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Đăng xuất">
                Đăng xuất
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Header */}
      <header className="header" role="banner">
        <button 
          className="menu-button" 
          onClick={toggleSidebar} 
          aria-label="Mở/đóng menu" 
          aria-expanded={sidebarActive}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="header-logo">
          <img src="../img/logo.png" alt="Logo ESMS" width="100" height="auto" loading="lazy" />
          <h1>ESMS</h1>
        </div>
        <nav className="header-menu" role="navigation" aria-label="Menu điều hướng chính">
          <a href="#" className="header-menu-select">Trang chủ</a>
          <a href="#" className="header-menu-select">Giới thiệu</a>
          <a href="#" className="header-menu-select">Tour phổ biến</a>
          <a href="#" className="header-menu-select">Liên lạc</a>
        </nav>
        <div className="header-menu-user">
          <img src="#" alt="Ảnh đại diện User" width="32" height="32" loading="lazy" />
          <p>Welcome, NamHLP1!</p>
        </div>
      </header>

      {/* Page Title */}
      <section className={`content-title-display-box ${sidebarActive ? 'shift' : ''}`}>
        <div className="content-title-display-name">
          <h2>Tạo coupon mới</h2>
        </div>
      </section>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="disclaimer-text">
            (<span className="required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Coupon Code Field */}
            <div className="field">
              <label htmlFor="couponCode">
                Nhập mã coupon (Coupon Code)
                <span className="required-indicator">*</span>
              </label>
              <input 
                id="couponCode" 
                name="couponCode" 
                type="text" 
                maxLength={config.maxCouponLength}
                required 
                placeholder="Ví dụ: SUMMER2024, WELCOME10, DISCOUNT50"
                aria-describedby="err-couponCode couponCode-hint"
                autoComplete="off"
                value={formData.couponCode}
                onChange={handleInputChange}
                className={errors.couponCode ? 'error' : ''}
              />
              <div id="couponCode-hint" className="hint">
                Mã coupon có thể chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_)
              </div>
              <div id="err-couponCode" className="error" aria-live="polite" role="alert">
                {errors.couponCode}
              </div>
            </div>

            {/* Discount Percentage Field */}
            <div className="field">
              <label htmlFor="discountPercentage">
                Phần trăm giảm giá (Discount %)
                <span className="required-indicator">*</span>
              </label>
              <input 
                id="discountPercentage" 
                name="discountPercentage" 
                type="number" 
                min="0" 
                max={config.maxDiscountPercentage}
                step="1"
                required 
                placeholder="Ví dụ: 10, 25, 50"
                aria-describedby="err-discountPercentage discountPercentage-hint"
                value={formData.discountPercentage}
                onChange={handleInputChange}
                className={errors.discountPercentage ? 'error' : ''}
              />
              <div id="discountPercentage-hint" className="hint">
                Giảm giá tối đa {config.maxDiscountPercentage}%.
              </div>
              <div id="err-discountPercentage" className="error" aria-live="polite" role="alert">
                {errors.discountPercentage}
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-action">
              <button type="submit" className="primary" disabled={isLoading}>
                {isLoading ? 'Đang tạo...' : 'Tạo coupon'}
              </button>
              <button type="button" className="secondary" onClick={handleReset}>
                Đặt lại
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

export default CreateCoupon;

