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
            {/* CODE Field */}
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-code">
                Nhập mã coupon
                <span className="create-coupon-required-indicator">*</span>
              </label>
              <input
                id="create-coupon-code"
                name="code"
                type="text"
                maxLength={50}
                required
                placeholder="Ví dụ: SUMMER2024, WELCOME10, DISCOUNT50"
                value={formData.code}
                onChange={onInputChange}
                autoComplete="off"
              />
              <div className="create-coupon-hint">
                Mã coupon có thể chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_). Tối đa 50 ký tự.
              </div>
              {errors.code && <div className="create-coupon-error">{errors.code}</div>}
            </div>

            {/* DESCRIPTION Field */}
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-description">Mô tả về coupon (DESCRIPTION)</label>
              <textarea
                id="create-coupon-description"
                name="description"
                maxLength={255}
                placeholder="Mô tả về coupon (tối đa 255 ký tự)"
                value={formData.description}
                onChange={onInputChange}
                rows={3}
              />
              <div className="create-coupon-hint">
                Còn lại: <span>{255 - formData.description.length}</span> ký tự
              </div>
              {errors.description && <div className="create-coupon-error">{errors.description}</div>}
            </div>

            {/* Discount Type Selection */}
            <div className="create-coupon-field">
              <label>Loại giảm giá (Discount Type)</label>
              <div className="create-coupon-radio-group">
                <label className="create-coupon-radio-label">
                  <input
                    type="radio"
                    name="discountType"
                    value="percentage"
                    checked={formData.discountType === 'percentage'}
                    onChange={onInputChange}
                  />
                  <span>Phần trăm</span>
                </label>
                <label className="create-coupon-radio-label">
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
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-discountValue">
                {formData.discountType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm giá (VND)'}
                <span className="create-coupon-required-indicator">*</span>
              </label>
              <input
                id="create-coupon-discountValue"
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
              <div className="create-coupon-hint">
                {formData.discountType === 'percentage' 
                  ? 'Phần trăm giảm giá tối đa 100%'
                  : 'Nhập số tiền giảm giá'}
              </div>
              {errors.discountValue && <div className="create-coupon-error">{errors.discountValue}</div>}
            </div>

            {/* Usage Limit Field */}
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-usageLimit">
                Giới hạn sử dụng
                <span className="create-coupon-required-indicator">*</span>
              </label>
              <input
                id="create-coupon-usageLimit"
                name="usageLimit"
                type="number"
                min={1}
                required
                placeholder="Ví dụ: 100, 500, 1000"
                value={formData.usageLimit}
                onChange={onInputChange}
                inputMode="numeric"
              />
              <div className="create-coupon-hint">
                Số lần tối đa coupon có thể được sử dụng (tối thiểu 1 lần)
              </div>
              {errors.usageLimit && <div className="create-coupon-error">{errors.usageLimit}</div>}
            </div>

            {/* Start Date Field */}
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-startDate">
                Ngày bắt đầu
                <span className="create-coupon-required-indicator">*</span>
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
              <div className="create-coupon-hint">
                Chọn ngày bắt đầu của coupon. Ngày bắt đầu không được là ngày trong quá khứ và phải trước ngày hết hạn.
              </div>
              {errors.startDate && <div className="create-coupon-error">{errors.startDate}</div>}
            </div>

            {/* Expiry Date Field */}
            <div className="create-coupon-field">
              <label htmlFor="create-coupon-expiryDate">
                Ngày hết hạn
                <span className="create-coupon-required-indicator">*</span>
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
              <div className="create-coupon-hint">
                Chọn ngày hết hạn của coupon. Ngày hết hạn không được là ngày trong quá khứ và phải sau ngày bắt đầu.
              </div>
              {errors.expiryDate && <div className="create-coupon-error">{errors.expiryDate}</div>}
            </div>

            {/* Form Actions */}
            <div className="create-coupon-form-action">
              <button type="submit" className="create-coupon-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo'}
              </button>
              <button type="button" className="create-coupon-btn-secondary" onClick={onClose}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCouponModal;

