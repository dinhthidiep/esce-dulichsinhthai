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
                {/* CODE Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-code">
                    Nhập mã coupon (CODE)
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-coupon-code"
                    name="code"
                    type="text"
                    maxLength={50}
                    required
                    placeholder="Ví dụ: SUMMER2024, WELCOME10, DISCOUNT50"
                    value={formData.code}
                    onChange={onInputChange}
                    autoComplete="off"
                  />
                  <div className="edit-coupon-hint">
                    Mã coupon có thể chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_). Tối đa 50 ký tự.
                  </div>
                  {errors.code && <div className="edit-coupon-error">{errors.code}</div>}
                </div>

                {/* DESCRIPTION Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-description">Mô tả về coupon (DESCRIPTION)</label>
                  <textarea
                    id="edit-coupon-description"
                    name="description"
                    maxLength={255}
                    placeholder="Mô tả về coupon (tối đa 255 ký tự)"
                    value={formData.description}
                    onChange={onInputChange}
                    rows={3}
                  />
                  <div className="edit-coupon-hint">
                    Còn lại: <span>{255 - formData.description.length}</span> ký tự
                  </div>
                  {errors.description && <div className="edit-coupon-error">{errors.description}</div>}
                </div>

                {/* Discount Type Selection */}
                <div className="edit-coupon-field">
                  <label>Loại giảm giá (Discount Type)</label>
                  <div className="edit-coupon-radio-group">
                    <label className="edit-coupon-radio-label">
                      <input
                        type="radio"
                        name="discountType"
                        value="percentage"
                        checked={formData.discountType === 'percentage'}
                        onChange={onInputChange}
                      />
                      <span>Phần trăm</span>
                    </label>
                    <label className="edit-coupon-radio-label">
                      <input
                        type="radio"
                        name="discountType"
                        value="amount"
                        checked={formData.discountType === 'amount'}
                        onChange={onInputChange}
                      />
                      <span>Số tiền giảm giá</span>
                    </label>
                  </div>
                </div>

                {/* Discount Value Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-discountValue">
                    {formData.discountType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm giá (VND)'}
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-coupon-discountValue"
                    name="discountValue"
                    type="number"
                    step={formData.discountType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    required
                    placeholder={formData.discountType === 'percentage' ? 'Ví dụ: 10, 25, 50' : 'Ví dụ: 50000, 100000'}
                    value={formData.discountValue}
                    onChange={onInputChange}
                    inputMode="decimal"
                  />
                  <div className="edit-coupon-hint">
                    {formData.discountType === 'percentage' 
                      ? 'Phần trăm giảm giá tối đa 100%'
                      : 'Nhập số tiền giảm giá'}
                  </div>
                  {errors.discountValue && <div className="edit-coupon-error">{errors.discountValue}</div>}
                </div>

                {/* Usage Limit Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-usageLimit">
                    Giới hạn sử dụng
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-coupon-usageLimit"
                    name="usageLimit"
                    type="number"
                    min={1}
                    required
                    placeholder="Ví dụ: 100, 500, 1000"
                    value={formData.usageLimit}
                    onChange={onInputChange}
                    inputMode="numeric"
                  />
                  <div className="edit-coupon-hint">
                    Số lần tối đa coupon có thể được sử dụng (tối thiểu 1 lần)
                  </div>
                  {errors.usageLimit && <div className="edit-coupon-error">{errors.usageLimit}</div>}
                </div>

                {/* Start Date Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-startDate">
                    Ngày bắt đầu
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-coupon-startDate"
                    name="startDate"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    max={formData.expiryDate || undefined}
                    value={formData.startDate}
                    onChange={onInputChange}
                  />
                  <div className="edit-coupon-hint">
                    Chọn ngày bắt đầu của coupon. Ngày bắt đầu không được là ngày trong quá khứ và phải trước ngày hết hạn.
                  </div>
                  {errors.startDate && <div className="edit-coupon-error">{errors.startDate}</div>}
                </div>

                {/* Expiry Date Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-expiryDate">
                    Ngày hết hạn
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-coupon-expiryDate"
                    name="expiryDate"
                    type="date"
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    value={formData.expiryDate}
                    onChange={onInputChange}
                  />
                  <div className="edit-coupon-hint">
                    Chọn ngày hết hạn của coupon. Ngày hết hạn không được là ngày trong quá khứ và phải sau ngày bắt đầu.
                  </div>
                  {errors.expiryDate && <div className="edit-coupon-error">{errors.expiryDate}</div>}
                </div>

                {/* IS_ACTIVE Field */}
                <div className="edit-coupon-field">
                  <label htmlFor="edit-coupon-isActive">
                    Trạng thái (IS_ACTIVE)
                    <span className="edit-coupon-required-indicator">*</span>
                  </label>
                  <select
                    id="edit-coupon-isActive"
                    name="isActive"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={onInputChange}
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã hủy</option>
                  </select>
                  <div className="edit-coupon-hint">
                    Chọn trạng thái hoạt động của coupon. "Hoạt động" = true, "Đã hủy" = false.
                  </div>
                  {errors.isActive && <div className="edit-coupon-error">{errors.isActive}</div>}
                </div>

                {/* Form Actions */}
                <div className="edit-coupon-form-action">
                  <button type="submit" className="edit-coupon-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
                  </button>
                  <button type="button" className="edit-coupon-btn-secondary" onClick={onClose}>
                    Hủy
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
