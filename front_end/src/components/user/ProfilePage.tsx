import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '~/utils/axiosInstance';
import ConditionalHeader from './ConditionalHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import LazyImage from './LazyImage';
import { formatPrice, getImageUrl } from '~/lib/utils';
import { API_ENDPOINTS } from '~/config/api';
import { useUserLevel } from '~/hooks/useUserLevel';
import LevelProgressBar from './LevelProgressBar';
import { uploadImageToFirebase, deleteImageFromFirebase, getFallbackImageUrl } from '~/services/firebaseStorage'
import { 
  UserIcon, 
  CalendarIcon, 
  BellIcon, 
  EditIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  StarIcon,
  ArrowRightIcon
} from './icons/index';
import './ProfilePage.css';

// Additional Icons for Review Management
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'personal');
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [bookingFallbackImage, setBookingFallbackImage] = useState<string>('/img/banahills.jpg');
  const originalFormDataRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Review management states
  const [reviewSortBy, setReviewSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [reviewFilterRating, setReviewFilterRating] = useState(0); // 0 = all, 1-5 = filter by rating
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: '' });
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [openReviewMenuId, setOpenReviewMenuId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{ name: string; email: string; phone: string; dob: string; gender: string; address: string; avatar: string }>({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    avatar: ''
  });

  // Get userId from localStorage - memoized với useCallback
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

  // Get user level data
  const userId = getUserId();
  const { totalSpent, level, levelInfo, progress, nextLevelAmount, loading: levelLoading, error: levelError } = useUserLevel(userId);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = getUserId();
      if (!userId) {
        setError('Vui lòng đăng nhập để xem thông tin cá nhân');
        setLoading(false);
        navigate('/login', { state: { returnUrl: '/profile' } });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load Firebase fallback image cho booking history
        try {
          const firebaseFallback = await getFallbackImageUrl();
          if (firebaseFallback) {
            setBookingFallbackImage(firebaseFallback);
          }
        } catch (fallbackErr) {
          console.warn('⚠️ [ProfilePage] Không thể load fallback image từ Firebase, dùng local:', fallbackErr);
        }

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Phiên đăng nhập đã hết hạn');
          navigate('/login', { state: { returnUrl: '/profile' } });
          return;
        }

        // Lấy userInfo từ storage trước để merge với API response (ưu tiên storage cho avatar)
        const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
        let storageUserInfo: any = null;
        if (userInfoStr) {
          try {
            storageUserInfo = JSON.parse(userInfoStr);
          } catch (parseErr) {
            console.warn('⚠️ [ProfilePage] Không thể parse userInfo từ storage:', parseErr);
          }
        }
        
        let userData: any = null;
        
        try {
          const response = await axiosInstance.get(`${API_ENDPOINTS.USER}/${userId}`);
          console.log('✅ [ProfilePage] Nhận được dữ liệu user từ API:', response.data);
          userData = response.data;
          
          // Merge với storage để ưu tiên avatar từ storage (nếu có)
          // Vì storage đã được cập nhật khi save, còn API có thể chưa sync
          if (storageUserInfo) {
            // Ưu tiên avatar từ storage nếu có (đã được cập nhật)
            if (storageUserInfo.Avatar || storageUserInfo.avatar) {
              userData.Avatar = storageUserInfo.Avatar || storageUserInfo.avatar;
              userData.avatar = storageUserInfo.Avatar || storageUserInfo.avatar;
            }
            // Merge các field khác từ storage nếu API không có
            if (!userData.Name && !userData.name && (storageUserInfo.Name || storageUserInfo.name)) {
              userData.Name = storageUserInfo.Name || storageUserInfo.name;
              userData.name = storageUserInfo.Name || storageUserInfo.name;
            }
          }
        } catch (apiErr: any) {
          console.warn('⚠️ [ProfilePage] Không thể lấy user từ API, sử dụng data từ localStorage:', apiErr?.message);
          
          // Fallback: sử dụng userInfo từ localStorage
          if (storageUserInfo) {
            userData = storageUserInfo;
            console.log('✅ [ProfilePage] Sử dụng userInfo từ localStorage:', userData);
          } else {
            throw apiErr; // Ném lại lỗi API nếu không có userInfo trong storage
          }
        }

        if (!userData) {
          setError('Không tìm thấy thông tin người dùng');
          return;
        }

        setUserInfo(userData);
        
        // Format DOB to YYYY-MM-DD for input
        let dobFormatted = '';
        if (userData.Dob || userData.dob) {
          const dobDate = new Date(userData.Dob || userData.dob);
          if (!isNaN(dobDate.getTime())) {
            dobFormatted = dobDate.toISOString().split('T')[0];
          }
        }

        // Ưu tiên avatar từ storage nếu có (đã được cập nhật)
        const avatarFromStorage = storageUserInfo?.Avatar || storageUserInfo?.avatar;
        const avatarFromApi = userData.Avatar || userData.avatar;
        const finalAvatar = avatarFromStorage || avatarFromApi || '';

        const initialFormData = {
          name: userData.Name || userData.name || '',
          email: userData.Email || userData.email || '',
          phone: userData.Phone || userData.phone || '',
          dob: dobFormatted,
          gender: userData.Gender || userData.gender || '',
          address: userData.Address || userData.address || '',
          avatar: finalAvatar
        };
        
        setFormData(initialFormData);
        // Lưu original data để so sánh thay đổi
        originalFormDataRef.current = JSON.stringify(initialFormData);
      } catch (err: any) {
        console.error('❌ [ProfilePage] Lỗi khi tải thông tin user:', err);
        console.error('  - Error message:', err?.message);
        console.error('  - Response status:', err?.response?.status);
        console.error('  - Response data:', err?.response?.data);
        console.error('  - Request URL:', err?.config?.url);
        
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin người dùng';
        
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setTimeout(() => {
            navigate('/login', { state: { returnUrl: '/profile' }, replace: true });
          }, 1500);
        } else if (err?.response?.status === 404) {
          setError('Không tìm thấy thông tin người dùng. Vui lòng thử lại sau.');
        } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network Error')) {
          setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.');
        } else {
          setError(`Không thể tải thông tin người dùng: ${errorMessage}. Vui lòng thử lại sau.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch bookings when tab is profile-active
  useEffect(() => {
    const fetchBookings = async () => {
      if (activeTab !== 'bookings') return;
      
      const userId = getUserId();
      if (!userId) return;

      try {
        setLoadingBookings(true);
        const response = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/user/${userId}`);
        console.log(' ProfilePage: Nhận được bookings:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Backend đã sắp xếp rồi, không cần sort lại ở frontend
          setBookings(response.data);
        } else {
          setBookings([]);
        }
      } catch (err: any) {
        const axiosError = err as { response?: { status?: number }; code?: string; message?: string }
        const errorStatus = axiosError?.response?.status
        const errorCode = axiosError?.code
        
        console.error(' Lỗi khi tải lịch sử đặt dịch vụ:', err);
        if (errorStatus === 401 || errorStatus === 403) {
          setError('Bạn không có quyền xem lịch sử đặt dịch vụ. Vui lòng đăng nhập lại.');
        } else if (errorStatus === 404) {
          setBookings([]); // User chưa có booking nào
        } else if (errorCode === 'ECONNABORTED' || axiosError?.message?.includes('timeout')) {
          // Timeout - hiển thị thông báo nhẹ nhàng và set mảng rỗng
          console.warn('⚠️ [ProfilePage] Request timeout khi tải bookings')
          setBookings([])
          setError('Không thể tải lịch sử đặt dịch vụ. Vui lòng thử lại sau.')
        } else {
          setError('Không thể tải lịch sử đặt dịch vụ. Vui lòng thử lại sau.');
          setBookings([]);
        }
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [activeTab, getUserId]);

  // Cập nhật activeTab khi location.state thay đổi (khi quay về từ PaymentPage)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear state để tránh set lại khi re-render - sử dụng navigate thay vì window.history
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Fetch reviews when tab is profile-active
  useEffect(() => {
    const fetchReviews = async () => {
      if (activeTab !== 'reviews') return;
      
      const userId = getUserId();
      if (!userId) {
        console.warn(' ProfilePage: Không có userId để fetch reviews');
        setReviews([]);
        setLoadingReviews(false);
        return;
      }

      try {
        setLoadingReviews(true);
        setError(null); // Clear previous errors
        
        if (process.env.NODE_ENV === 'development') {
          console.log(' ProfilePage: Đang fetch reviews cho userId:', userId);
          console.log(' ProfilePage: Endpoint:', `${API_ENDPOINTS.REVIEW}/user/${userId}`);
        }
        
        const response = await axiosInstance.get(`${API_ENDPOINTS.REVIEW}/user/${userId}`);
        const reviewsData = parseReviewsResponse(response.data);
        
        if (reviewsData.length === 0) {
          setReviews([]);
          setLoadingReviews(false);
          return;
        }
        
        // Enrich reviews với helper function
        const enrichedReviews = await enrichReviews(reviewsData);
        setReviews(enrichedReviews);
      } catch (err) {
        console.error(' ProfilePage: Lỗi khi tải reviews:', err);
        console.error('   Error type:', err.constructor.name);
        console.error('   Response status:', err.response?.status);
        console.error('   Response data:', err.response?.data);
        console.error('   Error message:', err.message);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Bạn không có quyền xem đánh giá. Vui lòng đăng nhập lại.');
        } else if (err.response?.status === 404) {
          // 404 có nghĩa là user chưa có review nào, không phải lỗi
          setReviews([]);
        } else {
          setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
          setReviews([]);
        }
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [activeTab, getUserId]);

  // Debug: Log reviews state changes
  useEffect(() => {
    if (activeTab === 'reviews') {
      console.log(' ProfilePage: Reviews state changed:', {
        reviewsCount: reviews.length,
        reviews: reviews,
        loadingReviews: loadingReviews,
        error: error
      });
    }
  }, [reviews, loadingReviews, error, activeTab]);

  // Validate individual field
  const validateField = (name, value) => {
    const errors: { [key: string]: string } = { ...fieldErrors };
    
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          errors.name = 'Họ và tên không được để trống';
        } else if (value.trim().length < 2) {
          errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
        } else if (value.trim().length > 100) {
          errors.name = 'Họ và tên không được vượt quá 100 ký tự';
        } else {
          delete errors.name;
        }
        break;
      case 'phone':
        if (!value || value.trim() === '') {
          errors.phone = 'Số điện thoại không được để trống';
        } else {
          const trimmedPhone = value.trim();
          // Database chỉ cho phép 10 ký tự, nhưng frontend cần validate cho 10 số
          const phoneRegex = /^[0-9]{10}$/;
          if (!phoneRegex.test(trimmedPhone)) {
            errors.phone = 'Số điện thoại phải có đúng 10 chữ số';
          } else if (trimmedPhone.length > 10) {
            errors.phone = 'Số điện thoại không được vượt quá 10 ký tự';
          } else {
            delete errors.phone;
          }
        }
        break;
      case 'address':
        if (!value || value.trim() === '') {
          errors.address = 'Địa chỉ không được để trống';
        } else if (value.trim().length > 255) {
          errors.address = 'Địa chỉ không được vượt quá 255 ký tự';
        } else {
          delete errors.address;
        }
        break;
      case 'gender':
        if (!value || value.trim() === '') {
          errors.gender = 'Giới tính không được để trống';
        } else if (value.trim().length > 10) {
          errors.gender = 'Giới tính không được vượt quá 10 ký tự';
        } else {
          delete errors.gender;
        }
        break;
      case 'dob':
        if (!value || value.trim() === '') {
          errors.dob = 'Ngày sinh không được để trống';
        } else {
          const dobDate = new Date(value);
          
          // Kiểm tra Invalid Date
          if (isNaN(dobDate.getTime())) {
            errors.dob = 'Ngày sinh không hợp lệ';
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time để so sánh ngày
            const normalizedDob = new Date(dobDate);
            normalizedDob.setHours(0, 0, 0, 0);
            
            if (normalizedDob > today) {
              errors.dob = 'Ngày sinh không thể trong tương lai';
            } else {
              // Kiểm tra 18 tuổi trở lên
              const age = today.getFullYear() - dobDate.getFullYear();
              const monthDiff = today.getMonth() - dobDate.getMonth();
              const dayDiff = today.getDate() - dobDate.getDate();
              
              let actualAge = age;
              if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                actualAge = age - 1;
              }
              
              if (actualAge < 18) {
                errors.dob = 'Bạn phải từ 18 tuổi trở lên';
              } else {
                delete errors.dob;
              }
            }
          }
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Kiểm tra có thay đổi không
      const newDataString = JSON.stringify(newData);
      setHasChanges(newDataString !== originalFormDataRef.current);
      
      return newData;
    });
    
    // Validate real-time
    validateField(name, value);
    
    // Clear success message khi có thay đổi
    if (success) {
      setSuccess(null);
    }
    
    // Clear error message khi bắt đầu nhập
    if (error && !error.includes('không có quyền')) {
      setError(null);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    // Focus vào field đầu tiên
    setTimeout(() => {
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  };

  const handleCancel = () => {
    // Nếu có thay đổi, xác nhận trước khi hủy
    if (hasChanges) {
      const confirmCancel = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?');
      if (!confirmCancel) {
        return;
      }
    }
    
    // Reset form data to original userInfo
    if (userInfo) {
      let dobFormatted = '';
      if (userInfo.Dob || userInfo.dob) {
        const dobDate = new Date(userInfo.Dob || userInfo.dob);
        if (!isNaN(dobDate.getTime())) {
          dobFormatted = dobDate.toISOString().split('T')[0];
        }
      }

      const resetData = {
        name: userInfo.Name || userInfo.name || '',
        email: userInfo.Email || userInfo.email || '',
        phone: userInfo.Phone || userInfo.phone || '',
        dob: dobFormatted,
        gender: userInfo.Gender || userInfo.gender || '',
        address: userInfo.Address || userInfo.address || '',
        avatar: userInfo.Avatar || userInfo.avatar || ''
      };
      
      setFormData(resetData);
      originalFormDataRef.current = JSON.stringify(resetData);
    }
    
    setIsEditing(false);
    setHasChanges(false);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setFieldErrors({});

      // Validate tất cả các field - không dùng validateField vì nó async và có thể không kịp cập nhật state
      const validationErrors: { [key: string]: string } = {};
      
      // Họ và tên (bắt buộc, 2-100 ký tự)
      if (!formData.name || formData.name.trim() === '') {
        validationErrors.name = 'Họ và tên không được để trống';
      } else if (formData.name.trim().length < 2) {
        validationErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
      } else if (formData.name.trim().length > 100) {
        validationErrors.name = 'Họ và tên không được vượt quá 100 ký tự';
      }
      
      // Số điện thoại (bắt buộc, đúng 10 số - database chỉ cho phép 10 ký tự)
      if (!formData.phone || formData.phone.trim() === '') {
        validationErrors.phone = 'Số điện thoại không được để trống';
      } else {
        const trimmedPhone = formData.phone.trim();
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          validationErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
        } else if (trimmedPhone.length > 10) {
          validationErrors.phone = 'Số điện thoại không được vượt quá 10 ký tự';
        }
      }
      
      // Địa chỉ (bắt buộc, tối đa 255 ký tự)
      if (!formData.address || formData.address.trim() === '') {
        validationErrors.address = 'Địa chỉ không được để trống';
      } else if (formData.address.trim().length > 255) {
        validationErrors.address = 'Địa chỉ không được vượt quá 255 ký tự';
      }
      
      // Giới tính (bắt buộc, tối đa 10 ký tự)
      if (!formData.gender || formData.gender.trim() === '') {
        validationErrors.gender = 'Giới tính không được để trống';
      } else if (formData.gender.trim().length > 10) {
        validationErrors.gender = 'Giới tính không được vượt quá 10 ký tự';
      }
      
      // Ngày sinh (bắt buộc, hợp lệ, không trong tương lai, từ 18 tuổi trở lên)
      if (!formData.dob || formData.dob.trim() === '') {
        validationErrors.dob = 'Ngày sinh không được để trống';
      } else {
        const dobDate = new Date(formData.dob);
        
        // Kiểm tra Invalid Date
        if (isNaN(dobDate.getTime())) {
          validationErrors.dob = 'Ngày sinh không hợp lệ';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const normalizedDob = new Date(dobDate);
          normalizedDob.setHours(0, 0, 0, 0);
          
          if (normalizedDob > today) {
            validationErrors.dob = 'Ngày sinh không thể trong tương lai';
          } else {
            // Kiểm tra 18 tuổi trở lên
            const age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            const dayDiff = today.getDate() - dobDate.getDate();
            
            let actualAge = age;
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              actualAge = age - 1;
            }
            
            if (actualAge < 18) {
              validationErrors.dob = 'Bạn phải từ 18 tuổi trở lên';
            }
          }
        }
      }
      
      // Nếu có lỗi validation, hiển thị và dừng lại
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setError('Vui lòng kiểm tra lại thông tin đã nhập');
        setSaving(false);
        // Scroll to first error
        setTimeout(() => {
          const firstErrorField = document.querySelector('.profile-form-input[aria-invalid="true"]') as HTMLElement;
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
          }
        }, 100);
        return;
      }

      // Format DOB to yyyy-MM-dd string (backend expects string in ISO format)
      let dobString = null;
      if (formData.dob) {
        // formData.dob is already in yyyy-MM-dd format from date input
        // Ensure it's in yyyy-MM-dd format
        const dobDate = new Date(formData.dob);
        if (!isNaN(dobDate.getTime())) {
          // Format as yyyy-MM-dd
          const year = dobDate.getFullYear();
          const month = String(dobDate.getMonth() + 1).padStart(2, '0');
          const day = String(dobDate.getDate()).padStart(2, '0');
          dobString = `${year}-${month}-${day}`;
        } else {
          // If already in yyyy-MM-dd format, use directly
          dobString = formData.dob;
        }
      }

      // Build payload exactly matching UpdateProfileDto
      // Backend requires: Name, Phone, Gender, Address, DOB (all profile-required)
      // Lấy giá trị từ formData, nếu không có thì lấy từ userInfo hiện tại
      // Nếu cả hai đều không có, gửi null (không phải empty string) để backend không báo lỗi validation
      const getValue = (formValue: string | undefined, userValue: any) => {
        const trimmed = formValue?.trim();
        if (trimmed) return trimmed;
        if (userValue) return String(userValue).trim() || null;
        return null;
      };
      
      const currentPhone = getValue(formData.phone, userInfo?.Phone || userInfo?.phone);
      const currentGender = getValue(formData.gender, userInfo?.Gender || userInfo?.gender);
      const currentAddress = getValue(formData.address, userInfo?.Address || userInfo?.address);
      const currentDOB = dobString || userInfo?.DOB || userInfo?.Dob || userInfo?.dob || null;
      const currentAvatar = getValue(formData.avatar, userInfo?.Avatar || userInfo?.avatar);
      
      const updateData: any = {
        Name: formData.name ? formData.name.trim() : (userInfo?.Name || userInfo?.name || ''),
        Phone: currentPhone,
        Gender: currentGender,
        Address: currentAddress,
        DOB: currentDOB
      };
      
      // Avatar là optional, chỉ thêm nếu có giá trị
      if (currentAvatar) {
        updateData.Avatar = currentAvatar;
      }

      // Log payload before sending
      console.log('🔵 ProfilePage.handleSave: formData.avatar:', formData.avatar);
      console.log('🔵 ProfilePage.handleSave: currentAvatar:', currentAvatar);
      console.log('🔵 ProfilePage.handleSave: Payload sẽ gửi đến backend:', JSON.stringify(updateData, null, 2));
      console.log('🔵 ProfilePage.handleSave: Endpoint:', `${API_ENDPOINTS.USER}/profile`);

      const response = await axiosInstance.put(`${API_ENDPOINTS.USER}/profile`, updateData);
      
      // Log response để debug
      if (import.meta.env.DEV) {
        console.log('✅ [ProfilePage] Response status:', response.status);
        console.log('✅ [ProfilePage] Response data:', response.data);
        console.log('✅ [ProfilePage] Response.data.user:', response.data?.user);
      }

      // Backend trả về { message: "Profile updated successfully", user: Account }
      // Account entity có thể có circular reference, cần xử lý cẩn thận
      let updatedUser = response.data?.user || response.data;
      
      if (!updatedUser) {
        console.error('❌ [ProfilePage] Response không có user data:', response.data);
        throw new Error('Không nhận được dữ liệu user từ server. Vui lòng thử lại.');
      }
      
      // Đảm bảo updatedUser là object hợp lệ
      if (typeof updatedUser !== 'object') {
        console.error('❌ [ProfilePage] User data không phải object:', updatedUser);
        throw new Error('Dữ liệu user không hợp lệ từ server.');
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ [ProfilePage] Updated user data:', updatedUser);
        console.log('✅ [ProfilePage] Updated user fields:', {
          Name: updatedUser.Name || updatedUser.name,
          Phone: updatedUser.Phone || updatedUser.phone,
          Gender: updatedUser.Gender || updatedUser.gender,
          Address: updatedUser.Address || updatedUser.address,
          DOB: updatedUser.Dob || updatedUser.dob,
          Avatar: updatedUser.Avatar || updatedUser.avatar
        });
      }
      
      setUserInfo(updatedUser);

      // Format DOB từ response để cập nhật formData
      let dobFormatted = '';
      if (updatedUser.Dob || updatedUser.dob) {
        const dobDate = new Date(updatedUser.Dob || updatedUser.dob);
        if (!isNaN(dobDate.getTime())) {
          dobFormatted = dobDate.toISOString().split('T')[0];
        }
      }

      // Cập nhật formData với dữ liệu mới từ response
      const updatedFormData = {
        name: updatedUser.Name || updatedUser.name || formData.name,
        email: updatedUser.Email || updatedUser.email || formData.email,
        phone: updatedUser.Phone || updatedUser.phone || formData.phone,
        dob: dobFormatted || formData.dob,
        gender: updatedUser.Gender || updatedUser.gender || formData.gender,
        address: updatedUser.Address || updatedUser.address || formData.address,
        avatar: updatedUser.Avatar || updatedUser.avatar || formData.avatar
      };
      setFormData(updatedFormData);

      // Update localStorage userInfo
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        try {
          const currentUserInfo = JSON.parse(userInfoStr);
          const updatedUserInfo = {
            ...currentUserInfo,
            Name: updatedUser.Name || updatedUser.name || currentUserInfo.Name || currentUserInfo.name,
            name: updatedUser.Name || updatedUser.name || currentUserInfo.name,
            Email: updatedUser.Email || updatedUser.email || currentUserInfo.Email || currentUserInfo.email,
            email: updatedUser.Email || updatedUser.email || currentUserInfo.email,
            Phone: updatedUser.Phone || updatedUser.phone || currentUserInfo.Phone || currentUserInfo.phone,
            phone: updatedUser.Phone || updatedUser.phone || currentUserInfo.phone,
            Avatar: updatedUser.Avatar || updatedUser.avatar || currentUserInfo.Avatar || currentUserInfo.avatar,
            avatar: updatedUser.Avatar || updatedUser.avatar || currentUserInfo.avatar,
            Gender: updatedUser.Gender || updatedUser.gender || currentUserInfo.Gender || currentUserInfo.gender,
            gender: updatedUser.Gender || updatedUser.gender || currentUserInfo.gender,
            Address: updatedUser.Address || updatedUser.address || currentUserInfo.Address || currentUserInfo.address,
            address: updatedUser.Address || updatedUser.address || currentUserInfo.address,
            Dob: updatedUser.Dob || updatedUser.dob || currentUserInfo.Dob || currentUserInfo.dob,
            dob: updatedUser.Dob || updatedUser.dob || currentUserInfo.dob
          };
          
          if (localStorage.getItem('userInfo')) {
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          }
          if (sessionStorage.getItem('userInfo')) {
            sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          }
          
          // Trigger custom event để Header tự động cập nhật
          window.dispatchEvent(new CustomEvent('userStorageChange'));
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
      }

      // Update original data ref với formData mới đã được cập nhật
      originalFormDataRef.current = JSON.stringify(updatedFormData);
      setHasChanges(false);
      setIsEditing(false);
      setFieldErrors({});
      
      // Show success message
      setSuccess('Cập nhật thông tin thành công!');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(' ProfilePage.handleSave: Lỗi khi cập nhật thông tin:', err);
      console.error('   Error type:', err.constructor.name);
      console.error('   Response status:', err.response?.status);
      console.error('   Response data:', JSON.stringify(err.response?.data, null, 2));
      console.error('   Response headers:', err.response?.headers);
      console.error('   Error message:', err.message);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        const errorMsg = 'Bạn không có quyền cập nhật thông tin. Vui lòng đăng nhập lại.';
        setError(errorMsg);
        navigate('/login', { state: { returnUrl: '/profile' } });
      } else if (err.response?.status === 400) {
        // Backend trả về BadRequest với object { message, error, innerException }
        // Hoặc có thể là string trong một số trường hợp cũ
        let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            // Trường hợp backend trả về string
            errorMessage = err.response.data;
          } else if (err.response.data.message) {
            // Trường hợp backend trả về object với message
            errorMessage = err.response.data.message;
          } else {
            // Fallback: stringify toàn bộ data
            errorMessage = JSON.stringify(err.response.data);
          }
        }
        
        setError(errorMessage);
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.';
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
  
    // clear lỗi cũ + validate type/size như đang làm
    setError(null)
    setFieldErrors(prev => {
      const next: any = { ...prev }   // ép kiểu any cho object lỗi
      delete next.avatar              // xoá lỗi avatar
      return next
    })
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, GIF)')
      setFieldErrors(prev => ({ ...prev, avatar: 'File phải là ảnh' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB')
      setFieldErrors(prev => ({ ...prev, avatar: 'Kích thước tối đa: 5MB' }))
      return
    }
  
    try {
      // Lưu URL ảnh cũ để xóa sau khi upload thành công
      const oldAvatarUrl = formData.avatar

      // Gửi lên Firebase, folder 'avatars'
      const downloadUrl = await uploadImageToFirebase(file, 'avatars')
  
      // Xóa ảnh cũ từ Firebase nếu có (chỉ xóa nếu là Firebase URL)
      if (oldAvatarUrl && oldAvatarUrl.includes('firebasestorage')) {
        try {
          await deleteImageFromFirebase(oldAvatarUrl)
          console.log('✅ Đã xóa ảnh avatar cũ từ Firebase')
        } catch (deleteErr) {
          // Không throw lỗi nếu xóa thất bại, chỉ log warning
          console.warn('⚠️ Không thể xóa ảnh avatar cũ:', deleteErr)
        }
      }

      // Cập nhật formData.avatar = URL Firebase
      setFormData(prev => {
        const next = { ...prev, avatar: downloadUrl }
        const newDataString = JSON.stringify(next)
        setHasChanges(newDataString !== originalFormDataRef.current)
        return next
      })
    } catch (err) {
      console.error('Upload avatar Firebase lỗi:', err)
      setError(err.message || 'Không thể upload ảnh. Vui lòng thử lại.')
      setFieldErrors(prev => ({ ...prev, avatar: 'Upload ảnh thất bại' }))
    }
  }

  // Get role name
  const getRoleName = () => {
    if (!userInfo) return 'User';
    
    if (userInfo.Role?.Name || userInfo.role?.name) {
      const roleName = userInfo.Role?.Name || userInfo.role?.name;
      if (roleName === 'User') return 'Tourist';
      return roleName;
    }
    if (userInfo.RoleName || userInfo.roleName) {
      const roleName = userInfo.RoleName || userInfo.roleName;
      if (roleName === 'User') return 'Tourist';
      return roleName;
    }
    
    // Role mapping theo database ROLES table
    // ID: 1 = Admin, ID: 2 = Host, ID: 3 = Agency, ID: 4 = Tourist
    const roleId = userInfo.RoleId || userInfo.roleId;
    if (roleId === 1) return 'Admin';
    if (roleId === 2) return 'Host';
    if (roleId === 3) return 'Agency';
    if (roleId === 4) return 'Tourist';
    return 'User';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate review statistics - Memoized để tránh tính toán lại mỗi render
  const reviewStatistics = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { total: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    
    const total = reviews.length;
    const sumRating = reviews.reduce((sum, review) => {
      const rating = review.Rating || review.rating || 0;
      return sum + rating;
    }, 0);
    const averageRating = total > 0 ? (sumRating / total).toFixed(1) : 0;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.floor(review.Rating || review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });
    
    return { total, averageRating, ratingDistribution };
  }, [reviews]);

  // Get sorted and filtered reviews - Memoized để tránh sort/filter lại mỗi render
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
  }, [reviews, reviewFilterRating, reviewSortBy]);

  // Helper function để enrich reviews (tái sử dụng)
  // Backend đã Include ServiceCombo trong Booking, nên không cần gọi thêm API
  const enrichReviews = useCallback(async (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) return [];
    
    const userId = getUserId();
    
    // Lấy ServiceCombo từ Booking (backend đã Include)
    // Nếu backend chưa Include, fallback sang gọi API
    const comboIdsToFetch: number[] = [];
    
    reviewsData.forEach(review => {
      const booking = review.Booking || review.booking;
      const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
      
      // Nếu không có ServiceCombo trong Booking, cần fetch
      if (!serviceCombo) {
        const comboId = booking?.ServiceComboId || booking?.serviceComboId;
        if (comboId && !comboIdsToFetch.includes(comboId)) {
          comboIdsToFetch.push(comboId);
        }
      }
    });
    
    // Fetch ServiceCombo nếu cần (fallback)
    const comboMap = new Map();
    if (comboIdsToFetch.length > 0) {
      const comboPromises = comboIdsToFetch.map(async (comboId) => {
        try {
          const comboResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${comboId}`);
          return { id: comboId, data: comboResponse.data };
        } catch (err) {
          return { id: comboId, data: null };
        }
      });
      
      const comboResults = await Promise.allSettled(comboPromises);
      comboResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          comboMap.set(result.value.id, result.value.data);
        }
      });
    }
    
    // Enrich reviews
    return reviewsData.map(review => {
      const enrichedReview = { ...review };
      const booking = enrichedReview.Booking || enrichedReview.booking;
      
      // Lấy ServiceCombo từ Booking (ưu tiên) hoặc từ comboMap (fallback)
      let serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
      if (!serviceCombo) {
        const comboId = booking?.ServiceComboId || booking?.serviceComboId;
        if (comboId && comboMap.has(comboId)) {
          serviceCombo = comboMap.get(comboId);
        }
      }
      
      // Gán ServiceCombo vào review để frontend dễ truy cập
      if (serviceCombo) {
        enrichedReview.ServiceCombo = serviceCombo;
        // Cũng gán ComboId để tương thích với code hiển thị
        enrichedReview.ComboId = serviceCombo.Id || serviceCombo.id;
      }
      
      // User info từ storage (nếu là review của chính user)
      if (enrichedReview.UserId || enrichedReview.userId) {
        const reviewUserId = enrichedReview.UserId || enrichedReview.userId;
        if (reviewUserId === userId && !enrichedReview.User) {
          const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
          if (userInfoStr) {
            try {
              enrichedReview.User = JSON.parse(userInfoStr);
            } catch (parseErr) {
              // Silent fail
            }
          }
        }
      }
      
      return enrichedReview;
    });
  }, []);

  // Helper function để parse reviews response
  const parseReviewsResponse = useCallback((responseData) => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (responseData.data && Array.isArray(responseData.data)) return responseData.data;
    if (responseData.reviews && Array.isArray(responseData.reviews)) return responseData.reviews;
    return [];
  }, []);

  // Handle edit review
  const handleEditReview = (review) => {
    setEditReviewForm({
      rating: review.Rating || review.rating || 5,
      comment: review.Content || review.content || review.Comment || review.comment || ''
    });
    setEditingReviewId(review.Id || review.id);
    setOpenReviewMenuId(null);
  };

  // Handle update review
  const handleUpdateReview = async () => {
    if (!editReviewForm.rating || editReviewForm.rating < 1 || editReviewForm.rating > 5) {
      setError('Vui lòng chọn số sao đánh giá từ 1 đến 5');
      return;
    }

    if (!editingReviewId) {
      setError('Không tìm thấy đánh giá cần chỉnh sửa');
      return;
    }

    try {
      setSubmittingReview(true);
      setError(null);
      
      const reviewData = {
        Rating: editReviewForm.rating,
        Comment: editReviewForm.comment || ''
      };

      await axiosInstance.put(`${API_ENDPOINTS.REVIEW}/${editingReviewId}`, reviewData);
      
      // Reload reviews
      const userId = getUserId();
      if (userId) {
        const response = await axiosInstance.get(`${API_ENDPOINTS.REVIEW}/user/${userId}`);
        const reviewsData = parseReviewsResponse(response.data);
        const enrichedReviews = await enrichReviews(reviewsData);
        setReviews(enrichedReviews);
      }
      
      setEditingReviewId(null);
      setEditReviewForm({ rating: 5, comment: '' });
      setSuccess('Đánh giá đã được cập nhật thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(' Lỗi khi cập nhật review:', err);
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      setError(null);
      
      await axiosInstance.delete(`${API_ENDPOINTS.REVIEW}/${reviewId}`);
      
      // Reload reviews
      const userId = getUserId();
      if (userId) {
        const response = await axiosInstance.get(`${API_ENDPOINTS.REVIEW}/user/${userId}`);
        const reviewsData = parseReviewsResponse(response.data);
        const enrichedReviews = await enrichReviews(reviewsData);
        setReviews(enrichedReviews);
      }
      
      setOpenReviewMenuId(null);
      setSuccess('Đánh giá đã được xóa thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(' Lỗi khi xóa review:', err);
      const errorMessage = err.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    // Nếu đang edit và có thay đổi, xác nhận trước khi chuyển tab
    if (isEditing && hasChanges) {
      const confirmChange = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn chuyển tab?');
      if (!confirmChange) {
        return;
      }
      // Reset edit mode
      handleCancel();
    }
    setActiveTab(tab);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  // Get booking status display
  const getBookingStatusDisplay = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending':
        return { text: 'Chờ xác nhận', className: 'profile-status-pending' };
      case 'confirmed':
        return { text: 'Đã xác nhận', className: 'profile-status-confirmed' };
      case 'processing':
        return { text: 'Đang xử lý', className: 'profile-status-confirmed' };
      case 'completed':
        return { text: 'Hoàn thành', className: 'profile-status-completed' };
      case 'cancelled':
        return { text: 'Đã hủy', className: 'profile-status-cancelled' };
      default:
        return { text: status || 'Chưa xác định', className: 'profile-status-unknown' };
    }
  };

  if (loading) {
    return (
      <div className="profile-profile-page">
        <ConditionalHeader />
        <main className="profile-profile-main">
          <LoadingSpinner message="Đang tải thông tin cá nhân..." />
        </main>
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="profile-profile-page">
        <ConditionalHeader />
        <main className="profile-profile-main">
          <div className="profile-profile-container">
            <div className="profile-error-container">
              <h2>Không thể tải thông tin</h2>
              <p>{error}</p>
              <Button variant="default" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Ưu tiên avatar từ storage (đã được cập nhật) để đồng bộ với Header
  const getAvatarFromStorage = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        const storageUserInfo = JSON.parse(userInfoStr);
        return storageUserInfo?.Avatar || storageUserInfo?.avatar || '';
      }
    } catch (e) {
      // Silent fail
    }
    return '';
  };
  
  // Ưu tiên: storage > formData > userInfo
  const avatarUrl = getAvatarFromStorage() || formData.avatar || userInfo?.Avatar || userInfo?.avatar || '';
  const displayName = userInfo?.Name || userInfo?.name || 'Người dùng';
  const displayEmail = userInfo?.Email || userInfo?.email || '';
  const roleName = getRoleName();

  // Get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'personal':
        return 'Thông tin cá nhân';
      case 'bookings':
        return 'Lịch sử đặt dịch vụ';
      case 'reviews':
        return 'Đánh giá của tôi';
      default:
        return 'Thông tin cá nhân';
    }
  };

  return (
    <div className="profile-profile-page">
      <ConditionalHeader />
      <main className="profile-profile-main">
        <div className="profile-profile-container">
          {/* Sidebar */}
          <aside className="profile-profile-sidebar">
            <div className="profile-sidebar-user-info">
              <div className="profile-sidebar-avatar">
                <LazyImage 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="profile-sidebar-avatar-image"
                />
              </div>
              <h3 className="profile-sidebar-user-name">{displayName}</h3>
              <p className="profile-sidebar-user-email">{displayEmail}</p>
              <Badge variant="default" className="profile-sidebar-role-badge">
                {roleName}
              </Badge>
            </div>

            <nav className="profile-sidebar-menu">
              <button
                onClick={() => handleTabChange('personal')}
                className={`profile-sidebar-menu-item ${activeTab === 'personal' ? 'profile-active' : ''}`}
              >
                <UserIcon className="profile-sidebar-menu-icon" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => handleTabChange('bookings')}
                className={`profile-sidebar-menu-item ${activeTab === 'bookings' ? 'profile-active' : ''}`}
              >
                <CalendarIcon className="profile-sidebar-menu-icon" />
                <span>Lịch sử đặt dịch vụ</span>
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`profile-sidebar-menu-item ${activeTab === 'reviews' ? 'profile-active' : ''}`}
              >
                <StarIcon className="profile-sidebar-menu-icon" />
                <span>Đánh giá của tôi</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="profile-profile-content">
            <div className="profile-profile-content-header">
              <h1 className="profile-profile-title">{getTabTitle()}</h1>
              {activeTab === 'personal' && (
                !isEditing ? (
                  <Button 
                    variant="default" 
                    onClick={handleEdit}
                    className="profile-edit-button"
                  >
                    <EditIcon className="profile-button-icon" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <div className="profile-edit-actions">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={saving}
                      className="profile-cancel-button"
                    >
                      <XIcon className="profile-button-icon" />
                      Hủy
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleSave}
                      disabled={saving}
                      className="profile-save-button"
                    >
                      <SaveIcon className="profile-button-icon" />
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                  </div>
                )
              )}
              {activeTab === 'bookings' && (
                <Button 
                  variant="default" 
                  onClick={() => navigate('/services')}
                  className="profile-edit-button"
                >
                  Đặt dịch vụ mới
                </Button>
              )}
            </div>

            {error && (
              <div className="profile-alert profile-alert-error" role="profile-alert">
                <AlertCircleIcon className="profile-alert-icon" />
                <div className="profile-alert-content">
                  <strong>Lỗi</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="profile-alert profile-alert-success" role="profile-alert">
                <CheckCircleIcon className="profile-alert-icon" />
                <div className="profile-alert-content">
                  <strong>Thành công</strong>
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
            <div className="profile-profile-form-compact">
              {/* Level Progress Bar - Only show for non-Host and non-Admin roles */}
              {!levelLoading && userId && level && getRoleName() !== 'Host' && getRoleName() !== 'Admin' && (
                <LevelProgressBar
                  totalSpent={totalSpent}
                  level={level}
                  progress={progress}
                  nextLevelAmount={nextLevelAmount}
                  showDetails={true}
                  size="large"
                />
              )}
              {levelError && getRoleName() !== 'Host' && getRoleName() !== 'Admin' && (
                <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem' }}>
                  {levelError}
                </div>
              )}
              {/* Avatar Section - Top - Chỉ hiện khi đang chỉnh sửa */}
              {isEditing && (
                <div className="profile-avatar-section-compact">
                  <div className="profile-avatar-wrapper-compact">
                    <div className="profile-avatar-preview-compact">
                      <LazyImage 
                        src={formData.avatar} 
                        alt="Avatar" 
                        className="profile-avatar-image"
                      />
                    </div>
                    <label htmlFor="avatar-upload" className="profile-avatar-change-button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Thay đổi ảnh
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="avatar-upload"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                      aria-label="Chọn ảnh đại diện"
                    />
                  </div>
                  {(fieldErrors as { [key: string]: string }).avatar && (
                    <span className="profile-field-error" role="profile-alert">
                      {(fieldErrors as { [key: string]: string }).avatar}
                    </span>
                  )}
                </div>
              )}

              {/* Form Fields - 2 Columns Layout */}
              <div className="profile-profile-fields-grid">
                {/* Left Column */}
                <div className="profile-profile-fields-column">
                  <div className="profile-form-field-compact">
                    <label htmlFor="name" className="profile-form-label-compact">
                      <UserIcon className="profile-field-icon" />
                      Họ và tên <span className="profile-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`profile-form-input-compact ${(fieldErrors as { [key: string]: string }).name ? 'profile-input-error' : ''}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('name', e.target.value)}
                      disabled={!isEditing}
                      required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).name}
                      aria-describedby={(fieldErrors as { [key: string]: string }).name ? 'name-error' : undefined}
                      placeholder="Nhập họ và tên của bạn"
                    />
                    {(fieldErrors as { [key: string]: string }).name && (
                      <span id="name-error" className="profile-field-error" role="profile-alert">
                        {(fieldErrors as { [key: string]: string }).name}
                      </span>
                    )}
                  </div>

                  <div className="profile-form-field-compact">
                    <label htmlFor="phone" className="profile-form-label-compact">
                      <svg className="profile-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`profile-form-input-compact ${(fieldErrors as { [key: string]: string }).phone ? 'profile-input-error' : ''}`}
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('phone', e.target.value)}
                      disabled={!isEditing}
                      required
                      placeholder="0901234567"
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).phone}
                      aria-describedby={(fieldErrors as { [key: string]: string }).phone ? 'phone-error' : undefined}
                    />
                    {(fieldErrors as { [key: string]: string }).phone && (
                      <span id="phone-error" className="profile-field-error" role="profile-alert">
                        {(fieldErrors as { [key: string]: string }).phone}
                      </span>
                    )}
                  </div>

                  <div className="profile-form-field-compact">
                    <label htmlFor="gender" className="profile-form-label-compact">
                      <UserIcon className="profile-field-icon" />
                      Giới tính
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className={`profile-form-input-compact ${(fieldErrors as { [key: string]: string }).gender ? 'profile-input-error' : ''}`}
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('gender', e.target.value)}
                      disabled={!isEditing}
                      required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).gender}
                      aria-describedby={(fieldErrors as { [key: string]: string }).gender ? 'gender-error' : undefined}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                    {(fieldErrors as { [key: string]: string }).gender && (
                      <span id="gender-error" className="profile-field-error" role="profile-alert">
                        {(fieldErrors as { [key: string]: string }).gender}
                      </span>
                    )}
                  </div>

                  <div className="profile-form-field-compact">
                    <label htmlFor="address" className="profile-form-label-compact">
                      <svg className="profile-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className={`profile-form-input-compact ${(fieldErrors as { [key: string]: string }).address ? 'profile-input-error' : ''}`}
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('address', e.target.value)}
                      required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).address}
                      aria-describedby={(fieldErrors as { [key: string]: string }).address ? 'address-error' : undefined}
                      disabled={!isEditing}
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    />
                    {(fieldErrors as { [key: string]: string }).address && (
                      <span id="address-error" className="profile-field-error" role="profile-alert">
                        {(fieldErrors as { [key: string]: string }).address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="profile-profile-fields-column">
                  <div className="profile-form-field-compact">
                    <label htmlFor="email" className="profile-form-label-compact">
                      <svg className="profile-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="profile-form-input-compact"
                      value={formData.email}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="profile-form-field-compact">
                    <label htmlFor="dob" className="profile-form-label-compact">
                      <CalendarIcon className="profile-field-icon" />
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      className={`profile-form-input-compact ${(fieldErrors as { [key: string]: string }).dob ? 'profile-input-error' : ''}`}
                      value={formData.dob}
                      onChange={handleInputChange}
                      onFocus={(e) => {
                        // Khi focus vào input, mở date picker ngay
                        if (isEditing && e.target instanceof HTMLInputElement) {
                          e.target.showPicker?.();
                        }
                      }}
                      onBlur={(e) => validateField('dob', e.target.value)}
                      disabled={!isEditing}
                      required
                      max={(() => {
                        // Max date là 18 năm trước từ hôm nay
                        const today = new Date();
                        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                        return maxDate.toISOString().split('T')[0];
                      })()}
                      min="1900-01-01"
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).dob}
                      aria-describedby={(fieldErrors as { [key: string]: string }).dob ? 'dob-error' : undefined}
                    />
                    {(fieldErrors as { [key: string]: string }).dob && (
                      <span id="dob-error" className="profile-field-error" role="profile-alert">
                        {(fieldErrors as { [key: string]: string }).dob}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="profile-tab-content">
                {loadingBookings ? (
                  <LoadingSpinner message="Đang tải lịch sử đặt dịch vụ..." />
                ) : bookings.length === 0 ? (
                  <div className="profile-empty-state">
                    <CalendarIcon className="profile-empty-state-icon" />
                    <h3>Chưa có đặt dịch vụ nào</h3>
                    <p>Bạn chưa có đặt dịch vụ nào. Hãy khám phá và đặt dịch vụ ngay!</p>
                    <Button variant="default" onClick={() => navigate('/services')}>
                      Đặt dịch vụ mới
                    </Button>
                  </div>
                ) : (
                  <div className="profile-bookings-list">
                    {bookings.map((booking) => {
                      console.log(' Booking:', booking);
                      const statusDisplay = getBookingStatusDisplay(booking.Status || booking.status);
                      const bookingId = booking.Id || booking.id;
                      const serviceCombo = booking.ServiceCombo || booking.serviceCombo;
                      const serviceName = serviceCombo?.Name || serviceCombo?.name || 'Dịch vụ';
                      // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên
                      let imagePath = serviceCombo?.Image || serviceCombo?.image || '';
                      if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
                        imagePath = imagePath.split(',')[0].trim();
                      }
                      const serviceImage = getImageUrl(imagePath, bookingFallbackImage);
                      
                      return (
                        <div key={bookingId} className="profile-booking-card ui-card">
                          <div className="ui-card-content">
                            <div className="profile-booking-card-content">
                              <div className="profile-booking-card-left">
                                <div className="profile-booking-image">
                                  <LazyImage
                                    src={serviceImage}
                                    alt={serviceName}
                                    className="profile-booking-image-img"
                                    fallbackSrc={bookingFallbackImage}
                                  />
                                </div>
                                <div className="profile-booking-info">
                                  <h3 className="profile-booking-service-name">{serviceName}</h3>
                                  <div className="profile-booking-details">
                                    {(booking.BookingDate || booking.bookingDate) && (
                                      <div className="profile-booking-detail-item">
                                        <CalendarIcon className="profile-detail-icon" />
                                        <span>
                                          Ngày đặt: {formatDate(booking.BookingDate || booking.bookingDate)}
                                        </span>
                                      </div>
                                    )}
                                    {booking.Quantity && (
                                      <div className="profile-booking-detail-item">
                                        <UserIcon className="profile-detail-icon" />
                                        <span>Số người: {booking.Quantity || booking.quantity}</span>
                                      </div>
                                    )}
                                    {booking.TotalAmount && (
                                      <div className="profile-booking-detail-item">
                                        <span className="profile-booking-price">
                                          Tổng tiền: {formatPrice(booking.TotalAmount || booking.totalAmount)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="profile-booking-status-row">
                                    <Badge className={`profile-status-badge ${statusDisplay.className}`}>
                                      {statusDisplay.text}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="profile-booking-card-actions">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/payment/${bookingId}`, {
                                    state: { 
                                      returnUrl: '/profile',
                                      returnTab: 'bookings'
                                    }
                                  })}
                                >
                                  Chi tiết
                                </Button>
                                {['pending', 'confirmed'].includes((booking.Status || booking.status)?.toLowerCase()) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="profile-cancel-booking-btn"
                                    onClick={async () => {
                                      if (window.confirm('Bạn có chắc muốn hủy đặt dịch vụ này?')) {
                                        try {
                                          setLoadingBookings(true);
                                          // Backend nhận [FromBody] string status, không phải object
                                          await axiosInstance.put(`${API_ENDPOINTS.BOOKING}/${bookingId}/status`, 'cancelled');
                                          // Reload bookings
                                          const userId = getUserId();
                                          const response = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/user/${userId}`);
                                          setBookings(response.data || []);
                                          setSuccess('Hủy đặt dịch vụ thành công!');
                                          setTimeout(() => setSuccess(null), 3000);
                                        } catch (err) {
                                          console.error(' Lỗi khi hủy đặt dịch vụ:', err);
                                          setError(err.response?.data?.message || 'Không thể hủy đặt dịch vụ. Vui lòng thử lại.');
                                          setTimeout(() => setError(null), 5000);
                                        } finally {
                                          setLoadingBookings(false);
                                        }
                                      }
                                    }}
                                  >
                                    Hủy dịch vụ
                                  </Button>
                                )}
                                {(booking.Status || booking.status)?.toLowerCase() === 'completed' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // Navigate đến trang chi tiết service với bookingId để review
                                      const comboId = serviceCombo?.Id || serviceCombo?.id;
                                      if (comboId) {
                                        navigate(`/services/${comboId}`, {
                                          state: { 
                                            openReview: true,
                                            bookingId: bookingId,
                                            returnUrl: '/profile',
                                            returnTab: 'bookings'
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    Đánh giá
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="profile-tab-content">
                {loadingReviews ? (
                  <LoadingSpinner message="Đang tải đánh giá..." />
                ) : error && error.includes('đánh giá') ? (
                  <div className="profile-empty-state">
                    <AlertCircleIcon className="profile-empty-state-icon" />
                    <h3>Không thể tải đánh giá</h3>
                    <p>{error}</p>
                    <Button variant="default" onClick={() => {
                      const userId = getUserId();
                      if (userId) {
                        setError(null);
                        setActiveTab('personal');
                        setTimeout(() => setActiveTab('reviews'), 100);
                      }
                    }}>
                      Thử lại
                    </Button>
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="profile-empty-state">
                    <StarIcon className="profile-empty-state-icon" />
                    <h3>Chưa có đánh giá nào</h3>
                    <p>Bạn chưa đánh giá dịch vụ nào. Hãy đánh giá sau khi sử dụng dịch vụ!</p>
                    <Button variant="default" onClick={() => navigate('/services')}>
                      Khám phá dịch vụ
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Filter and Sort Controls */}
                    <div className="profile-reviews-controls">
                      <div className="profile-filter-group">
                        <label htmlFor="rating-filter" className="profile-filter-label">Lọc theo sao:</label>
                        <select
                          id="rating-filter"
                          className="profile-filter-select"
                          value={reviewFilterRating}
                          onChange={(e) => setReviewFilterRating(parseInt(e.target.value))}
                        >
                          <option value={0}>Tất cả</option>
                          <option value={5}>5 sao</option>
                          <option value={4}>4 sao</option>
                          <option value={3}>3 sao</option>
                          <option value={2}>2 sao</option>
                          <option value={1}>1 sao</option>
                        </select>
                      </div>
                      <div className="profile-sort-group">
                        <label htmlFor="sort-by" className="profile-filter-label">Sắp xếp:</label>
                        <select
                          id="sort-by"
                          className="profile-filter-select"
                          value={reviewSortBy}
                          onChange={(e) => setReviewSortBy(e.target.value)}
                        >
                          <option value="newest">Mới nhất</option>
                          <option value="oldest">Cũ nhất</option>
                          <option value="highest">Cao nhất</option>
                          <option value="lowest">Thấp nhất</option>
                        </select>
                      </div>
                      <div className="profile-results-count">
                        Hiển thị {sortedAndFilteredReviews.length} / {reviews.length} đánh giá
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="profile-reviews-list">
                      {sortedAndFilteredReviews.length === 0 ? (
                        <div className="profile-empty-state">
                          <StarIcon className="profile-empty-state-icon" />
                          <h3>Không tìm thấy đánh giá</h3>
                          <p>Không có đánh giá nào phù hợp với bộ lọc đã chọn.</p>
                          <Button variant="outline" onClick={() => setReviewFilterRating(0)}>
                            Xóa bộ lọc
                          </Button>
                        </div>
                      ) : (
                        sortedAndFilteredReviews.map((review, index) => {
                      try {
                        const reviewId = review.Id || review.id || `review-${index}`;
                        const serviceCombo = review.ServiceCombo || review.serviceCombo;
                        
                        // Fallback nếu không có ServiceCombo - lấy từ ComboId
                        let serviceName = 'Dịch vụ không xác định';
                        let serviceId = null;
                        let serviceImage = bookingFallbackImage;
                        
                        if (serviceCombo) {
                          serviceName = serviceCombo.Name || serviceCombo.name || 'Dịch vụ không xác định';
                          serviceId = serviceCombo.Id || serviceCombo.id;
                          // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên
                          let imagePath = serviceCombo.Image || serviceCombo.image || '';
                          if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
                            imagePath = imagePath.split(',')[0].trim();
                          }
                          serviceImage = getImageUrl(imagePath, bookingFallbackImage);
                        } else if (review.ComboId || review.comboId) {
                          // Nếu chưa load được ServiceCombo, vẫn hiển thị review với thông tin cơ bản
                          serviceName = `Dịch vụ #${review.ComboId || review.comboId}`;
                          serviceId = review.ComboId || review.comboId;
                        }
                        
                        const rating = review.Rating || review.rating || 0;
                        const comment = review.Content || review.content || review.Comment || review.comment || '';
                        const createdAt = review.CreatedAt || review.createdAt || review.CreatedDate || review.createdDate;
                        
                        const isEditing = editingReviewId === reviewId;
                        
                        return (
                          <div key={reviewId} className="profile-review-card-enhanced">
                            {isEditing ? (
                              /* Edit Mode */
                              <div className="profile-review-edit-form">
                                <div className="profile-review-form-rating">
                                  <label>Đánh giá:</label>
                                  <div className="profile-star-rating-input">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        className={`profile-star-button ${star <= editReviewForm.rating ? 'profile-active' : ''}`}
                                        onClick={() => setEditReviewForm({ ...editReviewForm, rating: star })}
                                        aria-label={`${star} sao`}
                                      >
                                        <StarIcon className="profile-star-icon" filled={star <= editReviewForm.rating} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="profile-review-form-comment">
                                  <label htmlFor={`edit-comment-${reviewId}`}>Nhận xét:</label>
                                  <textarea
                                    id={`edit-comment-${reviewId}`}
                                    rows={4}
                                    value={editReviewForm.comment}
                                    onChange={(e) => setEditReviewForm({ ...editReviewForm, comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                                    maxLength={1000}
                                  />
                                  <div className="profile-char-count-wrapper">
                                    <span className="profile-char-count">{editReviewForm.comment.length}/1000 ký tự</span>
                                  </div>
                                </div>
                                <div className="profile-review-form-actions">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingReviewId(null);
                                      setEditReviewForm({ rating: 5, comment: '' });
                                    }}
                                    disabled={submittingReview}
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
                              /* View Mode - Layout theo yêu cầu */
                              <div className="profile-review-content-wrapper">
                                {/* Main Content: Image + Info */}
                                <div className="profile-review-main-content">
                                  {/* Service Image - Left */}
                                  <div className="profile-review-image-container">
                                    {serviceId ? (
                                      <Link to={`/services/${serviceId}`}>
                                        <LazyImage
                                          src={serviceImage}
                                          alt={serviceName}
                                          className="profile-review-service-image"
                                          fallbackSrc={bookingFallbackImage}
                                        />
                                      </Link>
                                    ) : (
                                      <LazyImage
                                        src={serviceImage}
                                        alt={serviceName}
                                        className="profile-review-service-image"
                                        fallbackSrc={bookingFallbackImage}
                                      />
                                    )}
                                  </div>

                                  {/* Service Info - Right */}
                                  <div className="profile-review-info-container">
                                    {serviceId ? (
                                      <Link to={`/services/${serviceId}`} className="profile-review-service-link">
                                        <h3 className="profile-review-service-title">{serviceName}</h3>
                                      </Link>
                                    ) : (
                                      <h3 className="profile-review-service-title">{serviceName}</h3>
                                    )}
                                    
                                    {createdAt && (
                                      <div className="profile-review-date-row">
                                        <CalendarIcon className="profile-review-date-icon" />
                                        <span>{formatDate(createdAt)}</span>
                                      </div>
                                    )}
                                    
                                    {rating > 0 && (
                                      <div className="profile-review-rating-row">
                                        <div className="profile-review-stars-inline">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIcon
                                              key={star}
                                              className="profile-review-star-inline"
                                              filled={star <= rating}
                                            />
                                          ))}
                                        </div>
                                        <span className="profile-review-rating-text-inline">
                                          ({rating.toFixed(1)})
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions Menu - Top Right */}
                                  <div className="profile-review-menu-wrapper">
                                    <button
                                      className="profile-review-menu-button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenReviewMenuId(openReviewMenuId === reviewId ? null : reviewId);
                                      }}
                                      aria-label="Tùy chọn"
                                    >
                                      <MoreVerticalIcon className="profile-review-menu-icon" />
                                    </button>
                                    {openReviewMenuId === reviewId && (
                                      <div className="profile-review-menu-dropdown">
                                        <button
                                          className="profile-review-menu-item"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditReview(review);
                                          }}
                                        >
                                          <EditIcon className="profile-review-menu-item-icon" />
                                          <span>Chỉnh sửa</span>
                                        </button>
                                        <button
                                          className="profile-review-menu-item profile-review-menu-item-delete"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReview(reviewId);
                                          }}
                                          disabled={deletingReviewId === reviewId}
                                        >
                                          <TrashIcon className="profile-review-menu-item-icon" />
                                          <span>{deletingReviewId === reviewId ? 'Đang xóa...' : 'Xóa'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Comment Section - Below */}
                                {comment && (
                                  <div className="profile-review-comment-wrapper">
                                    <p className="profile-review-comment-text">{comment}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      } catch (err) {
                        console.error(' ProfilePage: Lỗi khi render review:', err, review);
                        return (
                          <div key={`error-${index}`} className="profile-review-card ui-card">
                            <div className="ui-card-content">
                              <p>Lỗi khi hiển thị đánh giá này</p>
                            </div>
                          </div>
                        );
                      }
                          })
                        )}
                  </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;





