import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { CalendarIcon, StarIcon, CommentIcon, MoreVerticalIcon, AlertCircleIcon } from '../icons/index';
import ReplyReviewModal from './ReplyReviewModal';
import { getImageUrl } from '~/lib/utils';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './ReviewManagement.css';

interface ReviewManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const ReviewManagement: React.FC<ReviewManagementProps> = ({ onSuccess, onError }) => {
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewReplyFilter, setReviewReplyFilter] = useState('all');
  const [reviewComboFilter, setReviewComboFilter] = useState('all');
  const [reviewUserNameFilter, setReviewUserNameFilter] = useState('');
  const [reviewComboNameFilter, setReviewComboNameFilter] = useState('');
  const [reviewSortOrder, setReviewSortOrder] = useState('newest');
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Review management states
  const [reviewSortBy, setReviewSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [reviewFilterRating, setReviewFilterRating] = useState(0); // 0 = all, 1-5 = filter by rating
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const [reviewPageInput, setReviewPageInput] = useState('');
  const [reviewItemsPerPage] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: '' });
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [openReviewMenuId, setOpenReviewMenuId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

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

  // Load reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      const userId = getUserId();
      if (!userId) {
        setLoadingReviews(false);
        setReviews([]);
        return;
      }

      try {
        setLoadingReviews(true);
        
        // First get host's service combos
        const serviceComboResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${userId}`);
        const hostCombos = serviceComboResponse.data || [];
        const hostComboIds = hostCombos.map(c => c.Id || c.id);
        
        console.log('📊 [ReviewManagement] Host combos:', hostComboIds);
        
        if (hostComboIds.length === 0) {
          console.log('📊 [ReviewManagement] No service combos found for host');
          setReviews([]);
          setLoadingReviews(false);
          return;
        }
        
        // Get all reviews
        const response = await axiosInstance.get(API_ENDPOINTS.REVIEW);
        const allReviews = response.data || [];
        
        console.log('📊 [ReviewManagement] All reviews:', allReviews.length);
        
        // Filter reviews for host's service combos
        // Check both nested ServiceCombo and direct ServiceComboId from Booking
        const hostReviews = allReviews.filter(review => {
          const booking = review.Booking || review.booking;
          if (!booking) {
            console.log('📊 [ReviewManagement] Review has no booking:', review.Id || review.id);
            return false;
          }
          
          // Try to get ServiceComboId from different possible locations
          const serviceComboId = 
            booking.ServiceComboId || 
            booking.serviceComboId || 
            booking.ServicecomboId ||
            booking.servicecomboId ||
            (booking.ServiceCombo?.Id) || 
            (booking.ServiceCombo?.id) ||
            (booking.serviceCombo?.Id) || 
            (booking.serviceCombo?.id);
          
          const isHostReview = serviceComboId && hostComboIds.includes(serviceComboId);
          
          if (!isHostReview) {
            console.log('📊 [ReviewManagement] Review not for host combo:', {
              reviewId: review.Id || review.id,
              serviceComboId,
              hostComboIds
            });
          }
          
          return isHostReview;
        });
        
        // Enrich reviews with service combo info for display
        const enrichedReviews = hostReviews.map(review => {
          const booking = review.Booking || review.booking;
          const serviceComboId = 
            booking?.ServiceComboId || 
            booking?.serviceComboId || 
            booking?.ServicecomboId ||
            booking?.servicecomboId;
          
          // Find the matching combo from host's combos
          const matchingCombo = hostCombos.find(c => (c.Id || c.id) === serviceComboId);
          
          // If booking doesn't have ServiceCombo object, add it from our fetched data
          if (matchingCombo && booking && !booking.ServiceCombo && !booking.serviceCombo) {
            booking.ServiceCombo = matchingCombo;
          }
          
          return review;
        });
        
        console.log('📊 [ReviewManagement] Host reviews found:', enrichedReviews.length);
        setReviews(enrichedReviews);
      } catch (err) {
        console.error('Error loading reviews:', err);
        if (onError) {
          onError('Không thể tải đánh giá. Vui lòng thử lại.');
        }
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [getUserId, onError]);

  // Get sorted and filtered reviews
  const sortedAndFilteredReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    let filtered = [...reviews];
    
    // Filter by rating
    if (reviewFilterRating > 0) {
      filtered = filtered.filter(review => {
        const rating = Math.floor(review.Rating || review.rating || 0);
        return rating === reviewFilterRating;
      });
    }
    
    // Filter by combo name
    if (reviewComboNameFilter && reviewComboNameFilter.trim() !== '') {
      const searchTerm = reviewComboNameFilter.toLowerCase().trim();
      filtered = filtered.filter(review => {
        const booking = review.Booking || review.booking;
        const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
        const comboName = serviceCombo?.Name || serviceCombo?.name || '';
        return comboName.toLowerCase().includes(searchTerm);
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.CreatedAt || a.createdAt || a.CreatedDate || a.createdDate || 0);
      const dateB = new Date(b.CreatedAt || b.createdAt || b.CreatedDate || b.createdDate || 0);
      const ratingA = a.Rating || a.rating || 0;
      const ratingB = b.Rating || b.rating || 0;
      
      switch (reviewSortBy) {
        case 'newest':
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'highest':
          return ratingB - ratingA;
        case 'lowest':
          return ratingA - ratingB;
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });
    
    return filtered;
  }, [reviews, reviewFilterRating, reviewComboNameFilter, reviewSortBy]);

  // Paginated reviews
  const paginatedReviews = useMemo(() => {
    const totalPages = Math.ceil(sortedAndFilteredReviews.length / reviewItemsPerPage);
    const startIndex = (reviewCurrentPage - 1) * reviewItemsPerPage;
    const endIndex = startIndex + reviewItemsPerPage;
    return sortedAndFilteredReviews.slice(startIndex, endIndex);
  }, [sortedAndFilteredReviews, reviewCurrentPage, reviewItemsPerPage]);

  const reviewTotalPages = Math.ceil(sortedAndFilteredReviews.length / reviewItemsPerPage);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
  };

  // Review handlers
  const handleViewReviewDetails = (reviewId) => {
    const review = reviews.find(r => (r.Id || r.id) === reviewId);
    if (!review) {
      console.error('Review not found:', reviewId);
      return;
    }
    setSelectedReview(review);
    const replies = review.Replies || review.replies || [];
    const reply = replies.length > 0 ? replies[0] : null;
    setReplyText(reply?.Comment || reply?.comment || '');
  };

  const handleCloseReviewDetails = () => {
    setSelectedReview(null);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!selectedReview) return;
    
    if (!replyText.trim()) {
      if (onError) {
        onError('Vui lòng nhập nội dung phản hồi.');
      }
      return;
    }

    setIsSubmittingReply(true);
    try {
      const reviewId = selectedReview.Id || selectedReview.id;
      const currentUserId = getUserId();
      
      if (!currentUserId) {
        if (onError) {
          onError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }
        setIsSubmittingReply(false);
        return;
      }

      const existingReplies = selectedReview.Replies || selectedReview.replies || [];
      const existingReply = existingReplies.length > 0 ? existingReplies[0] : null;
      
      if (existingReply) {
        // Update existing reply using Review reply API
        const replyId = existingReply.Id || existingReply.id;
        await axiosInstance.put(`${API_ENDPOINTS.REVIEW}/reply/${replyId}`, {
          Content: replyText.trim()
        });
      } else {
        // Create new reply using Review reply API
        await axiosInstance.post(`${API_ENDPOINTS.REVIEW}/${reviewId}/reply`, {
          AuthorId: currentUserId,
          Content: replyText.trim()
        });
      }
      
      // Reload reviews to get updated data
      const response = await axiosInstance.get(API_ENDPOINTS.REVIEW);
      const allReviews = response.data || [];
      const serviceComboResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${currentUserId}`);
      const hostCombos = serviceComboResponse.data || [];
      const hostComboIds = hostCombos.map(c => c.Id || c.id);
      const hostReviews = allReviews.filter(review => {
        const booking = review.Booking || review.booking;
        const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
        const comboId = serviceCombo?.Id || serviceCombo?.id;
        return comboId && hostComboIds.includes(comboId);
      });
      setReviews(hostReviews);
      
      // Update selectedReview
      const updatedReview = hostReviews.find(r => (r.Id || r.id) === reviewId);
      if (updatedReview) {
        setSelectedReview(updatedReview);
      }
      
      if (onSuccess) {
        onSuccess('Đã lưu phản hồi thành công!');
      }
      handleCloseReviewDetails();
    } catch (err) {
      console.error('Error submitting reply:', err);
      if (onError) {
        onError('Không thể lưu phản hồi. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!selectedReview) return;
    
    const reply = selectedReview.Replies && selectedReview.Replies.length > 0 
      ? selectedReview.Replies[0] 
      : null;
    
    if (!reply) {
      if (onError) {
        onError('Không có phản hồi để xóa.');
      }
      return;
    }
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
      return;
    }

    setIsSubmittingReply(true);
    try {
      const reviewId = selectedReview.Id || selectedReview.id;
      const currentUserId = getUserId();
      
      const existingReplies = selectedReview.Replies || selectedReview.replies || [];
      const existingReply = existingReplies.length > 0 ? existingReplies[0] : null;
      
      if (existingReply) {
        const replyId = existingReply.Id || existingReply.id;
        await axiosInstance.delete(`${API_ENDPOINTS.REVIEW}/reply/${replyId}`);
      }
      
      // Reload reviews to get updated data
      const response = await axiosInstance.get(API_ENDPOINTS.REVIEW);
      const allReviews = response.data || [];
      const serviceComboResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${currentUserId}`);
      const hostCombos = serviceComboResponse.data || [];
      const hostComboIds = hostCombos.map(c => c.Id || c.id);
      const hostReviews = allReviews.filter(review => {
        const booking = review.Booking || review.booking;
        const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
        const comboId = serviceCombo?.Id || serviceCombo?.id;
        return comboId && hostComboIds.includes(comboId);
      });
      setReviews(hostReviews);
      
      // Update selectedReview
      const updatedReview = hostReviews.find(r => (r.Id || r.id) === reviewId);
      if (updatedReview) {
        setSelectedReview(updatedReview);
      } else {
        setSelectedReview(null);
      }
      
      if (onSuccess) {
        onSuccess('Đã xóa phản hồi thành công!');
      }
      handleCloseReviewDetails();
    } catch (err) {
      console.error('Error deleting reply:', err);
      if (onError) {
        onError('Không thể xóa phản hồi. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="review-mgr-review-management">
      {loadingReviews ? (
        <LoadingSpinner message="Đang tải đánh giá..." />
      ) : !reviews || reviews.length === 0 ? (
        <div className="review-mgr-empty-state">
          <StarIcon className="review-mgr-empty-state-icon" />
          <h3>Chưa có đánh giá nào</h3>
          <p>Bạn chưa đánh giá dịch vụ nào. Hãy đánh giá sau khi sử dụng dịch vụ!</p>
        </div>
      ) : (
        <>
          {/* Filter and Sort Controls */}
          <div className="review-mgr-review-filter-container">
            <div className="review-mgr-filter-row">
              <div className="review-mgr-filter-group">
                <label htmlFor="review-service-name-filter" className="review-mgr-filter-label">Tên dịch vụ</label>
                <input
                  type="text"
                  id="review-service-name-filter"
                  className="review-mgr-filter-select"
                  value={reviewComboNameFilter}
                  onChange={(e) => {
                    setReviewComboNameFilter(e.target.value);
                    setReviewCurrentPage(1);
                    setReviewPageInput('');
                  }}
                  placeholder="Tìm theo tên dịch vụ..."
                  style={{ minWidth: '200px' }}
                />
              </div>
              <div className="review-mgr-filter-group">
                <label htmlFor="rating-filter" className="review-mgr-filter-label">Lọc theo sao</label>
                <select
                  id="rating-filter"
                  value={reviewFilterRating}
                  onChange={(e) => {
                    setReviewFilterRating(parseInt(e.target.value));
                    setReviewCurrentPage(1);
                    setReviewPageInput('');
                  }}
                  className="review-mgr-filter-select"
                >
                  <option value={0}>Tất cả</option>
                  <option value={5}>5 sao</option>
                  <option value={4}>4 sao</option>
                  <option value={3}>3 sao</option>
                  <option value={2}>2 sao</option>
                  <option value={1}>1 sao</option>
                </select>
              </div>
              <div className="review-mgr-filter-group">
                <label htmlFor="sort-by" className="review-mgr-filter-label">Sắp xếp</label>
                <select
                  id="sort-by"
                  value={reviewSortBy}
                  onChange={(e) => {
                    setReviewSortBy(e.target.value);
                    setReviewCurrentPage(1);
                    setReviewPageInput('');
                  }}
                  className="review-mgr-filter-select"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="highest">Cao nhất</option>
                  <option value="lowest">Thấp nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="review-mgr-reviews-list">
            {sortedAndFilteredReviews.length === 0 ? (
              <div className="review-mgr-empty-state">
                <StarIcon className="review-mgr-empty-state-icon" />
                <h3>Không tìm thấy đánh giá</h3>
                <p>Không có đánh giá nào phù hợp với bộ lọc đã chọn.</p>
                <Button variant="outline" onClick={() => setReviewFilterRating(0)}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <>
                {paginatedReviews.map((review, index) => {
                  try {
                    const reviewId = review.Id || review.id || `review-${index}`;
                    const booking = review.Booking || review.booking;
                    const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo || review.ServiceCombo || review.serviceCombo;
                    
                    // Get reviewer info from review.User or booking.User
                    const reviewer = review.User || review.user;
                    const reviewerName = reviewer?.FullName || reviewer?.fullName || reviewer?.Name || reviewer?.name || 'Người dùng ẩn danh';
                    const reviewerAvatar = reviewer?.Avatar || reviewer?.avatar;
                    
                    // Fallback nếu không có ServiceCombo - lấy từ ComboId
                    let serviceName = 'Dịch vụ không xác định';
                    let serviceId = null;
                    let serviceImage = '/img/banahills.jpg';
                    
                    if (serviceCombo) {
                      serviceName = serviceCombo.Name || serviceCombo.name || 'Dịch vụ không xác định';
                      serviceId = serviceCombo.Id || serviceCombo.id;
                      // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên
                      let imagePath = serviceCombo.Image || serviceCombo.image || '';
                      if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
                        imagePath = imagePath.split(',')[0].trim();
                      }
                      serviceImage = getImageUrl(imagePath, '/img/banahills.jpg');
                    } else if (review.ComboId || review.comboId || booking?.ServiceComboId || booking?.serviceComboId) {
                      // Nếu chưa load được ServiceCombo, vẫn hiển thị review với thông tin cơ bản
                      const comboId = review.ComboId || review.comboId || booking?.ServiceComboId || booking?.serviceComboId;
                      serviceName = `Dịch vụ #${comboId}`;
                      serviceId = comboId;
                    }
                    
                    const rating = review.Rating || review.rating || 0;
                    const comment = review.Content || review.content || review.Comment || review.comment || '';
                    const createdAt = review.CreatedAt || review.createdAt || review.CreatedDate || review.createdDate;
                    
                    return (
                      <div key={reviewId} className="review-mgr-review-card-enhanced">
                        <div className="review-mgr-review-content-wrapper">
                          {/* Main Content: Image + Info */}
                          <div className="review-mgr-review-main-content">
                            {/* Service Image - Left */}
                            <div className="review-mgr-review-image-container">
                              {serviceId ? (
                                <Link to={`/services/${serviceId}`}>
                                  <img
                                    src={serviceImage}
                                    alt={serviceName}
                                    className="review-mgr-review-service-image"
                                    onError={(e) => {
                                      e.currentTarget.src = '/img/banahills.jpg';
                                    }}
                                  />
                                </Link>
                              ) : (
                                <img
                                  src={serviceImage}
                                  alt={serviceName}
                                  className="review-mgr-review-service-image"
                                  onError={(e) => {
                                    e.currentTarget.src = '/img/banahills.jpg';
                                  }}
                                />
                              )}
                            </div>

                            {/* Service Info - Right */}
                            <div className="review-mgr-review-info-container">
                              {serviceId ? (
                                <Link to={`/services/${serviceId}`} className="review-mgr-review-service-link">
                                  <h3 className="review-mgr-review-service-title">{serviceName}</h3>
                                </Link>
                              ) : (
                                <h3 className="review-mgr-review-service-title">{serviceName}</h3>
                              )}
                              
                              {/* Reviewer Info */}
                              <div className="review-mgr-review-reviewer-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
                                {reviewerAvatar ? (
                                  <img 
                                    src={getImageUrl(reviewerAvatar, '/img/default-avatar.png')} 
                                    alt={reviewerName}
                                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                    onError={(e) => { e.currentTarget.src = '/img/default-avatar.png'; }}
                                  />
                                ) : (
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#64748b' }}>
                                    {reviewerName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>{reviewerName}</span>
                              </div>
                              
                              {createdAt && (
                                <div className="review-mgr-review-date-row">
                                  <CalendarIcon className="review-mgr-review-date-icon" />
                                  <span>{formatDate(createdAt)}</span>
                                </div>
                              )}
                              
                              {rating > 0 && (
                                <div className="review-mgr-review-rating-row">
                                  <div className="review-mgr-review-stars-inline">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <StarIcon
                                        key={star}
                                        className="review-mgr-review-star-inline"
                                        filled={star <= rating}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions Menu - Top Right */}
                            <div className="review-mgr-review-menu-wrapper">
                              <button
                                className="review-mgr-review-menu-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenReviewMenuId(openReviewMenuId === reviewId ? null : reviewId);
                                }}
                                aria-label="Tùy chọn"
                              >
                                <MoreVerticalIcon className="review-mgr-review-menu-icon" />
                              </button>
                              {openReviewMenuId === reviewId && (
                                <div className="review-mgr-review-menu-dropdown">
                                  <button
                                    className="review-mgr-review-menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewReviewDetails(reviewId);
                                      setOpenReviewMenuId(null);
                                    }}
                                  >
                                    <CommentIcon className="review-mgr-review-menu-item-icon" />
                                    <span>Phản hồi</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comment Section - Below */}
                          <div className="review-mgr-review-comment-wrapper">
                            <div className="review-mgr-review-comment">
                              {comment || 'Không có ghi chú'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } catch (err) {
                    console.error('Error rendering review:', err, review);
                    return (
                      <div key={`error-${index}`} className="review-card ui-card">
                        <div className="ui-card-content">
                          <p>Lỗi khi hiển thị đánh giá này</p>
                        </div>
                      </div>
                    );
                  }
                })}
                
                {/* Pagination */}
                {reviewTotalPages > 1 && (
                  <div className="review-mgr-pagination">
                    <button
                      type="button"
                      className="review-mgr-pagination-btn"
                      onClick={() => {
                        const newPage = Math.max(1, reviewCurrentPage - 1);
                        setReviewCurrentPage(newPage);
                        setReviewPageInput('');
                      }}
                      disabled={reviewCurrentPage === 1}
                    >
                      <span>←</span> Trước
                    </button>
                    
                    <div className="review-mgr-pagination-controls">
                      <div className="review-mgr-pagination-numbers">
                        {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            className={`review-mgr-pagination-number ${reviewCurrentPage === page ? 'review-mgr-active' : ''}`}
                            onClick={() => {
                              setReviewCurrentPage(page);
                              setReviewPageInput('');
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
                        value={reviewPageInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setReviewPageInput(value);
                            const pageNum = parseInt(value);
                            if (value !== '' && pageNum >= 1 && pageNum <= reviewTotalPages) {
                              setReviewCurrentPage(pageNum);
                              setReviewPageInput('');
                            }
                          }
                        }}
                        placeholder={reviewCurrentPage.toString()}
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
                      className="review-mgr-pagination-btn"
                      onClick={() => {
                        const newPage = Math.min(reviewTotalPages, reviewCurrentPage + 1);
                        setReviewCurrentPage(newPage);
                        setReviewPageInput('');
                      }}
                      disabled={reviewCurrentPage === reviewTotalPages}
                    >
                      Sau <span>→</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Reply Review Modal */}
      <ReplyReviewModal
        isOpen={selectedReview !== null}
        onClose={handleCloseReviewDetails}
        review={selectedReview}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onSubmit={handleSubmitReply}
        onDelete={handleDeleteReply}
        isSubmitting={isSubmittingReply}
      />
    </div>
  );
};

export default ReviewManagement;





