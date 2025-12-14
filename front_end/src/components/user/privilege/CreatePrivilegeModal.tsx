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

    if (!formData.serviceId) {
      newErrors.serviceId = 'Vui lòng chọn dịch vụ';
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
      const selectedService = services.find(s => (s.Id || s.id)?.toString() === formData.serviceId);
      if (!selectedService) {
        setErrors({ serviceId: 'Dịch vụ không hợp lệ' });
        setIsSubmitting(false);
        return;
      }

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
      submitData.append('Name', selectedService.Name || selectedService.name || '');
      submitData.append('Description', selectedService.Description || selectedService.description || '');
      submitData.append('Price', (selectedService.Price || selectedService.price || 0).toString());
      submitData.append('HostId', hostId.toString());
      submitData.append('ServiceId', formData.serviceId);
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
            {/* Select Service from Host's services */}
            <div className="create-privilege-field">
              <label htmlFor="create-privilege-serviceId">
                Chọn dịch vụ tặng kèm <span className="create-privilege-required-indicator">*</span>
              </label>
              <select
                id="create-privilege-serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
                disabled={loadingServices}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map(service => (
                  <option key={service.Id || service.id} value={(service.Id || service.id)?.toString()}>
                    {service.Name || service.name} - {(service.Price || service.price || 0).toLocaleString('vi-VN')} VNĐ
                  </option>
                ))}
              </select>
              {loadingServices && <div className="create-privilege-hint">Đang tải danh sách dịch vụ...</div>}
              {!loadingServices && services.length === 0 && (
                <div className="create-privilege-hint" style={{ color: '#f59e0b' }}>
                  ⚠️ Bạn chưa có dịch vụ thêm nào. Vui lòng tạo dịch vụ thêm trước.
                </div>
              )}
              {errors.serviceId && <div className="create-privilege-error">{errors.serviceId}</div>}
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
                    <span>Agency</span>
                  </label>
                  {formData.forAgency && (
                    <div className="create-privilege-level-group">
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel1" checked={formData.agencyLevel1} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥉</span><span>Đồng</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel2" checked={formData.agencyLevel2} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥈</span><span>Bạc</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel3" checked={formData.agencyLevel3} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥇</span><span>Vàng</span>
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
                    <span>Tourist</span>
                  </label>
                  {formData.forTourist && (
                    <div className="create-privilege-level-group">
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel1" checked={formData.touristLevel1} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥉</span><span>Đồng</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel2" checked={formData.touristLevel2} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥈</span><span>Bạc</span>
                      </label>
                      <label className="create-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel3" checked={formData.touristLevel3} onChange={handleInputChange} />
                        <span className="create-privilege-level-icon">🥇</span><span>Vàng</span>
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





