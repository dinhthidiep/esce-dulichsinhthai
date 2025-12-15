import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import CreateServiceModal from './CreateServiceModal';
import EditServiceModal from './EditServiceModal';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './ServicesManagement.css';

interface ServicesManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface ServicesManagementRef {
  openCreateModal: () => void;
}

const ServicesManagement = forwardRef<ServicesManagementRef, ServicesManagementProps>(({ onSuccess, onError }, ref) => {
  // Services state
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [serviceCurrentPage, setServiceCurrentPage] = useState(1);
  const [servicePageInput, setServicePageInput] = useState('');
  const [serviceItemsPerPage] = useState(5);
  
  // Create Service Modal states
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [createServiceFormData, setCreateServiceFormData] = useState({
    name: '',
    description: '',
    price: ''
  });
  const [createServiceErrors, setCreateServiceErrors] = useState({});
  const [isCreatingService, setIsCreatingService] = useState(false);
  
  // Edit Service Modal states
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [loadingEditServiceData, setLoadingEditServiceData] = useState(false);
  const [editServiceFormData, setEditServiceFormData] = useState({
    name: '',
    description: '',
    price: ''
  });
  const [editServiceErrors, setEditServiceErrors] = useState({});
  const [isEditingService, setIsEditingService] = useState(false);
  
  // Delete Confirm Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [deletingServiceName, setDeletingServiceName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and sort function for services
  const applyServiceFilters = (serviceList, nameFilter, order) => {
    let filtered = [...serviceList];

    // Filter by name
    if (nameFilter && nameFilter.trim() !== '') {
      filtered = filtered.filter(s => {
        const name = (s.Name || s.name || '').toLowerCase();
        return name.includes(nameFilter.toLowerCase().trim());
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.Created_At || a.CreatedAt || 0);
      const dateB = new Date(b.Created_At || b.CreatedAt || 0);
      return order === 'newest' ? (dateB as any) - (dateA as any) : (dateA as any) - (dateB as any);
    });

    return filtered;
  };

  // Get user ID helper
  const getUserId = useCallback(() => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const userId = userInfo.Id || userInfo.id;
        if (userId) {
          const parsedId = parseInt(userId);
          if (!isNaN(parsedId) && parsedId > 0) {
            return parsedId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }, []);

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const userId = getUserId();
        if (!userId) {
          setServices([]);
          setFilteredServices([]);
          setLoadingServices(false);
          return;
        }

        // Get all services and filter by hostId (backend doesn't have /host/{hostId} endpoint)
        console.log('[ServicesManagement] Loading services for userId:', userId);
        const response = await axiosInstance.get(API_ENDPOINTS.SERVICE);
        const allServices = response.data || [];
        console.log('[ServicesManagement] Total services from API:', allServices.length);
        // So sánh bằng String để tránh lỗi type mismatch (number vs string)
        const servicesData = allServices.filter((s: any) => {
          const serviceHostId = String(s.HostId || s.hostId || '');
          const currentUserId = String(userId || '');
          return serviceHostId === currentUserId && serviceHostId !== '';
        });
        console.log('[ServicesManagement] Filtered services for host:', servicesData.length, servicesData);
        setServices(servicesData);
        const filtered = applyServiceFilters(servicesData, filterName, sortOrder);
        setFilteredServices(filtered);
        setServiceCurrentPage(1);
        setServicePageInput('');
      } catch (err) {
        console.error('Error loading services:', err);
        if (onError) {
          onError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
        }
        setServices([]);
        setFilteredServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [filterName, sortOrder, getUserId, onError]);

  // Handle service search
  const handleServiceSearch = () => {
    const filtered = applyServiceFilters(services, filterName, sortOrder);
    setFilteredServices(filtered);
    setServiceCurrentPage(1);
    setServicePageInput('');
  };

  // Handle open delete confirm modal
  const handleOpenDeleteModal = (serviceId: number, serviceName: string) => {
    setDeletingServiceId(serviceId);
    setDeletingServiceName(serviceName);
    setIsDeleteModalOpen(true);
  };

  // Handle close delete confirm modal
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingServiceId(null);
    setDeletingServiceName('');
  };

  // Handle confirm delete service
  const handleConfirmDelete = async () => {
    if (!deletingServiceId) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.SERVICE}/${deletingServiceId}`);
      setServices(prevServices => prevServices.filter(s => (s.Id || s.id) !== deletingServiceId));
      setFilteredServices(prevFiltered => prevFiltered.filter(s => (s.Id || s.id) !== deletingServiceId));
      if (onSuccess) onSuccess('Dịch vụ đã được xóa thành công!');
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error deleting service:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi xóa dịch vụ. Vui lòng thử lại.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Service Modal handlers
  const handleCreateServiceInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setCreateServiceFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear svc-admin-error when user starts typing
    if (createServiceErrors[name]) {
      setCreateServiceErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateServiceSubmit = async (e) => {
    e.preventDefault();
    
    if (isCreatingService) return;
    
    setIsCreatingService(true);
    
    // Validate required fields
    if (!createServiceFormData.name || !createServiceFormData.name.trim()) {
      setCreateServiceErrors({ name: 'Tên dịch vụ không được để trống' });
      setIsCreatingService(false);
      return;
    }
    
    if (!createServiceFormData.price || parseFloat(createServiceFormData.price) < 0) {
      setCreateServiceErrors({ price: 'Giá phải là số >= 0' });
      setIsCreatingService(false);
      return;
    }

    try {
      const userId = getUserId();
      if (!userId) {
        if (onError) {
          onError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }
        setIsCreatingService(false);
        return;
      }

      const formData = new FormData();
      formData.append('Name', createServiceFormData.name);
      formData.append('Description', createServiceFormData.description || '');
      formData.append('Price', createServiceFormData.price);
      formData.append('HostId', userId.toString());

      // Không set Content-Type thủ công - để axios tự xử lý boundary cho multipart/form-data
      const response = await axiosInstance.post(API_ENDPOINTS.SERVICE, formData);
      const newService = response.data;
      
      // Add new service to the list
      setServices(prevServices => [newService, ...prevServices]);
      const updatedServices = [newService, ...services];
      const filtered = applyServiceFilters(updatedServices, filterName, sortOrder);
      setFilteredServices(filtered);
      
      if (onSuccess) onSuccess('Dịch vụ được tạo thành công, vui lòng đợi xác nhận từ ban quản lý!');
      
      // Close modal and reset form
      setIsCreateServiceModalOpen(false);
      setCreateServiceFormData({ name: '', description: '', price: '' });
      setCreateServiceErrors({});
    } catch (err) {
      console.error('Error creating service:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi tạo dịch vụ. Vui lòng thử lại.');
      }
    } finally {
      setIsCreatingService(false);
    }
  };

  const handleCloseCreateServiceModal = () => {
    setIsCreateServiceModalOpen(false);
    setCreateServiceFormData({ name: '', description: '', price: '' });
    setCreateServiceErrors({});
  };

  // Edit Service Modal handlers
  const handleOpenEditServiceModal = async (serviceId) => {
    setEditingServiceId(serviceId);
    setIsEditServiceModalOpen(true);
    setEditServiceErrors({});
    setLoadingEditServiceData(true);
    
    try {
      // Load service from API
      const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE}/${serviceId}`);
      const service = response.data;
      
      if (!service) {
        if (onError) onError('Không tìm thấy dịch vụ.');
        setIsEditServiceModalOpen(false);
        setLoadingEditServiceData(false);
        return;
      }
      
      // Populate form with service data
      setEditServiceFormData({
        name: service.Name || service.name || '',
        description: service.Description || service.description || '',
        price: service.Price || service.price || ''
      });
      
    } catch (err) {
      console.error('Error loading service:', err);
      if (onError) {
        onError('Không thể tải thông tin dịch vụ. Vui lòng thử lại.');
      }
      setIsEditServiceModalOpen(false);
    } finally {
      setLoadingEditServiceData(false);
    }
  };

  const handleEditServiceInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setEditServiceFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear svc-admin-error when user starts typing
    if (editServiceErrors[name]) {
      setEditServiceErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditServiceSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditingService) return;
    
    setIsEditingService(true);
    
    // Validate required fields
    if (!editServiceFormData.name || !editServiceFormData.name.trim()) {
      setEditServiceErrors({ name: 'Tên dịch vụ không được để trống' });
      setIsEditingService(false);
      return;
    }
    
    if (!editServiceFormData.price || parseFloat(editServiceFormData.price) < 0) {
      setEditServiceErrors({ price: 'Giá phải là số >= 0' });
      setIsEditingService(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('Name', editServiceFormData.name);
      formData.append('Description', editServiceFormData.description || '');
      formData.append('Price', editServiceFormData.price);

      // Không set Content-Type thủ công - để axios tự xử lý boundary cho multipart/form-data
      const response = await axiosInstance.put(`${API_ENDPOINTS.SERVICE}/${editingServiceId}`, formData);
      const updatedService = response.data;
      
      // Update services
      setServices(prevServices => 
        prevServices.map(s => {
          if ((s.Id || s.id) === editingServiceId) {
            return updatedService;
          }
          return s;
        })
      );
      
      // Update filtered services
      const updatedServices = services.map(s => {
        if ((s.Id || s.id) === editingServiceId) {
          return updatedService;
        }
        return s;
      });
      const filtered = applyServiceFilters(updatedServices, filterName, sortOrder);
      setFilteredServices(filtered);
      
      if (onSuccess) onSuccess('Dịch vụ đã được cập nhật thành công!');
      handleCloseEditServiceModal();
    } catch (err) {
      console.error('Error updating service:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi cập nhật dịch vụ. Vui lòng thử lại.');
      }
    } finally {
      setIsEditingService(false);
    }
  };

  const handleCloseEditServiceModal = () => {
    setIsEditServiceModalOpen(false);
    setEditingServiceId(null);
    setEditServiceFormData({ name: '', description: '', price: '' });
    setEditServiceErrors({});
  };

  // Expose function to open create modal
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setIsCreateServiceModalOpen(true);
    }
  }));

  return (
    <div className="tab-content">
      {loadingServices ? (
        <LoadingSpinner message="Đang tải dịch vụ..." />
      ) : (
        <>
          {/* Services List */}
          {/* Filter Section */}
          <div className="svc-admin-service-filter-container">
            <div className="svc-admin-filter-row">
              <div className="svc-admin-filter-field">
                <label htmlFor="filter-name">Lọc theo tên</label>
                <input
                  id="filter-name"
                  type="text"
                  className="svc-admin-filter-input"
                  placeholder="Nhập tên dịch vụ..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleServiceSearch();
                    }
                  }}
                />
              </div>
              <div className="svc-admin-filter-field">
                <label htmlFor="sort-order">Thứ tự:</label>
                <select
                  id="sort-order"
                  className="svc-admin-filter-select"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setServiceCurrentPage(1);
                    setServicePageInput('');
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <button className="svc-admin-btn-search" onClick={handleServiceSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Services List */}
          {filteredServices.length === 0 ? (
            <div className="svc-admin-empty-state">
              <GridIcon className="svc-admin-empty-state-icon" />
              <h3>Chưa có dịch vụ nào</h3>
              <p>Bạn chưa tạo dịch vụ nào. Hãy tạo dịch vụ mới để bắt đầu!</p>
              <Button variant="default" onClick={() => setIsCreateServiceModalOpen(true)}>
                Tạo dịch vụ mới
              </Button>
            </div>
          ) : (
            <>
              <div className="svc-admin-services-grid">
                {(() => {
                  const totalPages = Math.ceil(filteredServices.length / serviceItemsPerPage);
                  const startIndex = (serviceCurrentPage - 1) * serviceItemsPerPage;
                  const endIndex = startIndex + serviceItemsPerPage;
                  const paginatedServices = filteredServices.slice(startIndex, endIndex);
                  
                  return paginatedServices.map(s => {
                    return (
                      <div key={s.Id || s.id} className="svc-admin-service-card">
                        <div className="svc-admin-service-card-left">
                          <div className="svc-admin-service-details">
                            <h3 className="svc-admin-service-name">{s.Name || s.name}</h3>
                            {s.Description || s.description ? (
                              <p className="svc-admin-service-description">Mô tả: {s.Description || s.description}</p>
                            ) : null}
                            <p className="svc-admin-service-date">Ngày sửa: {s.Updated_At || s.UpdatedAt ? new Date(s.Updated_At || s.UpdatedAt).toLocaleDateString('vi-VN') : 'Không'}</p>
                            <p className="svc-admin-service-price">Giá dịch vụ: {s.Price ? s.Price.toLocaleString('vi-VN') : '0'} VND</p>
                          </div>
                        </div>
                        <div className="svc-admin-service-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-edit-service"
                            onClick={() => {
                              const serviceId = s.Id || s.id;
                              handleOpenEditServiceModal(serviceId);
                            }}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cancel-booking-btn"
                            onClick={() => handleOpenDeleteModal(s.Id || s.id, s.Name || s.name)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredServices.length / serviceItemsPerPage);
                if (totalPages <= 1) return null;
                
                return (
                  <div className="svc-admin-pagination">
                    <button
                      type="button"
                      className="svc-admin-pagination-btn"
                      onClick={() => {
                        const newPage = Math.max(1, serviceCurrentPage - 1);
                        setServiceCurrentPage(newPage);
                        setServicePageInput('');
                      }}
                      disabled={serviceCurrentPage === 1}
                    >
                      <span>←</span> Trước
                    </button>
                    
                    <div className="svc-admin-pagination-controls">
                      <div className="svc-admin-pagination-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            className={`svc-admin-pagination-number ${serviceCurrentPage === page ? 'svc-admin-active' : ''}`}
                            onClick={() => {
                              setServiceCurrentPage(page);
                              setServicePageInput('');
                            }}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Đến trang:</span>
                      <input
                        type="text"
                        value={servicePageInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setServicePageInput(value);
                            const pageNum = parseInt(value);
                            if (value !== '' && pageNum >= 1 && pageNum <= totalPages) {
                              setServiceCurrentPage(pageNum);
                              setServicePageInput('');
                            }
                          }
                        }}
                        placeholder={serviceCurrentPage.toString()}
                        style={{
                          width: '60px',
                          padding: '0.375rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          textAlign: 'center'
                        }}
                        inputMode="numeric"
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="svc-admin-pagination-btn"
                      onClick={() => {
                        const newPage = Math.min(totalPages, serviceCurrentPage + 1);
                        setServiceCurrentPage(newPage);
                        setServicePageInput('');
                      }}
                      disabled={serviceCurrentPage === totalPages}
                    >
                      Sau <span>→</span>
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={isCreateServiceModalOpen}
        onClose={handleCloseCreateServiceModal}
        formData={createServiceFormData}
        errors={createServiceErrors}
        isSubmitting={isCreatingService}
        onInputChange={handleCreateServiceInputChange}
        onSubmit={handleCreateServiceSubmit}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        isOpen={isEditServiceModalOpen}
        onClose={handleCloseEditServiceModal}
        loading={loadingEditServiceData}
        formData={editServiceFormData}
        errors={editServiceErrors}
        isSubmitting={isEditingService}
        onInputChange={handleEditServiceInputChange}
        onSubmit={handleEditServiceSubmit}
      />

      {/* Delete Confirm Modal */}
      {isDeleteModalOpen && (
        <div className="svc-admin-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="svc-admin-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="svc-admin-delete-modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="svc-admin-delete-modal-title">Xác nhận xóa dịch vụ</h3>
            <p className="svc-admin-delete-modal-message">
              Bạn có chắc chắn muốn xóa dịch vụ <strong>"{deletingServiceName}"</strong>?
            </p>
            <p className="svc-admin-delete-modal-warning">
              Hành động này không thể hoàn tác.
            </p>
            <div className="svc-admin-delete-modal-actions">
              <button
                type="button"
                className="svc-admin-delete-modal-btn svc-admin-delete-modal-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="svc-admin-delete-modal-btn svc-admin-delete-modal-btn-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa dịch vụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ServicesManagement.displayName = 'ServicesManagement';

export default ServicesManagement;





