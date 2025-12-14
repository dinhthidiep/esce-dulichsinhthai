import React from 'react';
import { XIcon } from '../icons/index';
import './CreateCouponModal.css';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    code: string;
    description: string;
    discountType: 'percentage' | 'amount';
    discountValue: string;
    usageLimit: string;
    startDate: string;
    expiryDate: string;
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

const CreateCouponModal: React.FC<CreateCouponModalProps> = ({
  isOpen,
  onClose,
  formData,
  errors,
  isSubmitting,
  onInputChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="create-coupon-modal-overlay" onClick={onClose}>
      <div className="create-coupon-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-coupon-modal-header">
          <h2>Tạo coupon mới</h2>
          <button className="create-coupon-modal-close" onClick={onClose}>
            <XIcon className="create-coupon-modal-close-icon" />
          </button>
        </div>
        <div className="create-coupon-modal-body">
          <div className="create-coupon-disclaimer-text">
            (<span className="create-coupon-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={onSubmit} noValidate>
            <div className="create-coupon-form-grid">
              {/* Row 1: Code + Usage Limit */}
              <div className="create-coupon-field">
                <label htmlFor="create-coupon-code">
                  Mã coupon <span className="create-coupon-required-indicator">*</span>
                </label>
                <input
                  id="create-coupon-code"
                  name="code"
                  type="text"
                  maxLength={50}
                  required
                  placeholder="VD: SUMMER2024"
                  value={formData.code}
                  onChange={onInputChange}
                  autoComplete="off"
                />
                {errors.code && <div className="create-coupon-error">{errors.code}</div>}
              </div>

              <div className="create-coupon-field">
                <label htmlFor="create-coupon-usageLimit">
                  Giới hạn sử dụng <span className="create-coupon-required-indicator">*</span>
                </label>
                <input
                  id="create-coupon-usageLimit"
                  name="usageLimit"
                  type="number"
                  min={1}
                  required
                  placeholder="VD: 100"
                  value={formData.usageLimit}
                  onChange={onInputChange}
                  inputMode="numeric"
                />
                {errors.usageLimit && <div className="create-coupon-error">{errors.usageLimit}</div>}
              </div>

              {/* Row 2: Discount Type + Discount Value */}
              <div className="create-coupon-field">
                <label>Loại giảm giá</label>
                <div className="create-coupon-radio-group">
                  <label className="create-coupon-radio-label">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={formData.discountType === 'percentage'}
                      onChange={onInputChange}
                    />
                    <span>Phần trăm (%)</span>
                  </label>
                  <label className="create-coupon-radio-label">
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

              <div className="create-coupon-field">
                <label htmlFor="create-coupon-discountValue">
                  {formData.discountType === 'percentage' ? 'Giảm (%)' : 'Giảm (VND)'}
                  <span className="create-coupon-required-indicator">*</span>
                </label>
                <input
                  id="create-coupon-discountValue"
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
                {errors.discountValue && <div className="create-coupon-error">{errors.discountValue}</div>}
              </div>

              {/* Row 3: Start Date + Expiry Date */}
              <div className="create-coupon-field">
                <label htmlFor="create-coupon-startDate">
                  Ngày bắt đầu <span className="create-coupon-required-indicator">*</span>
                </label>
                <input
                  id="create-coupon-startDate"
                  name="startDate"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  max={formData.expiryDate || undefined}
                  value={formData.startDate}
                  onChange={onInputChange}
                />
                {errors.startDate && <div className="create-coupon-error">{errors.startDate}</div>}
              </div>

              <div className="create-coupon-field">
                <label htmlFor="create-coupon-expiryDate">
                  Ngày hết hạn <span className="create-coupon-required-indicator">*</span>
                </label>
                <input
                  id="create-coupon-expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  value={formData.expiryDate}
                  onChange={onInputChange}
                />
                {errors.expiryDate && <div className="create-coupon-error">{errors.expiryDate}</div>}
              </div>

              {/* Row 4: Description - Full width */}
              <div className="create-coupon-field create-coupon-field-full">
                <label htmlFor="create-coupon-description">Mô tả</label>
                <textarea
                  id="create-coupon-description"
                  name="description"
                  maxLength={255}
                  placeholder="Mô tả về coupon (tối đa 255 ký tự)"
                  value={formData.description}
                  onChange={onInputChange}
                  rows={2}
                />
                {errors.description && <div className="create-coupon-error">{errors.description}</div>}
              </div>

              {/* Row 5: Target Audience - Full width with 2-column grid */}
              <div className="create-coupon-field create-coupon-field-full">
                <label>🎯 Đối tượng áp dụng <span className="create-coupon-required-indicator">*</span></label>
                <div className="create-coupon-target-grid">
                  {/* Agency Section */}
                  <div className={`create-coupon-role-section ${formData.forAgency ? 'active' : ''}`}>
                    <label className="create-coupon-checkbox-label create-coupon-role-header">
                      <input
                        type="checkbox"
                        name="forAgency"
                        checked={formData.forAgency}
                        onChange={onInputChange}
                      />
                      <span className="create-coupon-role-icon">🏢</span>
                      <span>Agency</span>
                    </label>
                    {formData.forAgency && (
                      <div className="create-coupon-level-group">
                        <label className="create-coupon-checkbox-label">
                          <input type="checkbox" name="agencyLevel0" checked={formData.agencyLevel0} onChange={onInputChange} />
                          <span className="create-coupon-level-icon">✨</span><span>Tất cả</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="agencyLevel1" checked={formData.agencyLevel1} onChange={onInputChange} disabled={formData.agencyLevel0} />
                          <span className="create-coupon-level-icon">🥉</span><span>Đồng</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="agencyLevel2" checked={formData.agencyLevel2} onChange={onInputChange} disabled={formData.agencyLevel0} />
                          <span className="create-coupon-level-icon">🥈</span><span>Bạc</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.agencyLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="agencyLevel3" checked={formData.agencyLevel3} onChange={onInputChange} disabled={formData.agencyLevel0} />
                          <span className="create-coupon-level-icon">🥇</span><span>Vàng</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Tourist Section */}
                  <div className={`create-coupon-role-section ${formData.forTourist ? 'active' : ''}`}>
                    <label className="create-coupon-checkbox-label create-coupon-role-header">
                      <input
                        type="checkbox"
                        name="forTourist"
                        checked={formData.forTourist}
                        onChange={onInputChange}
                      />
                      <span className="create-coupon-role-icon">🧳</span>
                      <span>Tourist</span>
                    </label>
                    {formData.forTourist && (
                      <div className="create-coupon-level-group">
                        <label className="create-coupon-checkbox-label">
                          <input type="checkbox" name="touristLevel0" checked={formData.touristLevel0} onChange={onInputChange} />
                          <span className="create-coupon-level-icon">✨</span><span>Tất cả</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="touristLevel1" checked={formData.touristLevel1} onChange={onInputChange} disabled={formData.touristLevel0} />
                          <span className="create-coupon-level-icon">🥉</span><span>Đồng</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="touristLevel2" checked={formData.touristLevel2} onChange={onInputChange} disabled={formData.touristLevel0} />
                          <span className="create-coupon-level-icon">🥈</span><span>Bạc</span>
                        </label>
                        <label className={`create-coupon-checkbox-label ${formData.touristLevel0 ? 'disabled' : ''}`}>
                          <input type="checkbox" name="touristLevel3" checked={formData.touristLevel3} onChange={onInputChange} disabled={formData.touristLevel0} />
                          <span className="create-coupon-level-icon">🥇</span><span>Vàng</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="create-coupon-hint">
                  💡 Tick chọn ít nhất 1 vai trò và 1 hạng để áp dụng coupon.
                </div>
                {errors.targetAudience && <div className="create-coupon-error">{errors.targetAudience}</div>}
              </div>
            </div>

            {/* Form Actions */}
            <div className="create-coupon-form-action">
              <button type="button" className="create-coupon-btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="create-coupon-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo coupon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCouponModal;





