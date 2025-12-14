import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '~/utils/axiosInstance';
import ConditionalHeader from './ConditionalHeader';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import LazyImage from './LazyImage';
import ImageCarousel from './ImageCarousel';
import { 
  StarIcon, 
  MapPinIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  UsersIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CalendarIcon
} from './icons/index';
import { formatPrice, getImageUrl } from '~/lib/utils';
import { API_ENDPOINTS } from '~/config/api';
import './ServiceDetail.css';

// Sử dụng đường dẫn public URL thay vì import
const baNaHillImage = '/img/banahills.jpg';

// Hàm parse nhiều ảnh từ Image field
// Hỗ trợ: string đơn, string phân cách bởi dấu phẩy, hoặc array
const parseServiceImages = (imageField, fallbackImage) => {
  // Nếu không có ảnh, trả về fallback image
  if (!imageField || (typeof imageField === 'string' && imageField.trim() === '')) {
    return fallbackImage ? [fallbackImage] : [];
  }

  // Nếu là array, xử lý từng phần tử
  if (Array.isArray(imageField)) {
    const images = imageField
      .filter(img => img && String(img).trim() !== '')
      .map(img => getImageUrl(String(img).trim(), fallbackImage));
    
    // Nếu có ít nhất 1 ảnh, trả về
    if (images.length > 0) {
      return images;
    }
    // Nếu array rỗng, trả về fallback
    return fallbackImage ? [fallbackImage] : [];
  }

  // Nếu là string, kiểm tra xem có nhiều ảnh phân cách bởi dấu phẩy không
  const imageString = String(imageField).trim();
  
  // Kiểm tra nếu có dấu phẩy (nhiều ảnh)
  if (imageString.includes(',')) {
    const images = imageString
      .split(',')
      .map(img => img.trim())
      .filter(img => img !== '')
      .map(img => getImageUrl(img, fallbackImage));
    
    // Nếu có ít nhất 1 ảnh hợp lệ, trả về
    if (images.length > 0) {
      return images;
    }
  }

  // Nếu chỉ có 1 ảnh, trả về mảng với 1 phần tử
  const mainImage = getImageUrl(imageString, fallbackImage);
  return mainImage ? [mainImage] : (fallbackImage ? [fallbackImage] : []);
};

// Additional Icons
const CheckIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const MoreVerticalIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

const EditIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

// Constants
const MAX_COMMENT_LENGTH = 1000;
const MIN_RATING = 1;
const MAX_RATING = 5;

// Helper để lấy userId từ localStorage
const getUserId = () => {
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
    if (process.env.NODE_ENV === 'development') {
      console.error(' Error getting user ID:', error);
    }
    return null;
  }
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null); // BookingId để dùng cho can-review check
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [filterRating, setFilterRating] = useState(0); // 0 = all, 1-5 = filter by rating
  const [openMenuId, setOpenMenuId] = useState(null); // ID of review with open menu
  const [editingReviewId, setEditingReviewId] = useState(null); // ID of review being edited
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [deletingReviewId, setDeletingReviewId] = useState(null); // ID of review being deleted
  const [similarServices, setSimilarServices] = useState([]);
  const [loadingSimilarServices, setLoadingSimilarServices] = useState(false);
  const [availableServices, setAvailableServices] = useState([]); // Dịch vụ đơn lẻ của host
  const [selectedServices, setSelectedServices] = useState<number[]>([]); // ID các dịch vụ đã chọn
  const [loadingServices, setLoadingServices] = useState(false);

  // Helper function để enrich reviews (batch load Users thay vì N+1 queries)
  const enrichReviews = useCallback(async (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) return [];
    
    // Backend Review model có UserId (không phải AuthorId)
    // Lấy tất cả UserIds unique từ reviews
    const userIds = [...new Set(
      reviewsData
        .map(review => {
          // Backend trả về UserId hoặc User.Id
          const userId = review.UserId || review.userId;
          const userFromInclude = review.User?.Id || review.User?.id || review.user?.Id || review.user?.id;
          return userId || userFromInclude;
        })
        .filter(id => id != null)
    )];
    
    // Batch load tất cả Users cùng lúc
    const userMap = new Map();
    if (userIds.length > 0) {
      try {
        const userPromises = userIds.map(async (userId) => {
          try {
            // Backend đã include User, nhưng có thể không đầy đủ, load lại để chắc chắn
            const userResponse = await axiosInstance.get(`${API_ENDPOINTS.USER}/${userId}`);
            return { id: userId, data: userResponse.data };
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn(`⚠️ [ServiceDetail] Không thể load user ${userId}:`, err);
            }
            // Fallback: dùng User từ include nếu có
            const reviewWithUser = reviewsData.find(r => 
              (r.UserId || r.userId) === userId || 
              (r.User?.Id || r.User?.id || r.user?.Id || r.user?.id) === userId
            );
            const userFromInclude = reviewWithUser?.User || reviewWithUser?.user;
            return { id: userId, data: userFromInclude || null };
          }
        });
        
        const userResults = await Promise.allSettled(userPromises);
        userResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            userMap.set(result.value.id, result.value.data);
          }
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('❌ [ServiceDetail] Lỗi khi batch load Users:', err);
        }
      }
    }
    
    // Enrich reviews với data đã load
    return reviewsData.map(review => {
      const enrichedReview = { ...review };
      const userId = enrichedReview.UserId || enrichedReview.userId || 
                    enrichedReview.User?.Id || enrichedReview.User?.id ||
                    enrichedReview.user?.Id || enrichedReview.user?.id;
      
      if (userId && userMap.has(userId)) {
        enrichedReview.User = userMap.get(userId);
      } else if (userId) {
        // Fallback: dùng User từ include
        enrichedReview.User = enrichedReview.User || enrichedReview.user || null;
      }
      
      return enrichedReview;
    });
  }, []);

  // Fetch service data, reviews, and check if user can review
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate ID
        if (!id) {
          setError('ID dịch vụ không hợp lệ.');
          setLoading(false);
          return;
        }
        
        const serviceId = parseInt(id, 10);
        if (isNaN(serviceId) || serviceId <= 0) {
          setError('ID dịch vụ không hợp lệ.');
          setLoading(false);
          setTimeout(() => {
            navigate('/services', { replace: true });
          }, 2000);
          return;
        }
        
        // Gọi API ServiceCombo thay vì Service
        if (import.meta.env.DEV) {
          console.log('🔍 [ServiceDetail] Đang tải service với ID:', serviceId);
        }
        const url = `${API_ENDPOINTS.SERVICE_COMBO}/${serviceId}`;
        if (import.meta.env.DEV) {
          console.log('🔍 [ServiceDetail] API URL:', url);
        }
        
        const response = await axiosInstance.get(url);
        if (import.meta.env.DEV) {
          console.log('✅ [ServiceDetail] Nhận được dữ liệu:', response.data);
          console.log('  - Service ID:', response.data?.Id || response.data?.id);
          console.log('  - Service Name:', response.data?.Name || response.data?.name);
          console.log('  - Service Status:', response.data?.Status || response.data?.status);
        }
        
        // Validate response data
        if (!response.data) {
          throw new Error('Không nhận được dữ liệu từ server.');
        }
        
        setService(response.data);
        
        // Fetch average rating
        try {
          const ratingResponse = await axiosInstance.get(`${API_ENDPOINTS.REVIEW}/ServiceCombo/${serviceId}/average-rating`);
          setAverageRating(ratingResponse.data.AverageRating || 0);
        } catch (ratingErr) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(' Không thể lấy rating:', ratingErr);
          }
          setAverageRating(0);
        } finally {
          setRatingLoading(false);
        }
      } catch (err) {
        const errorStatus = err?.response?.status;
        const errorCode = err?.code;
        
        let errorMessage = 'Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.';
        
        if (errorStatus === 404) {
          // Service không tồn tại hoặc chưa được duyệt
          const serviceId = id ? parseInt(id, 10) : null;
          if (serviceId && !isNaN(serviceId)) {
            errorMessage = `Dịch vụ với ID ${serviceId} không tồn tại hoặc chưa được duyệt.`;
          } else {
            errorMessage = 'Dịch vụ không tồn tại hoặc chưa được duyệt.';
          }
          // 404 là lỗi hợp lệ (resource không tồn tại), chỉ log ở mức info
          if (import.meta.env.DEV) {
            console.warn('⚠️ [ServiceDetail] ServiceCombo không tìm thấy:', {
              serviceId: id,
              message: errorMessage
            });
          }
        } else {
          // Các lỗi khác (network, server error, etc.) - log chi tiết
          if (import.meta.env.DEV) {
            console.error('❌ [ServiceDetail] Lỗi khi tải chi tiết dịch vụ:', err);
            console.error('  - Error message:', err?.message);
            console.error('  - Error code:', errorCode);
            console.error('  - Response status:', errorStatus);
            console.error('  - Response data:', err?.response?.data);
          }
          
          if (errorCode === 'ERR_NETWORK' || errorCode === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else if (errorStatus === 403) {
            errorMessage = 'Bạn không có quyền truy cập dịch vụ này.';
          } else if (errorStatus) {
            errorMessage = `Lỗi ${errorStatus}: ${err.response?.statusText || 'Không thể tải thông tin dịch vụ'}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchService().catch((err) => {
        // Handle any unhandled errors
        if (import.meta.env.DEV) {
          console.error('❌ [ServiceDetail] Unhandled error in fetchService:', err);
        }
      });
    }
    
    // Cleanup function
  }, [id, navigate]);

  // Fetch similar services (các dịch vụ tương tự)
  useEffect(() => {
    const fetchSimilarServices = async () => {
      if (!id) return;
      
      try {
        setLoadingSimilarServices(true);
        // Lấy tất cả services
        const response = await axiosInstance.get(API_ENDPOINTS.SERVICE_COMBO);
        const allServices = response.data || [];
        
        // Loại trừ service hiện tại và lấy 4 services khác
        // Backend trả về status = "approved" cho ServiceCombo đã được duyệt
        const filtered = allServices
          .filter(s => {
            const serviceId = s.Id || s.id;
            const serviceStatus = (s.Status || s.status || 'open').toLowerCase();
            // Chấp nhận cả "approved" và "open" làm status hợp lệ
            return serviceId !== parseInt(id) && (serviceStatus === 'open' || serviceStatus === 'approved');
          })
          .slice(0, 4)
          .map(s => {
            // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên cho sd-card
            let imagePath = s.Image || s.image || '';
            if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
              imagePath = imagePath.split(',')[0].trim();
            }
            return {
              id: s.Id || s.id,
              name: s.Name || s.name || 'Dịch vụ',
              image: getImageUrl(imagePath, baNaHillImage),
              price: s.Price || s.price || 0,
              address: s.Address || s.address || '',
              availableSlots: s.AvailableSlots !== undefined ? s.AvailableSlots : (s.availableSlots !== undefined ? s.availableSlots : 0),
              status: s.Status || s.status || 'open'
            };
          });
        
        setSimilarServices(filtered);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(' Lỗi khi tải dịch vụ tương tự:', err);
        }
        setSimilarServices([]);
      } finally {
        setLoadingSimilarServices(false);
      }
    };

    fetchSimilarServices();
  }, [id]);

  // Fetch available services của host từ ServiceCombo.HostId
  useEffect(() => {
    const fetchHostServices = async () => {
      if (!service || !id || isNaN(parseInt(id))) return;
      
      try {
        setLoadingServices(true);
        
        // Lấy HostId từ ServiceCombo
        const hostId = service.HostId || service.hostId;
        if (!hostId) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [ServiceDetail] ServiceCombo không có HostId, không thể load dịch vụ thêm');
          }
          setAvailableServices([]);
          return;
        }
        
        // Lấy tất cả Service của host đó
        const url = `${API_ENDPOINTS.SERVICE}/host/${hostId}`;
        
        if (import.meta.env.DEV) {
          console.log(`🔍 [ServiceDetail] Đang load dịch vụ của host ${hostId}`);
        }
        
        const response = await axiosInstance.get(url);
        
        if (response.data && Array.isArray(response.data)) {
          // Chỉ lấy các Service có status = "Approved"
          const approvedServices = response.data.filter((svc: any) => {
            const status = (svc.Status || svc.status || '').toLowerCase();
            return status === 'approved';
          });
          
          if (import.meta.env.DEV) {
            console.log(`✅ [ServiceDetail] Tìm thấy ${approvedServices.length} dịch vụ đơn lẻ của host ${hostId}`);
          }
          setAvailableServices(approvedServices);
        } else {
          setAvailableServices([]);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [ServiceDetail] Không thể tải dịch vụ thêm của host:', err?.message || 'Unknown error');
        }
        // Đặt services = [] và tiếp tục (ServiceDetail vẫn hoạt động bình thường)
        setAvailableServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchHostServices();
  }, [service, id]);

  // Fetch reviews for this service combo
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      try {
        setLoadingReviews(true);
        // Lấy tất cả reviews, backend đã include Booking
        const response = await axiosInstance.get(API_ENDPOINTS.REVIEW);
        const allReviews = response.data || [];
        
        // Filter reviews theo ServiceComboId qua Booking (Review không có ComboId trực tiếp)
        // Backend Review model: Review -> Booking -> ServiceComboId
        const serviceReviews = allReviews.filter(review => {
          const booking = review.Booking || review.booking;
          if (!booking) return false;
          const comboId = booking.ServiceComboId || booking.serviceComboId;
          return comboId === parseInt(id);
        });
        
        if (import.meta.env.DEV) {
          console.log('📝 [ServiceDetail] Reviews cho service combo:', {
            totalReviews: allReviews.length,
            serviceReviews: serviceReviews.length,
            serviceComboId: id
          });
        }
        
        // Enrich reviews với batch loading (nếu cần)
        const enrichedReviews = await enrichReviews(serviceReviews);
        setReviews(enrichedReviews);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('❌ [ServiceDetail] Lỗi khi tải reviews:', err);
        }
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Check if user can review this service - Sử dụng API backend đúng logic
  const checkCanReview = useCallback(async () => {
      const userId = getUserId();
      if (!userId || !id) {
        setCanReview(false);
        setSelectedBookingId(null);
        return;
      }

      try {
        // Bước 1: Lấy bookings của user cho service combo này
        // LƯU Ý: 404 là trạng thái hợp lệ nếu user chưa có booking nào
        // Browser có thể hiển thị 404 trong Network tab - đây là hành vi bình thường, không phải lỗi
        let bookings = [];
        try {
          const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/user/${userId}`);
          bookings = bookingsResponse.data || [];
        } catch (bookingsErr: any) {
          // 404 có nghĩa là user chưa có booking nào - đây là trạng thái hợp lệ, không phải lỗi
          if (bookingsErr?.response?.status === 404) {
            // 404 là trạng thái hợp lệ (user chưa có booking)
            // Axios interceptor đã suppress log error cho endpoint này
            // Browser Network tab vẫn có thể hiển thị 404 - đây là hành vi mặc định của browser
            bookings = [];
          } else {
            // Lỗi thực sự khác (network, server error, etc.) - chỉ log nếu không phải 404
            if (import.meta.env.DEV) {
              console.error('❌ [ServiceDetail] Lỗi khi lấy bookings của user:', bookingsErr);
            }
            throw bookingsErr;
          }
        }
        
        // Bước 2: Filter bookings có ServiceComboId = id và status = completed (chỉ cho phép review sau khi hoàn thành chuyến)
        const relevantBookings = bookings.filter(booking => {
          const comboId = booking.ServiceComboId || booking.serviceComboId;
          const status = (booking.Status || booking.status || '').toLowerCase();
          return comboId === parseInt(id) && status === 'completed';
        });

        if (relevantBookings.length === 0) {
          setCanReview(false);
          setUserBookings([]);
          setSelectedBookingId(null);
          return;
        }

        setUserBookings(relevantBookings);
        
        // Bước 3: Với mỗi booking, gọi API backend can-review để kiểm tra chính xác
        // Backend API: GET /api/Review/booking/{bookingId}/user/{userId}/can-review
        let canReviewResult = false;
        let foundBookingId = null;

        // Kiểm tra từng booking, lấy booking đầu tiên có thể review
        for (const booking of relevantBookings) {
          const bookingId = booking.Id || booking.id;
          if (!bookingId) continue;

          try {
            // Gọi API backend can-review với bookingId cụ thể
            const canReviewResponse = await axiosInstance.get(
              `${API_ENDPOINTS.REVIEW}/booking/${bookingId}/user/${userId}/can-review`
            );
            
            const canReviewData = canReviewResponse.data || {};
            if (canReviewData.CanReview === true || canReviewData.canReview === true) {
              canReviewResult = true;
              foundBookingId = bookingId;
              if (process.env.NODE_ENV === 'development') {
                console.log(` User có thể review booking ${bookingId} cho service combo ${id}`);
              }
              break; // Tìm thấy booking có thể review, không cần check tiếp
            }
          } catch (err) {
            // Nếu API trả về lỗi, tiếp tục check booking khác
            if (process.env.NODE_ENV === 'development') {
              console.warn(` Không thể kiểm tra can-review cho booking ${bookingId}:`, err);
            }
            continue;
          }
        }

        setCanReview(canReviewResult);
        setSelectedBookingId(foundBookingId);
        
        if (process.env.NODE_ENV === 'development') {
          if (canReviewResult) {
            console.log(` User có thể review service combo ${id} với bookingId ${foundBookingId}`);
          } else {
            console.log(` User không thể review service combo ${id} (đã review hoặc chưa đủ điều kiện)`);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(' Lỗi khi kiểm tra can review:', err);
        }
        setCanReview(false);
        setSelectedBookingId(null);
      }
    }, [id]);

  // Gọi checkCanReview khi component mount hoặc id thay đổi
  useEffect(() => {
    checkCanReview();
  }, [checkCanReview]);

  // Xử lý state từ navigation (openReview từ ProfilePage)
  useEffect(() => {
    const state = location.state as { openReview?: boolean; bookingId?: number } | null;
    if (state?.openReview && state?.bookingId) {
      // Set bookingId từ state
      setSelectedBookingId(state.bookingId);
      setCanReview(true);
      
      // Mở form review và scroll đến phần review
      setShowReviewForm(true);
      
      // Scroll đến phần review sau khi component render
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      
      // Clear state để tránh mở lại khi refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate rating distribution - Memoized để tránh tính toán lại mỗi render
  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = review.Rating || review.rating || 0;
      if (rating >= MIN_RATING && rating <= MAX_RATING) {
        distribution[rating]++;
      }
    });
    return distribution;
  }, [reviews]);

  // Get sorted and filtered reviews - Memoized để tránh sort/filter lại mỗi render
  const sortedAndFilteredReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    let filtered = [...reviews];

    // Filter by rating
    if (filterRating > 0) {
      filtered = filtered.filter(review => {
        const rating = review.Rating || review.rating || 0;
        return rating === filterRating;
      });
    }

    // Sort reviews
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.CreatedAt || a.createdAt || a.CreatedDate || a.createdDate || 0);
      const dateB = new Date(b.CreatedAt || b.createdAt || b.CreatedDate || b.createdDate || 0);
      const ratingA = a.Rating || a.rating || 0;
      const ratingB = b.Rating || b.rating || 0;

      switch (sortBy) {
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

    return sorted;
  }, [reviews, sortBy, filterRating]);

  // Helper function to reload reviews
  const reloadReviews = async () => {
    if (!id) return;
    
    try {
      setLoadingReviews(true);
      const response = await axiosInstance.get(API_ENDPOINTS.REVIEW);
      const allReviews = response.data || [];
      
      // Filter reviews theo ServiceComboId qua Booking
      const serviceReviews = allReviews.filter(review => {
        const booking = review.Booking || review.booking;
        if (!booking) return false;
        const comboId = booking.ServiceComboId || booking.serviceComboId;
        return comboId === parseInt(id);
      });
      
      // Enrich reviews với batch loading
      const enrichedReviews = await enrichReviews(serviceReviews);
      setReviews(enrichedReviews);
      
      // Reload average rating
      const ratingResponse = await axiosInstance.get(`/Review/servicecombo/${id}/average-rating`);
      setAverageRating(ratingResponse.data.AverageRating || 0);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('❌ [ServiceDetail] Lỗi khi reload reviews:', err);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating || reviewForm.rating < MIN_RATING || reviewForm.rating > MAX_RATING) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      alert('Vui lòng đăng nhập để đánh giá');
      navigate('/login', { state: { returnUrl: `/services/${id}` } });
      return;
    }

    if (!id) {
      alert('Không tìm thấy thông tin dịch vụ');
      return;
    }

    try {
      setSubmittingReview(true);
      
      // Ưu tiên sử dụng selectedBookingId (từ ProfilePage hoặc checkCanReview)
      let bookingId = selectedBookingId;
      
      // Nếu không có selectedBookingId, tìm từ API
      if (!bookingId) {
        const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/user/${userId}`);
        const userBookingsData = bookingsResponse.data || [];
        
        // Tìm booking có ServiceComboId = id và status = completed (chỉ cho phép review khi hoàn thành)
        const validBooking = userBookingsData.find((booking: any) => {
          const comboId = booking.ServiceComboId || booking.serviceComboId;
          const status = (booking.Status || booking.status)?.toLowerCase();
          return comboId === parseInt(id as string) && status === 'completed';
        });
        
        if (!validBooking) {
          alert('Bạn chỉ có thể đánh giá sau khi hoàn thành chuyến du lịch.');
          setSubmittingReview(false);
          return;
        }
        
        bookingId = validBooking.Id || validBooking.id;
      }
      
      // Gửi theo format database: BookingId, UserId, Rating, Comment
      const reviewData = {
        BookingId: bookingId,
        UserId: userId,
        Rating: reviewForm.rating,
        Comment: reviewForm.comment || null // Backend dùng Comment, không phải Content
      };

      if (import.meta.env.DEV) {
        console.log('📤 [ServiceDetail] Gửi review data:', reviewData);
        console.log('  - BookingId:', bookingId);
        console.log('  - UserId:', userId);
        console.log('  - Rating:', reviewForm.rating);
      }
      
      await axiosInstance.post(`${API_ENDPOINTS.REVIEW}`, reviewData);
      
      // Reset form và reload reviews
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      
      await reloadReviews();
      
      // Reload can-review status sau khi submit review (user đã review nên canReview = false)
      await checkCanReview();
      
      alert('Đánh giá của bạn đã được gửi! Cảm ơn bạn đã đánh giá dịch vụ.');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(' Lỗi khi gửi review:', err);
      }
      const errorMessage = err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    const reviewId = review.Id || review.id;
    const rating = review.Rating || review.rating || 5;
    // Backend dùng Comment, không phải Content
    const comment = review.Comment || review.comment || '';
    
    setEditingReviewId(reviewId);
    setEditForm({ rating, comment });
    setOpenMenuId(null);
  };

  const handleUpdateReview = async () => {
    if (!editForm.rating || editForm.rating < MIN_RATING || editForm.rating > MAX_RATING) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!editingReviewId) {
      alert('Không tìm thấy đánh giá cần chỉnh sửa');
      return;
    }

    try {
      setSubmittingReview(true);
      // Backend dùng Comment, không phải Content
      const reviewData = {
        Rating: editForm.rating,
        Comment: editForm.comment || null
      };

      await axiosInstance.put(`${API_ENDPOINTS.REVIEW}/${editingReviewId}`, reviewData);
      
      setEditingReviewId(null);
      setEditForm({ rating: 5, comment: '' });
      setOpenMenuId(null);
      
      await reloadReviews();
      
      alert('Đánh giá đã được cập nhật thành công!');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(' Lỗi khi cập nhật review:', err);
      }
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      await axiosInstance.delete(`${API_ENDPOINTS.REVIEW}/${reviewId}`);
      
      setOpenMenuId(null);
      await reloadReviews();
      
      // Reload can-review status sau khi delete review (user có thể review lại)
      await checkCanReview();
      
      alert('Đánh giá đã được xóa thành công!');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(' Lỗi khi xóa review:', err);
      }
      const errorMessage = err.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.sd-review-menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    // Backend trả về "approved" cho ServiceCombo đã được duyệt
    if (statusLower === 'open' || statusLower === 'approved') {
      return { text: 'Có sẵn', variant: 'success', color: '#047857' };
    } else if (statusLower === 'closed') {
      return { text: 'Đã đóng', variant: 'danger', color: '#dc2626' };
    } else {
      return { text: 'Đã hủy', variant: 'default', color: '#64748b' };
    }
  };

  // Helper function để kiểm tra service có thể đặt được không
  const isServiceAvailable = (serviceStatus: string, slots: number) => {
    const statusLower = (serviceStatus || '').toLowerCase();
    // ServiceCombo có thể đặt nếu status = "approved" hoặc "open" và còn chỗ
    return (statusLower === 'approved' || statusLower === 'open') && slots > 0;
  };

  // Tính tổng tiền bao gồm cả dịch vụ thêm đã chọn - Phải đặt trước các điều kiện return sớm
  const selectedServicesTotal = useMemo(() => {
    if (!service || availableServices.length === 0) return 0;
    return selectedServices.reduce((total, svcId) => {
      const svc = availableServices.find((s: any) => (s.Id || s.id) === svcId);
      if (svc) {
        const price = Number(svc.Price || svc.price || 0);
        return total + price;
      }
      return total;
    }, 0);
  }, [selectedServices, availableServices, service]);

  if (loading) {
    return (
      <div className="sd-service-detail-page">
        <ConditionalHeader />
        <main className="sd-service-detail-main">
          <LoadingSpinner message="Đang tải thông tin dịch vụ..." />
        </main>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="sd-service-detail-page">
        <ConditionalHeader />
        <main className="sd-service-detail-main">
          <div className="sd-service-detail-container">
            <div className="sd-error-container" role="alert">
              <h2 className="sd-error-title">Không tìm thấy dịch vụ</h2>
              <p className="sd-error-message">{error || 'Dịch vụ không tồn tại hoặc chưa được duyệt'}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Button variant="default" onClick={() => navigate('/services')}>
                  <ArrowLeftIcon className="sd-button-icon" />
                  Quay lại danh sách
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Quay lại trang trước
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Map tất cả các trường từ API response (hỗ trợ cả PascalCase và camelCase)
  const serviceName = service.Name || service.name || 'Dịch vụ';
  const serviceImages = parseServiceImages(service.Image || service.image, baNaHillImage);
  const servicePrice = service.Price || service.price || 0;
  const serviceAddress = service.Address || service.address || '';
  const serviceDescription = service.Description || service.description || '';
  const availableSlots = service.AvailableSlots !== undefined ? service.AvailableSlots : (service.availableSlots !== undefined ? service.availableSlots : 0);
  const status = service.Status || service.status || 'open';
  const cancellationPolicy = service.CancellationPolicy || service.cancellationPolicy || null;
  const statusBadge = getStatusBadge(status);
  const rating = averageRating > 0 ? averageRating : 4.5; // Fallback rating

  // Tính tổng tiền (đã được tính trong useMemo ở trên)
  const totalPrice = servicePrice + selectedServicesTotal;

  return (
    <div className="sd-service-detail-page">
      <ConditionalHeader />
      
      <main className="sd-service-detail-main">
        {/* Hero Section with Image Carousel */}
        <section className="sd-service-hero-section">
          <div className="sd-service-hero-background">
            <ImageCarousel
              images={serviceImages}
              autoPlayInterval={4000}
              fallbackImage={baNaHillImage}
            />
            <div className="sd-service-hero-overlay"></div>
          </div>
          <div className="sd-service-hero-content">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="sd-back-button-hero"
            >
              <ArrowLeftIcon className="sd-button-icon" />
              Quay lại
            </Button>
            <div className="sd-service-hero-info">
              <h1 className="sd-service-hero-title">{serviceName}</h1>
              <div className="sd-service-hero-meta">
                {serviceAddress && (
                  <div className="sd-hero-meta-item">
                    <MapPinIcon className="sd-hero-meta-icon" />
                    <span>{serviceAddress}</span>
                  </div>
                )}
                {!ratingLoading && rating > 0 && (
                  <div className="sd-hero-meta-item">
                    <div className="sd-hero-rating">
                      <StarIcon className="sd-hero-star-icon" filled={true} />
                      <span className="sd-hero-rating-value">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                <Badge 
                  variant={statusBadge.variant as 'success' | 'default' | 'primary' | 'secondary' | 'danger' | 'warning'} 
                  className="sd-hero-status-badge"
                  style={{ backgroundColor: statusBadge.color === '#047857' ? '#d1fae5' : statusBadge.color === '#dc2626' ? '#fee2e2' : '#f1f5f9', color: statusBadge.color }}
                >
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="sd-service-detail-container">
          {/* Main Content Grid */}
          <div className="sd-service-detail-content">
            {/* Left Column - Main Content */}
            <div className="sd-service-detail-left">
              {/* Description Section */}
              <Card className="sd-description-card">
                <CardContent>
                  <h2 className="sd-section-title">Mô tả dịch vụ</h2>
                  <div className="sd-description-content">
                    {serviceDescription ? (
                      <p className="sd-description-text">{serviceDescription}</p>
                    ) : (
                      <p className="sd-description-text sd-description-empty">
                        Chưa có mô tả cho dịch vụ này.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Highlights Section */}
              <Card className="sd-highlights-card">
                <CardContent>
                  <h2 className="sd-section-title">Đặc điểm nổi bật</h2>
                  <div className="sd-highlights-grid">
                    <div className="sd-highlight-item">
                      <div className="sd-highlight-icon-wrapper">
                        <CheckCircleIcon className="sd-highlight-icon" />
                      </div>
                      <div className="sd-highlight-content">
                        <h3 className="sd-highlight-title">Dịch vụ chất lượng cao</h3>
                        <p className="sd-highlight-description">Được quản lý và kiểm duyệt bởi hệ thống ESCE</p>
                      </div>
                    </div>
                    <div className="sd-highlight-item">
                      <div className="sd-highlight-icon-wrapper">
                        <ShieldCheckIcon className="sd-highlight-icon" />
                      </div>
                      <div className="sd-highlight-content">
                        <h3 className="sd-highlight-title">Thanh toán an toàn</h3>
                        <p className="sd-highlight-description">Hệ thống thanh toán được bảo mật và an toàn</p>
                      </div>
                    </div>
                    <div className="sd-highlight-item">
                      <div className="sd-highlight-icon-wrapper">
                        <UsersIcon className="sd-highlight-icon" />
                      </div>
                      <div className="sd-highlight-content">
                        <h3 className="sd-highlight-title">Đặt dịch vụ theo nhóm</h3>
                        <p className="sd-highlight-description">Tiết kiệm chi phí khi đặt theo nhóm</p>
                      </div>
                    </div>
                    <div className="sd-highlight-item">
                      <div className="sd-highlight-icon-wrapper">
                        <ClockIcon className="sd-highlight-icon" />
                      </div>
                      <div className="sd-highlight-content">
                        <h3 className="sd-highlight-title">Hỗ trợ 24/7</h3>
                        <p className="sd-highlight-description">Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information and Cancellation Policy - Two Column Layout */}
              <div className="sd-info-policy-grid">
                {/* Left Column - Service Information */}
                <Card className="sd-service-info-card-detail">
                  <CardContent>
                    <h2 className="sd-section-title">Thông tin chi tiết</h2>
                    <div className="sd-detail-info-list">
                      {serviceAddress && (
                        <div className="sd-detail-info-item">
                          <MapPinIcon className="sd-detail-info-icon" />
                          <div className="sd-detail-info-content">
                            <span className="sd-detail-info-label">ĐỊA CHỈ</span>
                            <span className="sd-detail-info-value">{serviceAddress}</span>
                          </div>
                        </div>
                      )}
                      <div className="sd-detail-info-item">
                        <ClockIcon className="sd-detail-info-icon" />
                        <div className="sd-detail-info-content">
                          <span className="sd-detail-info-label">SỐ CHỖ CÒN LẠI</span>
                          <span className="sd-detail-info-value">
                             {availableSlots > 0 ? `${availableSlots} chỗ` : 'Đã hết chỗ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column - Cancellation Policy */}
                <Card className="sd-policy-card-detail">
                  <CardContent>
                    <h2 className="sd-section-title">Chính sách hủy</h2>
                    {cancellationPolicy ? (
                      // Hiển thị CancellationPolicy từ API nếu có
                      <div className="sd-policy-detail-list">
                        <div className="sd-policy-detail-item">
                          <svg className="sd-policy-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span className="sd-policy-detail-text">{cancellationPolicy}</span>
                        </div>
                      </div>
                    ) : (
                      // Fallback: Hiển thị policy mặc định nếu API không có
                      <div className="sd-policy-detail-list">
                        <div className="sd-policy-detail-item policy-item-48h-before">
                          <svg className="sd-policy-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span className="sd-policy-detail-text">Hủy trước 48h được hoàn 90%</span>
                        </div>
                        <div className="sd-policy-detail-item policy-item-48h-within">
                          <svg className="sd-policy-icon sd-warning" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                            <path d="M12 9v4"/>
                            <path d="M12 17h.01"/>
                          </svg>
                          <span className="sd-policy-detail-text">Hủy trong vòng 48h hoàn 50%</span>
                        </div>
                        <div className="sd-policy-detail-item policy-item-24h-within">
                          <svg className="sd-policy-icon sd-danger" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <span className="sd-policy-detail-text">Hủy trong vòng 24h không hoàn tiền</span>
                        </div>
                      </div>
                    )}
                    {!cancellationPolicy && (
                      <div className="sd-policy-note">
                        <span className="sd-policy-note-text">* Thời gian tính từ lúc check-in</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Services Section - Chỉ hiển thị khi có dịch vụ thêm */}
              {(!loadingServices && availableServices.length > 0) || loadingServices ? (
                <Card className="sd-additional-services-card">
                  <CardContent>
                    <h2 className="sd-section-title">Dịch vụ thêm (tùy chọn)</h2>
                    {loadingServices ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <LoadingSpinner message="Đang tải dịch vụ thêm..." />
                      </div>
                    ) : availableServices.length > 0 ? (
                      <div className="sd-additional-services-list">
                        {availableServices.map((svc: any) => {
                          const svcId = svc.Id || svc.id;
                          const svcName = svc.Name || svc.name || 'Dịch vụ';
                          const svcPrice = Number(svc.Price || svc.price || 0);
                          const isSelected = selectedServices.includes(svcId);
                          
                          return (
                            <label
                              key={svcId}
                              className="sd-additional-service-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: isSelected ? '#f0fdf4' : 'white',
                                borderColor: isSelected ? '#10b981' : '#e5e7eb'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedServices([...selectedServices, svcId]);
                                  } else {
                                    setSelectedServices(selectedServices.filter(id => id !== svcId));
                                  }
                                }}
                                style={{
                                  marginRight: '0.75rem',
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{svcName}</div>
                                <div style={{ color: '#10b981', fontWeight: 600 }}>
                                  {formatPrice(svcPrice)} / người
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {/* Reviews Section */}
              <div ref={reviewSectionRef}>
              <Card className="sd-reviews-card">
                <CardContent>
                  <div className="sd-reviews-header">
                    <div className="sd-reviews-header-left">
                      <h2 className="sd-section-title">Đánh giá từ khách hàng</h2>
                      {reviews.length > 0 && (
                        <span className="sd-reviews-count">({reviews.length} đánh giá)</span>
                      )}
                    </div>
                    {canReview && !showReviewForm && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const userId = getUserId();
                          if (!userId) {
                            navigate('/login', { state: { returnUrl: `/services/${id}` } });
                            return;
                          }
                          setShowReviewForm(true);
                        }}
                        className="sd-write-review-btn"
                      >
                        <StarIcon className="sd-button-icon" />
                        Viết đánh giá
                      </Button>
                    )}
                  </div>

                  {/* Rating Summary */}
                  {!loadingReviews && reviews.length > 0 && (
                    <div className="sd-rating-summary-section">
                      <div className="sd-rating-summary-main">
                        <div className="sd-rating-overall">
                          <div className="sd-rating-overall-value">
                            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                          </div>
                          <div className="sd-rating-overall-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className="sd-rating-overall-star"
                                filled={star <= Math.round(averageRating)}
                              />
                            ))}
                          </div>
                          <div className="sd-rating-overall-label">
                            {reviews.length} {reviews.length === 1 ? 'đánh giá' : 'đánh giá'}
                          </div>
                        </div>
                        <div className="sd-rating-distribution">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDistribution[star] || 0;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={star} className="sd-rating-distribution-item">
                                <div className="sd-distribution-star">
                                  <span className="sd-distribution-star-number">{star}</span>
                                  <StarIcon className="sd-distribution-star-icon" filled={true} />
                                </div>
                                <div className="sd-distribution-bar-wrapper">
                                  <div 
                                    className="sd-distribution-bar"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <div className="sd-review-form-container">
                      <div className="sd-review-form-header">
                        <h3 className="sd-review-form-title">Viết đánh giá của bạn</h3>
                        <button
                          className="sd-review-form-close"
                          onClick={() => {
                            setShowReviewForm(false);
                            setReviewForm({ rating: 5, comment: '' });
                          }}
                          aria-label="Đóng form"
                        >
                          ×
                        </button>
                      </div>
                      <div className="sd-review-form-rating">
                        <label>Đánh giá của bạn:</label>
                        <div className="sd-star-rating-input">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`sd-star-button ${star <= reviewForm.rating ? 'sd-active' : ''}`}
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              aria-label={`${star} sao`}
                            >
                              <StarIcon className="sd-star-icon" filled={star <= reviewForm.rating} />
                            </button>
                          ))}
                          <span className="sd-rating-text">
                            {reviewForm.rating === 5 && 'Tuyệt vời'}
                            {reviewForm.rating === 4 && 'Rất tốt'}
                            {reviewForm.rating === 3 && 'Tốt'}
                            {reviewForm.rating === 2 && 'Khá'}
                            {reviewForm.rating === 1 && 'Kém'}
                          </span>
                        </div>
                      </div>
                      <div className="sd-review-form-comment">
                        <label htmlFor="sd-review-comment">Nhận xét chi tiết:</label>
                        <textarea
                          id="sd-review-comment"
                          rows={5}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này. Điều gì bạn thích nhất? Có điều gì cần cải thiện không?"
                          maxLength={MAX_COMMENT_LENGTH}
                        />
                        <div className="sd-char-count-wrapper">
                          <span className="sd-char-count">{reviewForm.comment.length}/{MAX_COMMENT_LENGTH} ký tự</span>
                        </div>
                      </div>
                      <div className="sd-review-form-actions">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReviewForm(false);
                            setReviewForm({ rating: 5, comment: '' });
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          variant="default"
                          onClick={handleSubmitReview}
                          disabled={submittingReview}
                        >
                          {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sort and Filter Controls */}
                  {!loadingReviews && reviews.length > 0 && (
                    <div className="sd-reviews-controls">
                      <div className="sd-reviews-sort">
                        <label htmlFor="sd-sort-select">Sắp xếp:</label>
                        <div className="sd-sort-select-wrapper">
                          <select
                            id="sd-sort-select"
                            className="sd-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="highest">Điểm cao nhất</option>
                            <option value="lowest">Điểm thấp nhất</option>
                          </select>
                          <ChevronDownIcon className="sd-sort-chevron" />
                        </div>
                      </div>
                      <div className="sd-reviews-filter">
                        <label htmlFor="sd-filter-select">Lọc theo sao:</label>
                        <div className="sd-filter-select-wrapper">
                          <select
                            id="sd-filter-select"
                            className="sd-filter-select"
                            value={filterRating}
                            onChange={(e) => setFilterRating(parseInt(e.target.value))}
                          >
                            <option value="0">Tất cả</option>
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="3">3 sao</option>
                            <option value="2">2 sao</option>
                            <option value="1">1 sao</option>
                          </select>
                          <ChevronDownIcon className="sd-filter-chevron" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {loadingReviews ? (
                    <LoadingSpinner message="Đang tải đánh giá..." />
                  ) : reviews.length === 0 ? (
                    <div className="sd-reviews-empty">
                      <div className="sd-reviews-empty-icon-wrapper">
                        <StarIcon className="sd-reviews-empty-icon" />
                      </div>
                      <h3 className="sd-reviews-empty-title">Chưa có đánh giá nào</h3>
                      <p className="sd-reviews-empty-text">Hãy là người đầu tiên đánh giá dịch vụ này!</p>
                      {canReview && (
                        <Button
                          variant="default"
                          onClick={() => {
                            const userId = getUserId();
                            if (!userId) {
                              navigate('/login', { state: { returnUrl: `/services/${id}` } });
                              return;
                            }
                            setShowReviewForm(true);
                          }}
                          className="sd-write-review-empty-btn"
                        >
                          <StarIcon className="sd-button-icon" />
                          Viết đánh giá đầu tiên
                        </Button>
                      )}
                    </div>
                  ) : sortedAndFilteredReviews.length === 0 ? (
                    <div className="sd-reviews-empty">
                      <div className="sd-reviews-empty-icon-wrapper">
                        <StarIcon className="sd-reviews-empty-icon" />
                      </div>
                      <h3 className="sd-reviews-empty-title">Không tìm thấy đánh giá</h3>
                      <p className="sd-reviews-empty-text">Không có đánh giá nào phù hợp với bộ lọc của bạn.</p>
                      <Button
                        variant="outline"
                        onClick={() => setFilterRating(0)}
                        className="sd-reset-filter-btn"
                      >
                        Xóa bộ lọc
                      </Button>
                    </div>
                  ) : (
                    <div className="sd-reviews-list">
                      {sortedAndFilteredReviews.map((review) => {
                        const reviewId = review.Id || review.id;
                        const user = review.User || review.user;
                        const userName = user?.Name || user?.name || 'Khách hàng';
                        const userAvatar = user?.Avatar || user?.avatar || '';
                        // Backend dùng UserId, không phải AuthorId
                        const userId = review.UserId || review.userId;
                        const rating = review.Rating || review.rating || 0;
                        // Backend dùng Comment, không phải Content
                        const comment = review.Comment || review.comment || '';
                        // Backend dùng CreatedDate, không phải CreatedAt
                        const createdAt = review.CreatedDate || review.createdDate;
                        const currentUserId = getUserId();
                        const isOwnReview = currentUserId && userId && parseInt(userId.toString()) === parseInt(currentUserId.toString());
                        const isEditing = editingReviewId === reviewId;
                          
                        return (
                          <div key={reviewId} className="sd-review-item">
                            {isEditing ? (
                              <div className="sd-review-edit-form">
                                <div className="sd-review-form-rating">
                                  <label>Đánh giá:</label>
                                  <div className="sd-star-rating-input">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        className={`sd-star-button ${star <= editForm.rating ? 'sd-active' : ''}`}
                                        onClick={() => setEditForm({ ...editForm, rating: star })}
                                        aria-label={`${star} sao`}
                                      >
                                        <StarIcon className="sd-star-icon" filled={star <= editForm.rating} />
                                      </button>
                                    ))}
                                    <span className="sd-rating-text">
                                      {editForm.rating === 5 && 'Tuyệt vời'}
                                      {editForm.rating === 4 && 'Rất tốt'}
                                      {editForm.rating === 3 && 'Tốt'}
                                      {editForm.rating === 2 && 'Khá'}
                                      {editForm.rating === 1 && 'Kém'}
                                    </span>
                                  </div>
                                </div>
                                <div className="sd-review-form-comment">
                                  <label htmlFor={`edit-comment-${reviewId}`}>Nhận xét:</label>
                                  <textarea
                                    id={`edit-comment-${reviewId}`}
                                    rows={4}
                                    value={editForm.comment}
                                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                                    maxLength={MAX_COMMENT_LENGTH}
                                  />
                                  <div className="sd-char-count-wrapper">
                                    <span className="sd-char-count">{editForm.comment.length}/{MAX_COMMENT_LENGTH} ký tự</span>
                                  </div>
                                </div>
                                <div className="sd-review-form-actions">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingReviewId(null);
                                      setEditForm({ rating: 5, comment: '' });
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    variant="default"
                                    onClick={handleUpdateReview}
                                    disabled={submittingReview}
                                  >
                                    {submittingReview ? 'Đang lưu...' : 'Lưu thay đổi'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="sd-review-item-header">
                                  <div className="sd-review-user">
                                    <div className="sd-review-avatar">
                                      {userAvatar ? (
                                        <img src={userAvatar} alt={userName} />
                                      ) : (
                                        <span>{userName.charAt(0).toUpperCase()}</span>
                                      )}
                                    </div>
                                    <div className="sd-review-user-info">
                                      <div className="sd-review-user-name">{userName}</div>
                                      <div className="sd-review-date-row">
                                        <CalendarIcon className="sd-review-date-icon" />
                                        <span>{formatDate(createdAt)}</span>
                                      </div>
                                      <div className="sd-review-rating-row">
                                        <div className="sd-review-stars">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIcon
                                              key={star}
                                              className="sd-review-star"
                                              filled={star <= rating}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {isOwnReview && (
                                    <div className="sd-review-menu-container">
                                      <button
                                        className="sd-review-menu-button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(openMenuId === reviewId ? null : reviewId);
                                        }}
                                        aria-label="Tùy chọn"
                                      >
                                        <MoreVerticalIcon className="sd-review-menu-icon" />
                                      </button>
                                      {openMenuId === reviewId && (
                                        <div className="sd-review-menu-dropdown">
                                          <button
                                            className="sd-review-menu-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditReview(review);
                                            }}
                                          >
                                            <EditIcon className="sd-review-menu-item-icon" />
                                            <span>Chỉnh sửa</span>
                                          </button>
                                          <button
                                            className="sd-review-menu-item sd-review-menu-item-delete"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteReview(reviewId);
                                            }}
                                            disabled={deletingReviewId === reviewId}
                                          >
                                            <TrashIcon className="sd-review-menu-item-icon" />
                                            <span>{deletingReviewId === reviewId ? 'Đang xóa...' : 'Xóa'}</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {comment && (
                                  <div className="sd-review-comment">
                                    <p>{comment}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>

              {/* Similar Services Section */}
              {similarServices.length > 0 && (
                <div className="sd-similar-services-section">
                  <h2 className="sd-similar-services-title">Các dịch vụ tương tự</h2>
                  <div className="sd-similar-services-grid">
                    {similarServices.map((similarService) => (
                      <Link
                        key={similarService.id}
                        to={`/services/${similarService.id}`}
                        className="sd-similar-service-card-link"
                      >
                        <Card className="sd-similar-service-card">
                          <div className="sd-similar-service-image-wrapper">
                            <LazyImage
                              src={similarService.image}
                              alt={similarService.name}
                              className="sd-similar-service-image"
                              fallbackSrc={baNaHillImage}
                            />
                            {similarService.availableSlots > 0 && (
                              <Badge 
                                variant="success" 
                                className="sd-similar-service-badge"
                              >
                                Còn {similarService.availableSlots} chỗ
                              </Badge>
                            )}
                          </div>
                          <CardContent className="sd-similar-service-content">
                            <h3 className="sd-similar-service-name">{similarService.name}</h3>
                            {similarService.address && (
                              <div className="sd-similar-service-address">
                                <MapPinIcon className="sd-similar-service-address-icon" />
                                <span>{similarService.address}</span>
                              </div>
                            )}
                            <div className="sd-similar-service-price">
                              {formatPrice(similarService.price)}
                              <span className="sd-similar-service-price-unit">/ người</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Card (Sticky) */}
            <div className="sd-service-detail-right">
              <Card className="sd-booking-card">
                <CardContent>
                  <div className="sd-booking-header">
                    <div className="sd-booking-price-section">
                      <span className="sd-booking-price-label">Giá dịch vụ</span>
                      <div className="sd-booking-price-value-wrapper">
                        <span className="sd-booking-price-value">{formatPrice(servicePrice)}</span>
                        <span className="sd-booking-price-unit">/ người</span>
                      </div>
                    </div>
                    {availableSlots > 0 && (
                      <div className="sd-booking-slots-info">
                        <UsersIcon className="sd-booking-slots-icon" />
                        <span>Còn {availableSlots} chỗ</span>
                      </div>
                    )}
                  </div>

                  {/* Selected Additional Services */}
                  {selectedServices.length > 0 && (
                    <div className="sd-booking-selected-services" style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        Dịch vụ thêm đã chọn:
                      </div>
                      {selectedServices.map((svcId) => {
                        const svc = availableServices.find((s: any) => (s.Id || s.id) === svcId);
                        if (!svc) return null;
                        const svcName = svc.Name || svc.name || 'Dịch vụ';
                        const svcPrice = Number(svc.Price || svc.price || 0);
                        return (
                          <div 
                            key={svcId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0',
                              fontSize: '0.875rem'
                            }}
                          >
                            <span style={{ color: '#6b7280' }}>{svcName}</span>
                            <span style={{ fontWeight: 600, color: '#10b981' }}>
                              {formatPrice(svcPrice)}
                            </span>
                          </div>
                        );
                      })}
                      {selectedServicesTotal > 0 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #e5e7eb',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          <span>Tổng dịch vụ thêm:</span>
                          <span style={{ color: '#10b981' }}>
                            {formatPrice(selectedServicesTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Price */}
                  {selectedServices.length > 0 && (
                    <div className="sd-booking-total-price" style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '2px solid #10b981'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#10b981'
                      }}>
                        <span>Tổng cộng:</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="sd-booking-section">
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="sd-booking-button"
                      disabled={!isServiceAvailable(status, availableSlots)}
                      onClick={() => {
                        // Debug log
                        if (import.meta.env.DEV) {
                          console.log('🔍 [ServiceDetail] Click "Đặt dịch vụ ngay"')
                          console.log('  - Service ID:', id)
                          console.log('  - Service Status:', status)
                          console.log('  - Available Slots:', availableSlots)
                          console.log('  - Is Available:', isServiceAvailable(status, availableSlots))
                        }
                        
                        if (!isServiceAvailable(status, availableSlots)) {
                          if (import.meta.env.DEV) {
                            console.warn('  - Button disabled: status =', status, ', slots =', availableSlots)
                          }
                          alert('Dịch vụ hiện không khả dụng để đặt');
                          return;
                        }
                        
                        // Kiểm tra đăng nhập trước khi chuyển đến trang booking
                        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                        const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
                        
                        if (import.meta.env.DEV) {
                          console.log('  - Has Token:', !!token)
                          console.log('  - Has UserInfo:', !!userInfoStr)
                        }
                        
                        if (!token || !userInfoStr) {
                          // Chưa đăng nhập - chuyển đến trang đăng nhập với returnUrl
                          if (import.meta.env.DEV) {
                            console.log('  - Not logged in, redirecting to login')
                          }
                          navigate('/login', { 
                            state: { returnUrl: `/booking/${id}` } 
                          });
                          return;
                        }
                        
                        // Đã đăng nhập - chuyển đến trang booking với selected services
                        if (import.meta.env.DEV) {
                          console.log('  - Navigating to booking page:', `/booking/${id}`)
                          console.log('  - Selected services:', selectedServices)
                        }
                        navigate(`/booking/${id}`, {
                          state: {
                            selectedServices: selectedServices.map(svcId => {
                              const svc = availableServices.find((s: any) => (s.Id || s.id) === svcId);
                              return svc || null;
                            }).filter(svc => svc !== null)
                          }
                        });
                      }}
                    >
                      {isServiceAvailable(status, availableSlots)
                        ? 'Đặt dịch vụ ngay' 
                        : status.toLowerCase() === 'closed' 
                        ? 'Dịch vụ đã đóng'
                        : 'Hết chỗ'}
                    </Button>
                    <p className="sd-booking-note">
                      {isServiceAvailable(status, availableSlots)
                        ? 'Bạn sẽ được chuyển đến trang đặt dịch vụ để hoàn tất thanh toán'
                        : 'Dịch vụ hiện không khả dụng'}
                    </p>
                  </div>

                  {/* Rating Summary */}
                  {!ratingLoading && rating > 0 && (
                    <div className="sd-booking-rating-summary">
                      <div className="sd-rating-summary-header">
                        <StarIcon className="sd-rating-summary-star" filled={true} />
                        <span className="sd-rating-summary-value">{rating.toFixed(1)}</span>
                        <span className="sd-rating-summary-label">Đánh giá trung bình</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetail;



