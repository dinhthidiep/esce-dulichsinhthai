import './EditCoupon.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getCouponById, updateCoupon } from '../API/CouponApi';
import Header from './Header';
import { getCurrentUser } from '../API/SocialMediaApi';

const EditCoupon = () => {
  // State management - matching database schema
  const [formData, setFormData] = useState({
    id: '',
    code: '',                    // CODE NVARCHAR(50) UNIQUE NOT NULL
    description: '',             // DESCRIPTION NVARCHAR(255)
    discountType: 'percentage',  // DISCOUNT_PERCENT or DISCOUNT_AMOUNT
    discountValue: '',          // DISCOUNT_PERCENT DECIMAL(5,2) or DISCOUNT_AMOUNT DECIMAL(18,2)
    usageLimit: '',             // USAGE_LIMIT INT NOT NULL
    isActive: true              // IS_ACTIVE BIT DEFAULT 1
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

  // Get couponId and comboId from URL
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const couponId = urlParams.get('id');
  const comboId = urlParams.get('comboId');

  // Configuration matching database constraints
  const config = {
    maxCodeLength: 50,           // CODE NVARCHAR(50)
    maxDescriptionLength: 255,   // DESCRIPTION NVARCHAR(255)
    maxDiscountPercent: 100,      // DISCOUNT_PERCENT DECIMAL(5,2) - max 100%
    minUsageLimit: 1             // USAGE_LIMIT INT NOT NULL - minimum 1
  };

  // Validation matching database schema
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'code':
        if (!value || value.trim() === '') {
          return 'Mã coupon không được để trống';
        }
        // Check for spaces
        if (value.includes(' ')) {
          return 'Mã giảm giá không được có dấu cách.';
        }
        if (value.trim().length > config.maxCodeLength) {
          return `Mã coupon không được vượt quá ${config.maxCodeLength} ký tự`;
        }
        // Allow alphanumeric, dash, underscore for coupon codes
        const couponRegex = /^[A-Za-z0-9\-_]+$/;
        if (!couponRegex.test(value.trim())) {
          return 'Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới';
        }
        return '';

      case 'description':
        if (value && value.length > config.maxDescriptionLength) {
          return `Mô tả không được vượt quá ${config.maxDescriptionLength} ký tự`;
        }
        return '';

      case 'discountValue':
        if (!value || value.trim() === '') {
          return formData.discountType === 'percentage' 
            ? 'Phần trăm giảm giá không được để trống'
            : 'Số tiền giảm giá không được để trống';
        }
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Giá trị phải là số dương';
        }
        if (formData.discountType === 'percentage' && num > config.maxDiscountPercent) {
          return `Phần trăm không được vượt quá ${config.maxDiscountPercent}%`;
        }
        return '';

      case 'usageLimit':
        if (!value || value.trim() === '') {
          return 'Giới hạn sử dụng không được để trống';
        }
        const limit = parseInt(value);
        if (isNaN(limit) || limit < config.minUsageLimit) {
          return `Giới hạn sử dụng phải là số nguyên >= ${config.minUsageLimit}`;
        }
        return '';

      default:
        return '';
    }
  }, [formData.discountType]);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let fieldValue;
    
    if (type === 'radio') {
      fieldValue = value;
    } else if (type === 'select-one') {
      // For dropdown, convert string to boolean for isActive
      if (name === 'isActive') {
        fieldValue = value === 'true';
      } else {
        fieldValue = value;
      }
    } else {
      fieldValue = value;
    }
    
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
    setIsLoading(true);

    // Check required fields first
    const requiredFields = {
      code: formData.code,
      discountValue: formData.discountValue,
      usageLimit: formData.usageLimit
    };
    
    const emptyRequiredFields = Object.entries(requiredFields).filter(([key, value]) => {
      if (key === 'discountValue') {
        if (value === null || value === undefined) return true;
        const discountValue = typeof value === 'string' ? value.trim() : String(value);
        if (discountValue === '') return true;
        const discountNum = parseFloat(discountValue);
        return isNaN(discountNum) || discountNum <= 0;
      }
      if (key === 'usageLimit') {
        if (value === null || value === undefined) return true;
        const limitValue = typeof value === 'string' ? value.trim() : String(value);
        if (limitValue === '') return true;
        const limitNum = parseInt(limitValue);
        return isNaN(limitNum) || limitNum < 1;
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

    // Check for spaces in coupon code
    if (formData.code && formData.code.includes(' ')) {
      alert('Mã giảm giá không được có dấu cách.');
      setIsLoading(false);
      return;
    }

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'discountType' && key !== 'isActive' && key !== 'id') {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    // Validate couponId
    if (!couponId) {
      newErrors.couponId = 'Coupon ID không được tìm thấy. Vui lòng truy cập từ trang quản lý coupon.';
    }

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
      // Prepare coupon data according to database schema
      // Schema: CODE, DESCRIPTION, DISCOUNT_PERCENT, DISCOUNT_AMOUNT, USAGE_LIMIT, SERVICECOMBO_ID, IS_ACTIVE
      // HOST_ID, CREATED_AT, UPDATED_AT, USAGE_COUNT are set by backend
      const couponData = {
        Code: formData.code.trim(),
        Description: formData.description.trim() || null,
        DiscountPercent: formData.discountType === 'percentage' ? parseFloat(formData.discountValue) : null,
        DiscountAmount: formData.discountType === 'amount' ? parseFloat(formData.discountValue) : null,
        UsageLimit: parseInt(formData.usageLimit),
        ServiceComboId: parseInt(comboId || formData.serviceComboId || '0'),
        IsActive: formData.isActive
      };

      // Submit to backend API
      const result = await updateCoupon(couponId, couponData);
      if (result?.id || result?.Id) {
        alert('Coupon đã được cập nhật thành công!');
        // Redirect back to coupon manager with comboId
        window.location.href = `/coupon-manager?comboId=${comboId || formData.serviceComboId || ''}`;
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật coupon. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const comboId = urlParams.get('comboId');
    // Also check formData.serviceComboId as fallback
    const finalComboId = comboId || formData.serviceComboId;
    if (finalComboId) {
      window.location.href = `/coupon-manager?comboId=${finalComboId}`;
    } else {
      window.location.href = '/coupon-manager';
    }
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  // Load coupon data on component mount
  useEffect(() => {
    const loadCouponData = async () => {
      if (couponId) {
        try {
          const couponData = await getCouponById(couponId);
          console.log('Coupon data loaded:', couponData);
          setFormData({
            id: couponData.Id || couponData.id,
            code: couponData.Code || couponData.code || '',
            description: couponData.Description || couponData.description || '',
            discountType: (couponData.DiscountPercent || couponData.discountPercent) !== null && (couponData.DiscountPercent || couponData.discountPercent) !== undefined ? 'percentage' : 'amount',
            discountValue: (couponData.DiscountPercent || couponData.discountPercent) !== null && (couponData.DiscountPercent || couponData.discountPercent) !== undefined 
              ? String(couponData.DiscountPercent || couponData.discountPercent || '')
              : String(couponData.DiscountAmount || couponData.discountAmount || ''),
            usageLimit: String(couponData.UsageLimit || couponData.usageLimit || ''),
            isActive: couponData.IsActive !== undefined ? couponData.IsActive : (couponData.isActive !== undefined ? couponData.isActive : true),
            serviceComboId: couponData.ServiceComboId || couponData.serviceComboId
          });
          setErrors({});
        } catch (error) {
          console.error('Error loading coupon data:', error);
          alert('Không thể tải dữ liệu coupon. Vui lòng thử lại.');
        }
      } else {
        setErrors(prev => ({
          ...prev,
          couponId: 'Coupon ID không được tìm thấy. Vui lòng truy cập từ trang quản lý coupon.'
        }));
      }
    };

    loadCouponData();
  }, [couponId]);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarActive) {
        setSidebarActive(false);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('editCouponForm').dispatchEvent(new Event('submit'));
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
          <h2>Chỉnh sửa coupon</h2>
        </div>
      </section>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="disclaimer-text">
            (<span className="required-indicator">*</span>) bắt buộc
          </div>

          <form id="editCouponForm" onSubmit={handleSubmit} noValidate>
            {/* CODE Field - CODE NVARCHAR(50) UNIQUE NOT NULL */}
            <div className="field">
              <label htmlFor="code">
                Nhập mã coupon (CODE)
                <span className="required-indicator">*</span>
              </label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={config.maxCodeLength}
                required
                placeholder="Ví dụ: SUMMER2024, WELCOME10, DISCOUNT50"
                value={formData.code}
                onChange={handleInputChange}
                aria-describedby="code-hint"
                autoComplete="off"
              />
              <div id="code-hint" className="hint">
                Mã coupon có thể chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_). Tối đa {config.maxCodeLength} ký tự.
              </div>
            </div>

            {/* DESCRIPTION Field - DESCRIPTION NVARCHAR(255) */}
            <div className="field">
              <label htmlFor="description">Mô tả về coupon (DESCRIPTION)</label>
              <textarea
                id="description"
                name="description"
                maxLength={config.maxDescriptionLength}
                placeholder="Mô tả về coupon (tối đa 255 ký tự)"
                value={formData.description}
                onChange={handleInputChange}
                aria-describedby="description-hint"
                rows="3"
              />
              <div id="description-hint" className="hint">
                Còn lại: <span>{config.maxDescriptionLength - formData.description.length}</span> ký tự
              </div>
            </div>

            {/* Discount Type Selection */}
            <div className="field">
              <label>Loại giảm giá (Discount Type)</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="percentage"
                    checked={formData.discountType === 'percentage'}
                    onChange={handleInputChange}
                  />
                  <span>Phần trăm (%) - DISCOUNT_PERCENT DECIMAL(5,2)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="amount"
                    checked={formData.discountType === 'amount'}
                    onChange={handleInputChange}
                  />
                  <span>Số tiền (VND) - DISCOUNT_AMOUNT DECIMAL(18,2)</span>
                </label>
              </div>
            </div>

            {/* Discount Value Field */}
            <div className="field">
              <label htmlFor="discountValue">
                {formData.discountType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm giá (VND)'}
                <span className="required-indicator">*</span>
              </label>
              <input
                id="discountValue"
                name="discountValue"
                type="number"
                step={formData.discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={formData.discountType === 'percentage' ? config.maxDiscountPercent : undefined}
                required
                placeholder={formData.discountType === 'percentage' ? 'Ví dụ: 10, 25, 50' : 'Ví dụ: 50000, 100000'}
                value={formData.discountValue}
                onChange={handleInputChange}
                aria-describedby="discountValue-hint"
                inputMode="decimal"
              />
              <div id="discountValue-hint" className="hint">
                {formData.discountType === 'percentage' 
                  ? `Phần trăm giảm giá tối đa ${config.maxDiscountPercent}%`
                  : 'Nhập số tiền giảm giá (VND)'}
              </div>
            </div>

            {/* USAGE_LIMIT Field - USAGE_LIMIT INT NOT NULL */}
            <div className="field">
              <label htmlFor="usageLimit">
                Giới hạn sử dụng (USAGE_LIMIT)
                <span className="required-indicator">*</span>
              </label>
              <input
                id="usageLimit"
                name="usageLimit"
                type="number"
                min={config.minUsageLimit}
                required
                placeholder="Ví dụ: 100, 500, 1000"
                value={formData.usageLimit}
                onChange={handleInputChange}
                aria-describedby="usageLimit-hint"
                inputMode="numeric"
              />
              <div id="usageLimit-hint" className="hint">
                Số lần tối đa coupon có thể được sử dụng (tối thiểu {config.minUsageLimit} lần)
              </div>
            </div>

            {/* IS_ACTIVE Field - IS_ACTIVE BIT DEFAULT 1 */}
            <div className="field">
              <label htmlFor="isActive">
                Trạng thái (IS_ACTIVE)
                <span className="required-indicator">*</span>
              </label>
              <select
                id="isActive"
                name="isActive"
                value={formData.isActive ? 'true' : 'false'}
                onChange={handleInputChange}
                aria-describedby="isActive-hint"
              >
                <option value="true">Hoạt động</option>
                <option value="false">Đã hủy</option>
              </select>
              <div id="isActive-hint" className="hint">
                Chọn trạng thái hoạt động của coupon. "Hoạt động" = true, "Đã hủy" = false.
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-action">
              <button type="submit" className="primary" disabled={isLoading || !couponId}>
                {isLoading ? 'Đang xử lý...' : 'Cập nhật coupon'}
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

export default EditCoupon;

