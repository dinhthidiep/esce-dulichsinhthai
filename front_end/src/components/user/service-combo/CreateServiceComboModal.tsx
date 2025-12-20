import React, { useState, useRef } from 'react';
import { XIcon, ChevronDownIcon, ImageIcon } from '../icons/index';
import './CreateServiceComboModal.css';

interface CreateServiceComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    name: string;
    address: string;
    description: string;
    price: string;
    availableSlots: string;
    status: string;
    cancellationPolicy: string;
    images: File[];
  };
  errors: Record<string, string>;
  imagePreviews: string[];
  isSubmitting: boolean;
  allServices: any[];
  selectedServices: Record<string, { selected: boolean; quantity: number }>;
  servicesPage: number;
  servicesPageInput: string;
  servicesPerPage: number;
  serviceFilterName: string;
  serviceFilterPrice: string;
  isServicesTableOpen: boolean;
  allPromotions: any[];
  selectedPromotions: Record<string, { selected: boolean }>;
  promotionsPage: number;
  promotionsPageInput: string;
  promotionsPerPage: number;
  promotionFilterName: string;
  promotionFilterRank: string;
  isPromotionsTableOpen: boolean;
  allCoupons: any[];
  selectedCoupons: Record<string, { selected: boolean }>;
  couponsPage: number;
  couponsPageInput: string;
  couponsPerPage: number;
  couponFilterCode: string;
  couponFilterRank: string;
  couponFilterUserType: string;
  isCouponsTableOpen: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (index: number) => void;
  onServiceSelect: (serviceId: string, checked: boolean) => void;
  onServiceQuantityChange: (serviceId: string, quantity: string) => void;
  onPromotionSelect: (promotionId: string, selected: boolean) => void;
  onCouponSelect: (couponId: string, checked: boolean) => void;
  onServicesPageChange: (page: number) => void;
  onServicesPageInputChange: (value: string) => void;
  onServiceFilterNameChange: (value: string) => void;
  onServiceFilterPriceChange: (value: string) => void;
  onToggleServicesTable: () => void;
  onPromotionsPageChange: (page: number) => void;
  onPromotionsPageInputChange: (value: string) => void;
  onPromotionFilterNameChange: (value: string) => void;
  onPromotionFilterRankChange: (value: string) => void;
  onTogglePromotionsTable: () => void;
  onCouponsPageChange: (page: number) => void;
  onCouponsPageInputChange: (value: string) => void;
  onCouponFilterCodeChange: (value: string) => void;
  onCouponFilterRankChange: (value: string) => void;
  onCouponFilterUserTypeChange: (value: string) => void;
  onToggleCouponsTable: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CreateServiceComboModal: React.FC<CreateServiceComboModalProps> = ({
  isOpen,
  onClose,
  formData,
  errors,
  imagePreviews,
  isSubmitting,
  allServices,
  selectedServices,
  servicesPage,
  servicesPageInput,
  servicesPerPage,
  serviceFilterName,
  serviceFilterPrice,
  isServicesTableOpen,
  allPromotions,
  selectedPromotions,
  promotionsPage,
  promotionsPageInput,
  promotionsPerPage,
  promotionFilterName,
  promotionFilterRank,
  isPromotionsTableOpen,
  allCoupons,
  selectedCoupons,
  couponsPage,
  couponsPageInput,
  couponsPerPage,
  couponFilterCode,
  couponFilterRank,
  couponFilterUserType,
  isCouponsTableOpen,
  onInputChange,
  onImageChange,
  onRemoveImage,
  onServiceSelect,
  onServiceQuantityChange,
  onPromotionSelect,
  onCouponSelect,
  onServicesPageChange,
  onServicesPageInputChange,
  onServiceFilterNameChange,
  onServiceFilterPriceChange,
  onToggleServicesTable,
  onPromotionsPageChange,
  onPromotionsPageInputChange,
  onPromotionFilterNameChange,
  onPromotionFilterRankChange,
  onTogglePromotionsTable,
  onCouponsPageChange,
  onCouponsPageInputChange,
  onCouponFilterCodeChange,
  onCouponFilterRankChange,
  onCouponFilterUserTypeChange,
  onToggleCouponsTable,
  onSubmit
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      // Create a synthetic event to reuse the existing handler
      const syntheticEvent = {
        target: {
          files: files as any,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onImageChange(syntheticEvent);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  // Filter services
  let filteredServices = [...allServices];
  if (serviceFilterName.trim() !== '') {
    filteredServices = filteredServices.filter(s => 
      (s.Name || '').toLowerCase().includes(serviceFilterName.toLowerCase().trim())
    );
  }
  if (serviceFilterPrice.trim() !== '') {
    const filterPrice = parseInt(serviceFilterPrice);
    if (!isNaN(filterPrice)) {
      filteredServices = filteredServices.filter(s => 
        (s.Price || 0) <= filterPrice
      );
    }
  }
  const servicesTotalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const servicesStartIndex = (servicesPage - 1) * servicesPerPage;
  const servicesEndIndex = servicesStartIndex + servicesPerPage;
  const currentPageServices = filteredServices.slice(servicesStartIndex, servicesEndIndex);

  // Helper function to parse TargetAudience and extract Rank and UserType
  const parsePromotionInfo = (promotion: any) => {
    const name = promotion.Name || promotion.name || 'N/A';
    const targetAudienceStr = promotion.TargetAudience || promotion.targetAudience;
    
    let ranks: string[] = [];
    let userTypes: string[] = [];
    let pairedSegments: string[] = [];
    
    if (targetAudienceStr) {
      try {
        const ta = JSON.parse(targetAudienceStr);
        if (ta.forAgency) {
          userTypes.push('Công ty');
          const agencyRanks: string[] = [];
          if (ta.agencyLevels?.level1) agencyRanks.push('Đồng');
          if (ta.agencyLevels?.level2) agencyRanks.push('Bạc');
          if (ta.agencyLevels?.level3) agencyRanks.push('Vàng');
          ranks.push(...agencyRanks);
          if (agencyRanks.length > 0) pairedSegments.push(`Công ty: ${agencyRanks.join(', ')}`);
        }
        if (ta.forTourist) {
          userTypes.push('Khách hàng');
          const touristRanks: string[] = [];
          if (ta.touristLevels?.level1) touristRanks.push('Đồng');
          if (ta.touristLevels?.level2) touristRanks.push('Bạc');
          if (ta.touristLevels?.level3) touristRanks.push('Vàng');
          ranks.push(...touristRanks);
          if (touristRanks.length > 0) pairedSegments.push(`Khách hàng: ${touristRanks.join(', ')}`);
        }
      } catch (e) {
        console.error('Error parsing target audience:', e);
      }
    }
    
    const uniqueRanks = [...new Set(ranks)];
    const uniqueUserTypes = [...new Set(userTypes)];
    const pairedDisplay = pairedSegments.length > 0 ? pairedSegments.join(' | ') : 'N/A';

    return {
      name,
      ranks: uniqueRanks, // used for filtering
      userTypes: uniqueUserTypes, // used for filtering
      pairedDisplay,
      rankDisplay: uniqueRanks.length > 0 ? uniqueRanks.join(', ') : 'N/A',
      userTypeDisplay: uniqueUserTypes.length > 0 ? uniqueUserTypes.join(', ') : 'N/A'
    };
  };

  // Filter promotions
  let filteredPromotions = [...allPromotions];
  if (promotionFilterName.trim() !== '') {
    filteredPromotions = filteredPromotions.filter(p => {
      const info = parsePromotionInfo(p);
      return info.name.toLowerCase().includes(promotionFilterName.toLowerCase().trim());
    });
  }
  if (promotionFilterRank !== 'all') {
    filteredPromotions = filteredPromotions.filter(p => {
      const info = parsePromotionInfo(p);
      return info.ranks.includes(promotionFilterRank);
    });
  }
  const promotionsTotalPages = Math.ceil(filteredPromotions.length / promotionsPerPage);
  const promotionsStartIndex = (promotionsPage - 1) * promotionsPerPage;
  const promotionsEndIndex = promotionsStartIndex + promotionsPerPage;
  const currentPagePromotions = filteredPromotions.slice(promotionsStartIndex, promotionsEndIndex);

  // Filter coupons
  const parseCouponInfo = (coupon: any) => {
    const code = coupon.Code || coupon.code || 'N/A';
    const targetAudienceStr = coupon.TargetAudience || coupon.targetAudience;
    const requiredLevelRaw =
      coupon.RequiredLevel ??
      coupon.requiredLevel ??
      coupon.REQUIRED_LEVEL ??
      coupon.required_level ??
      coupon.requiredLevelId ??
      coupon.Requiredlevel;
    const requiredLevel = typeof requiredLevelRaw === 'string' ? parseInt(requiredLevelRaw, 10) : requiredLevelRaw;

    let ranks: string[] = [];
    let userTypes: string[] = [];
    let pairedSegments: string[] = [];

    if (targetAudienceStr) {
      try {
        // If TargetAudience is JSON (preferred), parse to derive userTypes (and ranks if present)
        if (typeof targetAudienceStr === 'string' && targetAudienceStr.trim().startsWith('{')) {
          const ta = JSON.parse(targetAudienceStr);
          if (ta.forAgency) {
            userTypes.push('Công ty');
            const agencyRanks: string[] = [];
            if (ta.agencyLevels?.level0) agencyRanks.push('Tất cả');
            if (ta.agencyLevels?.level1) agencyRanks.push('Đồng');
            if (ta.agencyLevels?.level2) agencyRanks.push('Bạc');
            if (ta.agencyLevels?.level3) agencyRanks.push('Vàng');
            ranks.push(...agencyRanks);
            if (agencyRanks.length > 0) pairedSegments.push(`Công ty: ${agencyRanks.join(', ')}`);
          }
          if (ta.forTourist) {
            userTypes.push('Khách hàng');
            const touristRanks: string[] = [];
            if (ta.touristLevels?.level0) touristRanks.push('Tất cả');
            if (ta.touristLevels?.level1) touristRanks.push('Đồng');
            if (ta.touristLevels?.level2) touristRanks.push('Bạc');
            if (ta.touristLevels?.level3) touristRanks.push('Vàng');
            ranks.push(...touristRanks);
            if (touristRanks.length > 0) pairedSegments.push(`Khách hàng: ${touristRanks.join(', ')}`);
          }
        } else if (typeof targetAudienceStr === 'string' && targetAudienceStr.trim() !== '' && targetAudienceStr.trim() !== 'string') {
          // If it's not JSON and not the default placeholder "string", treat it as a display value
          userTypes.push(targetAudienceStr.trim());
        }
      } catch (e) {
        console.error('Error parsing coupon target audience:', e);
      }
    }

    // Fallback: backend Coupon.TargetAudience is [NotMapped], so often missing in responses.
    // Use RequiredLevel (0..3) to derive a single "rank" label when available.
    let rankDisplayFromLevel: string | null = null;
    if (typeof requiredLevel === 'number' && !isNaN(requiredLevel)) {
      if (requiredLevel === 0) rankDisplayFromLevel = 'Tất cả';
      if (requiredLevel === 1) rankDisplayFromLevel = 'Đồng';
      if (requiredLevel === 2) rankDisplayFromLevel = 'Bạc';
      if (requiredLevel === 3) rankDisplayFromLevel = 'Vàng';
    }
    // Prefer explicit level-derived rank when ranks weren't derived from TargetAudience
    if (ranks.length === 0 && rankDisplayFromLevel) {
      ranks.push(rankDisplayFromLevel);
    }

    const pairedDisplay = pairedSegments.length > 0 ? pairedSegments.join(' | ') : (rankDisplayFromLevel || 'N/A');

    return {
      code,
      ranks: [...new Set(ranks)],
      userTypes: [...new Set(userTypes)],
      pairedDisplay,
      rankDisplay: rankDisplayFromLevel || (ranks.length > 0 ? ranks.join(', ') : 'N/A'),
      userTypeDisplay: userTypes.length > 0 ? userTypes.join(', ') : 'N/A'
    };
  };

  let filteredCoupons = [...allCoupons];
  if (couponFilterCode.trim() !== '') {
    filteredCoupons = filteredCoupons.filter((c) => {
      const info = parseCouponInfo(c);
      return info.code.toLowerCase().includes(couponFilterCode.toLowerCase().trim());
    });
  }
  if (couponFilterRank !== 'all') {
    filteredCoupons = filteredCoupons.filter((c) => {
      const info = parseCouponInfo(c);
      return info.ranks.includes(couponFilterRank);
    });
  }
  if (couponFilterUserType !== 'all') {
    filteredCoupons = filteredCoupons.filter((c) => {
      const info = parseCouponInfo(c);
      return info.userTypes.includes(couponFilterUserType);
    });
  }
  const couponsTotalPages = Math.ceil(filteredCoupons.length / couponsPerPage);
  const couponsStartIndex = (couponsPage - 1) * couponsPerPage;
  const couponsEndIndex = couponsStartIndex + couponsPerPage;
  const currentPageCoupons = filteredCoupons.slice(couponsStartIndex, couponsEndIndex);

  return (
    <div className="combo-create-create-service-combo-modal-overlay" onClick={onClose}>
      <div className="combo-create-create-service-combo-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="combo-create-create-service-combo-modal-header">
          <h2>Tạo gói dịch vụ mới</h2>
          <button className="combo-create-create-service-combo-modal-close" onClick={onClose}>
            <XIcon className="combo-create-create-service-combo-modal-close-icon" />
          </button>
        </div>
        <div className="combo-create-create-service-combo-modal-body">
          <div className="combo-create-create-service-combo-disclaimer-text">
            (<span className="combo-create-create-service-combo-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={onSubmit} noValidate>
            {/* Name Field */}
            <div className="combo-create-create-service-combo-field">
              <label htmlFor="create-service-combo-name">
                Nhập tên combo dịch vụ (Service Combo Name)
                <span className="combo-create-create-service-combo-required-indicator">*</span>
              </label>
              <input
                id="create-service-combo-name"
                name="name"
                type="text"
                maxLength={255}
                required
                placeholder="Tên combo dịch vụ..."
                value={formData.name}
                onChange={onInputChange}
                autoComplete="off"
              />
              {errors.name && <div className="combo-create-create-service-combo-error">{errors.name}</div>}
            </div>

            {/* Address Field */}
            <div className="combo-create-create-service-combo-field">
              <label htmlFor="create-service-combo-address">
                Địa chỉ (Address)
                <span className="combo-create-create-service-combo-required-indicator">*</span>
              </label>
              <input
                id="create-service-combo-address"
                name="address"
                type="text"
                maxLength={255}
                required
                placeholder="Địa chỉ combo dịch vụ..."
                value={formData.address}
                onChange={onInputChange}
                autoComplete="off"
              />
              {errors.address && <div className="combo-create-create-service-combo-error">{errors.address}</div>}
            </div>

            {/* Description Field */}
            <div className="combo-create-create-service-combo-field">
              <label htmlFor="create-service-combo-description">Mô tả về combo dịch vụ (Service Combo Description)</label>
              <textarea
                id="create-service-combo-description"
                name="description"
                maxLength={1000}
                placeholder="Mô tả ngắn về combo dịch vụ (tối đa 1000 ký tự)"
                value={formData.description}
                onChange={onInputChange}
                rows={4}
              />
              <div className="combo-create-create-service-combo-hint">
                Còn lại: <span>{1000 - formData.description.length}</span> ký tự
              </div>
            </div>

            {/* Price and Available Slots Fields */}
            <div className="combo-create-create-service-combo-field-row">
              <div className="combo-create-create-service-combo-field">
                <label htmlFor="create-service-combo-price">
                  Giá (Price)
                  <span className="combo-create-create-service-combo-required-indicator">*</span>
                </label>
                <input
                  id="create-service-combo-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={onInputChange}
                  inputMode="decimal"
                />
                {errors.price && <div className="combo-create-create-service-combo-error">{errors.price}</div>}
              </div>

              <div className="combo-create-create-service-combo-field">
                <label htmlFor="create-service-combo-availableSlots">
                  Số chỗ trống (Available Slots)
                  <span className="combo-create-create-service-combo-required-indicator">*</span>
                </label>
                <input
                  id="create-service-combo-availableSlots"
                  name="availableSlots"
                  type="number"
                  min={1}
                  required
                  placeholder="1"
                  value={formData.availableSlots}
                  onChange={onInputChange}
                  inputMode="numeric"
                />
                {errors.availableSlots && <div className="combo-create-create-service-combo-error">{errors.availableSlots}</div>}
              </div>
            </div>

            {/* Cancellation Policy Field */}
            <div className="combo-create-create-service-combo-field">
              <label htmlFor="create-service-combo-cancellationPolicy">Chính sách hủy (Cancellation Policy)</label>
              <textarea
                id="create-service-combo-cancellationPolicy"
                name="cancellationPolicy"
                maxLength={1000}
                placeholder="Chính sách hủy combo dịch vụ (tối đa 1000 ký tự)"
                value={formData.cancellationPolicy}
                onChange={onInputChange}
                rows={3}
              />
              <div className="combo-create-create-service-combo-hint">
                Còn lại: <span>{1000 - formData.cancellationPolicy.length}</span> ký tự
              </div>
            </div>

            {/* Image Upload Field - Forum Style */}
            <div className="combo-create-create-service-combo-field">
              <label className="combo-create-create-service-combo-label">
                Hình ảnh (tối đa 10 ảnh, mỗi ảnh tối đa 5MB)
              </label>
              
              {/* Drag & Drop Area */}
              <div
                className={`combo-create-upload-area ${isDragging ? 'combo-create-dragging' : ''} ${errors.images ? 'combo-create-error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="create-service-combo-image"
                  name="images"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={onImageChange}
                  onClick={(e) => e.stopPropagation()}
                  className="combo-create-file-input"
                />
                <div className="combo-create-upload-content">
                  <ImageIcon className="combo-create-upload-icon" />
                  <p className="combo-create-upload-text">
                    Kéo thả ảnh vào đây hoặc <span className="combo-create-upload-link">chọn từ máy tính</span>
                  </p>
                  <p className="combo-create-upload-hint">
                    Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 5MB/ảnh). Đã chọn: {imagePreviews.length}/10
                  </p>
                </div>
              </div>

              {errors.images && (
                <span className="combo-create-form-error-text">{errors.images}</span>
              )}

              {/* Image Preview Grid */}
              {imagePreviews.length > 0 && (
                <div className="combo-create-image-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="combo-create-image-preview-item">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="combo-create-image-preview"
                      />
                      {onRemoveImage && (
                        <button
                          type="button"
                          className="combo-create-image-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(index);
                          }}
                          aria-label="Xóa ảnh"
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services Section */}
            <div className="combo-create-create-service-combo-field">
              <div className="combo-create-create-service-combo-section-header">
                <label>Dịch vụ tính phí</label>
                <button
                  type="button"
                  onClick={onToggleServicesTable}
                  className="combo-create-create-service-combo-toggle-btn"
                >
                  <ChevronDownIcon 
                    className="combo-create-create-service-combo-chevron-icon"
                    style={{ 
                      transform: isServicesTableOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </button>
              </div>
              
              {isServicesTableOpen && (
                <div className="combo-create-create-service-combo-table-container">
                  {/* Filters */}
                  <div className="combo-create-create-service-combo-table-filters">
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Tên dịch vụ:</label>
                      <input
                        type="text"
                        value={serviceFilterName}
                        onChange={(e) => {
                          onServiceFilterNameChange(e.target.value);
                          onServicesPageChange(1);
                        }}
                        placeholder="Nhập tên dịch vụ..."
                        className="combo-create-create-service-combo-filter-input"
                      />
                    </div>
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Giá (VND):</label>
                      <input
                        type="text"
                        value={serviceFilterPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            onServiceFilterPriceChange(value);
                            onServicesPageChange(1);
                          }
                        }}
                        placeholder="Nhập giá..."
                        className="combo-create-create-service-combo-filter-input"
                      />
                    </div>
                  </div>
                  
                  <div className="combo-create-create-service-combo-table-wrapper">
                    <table className="combo-create-create-service-combo-table">
                      <thead>
                        <tr>
                          <th>Tên</th>
                          <th>Mô tả</th>
                          <th>Giá</th>
                          <th>Số lượng</th>
                          <th>Chọn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="combo-create-create-service-combo-empty-cell">
                              Không có dịch vụ nào
                            </td>
                          </tr>
                        ) : (
                          currentPageServices.map(service => {
                            const serviceId = String(service.Id || service.id);
                            const isSelected = selectedServices[serviceId]?.selected || false;
                            const quantity = selectedServices[serviceId]?.quantity || 0;
                            return (
                              <tr key={serviceId}>
                                <td>{service.Name || service.name || 'N/A'}</td>
                                <td>{service.Description || service.description || 'N/A'}</td>
                                <td>{(service.Price || service.price || 0).toLocaleString('vi-VN')} VND</td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={quantity}
                                    onChange={(e) => onServiceQuantityChange(serviceId, e.target.value)}
                                    disabled={!isSelected}
                                    className="combo-create-create-service-combo-quantity-input"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => onServiceSelect(serviceId, e.target.checked)}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {servicesTotalPages > 0 && (
                    <div className="combo-create-create-service-combo-pagination">
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.max(1, servicesPage - 1);
                          onServicesPageChange(newPage);
                          onServicesPageInputChange('');
                        }}
                        disabled={servicesPage === 1}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        <span>←</span> Trước
                      </button>
                      
                      <div className="combo-create-create-service-combo-pagination-numbers">
                        {Array.from({ length: servicesTotalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              onServicesPageChange(page);
                              onServicesPageInputChange('');
                            }}
                            className={`combo-create-create-service-combo-pagination-number ${servicesPage === page ? 'combo-create-active' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <div className="combo-create-create-service-combo-pagination-jump">
                        <span>Đến trang:</span>
                        <input
                          type="text"
                          value={servicesPageInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              onServicesPageInputChange(value);
                              const pageNum = parseInt(value);
                              if (value !== '' && pageNum >= 1 && pageNum <= servicesTotalPages) {
                                onServicesPageChange(pageNum);
                                onServicesPageInputChange('');
                              }
                            }
                          }}
                          placeholder={servicesPage.toString()}
                          className="combo-create-create-service-combo-pagination-input"
                          inputMode="numeric"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.min(servicesTotalPages, servicesPage + 1);
                          onServicesPageChange(newPage);
                          onServicesPageInputChange('');
                        }}
                        disabled={servicesPage === servicesTotalPages}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        Sau <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Promotions Section */}
            <div className="combo-create-create-service-combo-field">
              <div className="combo-create-create-service-combo-section-header">
                <label>Ưu đãi</label>
                <button
                  type="button"
                  onClick={onTogglePromotionsTable}
                  className="combo-create-create-service-combo-toggle-btn"
                >
                  <ChevronDownIcon 
                    className="combo-create-create-service-combo-chevron-icon"
                    style={{ 
                      transform: isPromotionsTableOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </button>
              </div>
              
              {isPromotionsTableOpen && (
                <div className="combo-create-create-service-combo-table-container">
                  {/* Filters */}
                  <div className="combo-create-create-service-combo-table-filters">
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Tên ưu đãi:</label>
                      <input
                        type="text"
                        value={promotionFilterName}
                        onChange={(e) => {
                          onPromotionFilterNameChange(e.target.value);
                          onPromotionsPageChange(1);
                        }}
                        placeholder="Nhập tên ưu đãi..."
                        className="combo-create-create-service-combo-filter-input"
                      />
                    </div>
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Hạng:</label>
                      <select
                        value={promotionFilterRank}
                        onChange={(e) => {
                          onPromotionFilterRankChange(e.target.value);
                          onPromotionsPageChange(1);
                        }}
                        className="combo-create-create-service-combo-filter-select"
                      >
                        <option value="all">Tất cả</option>
                        <option value="Đồng">Đồng</option>
                        <option value="Bạc">Bạc</option>
                        <option value="Vàng">Vàng</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="combo-create-create-service-combo-table-wrapper">
                    <table className="combo-create-create-service-combo-table">
                      <thead>
                        <tr>
                          <th>Tên ưu đãi</th>
                          <th>Cho người dùng</th>
                          <th>Chọn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPromotions.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="combo-create-create-service-combo-empty-cell">
                              Không có ưu đãi nào
                            </td>
                          </tr>
                        ) : (
                          currentPagePromotions.map(promotion => {
                            const promotionId = String(promotion.Id || promotion.id);
                            const isSelected = selectedPromotions[promotionId]?.selected || false;
                            const info = parsePromotionInfo(promotion);
                            return (
                              <tr key={promotionId}>
                                <td>{info.name}</td>
                                <td>{info.pairedDisplay}</td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => onPromotionSelect(promotionId, e.target.checked)}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {promotionsTotalPages > 0 && (
                    <div className="combo-create-create-service-combo-pagination">
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.max(1, promotionsPage - 1);
                          onPromotionsPageChange(newPage);
                          onPromotionsPageInputChange('');
                        }}
                        disabled={promotionsPage === 1}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        <span>←</span> Trước
                      </button>
                      
                      <div className="combo-create-create-service-combo-pagination-numbers">
                        {Array.from({ length: promotionsTotalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              onPromotionsPageChange(page);
                              onPromotionsPageInputChange('');
                            }}
                            className={`combo-create-create-service-combo-pagination-number ${promotionsPage === page ? 'combo-create-active' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <div className="combo-create-create-service-combo-pagination-jump">
                        <span>Đến trang:</span>
                        <input
                          type="text"
                          value={promotionsPageInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              onPromotionsPageInputChange(value);
                              const pageNum = parseInt(value);
                              if (value !== '' && pageNum >= 1 && pageNum <= promotionsTotalPages) {
                                onPromotionsPageChange(pageNum);
                                onPromotionsPageInputChange('');
                              }
                            }
                          }}
                          placeholder={promotionsPage.toString()}
                          className="combo-create-create-service-combo-pagination-input"
                          inputMode="numeric"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.min(promotionsTotalPages, promotionsPage + 1);
                          onPromotionsPageChange(newPage);
                          onPromotionsPageInputChange('');
                        }}
                        disabled={promotionsPage === promotionsTotalPages}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        Sau <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coupons Section */}
            <div className="combo-create-create-service-combo-field">
              <div className="combo-create-create-service-combo-section-header">
                <label>Mã giảm giá</label>
                <button
                  type="button"
                  onClick={onToggleCouponsTable}
                  className="combo-create-create-service-combo-toggle-btn"
                >
                  <ChevronDownIcon 
                    className="combo-create-create-service-combo-chevron-icon"
                    style={{ 
                      transform: isCouponsTableOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </button>
              </div>
              
              {isCouponsTableOpen && (
                <div className="combo-create-create-service-combo-table-container">
                  {/* Filters */}
                  <div className="combo-create-create-service-combo-table-filters">
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Mã:</label>
                      <input
                        type="text"
                        value={couponFilterCode}
                        onChange={(e) => {
                          onCouponFilterCodeChange(e.target.value);
                          onCouponsPageChange(1);
                        }}
                        placeholder="Nhập mã giảm giá..."
                        className="combo-create-create-service-combo-filter-input"
                      />
                    </div>
                    <div className="combo-create-create-service-combo-filter-field">
                      <label>Hạng:</label>
                      <select
                        value={couponFilterRank}
                        onChange={(e) => {
                          onCouponFilterRankChange(e.target.value);
                          onCouponsPageChange(1);
                        }}
                        className="combo-create-create-service-combo-filter-select"
                      >
                        <option value="all">Tất cả</option>
                        <option value="Đồng">Đồng</option>
                        <option value="Bạc">Bạc</option>
                        <option value="Vàng">Vàng</option>
                        <option value="Tất cả">Tất cả</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="combo-create-create-service-combo-table-wrapper">
                    <table className="combo-create-create-service-combo-table">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Cho người dùng</th>
                          <th>Chọn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCoupons.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="combo-create-create-service-combo-empty-cell">
                              Không có mã giảm giá nào
                            </td>
                          </tr>
                        ) : (
                          currentPageCoupons.map(coupon => {
                            const couponId = String(coupon.Id || coupon.id);
                            const isSelected = selectedCoupons[couponId]?.selected || false;
                            const info = parseCouponInfo(coupon);
                            return (
                              <tr key={couponId}>
                                <td>{info.code}</td>
                                <td>{info.pairedDisplay}</td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => onCouponSelect(couponId, e.target.checked)}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {couponsTotalPages > 0 && (
                    <div className="combo-create-create-service-combo-pagination">
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.max(1, couponsPage - 1);
                          onCouponsPageChange(newPage);
                          onCouponsPageInputChange('');
                        }}
                        disabled={couponsPage === 1}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        <span>←</span> Trước
                      </button>
                      
                      <div className="combo-create-create-service-combo-pagination-numbers">
                        {Array.from({ length: couponsTotalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              onCouponsPageChange(page);
                              onCouponsPageInputChange('');
                            }}
                            className={`combo-create-create-service-combo-pagination-number ${couponsPage === page ? 'combo-create-active' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <div className="combo-create-create-service-combo-pagination-jump">
                        <span>Đến trang:</span>
                        <input
                          type="text"
                          value={couponsPageInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              onCouponsPageInputChange(value);
                              const pageNum = parseInt(value);
                              if (value !== '' && pageNum >= 1 && pageNum <= couponsTotalPages) {
                                onCouponsPageChange(pageNum);
                                onCouponsPageInputChange('');
                              }
                            }
                          }}
                          placeholder={couponsPage.toString()}
                          className="combo-create-create-service-combo-pagination-input"
                          inputMode="numeric"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newPage = Math.min(couponsTotalPages, couponsPage + 1);
                          onCouponsPageChange(newPage);
                          onCouponsPageInputChange('');
                        }}
                        disabled={couponsPage === couponsTotalPages}
                        className="combo-create-create-service-combo-pagination-btn"
                      >
                        Sau <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="combo-create-create-service-combo-form-action">
              <button type="submit" className="combo-create-create-service-combo-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo'}
              </button>
              <button type="button" className="combo-create-create-service-combo-btn-secondary" onClick={onClose}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateServiceComboModal;





