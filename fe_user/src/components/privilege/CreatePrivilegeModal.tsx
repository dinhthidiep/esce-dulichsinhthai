import React, { useState } from 'react';
import { XIcon } from '../icons/index';
import './CreatePrivilegeModal.css';

interface CreatePrivilegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    serviceName: string;
    rank: string;
    userType: string;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  onSubmit: (formData: { serviceName: string; rank: string; userType: string }, errors: Record<string, string>) => void;
}

const CreatePrivilegeModal: React.FC<CreatePrivilegeModalProps> = ({
  isOpen,
  onClose,
  formData,
  errors,
  isSubmitting,
  onSubmit
}) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setLocalFormData(formData);
      setLocalErrors({});
    }
  }, [isOpen, formData]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'serviceName':
        if (!value || value.trim() === '') {
          return 'Tên dịch vụ không được để trống';
        }
        return '';

      case 'rank':
        if (!value || value === '') {
          return 'Vui lòng chọn hạng người dùng';
        }
        return '';

      case 'userType':
        if (!value || value === '') {
          return 'Vui lòng chọn loại người dùng';
        }
        return '';

      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(localFormData).forEach(key => {
      const error = validateField(key, localFormData[key as keyof typeof localFormData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }

    onSubmit(localFormData, {});
  };

  if (!isOpen) return null;

  return (
    <div className="create-privilege-modal-overlay" onClick={onClose}>
      <div className="create-privilege-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-privilege-modal-header">
          <h2>Tạo ưu đãi</h2>
          <button className="create-privilege-modal-close" onClick={onClose}>
            <XIcon className="create-privilege-modal-close-icon" />
          </button>
        </div>
        <div className="create-privilege-modal-body">
          <div className="create-privilege-disclaimer-text">
            (<span className="create-privilege-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Service Name Field */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-serviceName">
                Tên dịch vụ
                <span className="create-privilege-required-indicator">*</span>
              </label>
              <input
                id="create-privilege-serviceName"
                name="serviceName"
                type="text"
                required
                placeholder="Nhập tên dịch vụ..."
                value={localFormData.serviceName}
                onChange={handleInputChange}
                autoComplete="off"
                className={localErrors.serviceName || errors.serviceName ? 'create-privilege-input-error' : ''}
              />
              {(localErrors.serviceName || errors.serviceName) && (
                <div className="create-privilege-error">{localErrors.serviceName || errors.serviceName}</div>
              )}
            </div>

            {/* Rank Field */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-rank">
                Hạng người dùng
                <span className="create-privilege-required-indicator">*</span>
              </label>
              <select
                id="create-privilege-rank"
                name="rank"
                required
                value={localFormData.rank}
                onChange={handleInputChange}
                className={localErrors.rank || errors.rank ? 'create-privilege-input-error' : ''}
              >
                <option value="">--Chọn--</option>
                <option value="Đồng">Đồng</option>
                <option value="Bạc">Bạc</option>
                <option value="Vàng">Vàng</option>
              </select>
              {(localErrors.rank || errors.rank) && (
                <div className="create-privilege-error">{localErrors.rank || errors.rank}</div>
              )}
            </div>

            {/* User Type Field */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-userType">
                Loại người dùng
                <span className="create-privilege-required-indicator">*</span>
              </label>
              <select
                id="create-privilege-userType"
                name="userType"
                required
                value={localFormData.userType}
                onChange={handleInputChange}
                className={localErrors.userType || errors.userType ? 'create-privilege-input-error' : ''}
              >
                <option value="">--Chọn--</option>
                <option value="Khách hàng">Khách hàng</option>
                <option value="Công ty">Công ty</option>
              </select>
              {(localErrors.userType || errors.userType) && (
                <div className="create-privilege-error">{localErrors.userType || errors.userType}</div>
              )}
            </div>

            {/* Form Actions */}
            <div className="create-privilege-form-action">
              <button type="submit" className="create-privilege-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo'}
              </button>
              <button type="button" className="create-privilege-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePrivilegeModal;
