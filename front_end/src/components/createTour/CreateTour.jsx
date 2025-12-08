import React, { useState, useEffect, useCallback } from 'react';

const CreateTour = () => {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    capacity: '',
    availableSlot: '',
    startDate: '',
    endDate: '',
    image: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);

  // Configuration
  const config = {
    maxDescriptionLength: 5000,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  };

  // Utility functions
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
      case 'address':
        return !value || value.trim() === '' ? `${name === 'name' ? 'Tên tour' : 'Địa chỉ'} không được để trống` : '';
      
      case 'price':
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) return 'Giá phải là số >= 0';
        return '';
      
      case 'capacity':
        const capacity = parseInt(value, 10);
        if (isNaN(capacity) || capacity < 1) return 'Sức chứa phải là số nguyên >= 1';
        return '';
      
      case 'availableSlot':
        const available = parseInt(value, 10);
        if (isNaN(available) || available < 0) return 'Số chỗ còn phải là số nguyên >= 0';
        if (formData.capacity && available > parseInt(formData.capacity, 10)) {
          return 'Số chỗ còn không thể lớn hơn sức chứa';
        }
        return '';
      
      case 'startDate':
      case 'endDate':
        if (!value) return `${name === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} không được để trống`;
        if (name === 'endDate' && formData.startDate && value < formData.startDate) {
          return 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
        }
        return '';
      
      case 'image':
        if (!value) return '';
        if (!config.allowedImageTypes.includes(value.type)) {
          return 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)';
        }
        if (value.size > config.maxImageSize) {
          return 'Kích thước file không được vượt quá 5MB';
        }
        return '';
      
      default:
        return '';
    }
  }, [formData.capacity, formData.startDate]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateField('image', file);
      if (error) {
        setErrors(prev => ({ ...prev, image: error }));
        setImagePreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    
    handleInputChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Submit to server
      const response = await fetch('/create-tour', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        // Success - redirect or show success message
        alert('Tour đã được tạo thành công!');
        handleReset();
      } else {
        throw new Error('Failed to create tour');
      }
    } catch (error) {
      console.error('Error creating tour:', error);
      alert('Có lỗi xảy ra khi tạo tour. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      capacity: '',
      availableSlot: '',
      startDate: '',
      endDate: '',
      image: null
    });
    setErrors({});
    setImagePreview(null);
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || today
    }));
  }, []);

  // Update end date minimum when start date changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setFormData(prev => ({
        ...prev,
        endDate: formData.startDate
      }));
    }
  }, [formData.startDate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarActive) {
        setSidebarActive(false);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('createTourForm').dispatchEvent(new Event('submit'));
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
          <img src="/src/img/logo.png" alt="Logo ESMS" width="100" height="auto" loading="lazy" />
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
          <h2>Tạo tour mới</h2>
        </div>
      </section>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="disclaimer-text">
            (<span className="required-indicator">*</span>) bắt buộc
          </div>
          
          <form id="createTourForm" onSubmit={handleSubmit} noValidate>
            {/* Tour Name Field */}
            <div className="field">
              <label htmlFor="name">
                Nhập tên tour (Tour Name)
                <span className="required-indicator">*</span>
              </label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                maxLength="255" 
                required 
                placeholder="Tên tour..."
                value={formData.name}
                onChange={handleInputChange}
                aria-describedby="err-name"
                autoComplete="off"
              />
              <div id="err-name" className="error" aria-live="polite" role="alert">
                {errors.name}
              </div>
            </div>

            {/* Address Field */}
            <div className="field">
              <label htmlFor="address">
                Nhập địa chỉ (Address)
                <span className="required-indicator">*</span>
              </label>
              <input 
                id="address" 
                name="address" 
                type="text" 
                maxLength="255" 
                required 
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                value={formData.address}
                onChange={handleInputChange}
                aria-describedby="err-address"
                autoComplete="address-line1"
              />
              <div id="err-address" className="error" role="alert">
                {errors.address}
              </div>
            </div>

            {/* Description Field */}
            <div className="field">
              <label htmlFor="description">Mô tả về tour (Tour Description)</label>
              <textarea 
                id="description" 
                name="description" 
                maxLength="5000" 
                placeholder="Mô tả ngắn về tour (tối đa 5000 ký tự)"
                value={formData.description}
                onChange={handleInputChange}
                aria-describedby="err-description description-hint"
                rows="4"
              />
              <div id="description-hint" className="hint">
                Còn lại: <span>{config.maxDescriptionLength - formData.description.length}</span> ký tự
              </div>
              <div id="err-description" className="error" role="alert">
                {errors.description}
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
                aria-describedby="err-price"
                inputMode="decimal"
              />
              <div id="err-price" className="error" role="alert">
                {errors.price}
              </div>
            </div>

            {/* Small Fields Grid */}
            <div className="small-field">
              {/* Capacity Field */}
              <div className="field-group">
                <label htmlFor="capacity">
                  Sức chứa (Capacity)
                  <span className="required-indicator">*</span>
                </label>
                <input 
                  id="capacity" 
                  name="capacity" 
                  type="number" 
                  min="1" 
                  step="1" 
                  required 
                  placeholder="Ví dụ: 20"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  aria-describedby="err-capacity"
                  inputMode="numeric"
                />
                <div id="err-capacity" className="error" role="alert">
                  {errors.capacity}
                </div>
              </div>

              {/* Available Slots Field */}
              <div className="field-group">
                <label htmlFor="availableSlot">
                  Số chỗ còn (Available slots)
                  <span className="required-indicator">*</span>
                </label>
                <input 
                  id="availableSlot" 
                  name="availableSlot" 
                  type="number" 
                  min="0" 
                  step="1" 
                  required 
                  placeholder="Ví dụ: 15"
                  value={formData.availableSlot}
                  onChange={handleInputChange}
                  aria-describedby="err-availableSlot"
                  inputMode="numeric"
                />
                <div id="err-availableSlot" className="error" role="alert">
                  {errors.availableSlot}
                </div>
              </div>

              {/* Start Date Field */}
              <div className="field-group">
                <label htmlFor="startDate">
                  Ngày bắt đầu (Start date)
                  <span className="required-indicator">*</span>
                </label>
                <input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  aria-describedby="err-startDate"
                />
                <div id="err-startDate" className="error" role="alert">
                  {errors.startDate}
                </div>
              </div>

              {/* End Date Field */}
              <div className="field-group">
                <label htmlFor="endDate">
                  Ngày kết thúc (End date)
                  <span className="required-indicator">*</span>
                </label>
                <input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  required
                  min={formData.startDate}
                  value={formData.endDate}
                  onChange={handleInputChange}
                  aria-describedby="err-endDate"
                />
                <div id="err-endDate" className="error" role="alert">
                  {errors.endDate}
                </div>
              </div>
            </div>

            {/* Image Upload Field */}
            <div className="field">
              <label htmlFor="image">Ảnh đại diện (IMAGE)</label>
              <input 
                id="image" 
                name="image" 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                aria-describedby="err-image image-hint"
              />
              <div id="image-hint" className="hint">
                Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)
              </div>
              {imagePreview && (
                <img 
                  src={imagePreview}
                  className="img-preview" 
                  alt="Xem trước ảnh"
                  loading="lazy"
                />
              )}
              <div id="err-image" className="error" role="alert">
                {errors.image}
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-action">
              <button type="submit" className="primary" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Tạo tour'}
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

export default CreateTour;
