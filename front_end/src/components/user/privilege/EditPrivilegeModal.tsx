import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/index';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './EditPrivilegeModal.css';

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

interface BonusServiceData {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  Description?: string;
  description?: string;
  Price?: number;
  price?: number;
  ServiceId?: number;
  serviceId?: number;
  TargetAudience?: string;
  targetAudience?: string;
}

interface EditPrivilegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: number | null;
  bonusService: BonusServiceData | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onUpdated?: () => void;
}

const EditPrivilegeModal: React.FC<EditPrivilegeModalProps> = ({
  isOpen,
  onClose,
  hostId,
  bonusService,
  onSuccess,
  onError,
  onUpdated
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load services and populate form when modal opens
  useEffect(() => {
    if (isOpen && hostId) {
      loadServices();
      populateForm();
    }
  }, [isOpen, hostId, bonusService]);

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

  const populateForm = () => {
    if (!bonusService) return;

    const serviceId = bonusService.ServiceId || bonusService.serviceId;
    const targetAudienceStr = bonusService.TargetAudience || bonusService.targetAudience;

    let targetAudience = {
      forAgency: false,
      agencyLevels: { level1: false, level2: false, level3: false },
      forTourist: false,
      touristLevels: { level1: false, level2: false, level3: false }
    };

    if (targetAudienceStr) {
      try {
        targetAudience = JSON.parse(targetAudienceStr);
      } catch (e) {
        console.error('Error parsing target audience:', e);
      }
    }

    setFormData({
      serviceId: serviceId?.toString() || '',
      forAgency: targetAudience.forAgency || false,
      agencyLevel1: targetAudience.agencyLevels?.level1 || false,
      agencyLevel2: targetAudience.agencyLevels?.level2 || false,
      agencyLevel3: targetAudience.agencyLevels?.level3 || false,
      forTourist: targetAudience.forTourist || false,
      touristLevel1: targetAudience.touristLevels?.level1 || false,
      touristLevel2: targetAudience.touristLevels?.level2 || false,
      touristLevel3: targetAudience.touristLevels?.level3 || false,
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    const fieldValue = type === 'checkbox' ? checked : value;
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
    
    const bonusId = bonusService?.Id || bonusService?.id;
    if (isSubmitting || !hostId || !bonusId) return;
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
      submitData.append('ServiceId', formData.serviceId);
      submitData.append('TargetAudience', JSON.stringify(targetAudience));

      await axiosInstance.put(`${API_ENDPOINTS.BONUS_SERVICE}/${bonusId}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onSuccess) onSuccess('Cập nhật ưu đãi thành công!');
      if (onUpdated) onUpdated();
      handleClose();
    } catch (err: any) {
      console.error('Error updating bonus service:', err);
      if (onError) {
        onError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ưu đãi');
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
    <div className="edit-privilege-modal-overlay" onClick={handleClose}>
      <div className="edit-privilege-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-privilege-modal-header">
          <h2>Chỉnh sửa ưu đãi (Dịch vụ tặng kèm)</h2>
          <button className="edit-privilege-modal-close" onClick={handleClose}>
            <XIcon className="edit-privilege-modal-close-icon" />
          </button>
        </div>
        <div className="edit-privilege-modal-body">
          <div className="edit-privilege-disclaimer-text">
            (<span className="edit-privilege-required-indicator">*</span>) bắt buộc
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Select Service */}
            <div className="edit-privilege-field">
              <label htmlFor="edit-privilege-serviceId">
                Chọn dịch vụ tặng kèm <span className="edit-privilege-required-indicator">*</span>
              </label>
              <select
                id="edit-privilege-serviceId"
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
              {loadingServices && <div className="edit-privilege-hint">Đang tải danh sách dịch vụ...</div>}
              {errors.serviceId && <div className="edit-privilege-error">{errors.serviceId}</div>}
            </div>

            {/* Target Audience */}
            <div className="edit-privilege-field">
              <label>🎯 Đối tượng được sử dụng <span className="edit-privilege-required-indicator">*</span></label>
              <div className="edit-privilege-target-grid">
                {/* Agency Section */}
                <div className={`edit-privilege-role-section ${formData.forAgency ? 'active' : ''}`}>
                  <label className="edit-privilege-checkbox-label edit-privilege-role-header">
                    <input
                      type="checkbox"
                      name="forAgency"
                      checked={formData.forAgency}
                      onChange={handleInputChange}
                    />
                    <span className="edit-privilege-role-icon">🏢</span>
                    <span>Agency</span>
                  </label>
                  {formData.forAgency && (
                    <div className="edit-privilege-level-group">
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel1" checked={formData.agencyLevel1} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥉</span><span>Đồng</span>
                      </label>
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel2" checked={formData.agencyLevel2} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥈</span><span>Bạc</span>
                      </label>
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="agencyLevel3" checked={formData.agencyLevel3} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥇</span><span>Vàng</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Tourist Section */}
                <div className={`edit-privilege-role-section ${formData.forTourist ? 'active' : ''}`}>
                  <label className="edit-privilege-checkbox-label edit-privilege-role-header">
                    <input
                      type="checkbox"
                      name="forTourist"
                      checked={formData.forTourist}
                      onChange={handleInputChange}
                    />
                    <span className="edit-privilege-role-icon">🧳</span>
                    <span>Tourist</span>
                  </label>
                  {formData.forTourist && (
                    <div className="edit-privilege-level-group">
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel1" checked={formData.touristLevel1} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥉</span><span>Đồng</span>
                      </label>
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel2" checked={formData.touristLevel2} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥈</span><span>Bạc</span>
                      </label>
                      <label className="edit-privilege-checkbox-label">
                        <input type="checkbox" name="touristLevel3" checked={formData.touristLevel3} onChange={handleInputChange} />
                        <span className="edit-privilege-level-icon">🥇</span><span>Vàng</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="edit-privilege-hint">
                💡 Chọn vai trò và hạng người dùng được sử dụng dịch vụ tặng kèm này
              </div>
              {errors.targetAudience && <div className="edit-privilege-error">{errors.targetAudience}</div>}
            </div>

            {/* Form Actions */}
            <div className="edit-privilege-form-action">
              <button type="button" className="edit-privilege-btn-secondary" onClick={handleClose}>
                Hủy
              </button>
              <button type="submit" className="edit-privilege-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPrivilegeModal;





