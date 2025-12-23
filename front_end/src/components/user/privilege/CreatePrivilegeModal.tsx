import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/index';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './CreatePrivilegeModal.css';

interface Service {
  Id: number;
  id?: number;
  Name: string;
  name?: string;
  Description?: string;
  description?: string;
  Price?: number;
  price?: number;
}

interface CreatePrivilegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: number | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onCreated?: () => void;
}

const CreatePrivilegeModal: React.FC<CreatePrivilegeModalProps> = ({
  isOpen,
  onClose,
  hostId,
  onSuccess,
  onError,
  onCreated
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic info
    name: '',
    description: '',
    price: '',
    serviceId: '',
    // Target audience
    forAgency: false,
    agencyLevel1: false,
    agencyLevel2: false,
    agencyLevel3: false,
    forTourist: false,
    touristLevel1: false,
    touristLevel2: false,
    touristLevel3: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load services when modal opens
  useEffect(() => {
    if (isOpen && hostId) {
      loadServices();
    }
  }, [isOpen, hostId]);

  const loadServices = async () => {
    if (!hostId) return;
    
    setLoadingServices(true);
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE}/host/${hostId}`);
      setServices(response.data || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Auto-fill form when service is selected
  const handleServiceSelect = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceId }));
    
    if (serviceId) {
      const selectedService = services.find(s => (s.Id || s.id)?.toString() === serviceId);
      if (selectedService) {
        setFormData(prev => ({
          ...prev,
          serviceId,
          name: selectedService.Name || selectedService.name || '',
          description: selectedService.Description || selectedService.description || '',
          price: (selectedService.Price || selectedService.price || 0).toString(),
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let fieldValue: string | boolean = value;
    if (type === 'checkbox') {
      fieldValue = checked;
    }

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên ưu đãi';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Vui lòng nhập giá hợp lệ';
    }

    // Validate target audience
    const hasAgencyLevel = formData.forAgency && (formData.agencyLevel1 || formData.agencyLevel2 || formData.agencyLevel3);
    const hasTouristLevel = formData.forTourist && (formData.touristLevel1 || formData.touristLevel2 || formData.touristLevel3);
    
    if (!hasAgencyLevel && !hasTouristLevel) {
      newErrors.targetAudience = 'Vui lòng chọn ít nhất 1 vai trò và 1 hạng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !hostId) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const targetAudience = {
        forAgency: formData.forAgency,
        agencyLevels: formData.forAgency ? {
          level1: formData.agencyLevel1,
          level2: formData.agencyLevel2,
          level3: formData.agencyLevel3
        } : null,
        forTourist: formData.forTourist,
        touristLevels: formData.forTourist ? {
          level1: formData.touristLevel1,
          level2: formData.touristLevel2,
          level3: formData.touristLevel3
        } : null
      };

      const submitData = new FormData();
      submitData.append('Name', formData.name.trim());
      submitData.append('Description', formData.description.trim());
      submitData.append('Price', formData.price);
      submitData.append('HostId', hostId.toString());
      if (formData.serviceId) {
        submitData.append('ServiceId', formData.serviceId);
      }
      submitData.append('TargetAudience', JSON.stringify(targetAudience));

      await axiosInstance.post(`${API_ENDPOINTS.BONUS_SERVICE}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onSuccess) onSuccess('Tạo ưu đãi thành công!');
      if (onCreated) onCreated();
      handleClose();
    } catch (err: any) {
      console.error('Error creating bonus service:', err);
      if (onError) {
        onError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo ưu đãi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      serviceId: '',
      forAgency: false,
      agencyLevel1: false,
      agencyLevel2: false,
      agencyLevel3: false,
      forTourist: false,
      touristLevel1: false,
      touristLevel2: false,
      touristLevel3: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-privilege-modal-overlay" onClick={handleClose}>
      <div className="create-privilege-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-privilege-modal-header">
          <h2>Tạo ưu đãi (Dịch vụ tặng kèm)</h2>
          <button className="create-privilege-modal-close" onClick={handleClose}>
            <XIcon className="create-privilege-modal-close-icon" />
          </button>
        </div>
        <div className="create-privilege-modal-body">
          <div className="create-privilege-disclaimer-text">
            (<span className="create-privilege-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Select Service from Host's services (optional - to auto-fill) */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-serviceId">
                Chọn từ dịch vụ có sẵn (tùy chọn)
              </label>
              <select
                id="create-privilege-serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
                disabled={loadingServices}
              >
                <option value="">-- Không chọn (nhập thủ công) --</option>
                {services.map(service => (
                  <option key={service.Id || service.id} value={(service.Id || service.id)?.toString()}>
                    {service.Name || service.name} - {(service.Price || service.price || 0).toLocaleString('vi-VN')} VNĐ
                  </option>
                ))}
              </select>
              {loadingServices && <div className="create-privilege-hint">Đang tải danh sách dịch vụ...</div>}
              <div className="create-privilege-hint">💡 Chọn dịch vụ để tự động điền thông tin, hoặc nhập thủ công bên dưới</div>
            </div>

            {/* Name */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-name">
                Tên ưu đãi <span className="create-privilege-required-indicator">*</span>
              </label>
              <input
                type="text"
                id="create-privilege-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập tên ưu đãi..."
              />
              {errors.name && <div className="create-privilege-error">{errors.name}</div>}
            </div>

            {/* Description */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-description">
                Mô tả
              </label>
              <textarea
                id="create-privilege-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Nhập mô tả ưu đãi..."
                rows={3}
              />
            </div>

            {/* Price */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-price">
                Giá trị (VNĐ) <span className="create-privilege-required-indicator">*</span>
              </label>
              <input
                type="number"
                id="create-privilege-price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
              {errors.price && <div className="create-privilege-error">{errors.price}</div>}
              <div className="create-privilege-hint">💰 Giá trị của ưu đãi này (có thể là 0 nếu miễn phí)</div>
            </div>

            {/* Target Audience */}
            <div className="create-privilege-field">
              <label>🎯 Đối tượng được sử dụng <span className="create-privilege-required-indicator">*</span></label>
              <div className="create-privilege-target-grid">
                {/* Agency Section */}
                <div className={`create-privilege-role-section ${formData.forAgency ? 'active' : ''}`}>
                  <label className="create-privilege-checkbox-label create-privilege-role-header">
                    <input
                      type="checkbox"
                      name="forAgency"
                      checked={formData.forAgency}
                      onChange={handleInputChange}
                    />
                    <span className="create-privilege-role-icon">🏢</span>
                    <span>Agency (Đại lý)</span>
                  </label>
                  {formData.forAgency && (
                    <div className="create-privilege-level-group">
                      <div className="create-privilege-level-title">Chọn hạng Agency:</div>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel1" checked={formData.agencyLevel1} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥉</span>
                        <span>Đồng (Level 1)</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel2" checked={formData.agencyLevel2} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥈</span>
                        <span>Bạc (Level 2)</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel3" checked={formData.agencyLevel3} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥇</span>
                        <span>Vàng (Level 3)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Tourist Section */}
                <div className={`create-privilege-role-section ${formData.forTourist ? 'active' : ''}`}>
                  <label className="create-privilege-checkbox-label create-privilege-role-header">
                    <input
                      type="checkbox"
                      name="forTourist"
                      checked={formData.forTourist}
                      onChange={handleInputChange}
                    />
                    <span className="create-privilege-role-icon">🧳</span>
                    <span>Tourist (Khách du lịch)</span>
                  </label>
                  {formData.forTourist && (
                    <div className="create-privilege-level-group">
                      <div className="create-privilege-level-title">Chọn hạng Tourist:</div>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel1" checked={formData.touristLevel1} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥉</span>
                        <span>Đồng (Level 1)</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel2" checked={formData.touristLevel2} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥈</span>
                        <span>Bạc (Level 2)</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel3" checked={formData.touristLevel3} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥇</span>
                        <span>Vàng (Level 3)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="create-privilege-hint">
                💡 Chọn vai trò và hạng người dùng được sử dụng dịch vụ tặng kèm này
              </div>
              {errors.targetAudience && <div className="create-privilege-error">{errors.targetAudience}</div>}
            </div>

            {/* Summary */}
            {(formData.forAgency || formData.forTourist) && (
              <div className="create-privilege-summary">
                <div className="create-privilege-summary-title">📋 Tóm tắt đối tượng:</div>
                <div className="create-privilege-summary-content">
                  {formData.forAgency && (
                    <div className="create-privilege-summary-item">
                      <span>🏢 Agency:</span>
                      <span>
                        {[
                          formData.agencyLevel1 && '🥉 Đồng',
                          formData.agencyLevel2 && '🥈 Bạc',
                          formData.agencyLevel3 && '🥇 Vàng'
                        ].filter(Boolean).join(', ') || 'Chưa chọn hạng'}
                      </span>
                    </div>
                  )}
                  {formData.forTourist && (
                    <div className="create-privilege-summary-item">
                      <span>🧳 Tourist:</span>
                      <span>
                        {[
                          formData.touristLevel1 && '🥉 Đồng',
                          formData.touristLevel2 && '🥈 Bạc',
                          formData.touristLevel3 && '🥇 Vàng'
                        ].filter(Boolean).join(', ') || 'Chưa chọn hạng'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="create-privilege-form-action">
              <button type="button" className="create-privilege-btn-secondary" onClick={handleClose}>
                Hủy
              </button>
              <button type="submit" className="create-privilege-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tạo ưu đãi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePrivilegeModal;
