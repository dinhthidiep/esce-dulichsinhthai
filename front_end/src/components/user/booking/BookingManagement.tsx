import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../LoadingSpinner';
import { CalendarIcon, UserIcon } from '../icons/index';
import BookingConfirmationModal from './BookingConfirmationModal';
import { formatPrice, getImageUrl } from '~/lib/utils';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './BookingManagement.css';

interface BookingManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ onSuccess, onError }) => {
  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingServiceNameFilter, setBookingServiceNameFilter] = useState('');
  const [bookingUserNameFilter, setBookingUserNameFilter] = useState('');
  const [bookingSortOrder, setBookingSortOrder] = useState('newest');
  const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
  const [bookingPageInput, setBookingPageInput] = useState('');
  const [bookingItemsPerPage] = useState(5);
  
  // Booking Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalData, setBookingModalData] = useState({ bookingId: null, action: '', notes: '' });
  
  // Booking Detail Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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

  // Load bookings from API
  useEffect(() => {
    const loadBookings = async () => {
      const userId = getUserId();
      if (!userId) {
        setLoadingBookings(false);
        setBookings([]);
        return;
      }

      try {
        setLoadingBookings(true);
        // Get bookings for host's service combos
        // First get all service combos for this host, then get bookings for those combos
        const serviceCombosResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${userId}`);
        const serviceCombos = serviceCombosResponse.data || [];
        const comboIds = serviceCombos.map((c: any) => c.Id || c.id).filter((id: any) => id);
        
        // Get bookings for each service combo
        const allBookings: any[] = [];
        for (const comboId of comboIds) {
          try {
            const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/combo/${comboId}`);
            const comboBookings = bookingsResponse.data || [];
            allBookings.push(...comboBookings);
          } catch (err) {
            // Ignore 404 for combos without bookings
            if ((err as any)?.response?.status !== 404) {
              console.error(`Error loading bookings for combo ${comboId}:`, err);
            }
          }
        }
        
        setBookings(allBookings);
      } catch (err) {
        console.error('Error loading bookings:', err);
        if (onError) {
          onError('Không thể tải danh sách booking. Vui lòng thử lại.');
        }
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, [getUserId, onError]);

  // Filter and sort bookings
  useEffect(() => {
    let filtered = [...bookings];

    // Filter by status
    if (bookingStatusFilter && bookingStatusFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const status = (booking.Status || booking.status || '').toLowerCase();
        return status === bookingStatusFilter.toLowerCase();
      });
    }

    // Filter by service name
    if (bookingServiceNameFilter && bookingServiceNameFilter.trim() !== '') {
      filtered = filtered.filter(booking => {
        const serviceCombo = booking.ServiceCombo || booking.serviceCombo;
        const serviceName = serviceCombo?.Name || serviceCombo?.name || '';
        return serviceName.toLowerCase().includes(bookingServiceNameFilter.toLowerCase().trim());
      });
    }

    // Filter by user name
    if (bookingUserNameFilter && bookingUserNameFilter.trim() !== '') {
      filtered = filtered.filter(booking => {
        const user = booking.User || booking.user || {};
        const userName = user.Name || user.name || '';
        return userName.toLowerCase().includes(bookingUserNameFilter.toLowerCase().trim());
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.BookingDate || a.bookingDate || 0);
      const dateB = new Date(b.BookingDate || b.bookingDate || 0);
      
      if (bookingSortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    setFilteredBookings(filtered);
    setBookingCurrentPage(1);
    setBookingPageInput('');
  }, [bookings, bookingStatusFilter, bookingServiceNameFilter, bookingUserNameFilter, bookingSortOrder]);

  // Paginated bookings
  const paginatedBookings = useMemo(() => {
    const totalPages = Math.ceil(filteredBookings.length / bookingItemsPerPage);
    const startIndex = (bookingCurrentPage - 1) * bookingItemsPerPage;
    const endIndex = startIndex + bookingItemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, bookingCurrentPage, bookingItemsPerPage]);

  const bookingTotalPages = Math.ceil(filteredBookings.length / bookingItemsPerPage);

  // Helper functions
  const formatBookingDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getBookingStatusDisplay = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending':
        return { text: 'Đã xử lý', className: 'booking-mgr-status-pending' };
      case 'confirmed':
        return { text: 'Đã xác nhận', className: 'booking-mgr-status-confirmed' };
      case 'completed':
        return { text: 'Đã hoàn thành', className: 'booking-mgr-status-completed' };
      case 'cancelled':
        return { text: 'Đã hủy', className: 'booking-mgr-status-cancelled' };
      default:
        return { text: 'Đã xử lý', className: 'booking-mgr-status-pending' };
    }
  };

  // Booking handlers
  const handleAcceptBooking = (bookingId, currentNotes) => {
    setBookingModalData({
      bookingId: bookingId,
      action: 'accept',
      notes: currentNotes || ''
    });
    setShowBookingModal(true);
  };

  const handleRejectBooking = (bookingId, currentNotes) => {
    setBookingModalData({
      bookingId: bookingId,
      action: 'reject',
      notes: currentNotes || ''
    });
    setShowBookingModal(true);
  };

  const handleCompleteBooking = (bookingId, currentNotes) => {
    setBookingModalData({
      bookingId: bookingId,
      action: 'complete',
      notes: currentNotes || ''
    });
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setBookingModalData({ bookingId: null, action: '', notes: '' });
  };

  const handleConfirmBookingAction = async () => {
    const { bookingId, action, notes } = bookingModalData;
    
    let newStatus;
    let actionText;
    if (action === 'accept') {
      newStatus = 'confirmed';
      actionText = 'chấp nhận';
    } else if (action === 'reject') {
      newStatus = 'cancelled';
      actionText = 'từ chối';
    } else if (action === 'complete') {
      newStatus = 'completed';
      actionText = 'hoàn thành';
    } else {
      if (onError) {
        onError('Hành động không hợp lệ');
      }
      return;
    }
    
    try {
      // Update booking status via API - dùng endpoint /status riêng
      await axiosInstance.put(`${API_ENDPOINTS.BOOKING}/${bookingId}/status`, newStatus, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => {
          const id = booking.Id || booking.id;
          if (id === bookingId) {
            return {
              ...booking,
              Status: newStatus,
              status: newStatus,
              Notes: notes || booking.Notes || booking.notes || '',
              notes: notes || booking.Notes || booking.notes || ''
            };
          }
          return booking;
        })
      );
      
      if (onSuccess) {
        onSuccess(`Đã ${actionText} booking thành công!`);
      }
      handleCloseBookingModal();
    } catch (err) {
      console.error('Error updating booking:', err);
      if (onError) {
        onError(`Có lỗi xảy ra khi ${actionText} booking. Vui lòng thử lại.`);
      }
    }
  };

  return (
    <div className="booking-mgr-booking-management">
      {loadingBookings ? (
        <LoadingSpinner message="Đang tải danh sách booking..." />
      ) : (
        <>
          {/* Filters */}
          <div className="booking-mgr-booking-filter-container">
            <div className="booking-mgr-filter-row">
              <div className="booking-mgr-filter-group">
                <label htmlFor="booking-status-filter" className="booking-mgr-filter-label">Trạng thái</label>
                <select 
                  id="booking-status-filter"
                  className="booking-mgr-filter-select"
                  value={bookingStatusFilter}
                  onChange={(e) => {
                    setBookingStatusFilter(e.target.value);
                    setBookingCurrentPage(1);
                    setBookingPageInput('');
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Đã xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="booking-mgr-filter-group">
                <label htmlFor="booking-service-name-filter" className="booking-mgr-filter-label">Tên dịch vụ</label>
                <input
                  type="text"
                  id="booking-service-name-filter"
                  className="booking-mgr-filter-select"
                  value={bookingServiceNameFilter}
                  onChange={(e) => {
                    setBookingServiceNameFilter(e.target.value);
                    setBookingCurrentPage(1);
                    setBookingPageInput('');
                  }}
                  placeholder="Tìm theo tên dịch vụ..."
                  style={{ minWidth: '200px' }}
                />
              </div>

              <div className="booking-mgr-filter-group">
                <label htmlFor="booking-user-name-filter" className="booking-mgr-filter-label">Tên người dùng</label>
                <input
                  type="text"
                  id="booking-user-name-filter"
                  className="booking-mgr-filter-select"
                  value={bookingUserNameFilter}
                  onChange={(e) => {
                    setBookingUserNameFilter(e.target.value);
                    setBookingCurrentPage(1);
                    setBookingPageInput('');
                  }}
                  placeholder="Tìm theo tên người dùng..."
                  style={{ minWidth: '200px' }}
                />
              </div>

              <div className="booking-mgr-filter-group">
                <label htmlFor="booking-sort-order" className="booking-mgr-filter-label">Sắp xếp</label>
                <select 
                  id="booking-sort-order"
                  className="booking-mgr-filter-select"
                  value={bookingSortOrder}
                  onChange={(e) => {
                    setBookingSortOrder(e.target.value);
                    setBookingCurrentPage(1);
                    setBookingPageInput('');
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="booking-mgr-empty-state">
              <CalendarIcon className="booking-mgr-empty-state-icon" />
              <h3>Không có booking nào</h3>
              <p>Bạn chưa có booking nào.</p>
            </div>
          ) : (
            <div className="booking-mgr-bookings-list">
              {paginatedBookings.map((booking) => {
                const statusDisplay = getBookingStatusDisplay(booking.Status || booking.status);
                const bookingId = booking.Id || booking.id;
                const serviceCombo = booking.ServiceCombo || booking.serviceCombo;
                const serviceName = serviceCombo?.Name || serviceCombo?.name || 'Dịch vụ';
                // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên
                let imagePath = serviceCombo?.Image || serviceCombo?.image || '';
                if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
                  imagePath = imagePath.split(',')[0].trim();
                }
                const serviceImage = getImageUrl(imagePath, '/img/banahills.jpg');
                const bookingDate = booking.BookingDate || booking.bookingDate;
                const startDate = booking.StartDate || booking.startDate || booking.START_DATE;
                const endDate = booking.EndDate || booking.endDate || booking.END_DATE;
                const quantity = booking.Quantity || booking.quantity || 0;
                const totalAmount = booking.TotalAmount || booking.totalAmount || 0;
                const notes = booking.Notes || booking.notes || 'Không có ghi chú';
                const status = (booking.Status || booking.status || '').toLowerCase();
                const user = booking.User || booking.user || {};
                const userName = user.FullName || user.fullName || user.Name || user.name || 'N/A';
                const isPending = status === 'pending';
                const isConfirmed = status === 'confirmed';
                
                return (
                  <div key={bookingId} className="booking-mgr-booking-card ui-card">
                    <div className="booking-mgr-booking-card-content">
                      {/* Part 1: Main Info */}
                      <div className="booking-mgr-booking-card-main">
                        <div className="booking-mgr-booking-card-header">
                          <div className="booking-mgr-booking-card-left">
                            <div className="booking-mgr-booking-image">
                              <img
                                src={serviceImage}
                                alt={serviceName}
                                className="booking-mgr-booking-image-img"
                                onError={(e) => {
                                  e.currentTarget.src = '/img/banahills.jpg';
                                }}
                              />
                            </div>
                            <div className="booking-mgr-booking-info">
                              <div className="booking-mgr-booking-title-row">
                                <h3 className="booking-mgr-booking-service-name">{serviceName}</h3>
                                <Badge className={`booking-mgr-status-badge ${statusDisplay.className}`}>
                                  {statusDisplay.text}
                                </Badge>
                              </div>
                              <div className="booking-mgr-booking-details">
                                <div className="booking-mgr-booking-detail-item">
                                  <span className="booking-mgr-booking-info-label">Người đặt:</span>
                                  <span className="booking-mgr-booking-info-value">{userName}</span>
                                </div>
                                {bookingDate && (
                                  <div className="booking-mgr-booking-detail-item">
                                    <CalendarIcon className="booking-mgr-detail-icon" />
                                    <span>Ngày đặt: {formatBookingDate(bookingDate)}</span>
                                  </div>
                                )}
                                {startDate && (
                                  <div className="booking-mgr-booking-detail-item">
                                    <CalendarIcon className="booking-mgr-detail-icon" />
                                    <span>
                                      {formatBookingDate(startDate)}
                                      {endDate && ` - ${formatBookingDate(endDate)}`}
                                    </span>
                                  </div>
                                )}
                                {quantity > 0 && (
                                  <div className="booking-mgr-booking-detail-item">
                                    <UserIcon className="booking-mgr-detail-icon" />
                                    <span>Số người: {quantity}</span>
                                  </div>
                                )}
                                {totalAmount > 0 && (
                                  <div className="booking-mgr-booking-detail-item">
                                    <span className="booking-mgr-booking-price">
                                      Tổng tiền: {formatCurrency(totalAmount)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="booking-mgr-booking-card-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-view-detail"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailModal(true);
                              }}
                            >
                              Xem chi tiết
                            </Button>
                            {isPending && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="btn-edit-service"
                                  onClick={() => handleAcceptBooking(bookingId, notes)}
                                >
                                  Chấp nhận
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cancel-booking-btn"
                                  onClick={() => handleRejectBooking(bookingId, notes)}
                                >
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {isConfirmed && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-edit-service"
                                onClick={() => handleCompleteBooking(bookingId, notes)}
                              >
                                Hoàn thành
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Part 2: Notes */}
                      <div className="booking-mgr-booking-card-notes">
                        <div className="booking-mgr-booking-notes">
                          <span className="booking-mgr-booking-info-label">Ghi chú:</span>
                          <span className="booking-mgr-booking-info-value">{notes || 'Không có ghi chú'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Pagination */}
              {bookingTotalPages > 1 && (
                <div className="booking-mgr-pagination">
                  <button
                    type="button"
                    className="booking-mgr-pagination-btn"
                    onClick={() => {
                      const newPage = Math.max(1, bookingCurrentPage - 1);
                      setBookingCurrentPage(newPage);
                      setBookingPageInput('');
                    }}
                    disabled={bookingCurrentPage === 1}
                  >
                    <span>←</span> Trước
                  </button>
                  
                  <div className="booking-mgr-pagination-controls">
                    <div className="booking-mgr-pagination-numbers">
                      {Array.from({ length: bookingTotalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          className={`booking-mgr-pagination-number ${bookingCurrentPage === page ? 'booking-mgr-active' : ''}`}
                          onClick={() => {
                            setBookingCurrentPage(page);
                            setBookingPageInput('');
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
                      value={bookingPageInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setBookingPageInput(value);
                          const pageNum = parseInt(value);
                          if (value !== '' && pageNum >= 1 && pageNum <= bookingTotalPages) {
                            setBookingCurrentPage(pageNum);
                            setBookingPageInput('');
                          }
                        }
                      }}
                      placeholder={bookingCurrentPage.toString()}
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
                    className="booking-mgr-pagination-btn"
                    onClick={() => {
                      const newPage = Math.min(bookingTotalPages, bookingCurrentPage + 1);
                      setBookingCurrentPage(newPage);
                      setBookingPageInput('');
                    }}
                    disabled={bookingCurrentPage === bookingTotalPages}
                  >
                    Sau <span>→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        modalData={bookingModalData}
        onConfirm={handleConfirmBookingAction}
        onModalDataChange={setBookingModalData}
      />

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="booking-detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-detail-modal-header">
              <h2>Chi tiết đơn đặt hàng</h2>
              <button 
                className="booking-detail-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="booking-detail-modal-content">
              {/* Service Info */}
              <div className="booking-detail-section">
                <h3>Thông tin dịch vụ</h3>
                <div className="booking-detail-service">
                  <img 
                    src={getImageUrl(
                      (selectedBooking.ServiceCombo?.Image || selectedBooking.serviceCombo?.image || '').split(',')[0]?.trim(),
                      '/img/banahills.jpg'
                    )}
                    alt="Service"
                    className="booking-detail-service-image"
                  />
                  <div className="booking-detail-service-info">
                    <h4>{selectedBooking.ServiceCombo?.Name || selectedBooking.serviceCombo?.name || 'Dịch vụ'}</h4>
                    <p>{selectedBooking.ServiceCombo?.Address || selectedBooking.serviceCombo?.address || ''}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="booking-detail-section">
                <h3>Thông tin người đặt</h3>
                <div className="booking-detail-grid">
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Họ tên:</span>
                    <span className="booking-detail-value">
                      {selectedBooking.User?.Name || selectedBooking.user?.name || selectedBooking.User?.FullName || selectedBooking.user?.fullName || 'N/A'}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Email:</span>
                    <span className="booking-detail-value">
                      {selectedBooking.User?.Email || selectedBooking.user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Số điện thoại:</span>
                    <span className="booking-detail-value">
                      {selectedBooking.User?.Phone || selectedBooking.user?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="booking-detail-section">
                <h3>Thông tin đặt hàng</h3>
                <div className="booking-detail-grid">
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Mã đơn:</span>
                    <span className="booking-detail-value">
                      {selectedBooking.BookingNumber || selectedBooking.bookingNumber || `#${selectedBooking.Id || selectedBooking.id}`}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Ngày đặt:</span>
                    <span className="booking-detail-value">
                      {formatBookingDate(selectedBooking.BookingDate || selectedBooking.bookingDate)}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Số người:</span>
                    <span className="booking-detail-value">
                      {selectedBooking.Quantity || selectedBooking.quantity || 0}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Đơn giá:</span>
                    <span className="booking-detail-value">
                      {formatCurrency(selectedBooking.UnitPrice || selectedBooking.unitPrice || 0)}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Tổng tiền:</span>
                    <span className="booking-detail-value booking-detail-total">
                      {formatCurrency(selectedBooking.TotalAmount || selectedBooking.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Trạng thái:</span>
                    <Badge className={`booking-mgr-status-badge ${getBookingStatusDisplay(selectedBooking.Status || selectedBooking.status).className}`}>
                      {getBookingStatusDisplay(selectedBooking.Status || selectedBooking.status).text}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="booking-detail-section">
                <h3>Ghi chú</h3>
                <p className="booking-detail-notes">
                  {selectedBooking.Notes || selectedBooking.notes || 'Không có ghi chú'}
                </p>
              </div>
            </div>
            <div className="booking-detail-modal-footer">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;





