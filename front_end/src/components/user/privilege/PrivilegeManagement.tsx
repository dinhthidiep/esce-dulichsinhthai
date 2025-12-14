import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import CreatePrivilegeModal from './CreatePrivilegeModal';
import EditPrivilegeModal from './EditPrivilegeModal';
import DeletePrivilegeModal from './DeletePrivilegeModal';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS, API_BASE_URL } from '~/config/api';
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
  
  // Edit Promotion Modal states
  const [isEditPromotionModalOpen, setIsEditPromotionModalOpen] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  
  // Delete Promotion Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPromotion, setDeletingPromotion] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Load promotions (bonus services) from API
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setLoadingPromotions(true);
        const userId = getUserId();
        if (!userId) {
          setPromotions([]);
          return;
        }

        const response = await axiosInstance.get(`${API_BASE_URL}/BonusService/host/${userId}`);
        const bonusServices = response.data || [];
        setPromotions(bonusServices);
      } catch (err) {
        console.error('Error loading promotions:', err);
        if (onError) {
          onError('Không thể tải danh sách ưu đãi. Vui lòng thử lại.');
        }
        setPromotions([]);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, [onError, getUserId]);

  // Apply filters when filter values change
  useEffect(() => {
    const filtered = applyPromotionFilters(promotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
    setFilteredPromotions(filtered);
    setPromotionCurrentPage(1);
    setPromotionPageInput('');
  }, [promotionFilterName, promotionFilterStatus, promotionSortOrder, promotions, applyPromotionFilters]);

  // Calculate priv-mgr-pagination values using useMemo - with safe defaults
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
  };

  // Handle close create promotion modal
  const handleCloseCreatePromotionModal = () => {
    setIsCreatePromotionModalOpen(false);
  };

  // Handle open edit promotion modal
  const handleOpenEditPromotionModal = (promotionId: number) => {
    setEditingPromotionId(promotionId);
    setIsEditPromotionModalOpen(true);
  };

  // Handle close edit promotion modal
  const handleCloseEditPromotionModal = () => {
    setIsEditPromotionModalOpen(false);
    setEditingPromotionId(null);
  };

  // Handle open delete modal
  const handleOpenDeleteModal = (promotionId: number, promotionName: string) => {
    setDeletingPromotion({ id: promotionId, name: promotionName });
    setIsDeleteModalOpen(true);
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingPromotion(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingPromotion) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`${API_BASE_URL}/BonusService/${deletingPromotion.id}`);
      
      const updatedPromotions = promotions.filter(p => (p.Id || p.id) !== deletingPromotion.id);
      setPromotions(updatedPromotions);
      const filtered = applyPromotionFilters(updatedPromotions, promotionFilterName, promotionFilterStatus, promotionSortOrder);
      setFilteredPromotions(filtered);
      
      if (onSuccess) {
        onSuccess('Ưu đãi đã được xóa thành công!');
      }
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi xóa ưu đãi. Vui lòng thử lại.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Expose function to open create modal
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      handleOpenCreatePromotionModal();
    }
  }));

  return (
    <div className="priv-mgr-privilege-management">
      {loadingPromotions ? (
        <LoadingSpinner message="Đang tải ưu đãi..." />
      ) : (
        <>
          {/* Filter Section */}
          <div className="priv-mgr-coupon-filter-container">
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
            <div className="priv-mgr-empty-state">
              <GridIcon className="priv-mgr-empty-state-icon" />
              <h3>Chưa có ưu đãi nào</h3>
              <p>Không tìm thấy ưu đãi nào phù hợp với bộ lọc của bạn.</p>
            </div>
          ) : (
            <>
              <div className="priv-mgr-coupons-table-container">
                <table className="priv-mgr-coupons-table promotions-table">
                  <thead>
                    <tr>
                      <th>Tên dịch vụ</th>
                      <th>Giá gốc</th>
                      <th>Đối tượng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginationData.paginatedPromotions.map(promotion => {
                      const name = promotion.Name || promotion.name || 'Không có';
                      const price = promotion.Price || promotion.price || 0;
                      const targetAudienceStr = promotion.TargetAudience || promotion.targetAudience;
                      
                      // Parse target audience
                      let targetDisplay = 'Chưa thiết lập';
                      if (targetAudienceStr) {
                        try {
                          const ta = JSON.parse(targetAudienceStr);
                          const parts: string[] = [];
                          if (ta.forAgency) {
                            const levels: string[] = [];
                            if (ta.agencyLevels?.level1) levels.push('Đồng');
                            if (ta.agencyLevels?.level2) levels.push('Bạc');
                            if (ta.agencyLevels?.level3) levels.push('Vàng');
                            if (levels.length > 0) parts.push(`🏢 Agency (${levels.join(', ')})`);
                          }
                          if (ta.forTourist) {
                            const levels: string[] = [];
                            if (ta.touristLevels?.level1) levels.push('Đồng');
                            if (ta.touristLevels?.level2) levels.push('Bạc');
                            if (ta.touristLevels?.level3) levels.push('Vàng');
                            if (levels.length > 0) parts.push(`🧳 Tourist (${levels.join(', ')})`);
                          }
                          if (parts.length > 0) targetDisplay = parts.join(' | ');
                        } catch (e) {
                          console.error('Error parsing target audience:', e);
                        }
                      }
                      
                      return (
                        <tr key={promotion.Id || promotion.id}>
                          <td className="priv-mgr-promotion-service-name-cell">
                            {name}
                          </td>
                          <td className="priv-mgr-promotion-price-cell">
                            {price.toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="priv-mgr-promotion-target-cell">
                            <span className="priv-mgr-target-badge">
                              {targetDisplay}
                            </span>
                          </td>
                          <td className="priv-mgr-promotion-actions-cell">
                            <div className="priv-mgr-coupon-table-actions">
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
                                onClick={() => handleOpenDeleteModal(promotion.Id || promotion.id, name)}
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
                <div className="priv-mgr-pagination">
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
        hostId={getUserId()}
        onSuccess={onSuccess}
        onError={onError}
        onCreated={() => {
          // Reload promotions after creation
          const loadPromotions = async () => {
            try {
              const userId = getUserId();
              if (!userId) return;
              const response = await axiosInstance.get(`${API_BASE_URL}/BonusService/host/${userId}`);
              setPromotions(response.data || []);
            } catch (err) {
              console.error('Error reloading promotions:', err);
            }
          };
          loadPromotions();
        }}
      />

      {/* Edit Promotion Modal */}
      <EditPrivilegeModal
        isOpen={isEditPromotionModalOpen}
        onClose={handleCloseEditPromotionModal}
        hostId={getUserId()}
        bonusService={promotions.find(p => (p.Id || p.id) === editingPromotionId) || null}
        onSuccess={onSuccess}
        onError={onError}
        onUpdated={() => {
          // Reload promotions after update
          const loadPromotions = async () => {
            try {
              const userId = getUserId();
              if (!userId) return;
              const response = await axiosInstance.get(`${API_BASE_URL}/BonusService/host/${userId}`);
              setPromotions(response.data || []);
            } catch (err) {
              console.error('Error reloading promotions:', err);
            }
          };
          loadPromotions();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeletePrivilegeModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        serviceName={deletingPromotion?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
});

PrivilegeManagement.displayName = 'PrivilegeManagement';

export default PrivilegeManagement;





