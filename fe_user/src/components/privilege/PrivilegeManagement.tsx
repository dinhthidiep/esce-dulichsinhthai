import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import CreatePrivilegeModal from './CreatePrivilegeModal';
import EditPrivilegeModal from './EditPrivilegeModal';
import './PrivilegeManagement.css';

interface PrivilegeManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface PrivilegeManagementRef {
  openCreateModal: () => void;
}

const PrivilegeManagement = forwardRef<PrivilegeManagementRef, PrivilegeManagementProps>(({ onSuccess, onError }, ref) => {
  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [promotionFilterName, setPromotionFilterName] = useState('');
  const [promotionFilterStatus, setPromotionFilterStatus] = useState('all');
  const [promotionSortOrder, setPromotionSortOrder] = useState('newest');
  const [promotionCurrentPage, setPromotionCurrentPage] = useState(1);
  const [promotionPageInput, setPromotionPageInput] = useState('');
  const [promotionItemsPerPage] = useState(5);
  
  // Create Promotion Modal states
  const [isCreatePromotionModalOpen, setIsCreatePromotionModalOpen] = useState(false);
  const [createPromotionFormData, setCreatePromotionFormData] = useState({
    serviceName: '',
    rank: '',
    userType: ''
  });
  const [createPromotionErrors, setCreatePromotionErrors] = useState({});
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  
  // Edit Promotion Modal states
  const [isEditPromotionModalOpen, setIsEditPromotionModalOpen] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState(null);
  const [editPromotionFormData, setEditPromotionFormData] = useState({
    serviceName: '',
    rank: '',
    userType: ''
  });
  const [editPromotionErrors, setEditPromotionErrors] = useState({});
  const [isEditingPromotion, setIsEditingPromotion] = useState(false);
  
  // Filter and sort function for promotions
  const applyPromotionFilters = useCallback((promotionList, nameFilter, statusFilter, order) => {
    if (!Array.isArray(promotionList) || promotionList.length === 0) {
      return [];
    }
    
    let filtered = [...promotionList];

    // Filter by service name
    if (nameFilter && nameFilter.trim() !== '') {
      filtered = filtered.filter(p => {
        const serviceName = (p.ServiceName || p.serviceName || '').toLowerCase();
        const searchTerm = nameFilter.toLowerCase().trim();
        return serviceName.includes(searchTerm);
      });
    }

    // Filter by status (not used for promotions, but kept for consistency)
    if (statusFilter !== 'all') {
      // Promotions don't have status, so we skip this filter
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.CreatedAt || a.Created_At || 0);
      const dateB = new Date(b.CreatedAt || b.Created_At || 0);
      return order === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, []);

  // Load promotions - use mock data
  useEffect(() => {
    setLoadingPromotions(true);
    
    // Generate mock promotions data (30 promotions)
    const mockPromotions = Array.from({ length: 30 }, (_, i) => {
      const createdDate = new Date(Date.now() - i * 86400000);
      const ranks = ['Đồng', 'Bạc', 'Vàng'];
      const userTypes = ['Khách hàng', 'Công ty'];
      
      return {
        Id: i + 1,
        id: i + 1,
        ServiceName: `Dịch vụ ${i + 1}`,
        serviceName: `Dịch vụ ${i + 1}`,
        Rank: ranks[i % ranks.length],
        rank: ranks[i % ranks.length],
        UserType: userTypes[i % userTypes.length],
        userType: userTypes[i % userTypes.length],
        CreatedAt: createdDate.toISOString(),
        createdAt: createdDate.toISOString()
      };
    });
    
    setPromotions(mockPromotions);
    setLoadingPromotions(false);
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    const filtered = applyPromotionFilters(promotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
    setFilteredPromotions(filtered);
    setPromotionCurrentPage(1);
    setPromotionPageInput('');
  }, [promotionFilterName, promotionFilterStatus, promotionSortOrder, promotions, applyPromotionFilters]);

  // Calculate pagination values using useMemo - with safe defaults
  const paginationData = useMemo(() => {
    const safeFiltered = Array.isArray(filteredPromotions) ? filteredPromotions : [];
    const safeItemsPerPage = promotionItemsPerPage || 5;
    
    if (safeFiltered.length === 0 || !safeItemsPerPage) {
      return {
        totalPages: 1,
        startIndex: 0,
        endIndex: safeItemsPerPage,
        paginatedPromotions: [],
        isLastPage: true
      };
    }
    
    const totalPages = Math.max(1, Math.ceil(safeFiltered.length / safeItemsPerPage));
    const startIndex = Math.max(0, (promotionCurrentPage - 1) * safeItemsPerPage);
    const endIndex = Math.min(startIndex + safeItemsPerPage, safeFiltered.length);
    const paginatedPromotions = safeFiltered.slice(startIndex, endIndex);
    const isLastPage = promotionCurrentPage >= totalPages || totalPages <= 1;
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedPromotions,
      isLastPage
    };
  }, [filteredPromotions, promotionItemsPerPage, promotionCurrentPage]);

  // Handle promotion search
  const handlePromotionSearch = () => {
    const filtered = applyPromotionFilters(promotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
    setFilteredPromotions(filtered);
    setPromotionCurrentPage(1);
    setPromotionPageInput('');
  };

  // Handle open create promotion modal
  const handleOpenCreatePromotionModal = () => {
    setIsCreatePromotionModalOpen(true);
    setCreatePromotionFormData({
      serviceName: '',
      rank: '',
      userType: ''
    });
    setCreatePromotionErrors({});
  };

  // Handle close create promotion modal
  const handleCloseCreatePromotionModal = () => {
    setIsCreatePromotionModalOpen(false);
    setCreatePromotionFormData({
      serviceName: '',
      rank: '',
      userType: ''
    });
    setCreatePromotionErrors({});
  };

  // Handle create promotion submit
  const handleCreatePromotionSubmit = (formData, errors) => {
    if (isCreatingPromotion) return;
    
    setIsCreatingPromotion(true);
    setCreatePromotionErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setIsCreatingPromotion(false);
      return;
    }
    
    // Simulate API call with mock data
    setTimeout(() => {
      const newPromotion = {
        Id: promotions.length + 1,
        id: promotions.length + 1,
        ServiceName: formData.serviceName,
        serviceName: formData.serviceName,
        Rank: formData.rank,
        rank: formData.rank,
        UserType: formData.userType,
        userType: formData.userType,
        CreatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedPromotions = [newPromotion, ...promotions];
      setPromotions(updatedPromotions);
      const filtered = applyPromotionFilters(updatedPromotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
      setFilteredPromotions(filtered);
      
      if (onSuccess) {
        onSuccess('Ưu đãi đã được tạo thành công!');
      }
      handleCloseCreatePromotionModal();
      setIsCreatingPromotion(false);
    }, 500);
  };

  // Handle open edit promotion modal
  const handleOpenEditPromotionModal = (promotionId) => {
    const promotion = promotions.find(p => (p.Id || p.id) === promotionId);
    if (promotion) {
      setEditingPromotionId(promotionId);
      setIsEditPromotionModalOpen(true);
      setEditPromotionFormData({
        serviceName: promotion.ServiceName || promotion.serviceName || '',
        rank: promotion.Rank || promotion.rank || '',
        userType: promotion.UserType || promotion.userType || ''
      });
      setEditPromotionErrors({});
    }
  };

  // Handle close edit promotion modal
  const handleCloseEditPromotionModal = () => {
    setIsEditPromotionModalOpen(false);
    setEditingPromotionId(null);
    setEditPromotionFormData({
      serviceName: '',
      rank: '',
      userType: ''
    });
    setEditPromotionErrors({});
  };

  // Handle edit promotion submit
  const handleEditPromotionSubmit = (formData, errors) => {
    if (isEditingPromotion || !editingPromotionId) return;
    
    setIsEditingPromotion(true);
    setEditPromotionErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setIsEditingPromotion(false);
      return;
    }
    
    // Simulate API call with mock data
    setTimeout(() => {
      const updatedPromotions = promotions.map(p => {
        if ((p.Id || p.id) === editingPromotionId) {
          return {
            ...p,
            ServiceName: formData.serviceName,
            serviceName: formData.serviceName,
            Rank: formData.rank,
            rank: formData.rank,
            UserType: formData.userType,
            userType: formData.userType
          };
        }
        return p;
      });
      
      setPromotions(updatedPromotions);
      const filtered = applyPromotionFilters(updatedPromotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
      setFilteredPromotions(filtered);
      
      if (onSuccess) {
        onSuccess('Ưu đãi đã được cập nhật thành công!');
      }
      handleCloseEditPromotionModal();
      setIsEditingPromotion(false);
    }, 500);
  };

  // Handle delete promotion
  const handleDeletePromotion = (promotionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ưu đãi này?')) {
      const updatedPromotions = promotions.filter(p => (p.Id || p.id) !== promotionId);
      setPromotions(updatedPromotions);
      const filtered = applyPromotionFilters(updatedPromotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
      setFilteredPromotions(filtered);
      
      if (onSuccess) {
        onSuccess('Ưu đãi đã được xóa thành công!');
      }
    }
  };

  // Expose function to open create modal
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      handleOpenCreatePromotionModal();
    }
  }));

  return (
    <div className="privilege-management">
      {loadingPromotions ? (
        <LoadingSpinner message="Đang tải ưu đãi..." />
      ) : (
        <>
          {/* Filter Section */}
          <div className="coupon-filter-container">
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="promotion-filter-name">Lọc theo tên dịch vụ:</label>
                <input
                  id="promotion-filter-name"
                  type="text"
                  className="filter-input"
                  placeholder="Nhập tên dịch vụ..."
                  value={promotionFilterName}
                  onChange={(e) => setPromotionFilterName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePromotionSearch();
                    }
                  }}
                />
              </div>
              <div className="filter-field">
                <label htmlFor="promotion-sort-order">Thứ tự:</label>
                <select
                  id="promotion-sort-order"
                  className="filter-select"
                  value={promotionSortOrder}
                  onChange={(e) => {
                    setPromotionSortOrder(e.target.value);
                    const filtered = applyPromotionFilters(promotions, promotionFilterName, promotionFilterStatus, e.target.value);
                    setFilteredPromotions(filtered);
                    setPromotionCurrentPage(1);
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <button className="btn-search" onClick={handlePromotionSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Promotions List */}
          {filteredPromotions.length === 0 ? (
            <div className="empty-state">
              <GridIcon className="empty-state-icon" />
              <h3>Chưa có ưu đãi nào</h3>
              <p>Không tìm thấy ưu đãi nào phù hợp với bộ lọc của bạn.</p>
            </div>
          ) : (
            <>
              <div className="coupons-table-container">
                <table className="coupons-table promotions-table">
                  <thead>
                    <tr>
                      <th>Tên dịch vụ</th>
                      <th>Hạng người dùng</th>
                      <th>Loại người dùng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginationData.paginatedPromotions.map(promotion => {
                      return (
                        <tr key={promotion.Id || promotion.id}>
                          <td className="promotion-service-name-cell">
                            {promotion.ServiceName || promotion.serviceName || 'Không có'}
                          </td>
                          <td className="promotion-rank-cell">
                            <span className={`rank-badge rank-${(promotion.Rank || promotion.rank || '').toLowerCase().replace(/\s+/g, '-')}`}>
                              {promotion.Rank || promotion.rank || 'Không có'}
                            </span>
                          </td>
                          <td className="promotion-user-type-cell">
                            {promotion.UserType || promotion.userType || 'Không có'}
                          </td>
                          <td className="promotion-actions-cell">
                            <div className="coupon-table-actions">
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-edit-service"
                                onClick={() => handleOpenEditPromotionModal(promotion.Id || promotion.id)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cancel-booking-btn"
                                onClick={() => handleDeletePromotion(promotion.Id || promotion.id)}
                              >
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(!paginationData || paginationData.totalPages <= 1) ? null : (
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => {
                      const newPage = Math.max(1, promotionCurrentPage - 1);
                      setPromotionCurrentPage(newPage);
                      setPromotionPageInput('');
                    }}
                    disabled={promotionCurrentPage === 1}
                  >
                    <span>←</span> Trước
                  </button>
                  
                  <div className="pagination-controls">
                    <div className="pagination-numbers">
                      {Array.from({ length: paginationData?.totalPages || 1 }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          className={`pagination-number ${promotionCurrentPage === page ? 'active' : ''}`}
                          onClick={() => {
                            setPromotionCurrentPage(page);
                            setPromotionPageInput('');
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
                      value={promotionPageInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setPromotionPageInput(value);
                          const pageNum = parseInt(value);
                          const currentTotalPages = paginationData?.totalPages || 1;
                          if (value !== '' && pageNum >= 1 && pageNum <= currentTotalPages) {
                            setPromotionCurrentPage(pageNum);
                            setPromotionPageInput('');
                          }
                        }
                      }}
                      placeholder={promotionCurrentPage.toString()}
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
                      const currentTotalPages = paginationData?.totalPages || 1;
                      const newPage = Math.min(currentTotalPages, promotionCurrentPage + 1);
                      setPromotionCurrentPage(newPage);
                      setPromotionPageInput('');
                    }}
                    disabled={paginationData?.isLastPage ?? false}
                  >
                    Sau <span>→</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Promotion Modal */}
      <CreatePrivilegeModal
        isOpen={isCreatePromotionModalOpen}
        onClose={handleCloseCreatePromotionModal}
        formData={createPromotionFormData}
        errors={createPromotionErrors}
        isSubmitting={isCreatingPromotion}
        onSubmit={handleCreatePromotionSubmit}
      />

      {/* Edit Promotion Modal */}
      <EditPrivilegeModal
        isOpen={isEditPromotionModalOpen}
        onClose={handleCloseEditPromotionModal}
        formData={editPromotionFormData}
        errors={editPromotionErrors}
        isSubmitting={isEditingPromotion}
        onSubmit={handleEditPromotionSubmit}
      />
    </div>
  );
});

PrivilegeManagement.displayName = 'PrivilegeManagement';

export default PrivilegeManagement;
