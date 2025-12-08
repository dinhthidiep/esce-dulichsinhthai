import React from 'react';
import { XIcon } from '../icons/index';
import LoadingSpinner from '../LoadingSpinner';
import './EditServiceModal.css';

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  formData: {
    name: string;
    description: string;
    price: string;
    image: File | null;
  };
  errors: Record<string, string>;
  imagePreview: string | null;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
  isOpen,
  onClose,
  loading,
  formData,
  errors,
  imagePreview,
  isSubmitting,
  onInputChange,
  onImageChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="edit-service-modal-overlay" onClick={onClose}>
      <div className="edit-service-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-service-modal-header">
          <h2>Chỉnh sửa dịch vụ</h2>
          <button className="edit-service-modal-close" onClick={onClose}>
            <XIcon className="edit-service-modal-close-icon" />
          </button>
        </div>
        <div className="edit-service-modal-body">
          {loading ? (
            <LoadingSpinner message="Đang tải thông tin dịch vụ..." />
          ) : (
            <>
              <div className="edit-service-disclaimer-text">
                (<span className="edit-service-required-indicator">*</span>) bắt buộc
              </div>
              
              <form onSubmit={onSubmit} noValidate>
                {/* Service Name Field */}
                <div className="edit-service-field">
                  <label htmlFor="edit-service-name">
                    Nhập tên dịch vụ (Service Name)
                    <span className="edit-service-required-indicator">*</span>
                  </label>
                  <input
                    id="edit-service-name"
                    name="name"
                    type="text"
                    maxLength={255}
                    required
                    placeholder="Tên dịch vụ..."
                    value={formData.name}
                    onChange={onInputChange}
                    autoComplete="off"
                  />
                  {errors.name && <div className="edit-service-error">{errors.name}</div>}
                </div>

                {/* Description Field */}
                <div className="edit-service-field">
                  <label htmlFor="edit-service-description">Mô tả về dịch vụ (Service Description)</label>
                  <textarea
                    id="edit-service-description"
                    name="description"
                    maxLength={5000}
                    placeholder="Mô tả ngắn về dịch vụ (tối đa 5000 ký tự)"
                    value={formData.description}
                    onChange={onInputChange}
                    rows={4}
                  />
                  <div className="edit-service-hint">
                    Còn lại: <span>{5000 - formData.description.length}</span> ký tự
                  </div>
                </div>

                {/* Price Field */}
                <div className="edit-service-field">
                  <label htmlFor="edit-service-price">
                    Giá (Price)
                    <span className="edit-service-required-indicator">*</span>
                  </label>
                  <input 
                    id="edit-service-price" 
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
                  {errors.price && <div className="edit-service-error">{errors.price}</div>}
                </div>

                {/* Image Upload Field */}
                <div className="edit-service-field">
                  <label htmlFor="edit-service-image">Chọn ảnh (Image)</label>
                  <input
                    id="edit-service-image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                  />
                  <div className="edit-service-hint">
                    Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP), tối đa 5MB
                  </div>
                  {errors.image && <div className="edit-service-error">{errors.image}</div>}
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      className="edit-service-img-preview"
                      alt="Xem trước ảnh"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Form Actions */}
                <div className="edit-service-form-action">
                  <button type="submit" className="edit-service-btn-primary" disabled={isSubmitting || !formData.name || !formData.price}>
                    {isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
                  </button>
                  <button type="button" className="edit-service-btn-secondary" onClick={onClose} disabled={isSubmitting}>
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

export default EditServiceModal;

