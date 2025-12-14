import React from 'react';
import { XIcon } from '../icons/index';
import LoadingSpinner from '../LoadingSpinner';
import './EditCouponModal.css';

interface EditCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  formData: {
    code: string;
    description: string;
    discountType: 'percentage' | 'amount';
    discountValue: string;
    usageLimit: string;
    startDate: string;
    expiryDate: string;
    isActive: boolean;
    forAgency: boolean;
    agencyLevel0: boolean;
    agencyLevel1: boolean;
    agencyLevel2: boolean;
    agencyLevel3: boolean;
    forTourist: boolean;
    touristLevel0: boolean;
    touristLevel1: boolean;
    touristLevel2: boolean;
    touristLevel3: boolean;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EditCouponModal: React.FC<EditCouponModalProps> = ({
  isOpen,
  onClose,
  loading,
  formData,
  errors,
  isSubmitting,
  onInputChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="edit-coupon-modal-overlay" onClick={onClose}>
      <div className="edit-coupon-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-coupon-modal-header">
          <h2>Chỉnh sửa coupon</h2>
          <button className="edit-coupon-modal-close" onClick={onClose}>
            <XIcon className="edit-coupon-modal-close-icon" />
          </button>
        </div>
        <div className="edit-coupon-modal-body">
          {loading ? (
            <LoadingSpinner message="Đang tải dữ liệu coupon..." />
          ) : (
            <>
              <div className="edit-coupon-disclaimer-text">
                (<span className="edit-coupon-required-indicator">*</span>) bắt buộc
              </div>
              
              <form onSubmit={onSubmit} noValidate>
                <div className="edit-coupon-form-grid">
                  {/* Row 1: Code + Usage Limit */}
                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-code">
                      Mã coupon <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <input
                      id="edit-coupon-code"
                      name="code"
                      type="text"
                      maxLength={50}
                      required
                      placeholder="VD: SUMMER2024"
                      value={formData.code}
                      onChange={onInputChange}
                      autoComplete="off"
                    />
                    {errors.code && <div className="edit-coupon-error">{errors.code}</div>}
                  </div>

                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-usageLimit">
                      Giới hạn sử dụng <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <input
                      id="edit-coupon-usageLimit"
                      name="usageLimit"
                      type="number"
                      min={1}
                      required
                      placeholder="VD: 100"
                      value={formData.usageLimit}
                      onChange={onInputChange}
                      inputMode="numeric"
                    />
                    {errors.usageLimit && <div className="edit-coupon-error">{errors.usageLimit}</div>}
                  </div>

                  {/* Row 2: Discount Type + Discount Value */}
                  <div className="edit-coupon-field">
                    <label>Loại giảm giá</label>
                    <div className="edit-coupon-radio-group">
                      <label className="edit-coupon-radio-label">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={formData.discountType === 'percentage'}
                          onChange={onInputChange}
                        />
                        <span>Phần trăm (%)</span>
                      </label>
                      <label className="edit-coupon-radio-label">
                        <input
                          type="radio"
                          name="discountType"
                          value="amount"
                          checked={formData.discountType === 'amount'}
                          onChange={onInputChange}
                        />
                        <span>Số tiền (VND)</span>
                      </label>
                    </div>
                  </div>

                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-discountValue">
                      {formData.discountType === 'percentage' ? 'Giảm (%)' : 'Giảm (VND)'}
                      <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <input
                      id="edit-coupon-discountValue"
                      name="discountValue"
                      type="number"
                      step={formData.discountType === 'percentage' ? '1' : '1000'}
                      min="0"
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      required
                      placeholder={formData.discountType === 'percentage' ? 'VD: 10, 25' : 'VD: 50000'}
                      value={formData.discountValue}
                      onChange={onInputChange}
                      inputMode="decimal"
                    />
                    {errors.discountValue && <div className="edit-coupon-error">{errors.discountValue}</div>}
                  </div>

                  {/* Row 3: Start Date + Expiry Date */}
                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-startDate">
                      Ngày bắt đầu <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <input
                      id="edit-coupon-startDate"
                      name="startDate"
                      type="date"
                      required
                      max={formData.expiryDate || undefined}
                      value={formData.startDate}
                      onChange={onInputChange}
                    />
                    {errors.startDate && <div className="edit-coupon-error">{errors.startDate}</div>}
                  </div>

                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-expiryDate">
                      Ngày hết hạn <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <input
                      id="edit-coupon-expiryDate"
                      name="expiryDate"
                      type="date"
                      required
                      min={formData.startDate || undefined}
                      value={formData.expiryDate}
                      onChange={onInputChange}
                    />
                    {errors.expiryDate && <div className="edit-coupon-error">{errors.expiryDate}</div>}
                  </div>

                  {/* Row 4: Description + Status */}
                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-description">Mô tả</label>
                    <textarea
                      id="edit-coupon-description"
                      name="description"
                      maxLength={255}
                      placeholder="Mô tả về coupon"
                      value={formData.description}
                      onChange={onInputChange}
                      rows={2}
                    />
                    {errors.description && <div className="edit-coupon-error">{errors.description}</div>}
                  </div>

                  <div className="edit-coupon-field">
                    <label htmlFor="edit-coupon-isActive">
                      Trạng thái <span className="edit-coupon-required-indicator">*</span>
                    </label>
                    <select
                      id="edit-coupon-isActive"
                      name="isActive"
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={onInputChange}
                    >
                      <option value="true">✅ Khả dụng</option>
                      <option value="false">🔒 Khóa</option>
                    </select>
                    {errors.isActive && <div className="edit-coupon-error">{errors.isActive}</div>}
                  </div>

                  {/* Row 5: Target Audience - Full width with 2-column grid */}
                  <div className="edit-coupon-field edit-coupon-field-full">
                    <label>🎯 Đối tượng áp dụng <span className="edit-coupon-required-indicator">*</span></label>
                    <div className="edit-coupon-target-grid">
                      {/* Agency Section */}
                      <div className={`edit-coupon-role-section ${formData.forAgency ? 'active' : ''}`}>
                        <label className="edit-coupon-checkbox-label edit-coupon-role-header">
                          <input
                            type="checkbox"
                            name="forAgency"
                            checked={formData.forAgency}
                            onChange={onInputChange}
                          />
                          <span className="edit-coupon-role-icon">🏢</span>
                          <span>Agency</span>
                        </label>
                        {formData.forAgency && (
                          <div className="edit-coupon-level-group">
                            <label className="edit-coupon-checkbox-label">
                              <input type="checkbox" name="agencyLevel0" checked={formData.agencyLevel0} onChange={onInputChange} />
                              <span className="edit-coupon-level-icon">✨</span><span>Tất cả</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="agencyLevel1" checked={formData.agencyLevel1} onChange={onInputChange} disabled={formData.agencyLevel0} />
                              <span className="edit-coupon-level-icon">🥉</span><span>Đồng</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="agencyLevel2" checked={formData.agencyLevel2} onChange={onInputChange} disabled={formData.agencyLevel0} />
                              <span className="edit-coupon-level-icon">🥈</span><span>Bạc</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="agencyLevel3" checked={formData.agencyLevel3} onChange={onInputChange} disabled={formData.agencyLevel0} />
                              <span className="edit-coupon-level-icon">🥇</span><span>Vàng</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Tourist Section */}
                      <div className={`edit-coupon-role-section ${formData.forTourist ? 'active' : ''}`}>
                        <label className="edit-coupon-checkbox-label edit-coupon-role-header">
                          <input
                            type="checkbox"
                            name="forTourist"
                            checked={formData.forTourist}
                            onChange={onInputChange}
                          />
                          <span className="edit-coupon-role-icon">🧳</span>
                          <span>Tourist</span>
                        </label>
                        {formData.forTourist && (
                          <div className="edit-coupon-level-group">
                            <label className="edit-coupon-checkbox-label">
                              <input type="checkbox" name="touristLevel0" checked={formData.touristLevel0} onChange={onInputChange} />
                              <span className="edit-coupon-level-icon">✨</span><span>Tất cả</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="touristLevel1" checked={formData.touristLevel1} onChange={onInputChange} disabled={formData.touristLevel0} />
                              <span className="edit-coupon-level-icon">🥉</span><span>Đồng</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="touristLevel2" checked={formData.touristLevel2} onChange={onInputChange} disabled={formData.touristLevel0} />
                              <span className="edit-coupon-level-icon">🥈</span><span>Bạc</span>
                            </label>
                            <label className={`edit-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                              <input type="checkbox" name="touristLevel3" checked={formData.touristLevel3} onChange={onInputChange} disabled={formData.touristLevel0} />
                              <span className="edit-coupon-level-icon">🥇</span><span>Vàng</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="edit-coupon-hint">
                      💡 Tick chọn ít nhất 1 vai trò và 1 hạng để áp dụng coupon.
                    </div>
                    {errors.targetAudience && <div className="edit-coupon-error">{errors.targetAudience}</div>}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="edit-coupon-form-action">
                  <button type="button" className="edit-coupon-btn-secondary" onClick={onClose}>
                    Hủy
                  </button>
                  <button type="submit" className="edit-coupon-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCouponModal;





