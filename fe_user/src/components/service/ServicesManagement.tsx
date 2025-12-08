import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import { getImageUrl } from '../../lib/utils';
import CreateServiceModal from './CreateServiceModal';
import EditServiceModal from './EditServiceModal';
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
    price: '',
    image: null
  });
  const [createServiceErrors, setCreateServiceErrors] = useState({});
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Edit Service Modal states
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [loadingEditServiceData, setLoadingEditServiceData] = useState(false);
  const [editServiceFormData, setEditServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null
  });
  const [editServiceErrors, setEditServiceErrors] = useState({});
  const [isEditingService, setIsEditingService] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState(null);

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

  // Load services - use mock data
  useEffect(() => {
    setLoadingServices(true);
    
    // Generate mock services data (30 services)
    const mockServices = Array.from({ length: 30 }, (_, i) => {
      const createdDate = new Date(Date.now() - i * 86400000);
      const updatedDate = new Date(createdDate.getTime() + Math.random() * 86400000);
      
      return {
        Id: `mock-service-${i + 1}`,
        id: `mock-service-${i + 1}`,
        Name: `Dịch vụ ${i + 1}`,
        name: `Dịch vụ ${i + 1}`,
        Description: `Mô tả dịch vụ ${i + 1}. Đây là một dịch vụ chất lượng cao phục vụ khách hàng.`,
        description: `Mô tả dịch vụ ${i + 1}. Đây là một dịch vụ chất lượng cao phục vụ khách hàng.`,
        Price: Math.floor(Math.random() * 5000000) + 1000000,
        price: Math.floor(Math.random() * 5000000) + 1000000,
        Images: '/img/banahills.jpg',
        images: '/img/banahills.jpg',
        CreatedAt: createdDate.toISOString(),
        createdAt: createdDate.toISOString(),
        UpdatedAt: updatedDate.toISOString(),
        Updated_At: updatedDate.toISOString(),
        Status: 'active',
        status: 'active'
      };
    });
    
    setServices(mockServices);
    // Apply initial filters
    const filtered = applyServiceFilters(mockServices, filterName, sortOrder);
    setFilteredServices(filtered);
    // Reset pagination when filter changes
    setServiceCurrentPage(1);
    setServicePageInput('');
    setLoadingServices(false);
  }, [filterName, sortOrder]);

  // Handle service search
  const handleServiceSearch = () => {
    const filtered = applyServiceFilters(services, filterName, sortOrder);
    setFilteredServices(filtered);
    setServiceCurrentPage(1);
    setServicePageInput('');
  };

  // Handle delete service
  const handleDeleteService = (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      // Remove the deleted item from the list (mock data only)
      setServices(prevServices => prevServices.filter(s => (s.Id || s.id) !== serviceId));
      setFilteredServices(prevFiltered => prevFiltered.filter(s => (s.Id || s.id) !== serviceId));
      if (onSuccess) onSuccess('Dịch vụ đã được xóa thành công!');
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

    // Clear error when user starts typing
    if (createServiceErrors[name]) {
      setCreateServiceErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateServiceImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setCreateServiceErrors(prev => ({ ...prev, image: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)' }));
        setImagePreview(null);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setCreateServiceErrors(prev => ({ ...prev, image: 'Kích thước file không được vượt quá 5MB' }));
        setImagePreview(null);
        return;
      }

      // Clear error
      setCreateServiceErrors(prev => ({ ...prev, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);

      // Update formData
      setCreateServiceFormData(prev => ({
        ...prev,
        image: file
      }));
    } else {
      setImagePreview(null);
      setCreateServiceFormData(prev => ({
        ...prev,
        image: null
      }));
    }
  };

  const handleCreateServiceSubmit = (e) => {
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

    // Simulate API delay
    setTimeout(() => {
      // Create new service with mock data
      const newService = {
        Id: `mock-service-${Date.now()}`,
        id: `mock-service-${Date.now()}`,
        Name: createServiceFormData.name,
        name: createServiceFormData.name,
        Description: createServiceFormData.description || '',
        description: createServiceFormData.description || '',
        Price: parseFloat(createServiceFormData.price),
        price: parseFloat(createServiceFormData.price),
        Images: imagePreview || '/img/banahills.jpg',
        images: imagePreview || '/img/banahills.jpg',
        CreatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        Updated_At: new Date().toISOString(),
        Status: 'active',
        status: 'active'
      };
      
      // Add new service to the list
      setServices(prevServices => [newService, ...prevServices]);
      const updatedServices = [newService, ...services];
      const filtered = applyServiceFilters(updatedServices, filterName, sortOrder);
      setFilteredServices(filtered);
      
      if (onSuccess) onSuccess('Dịch vụ được tạo thành công, vui lòng đợi xác nhận từ ban quản lý!');
      
      // Close modal and reset form
      setIsCreateServiceModalOpen(false);
      setCreateServiceFormData({ name: '', description: '', price: '', image: null });
      setCreateServiceErrors({});
      setImagePreview(null);
      setIsCreatingService(false);
    }, 500);
  };

  const handleCloseCreateServiceModal = () => {
    setIsCreateServiceModalOpen(false);
    setCreateServiceFormData({ name: '', description: '', price: '', image: null });
    setCreateServiceErrors({});
    setImagePreview(null);
  };

  // Edit Service Modal handlers
  const handleOpenEditServiceModal = (serviceId) => {
    setEditingServiceId(serviceId);
    setIsEditServiceModalOpen(true);
    setEditServiceErrors({});
    setEditImagePreview(null);
    setLoadingEditServiceData(true);
    
    // Simulate loading delay
    setTimeout(() => {
      // Get service from state (mock data only)
      const service = services.find(s => (s.Id || s.id) === serviceId);
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
        price: service.Price || service.price || '',
        image: null
      });
      
      // Set image preview if service has images
      if (service.Images || service.images) {
        let imagePath = service.Images || service.images;
        if (typeof imagePath === 'string' && imagePath.includes(',')) {
          imagePath = imagePath.split(',')[0].trim();
        }
        if (imagePath) {
          const imageUrl = getImageUrl(imagePath, '/img/banahills.jpg');
          setEditImagePreview(imageUrl);
        }
      }
      
      setLoadingEditServiceData(false);
    }, 300);
  };

  const handleEditServiceInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setEditServiceFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error when user starts typing
    if (editServiceErrors[name]) {
      setEditServiceErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditServiceImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setEditServiceErrors(prev => ({ ...prev, image: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)' }));
        setEditImagePreview(null);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setEditServiceErrors(prev => ({ ...prev, image: 'Kích thước file không được vượt quá 5MB' }));
        setEditImagePreview(null);
        return;
      }

      // Clear error
      setEditServiceErrors(prev => ({ ...prev, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);

      // Update formData
      setEditServiceFormData(prev => ({
        ...prev,
        image: file
      }));
    } else {
      setEditImagePreview(null);
      setEditServiceFormData(prev => ({
        ...prev,
        image: null
      }));
    }
  };

  const handleEditServiceSubmit = (e) => {
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

    // Simulate API delay
    setTimeout(() => {
      // Update service in state (mock data only)
      setServices(prevServices => 
        prevServices.map(s => {
          if ((s.Id || s.id) === editingServiceId) {
            return {
              ...s,
              Name: editServiceFormData.name,
              name: editServiceFormData.name,
              Description: editServiceFormData.description || '',
              description: editServiceFormData.description || '',
              Price: parseFloat(editServiceFormData.price),
              price: parseFloat(editServiceFormData.price),
              Images: editImagePreview || s.Images || '/img/banahills.jpg',
              images: editImagePreview || s.images || '/img/banahills.jpg',
              UpdatedAt: new Date().toISOString(),
              Updated_At: new Date().toISOString()
            };
          }
          return s;
        })
      );
      
      // Update filtered services
      const updatedServices = services.map(s => {
        if ((s.Id || s.id) === editingServiceId) {
          return {
            ...s,
            Name: editServiceFormData.name,
            name: editServiceFormData.name,
            Description: editServiceFormData.description || '',
            description: editServiceFormData.description || '',
            Price: parseFloat(editServiceFormData.price),
            price: parseFloat(editServiceFormData.price),
            Images: editImagePreview || s.Images || '/img/banahills.jpg',
            images: editImagePreview || s.images || '/img/banahills.jpg',
            UpdatedAt: new Date().toISOString(),
            Updated_At: new Date().toISOString()
          };
        }
        return s;
      });
      const filtered = applyServiceFilters(updatedServices, filterName, sortOrder);
      setFilteredServices(filtered);
      
      if (onSuccess) onSuccess('Dịch vụ đã được cập nhật thành công!');
      handleCloseEditServiceModal();
      setIsEditingService(false);
    }, 500);
  };

  const handleCloseEditServiceModal = () => {
    setIsEditServiceModalOpen(false);
    setEditingServiceId(null);
    setEditServiceFormData({ name: '', description: '', price: '', image: null });
    setEditServiceErrors({});
    setEditImagePreview(null);
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
          <div className="service-filter-container">
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="filter-name">Lọc theo tên</label>
                <input
                  id="filter-name"
                  type="text"
                  className="filter-input"
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
              <div className="filter-field">
                <label htmlFor="sort-order">Thứ tự:</label>
                <select
                  id="sort-order"
                  className="filter-select"
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
              <button className="btn-search" onClick={handleServiceSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Services List */}
          {filteredServices.length === 0 ? (
            <div className="empty-state">
              <GridIcon className="empty-state-icon" />
              <h3>Chưa có dịch vụ nào</h3>
              <p>Bạn chưa tạo dịch vụ nào. Hãy tạo dịch vụ mới để bắt đầu!</p>
              <Button variant="default" onClick={() => setIsCreateServiceModalOpen(true)}>
                Tạo dịch vụ mới
              </Button>
            </div>
          ) : (
            <>
              <div className="services-grid">
                {(() => {
                  const totalPages = Math.ceil(filteredServices.length / serviceItemsPerPage);
                  const startIndex = (serviceCurrentPage - 1) * serviceItemsPerPage;
                  const endIndex = startIndex + serviceItemsPerPage;
                  const paginatedServices = filteredServices.slice(startIndex, endIndex);
                  
                  return paginatedServices.map(s => {
                    // Handle service images - get first image if multiple
                    let serviceImagePath = s.Images || s.images || '';
                    if (serviceImagePath && typeof serviceImagePath === 'string' && serviceImagePath.includes(',')) {
                      serviceImagePath = serviceImagePath.split(',')[0].trim();
                    }
                    const serviceImage = getImageUrl(serviceImagePath, '/img/banahills.jpg');
                    
                    return (
                      <div key={s.Id || s.id} className="service-card">
                        <div className="service-card-left">
                          <div className="service-image">
                            <img
                              src={serviceImage || '/img/banahills.jpg'}
                              alt={s.Name || s.name}
                              className="service-image-img"
                              onError={(e) => {
                                if (e.currentTarget.src !== '/img/banahills.jpg') {
                                  e.currentTarget.src = '/img/banahills.jpg';
                                }
                              }}
                            />
                          </div>
                          <div className="service-details">
                            <h3 className="service-name">{s.Name || s.name}</h3>
                            {s.Description || s.description ? (
                              <p className="service-description">Mô tả: {s.Description || s.description}</p>
                            ) : null}
                            <p className="service-date">Ngày sửa: {s.Updated_At || s.UpdatedAt ? new Date(s.Updated_At || s.UpdatedAt).toLocaleDateString('vi-VN') : 'Không'}</p>
                            <p className="service-price">Giá dịch vụ: {s.Price ? s.Price.toLocaleString('vi-VN') : '0'} VND</p>
                          </div>
                        </div>
                        <div className="service-actions">
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
                            onClick={() => handleDeleteService(s.Id || s.id)}
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
                  <div className="pagination">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => {
                        const newPage = Math.max(1, serviceCurrentPage - 1);
                        setServiceCurrentPage(newPage);
                        setServicePageInput('');
                      }}
                      disabled={serviceCurrentPage === 1}
                    >
                      <span>←</span> Trước
                    </button>
                    
                    <div className="pagination-controls">
                      <div className="pagination-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            className={`pagination-number ${serviceCurrentPage === page ? 'active' : ''}`}
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
                      className="pagination-btn"
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
        imagePreview={imagePreview}
        isSubmitting={isCreatingService}
        onInputChange={handleCreateServiceInputChange}
        onImageChange={handleCreateServiceImageChange}
        onSubmit={handleCreateServiceSubmit}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        isOpen={isEditServiceModalOpen}
        onClose={handleCloseEditServiceModal}
        loading={loadingEditServiceData}
        formData={editServiceFormData}
        errors={editServiceErrors}
        imagePreview={editImagePreview}
        isSubmitting={isEditingService}
        onInputChange={handleEditServiceInputChange}
        onImageChange={handleEditServiceImageChange}
        onSubmit={handleEditServiceSubmit}
      />
    </div>
  );
});

ServicesManagement.displayName = 'ServicesManagement';

export default ServicesManagement;
