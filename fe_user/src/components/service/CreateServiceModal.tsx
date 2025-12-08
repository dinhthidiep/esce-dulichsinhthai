import React from 'react';
import { XIcon } from '../icons/index';
import './CreateServiceModal.css';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  isOpen,
  onClose,
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
    <div className="create-service-modal-overlay" onClick={onClose}>
      <div className="create-service-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-service-modal-header">
          <h2>Tạo dịch vụ mới</h2>
          <button className="create-service-modal-close" onClick={onClose}>
            <XIcon className="create-service-modal-close-icon" />
          </button>
        </div>
        <div className="create-service-modal-body">
          <div className="create-service-disclaimer-text">
            (<span className="create-service-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={onSubmit} noValidate>
            {/* Service Name Field */}
            <div className="create-service-field">
              <label htmlFor="create-service-name">
                Nhập tên dịch vụ (Service Name)
                <span className="create-service-required-indicator">*</span>
              </label>
              <input
                id="create-service-name"
                name="name"
                type="text"
                maxLength={255}
                required
                placeholder="Tên dịch vụ..."
                value={formData.name}
                onChange={onInputChange}
                autoComplete="off"
              />
              {errors.name && <div className="create-service-error">{errors.name}</div>}
            </div>

            {/* Description Field */}
            <div className="create-service-field">
              <label htmlFor="create-service-description">Mô tả về dịch vụ (Service Description)</label>
              <textarea
                id="create-service-description"
                name="description"
                maxLength={5000}
                placeholder="Mô tả ngắn về dịch vụ (tối đa 5000 ký tự)"
                value={formData.description}
                onChange={onInputChange}
                rows={4}
              />
              <div className="create-service-hint">
                Còn lại: <span>{5000 - formData.description.length}</span> ký tự
              </div>
            </div>

            {/* Price Field */}
            <div className="create-service-field">
              <label htmlFor="create-service-price">
                Giá (Price)
                <span className="create-service-required-indicator">*</span>
              </label>
              <input 
                id="create-service-price" 
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
              {errors.price && <div className="create-service-error">{errors.price}</div>}
            </div>

            {/* Image Upload Field */}
            <div className="create-service-field">
              <label htmlFor="create-service-image">Chọn ảnh (Image)</label>
              <input
                id="create-service-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={onImageChange}
              />
              <div className="create-service-hint">
                Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP), tối đa 5MB
              </div>
              {errors.image && <div className="create-service-error">{errors.image}</div>}
              {imagePreview && (
                <img
                  src={imagePreview}
                  className="create-service-img-preview"
                  alt="Xem trước ảnh"
                  loading="lazy"
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="create-service-form-action">
              <button type="submit" className="create-service-btn-primary" disabled={isSubmitting || !formData.name || !formData.price}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo dịch vụ'}
              </button>
              <button type="button" className="create-service-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateServiceModal;

