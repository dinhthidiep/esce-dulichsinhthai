import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '~/utils/axiosInstance';
import HostHeader from '~/components/user/HostHeader';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { 
  UserIcon, 
  CalendarIcon, 
  BellIcon, 
  SettingsIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  StarIcon,
  ArrowRightIcon,
  GridIcon,
  ChevronDownIcon,
  CommentIcon
} from './icons/index';
import HostSidebar from './HostSidebar';

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
import { formatPrice, getImageUrl } from '~/lib/utils';
import { API_ENDPOINTS } from '~/config/api';
import ServicesManagement from './service/ServicesManagement';
import type { ServicesManagementRef } from './service/ServicesManagement';
import CouponManagement from './coupon/CouponManagement';
import type { CouponManagementRef } from './coupon/CouponManagement';
import ServiceComboManagement from './service-combo/ServiceComboManagement';
import type { ServiceComboManagementRef } from './service-combo/ServiceComboManagement';
import PrivilegeManagement from './privilege/PrivilegeManagement';
import type { PrivilegeManagementRef } from './privilege/PrivilegeManagement';
import BookingManagement from './booking/BookingManagement';
import ReviewManagement from './review/ReviewManagement';
import RevenueManagement from './revenue/RevenueManagement';
import './HostDashboard.css';

const HostDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'services');
  const [couponToggleState, setCouponToggleState] = useState(false); // Track coupon toggle state: false = coupons list, true = promotions list
  
  // Sync coupon toggle state when tab changes
  useEffect(() => {
    if (activeTab === 'coupons' && couponManagementRef.current) {
      const currentToggleState = couponManagementRef.current.getToggleState();
      setCouponToggleState(currentToggleState);
    }
  }, [activeTab]);
  // Apply Promotion Modal states
  const [isApplyPromotionModalOpen, setIsApplyPromotionModalOpen] = useState(false);
  const [applyPromotionFormData, setApplyPromotionFormData] = useState({
    serviceId: '',
    couponId: '',
    rankId: '',
    userType: ''
  });
  const [applyPromotionErrors, setApplyPromotionErrors] = useState<Record<string, string>>({});
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  
  // Service Rank Rules states
  const [serviceRankRules, setServiceRankRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showPromotionsList, setShowPromotionsList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 5;
  
  // Coupon Rank Rules states (used in Apply Promotion Modal)
  const [couponRankRules, setCouponRankRules] = useState([]);
  
  // Services and Coupons for dropdowns
  const [allServices, setAllServices] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  
  
  
  const originalFormDataRef = useRef(null);
  const fileInputRef = useRef(null);
  const servicesManagementRef = useRef<ServicesManagementRef>(null);
  const couponManagementRef = useRef<CouponManagementRef>(null);
  const serviceComboManagementRef = useRef<ServiceComboManagementRef>(null);
  const privilegeManagementRef = useRef<PrivilegeManagementRef>(null);
  
  
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
    } catch (err) {
      console.error('Error getting user ID:', err);
      return null;
    }
  }, []);

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

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Phiên đăng nhập đã hết hạn');
          navigate('/login', { state: { returnUrl: '/profile' } });
          return;
        }

        const response = await axiosInstance.get(`${API_ENDPOINTS.USER}/${userId}`);
        console.log(' HostDashboard: Nhận được dữ liệu user:', response.data);

        const userData = response.data;
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

        const initialFormData = {
          name: userData.Name || userData.name || '',
          email: userData.Email || userData.email || '',
          phone: userData.Phone || userData.phone || '',
          dob: dobFormatted,
          gender: userData.Gender || userData.gender || '',
          address: userData.Address || userData.address || '',
          avatar: userData.Avatar || userData.avatar || ''
        };
        
        setFormData(initialFormData);
        // Lưu original data để so sánh thay đổi
        originalFormDataRef.current = JSON.stringify(initialFormData);
      } catch (err) {
        console.error(' Lỗi khi tải thông tin user:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này. Vui lòng đăng nhập lại.');
          navigate('/login', { state: { returnUrl: '/profile' } });
        } else if (err.response?.status === 404) {
          setError('Không tìm thấy thông tin người dùng');
        } else {
          setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);


  // Cập nhật activeTab khi location.state thay đổi (khi quay về từ PaymentPage)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear state để tránh set lại khi re-render - sử dụng navigate thay vì window.history
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);



  // Load coupons when coupons tab is host-active







  // Filter and sort function for coupons
  // Filter and sort function for service combos

  // Booking handlers




  const formatCurrency = (amount) => {
    if (amount == null) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatReviewDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };


  // Get coupon status display

  // Apply Promotion Modal handlers
  const handleApplyPromotionInputChange = (e) => {
    const { name, value } = e.target;
    
    setApplyPromotionFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear host-error when user starts typing
    if (applyPromotionErrors[name]) {
      setApplyPromotionErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleApplyPromotionSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - check if we're in services or coupons tab
    const errors: Record<string, string> = {};
    if (activeTab === 'services') {
      if (!applyPromotionFormData.serviceId) {
        errors.serviceId = 'Vui lòng chọn dịch vụ';
      }
    } else if (activeTab === 'coupons') {
      if (!applyPromotionFormData.couponId) {
        errors.couponId = 'Vui lòng chọn coupon';
      }
    }
    if (!applyPromotionFormData.rankId) {
      errors.rankId = 'Vui lòng chọn hạng';
    }
    if (!applyPromotionFormData.userType) {
      errors.userType = 'Vui lòng chọn loại người dùng';
    }

    if (Object.keys(errors).length > 0) {
      setApplyPromotionErrors(errors);
      return;
    }

    setIsApplyingPromotion(true);
    setApplyPromotionErrors({});

    try {
      if (activeTab === 'services') {
        // TODO: Implement API call to create ServiceRankRule
        console.log('Applying service promotion:', applyPromotionFormData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add to serviceRankRules
        // Load service from API to get name
        try {
          const serviceResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE}/${applyPromotionFormData.serviceId}`);
          const service = serviceResponse.data;
          const newRule = {
            RuleID: serviceRankRules.length + 1,
            ServiceID: parseInt(applyPromotionFormData.serviceId),
            RankID: applyPromotionFormData.rankId,
            UserType: applyPromotionFormData.userType,
            ServiceName: service ? (service.Name || service.name) : `Dịch vụ ID: ${applyPromotionFormData.serviceId}`
          };
          setServiceRankRules(prev => [...prev, newRule]);
        } catch (err) {
          console.error('Error loading service:', err);
          const newRule = {
            RuleID: serviceRankRules.length + 1,
            ServiceID: parseInt(applyPromotionFormData.serviceId),
            RankID: applyPromotionFormData.rankId,
            UserType: applyPromotionFormData.userType,
            ServiceName: `Dịch vụ ID: ${applyPromotionFormData.serviceId}`
          };
          setServiceRankRules(prev => [...prev, newRule]);
        }
      } else if (activeTab === 'coupons') {
        // TODO: Implement API call to create CouponRankRule
        console.log('Applying coupon promotion:', applyPromotionFormData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add to couponRankRules
        // Load coupon from API to get code
        try {
          const couponResponse = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/${applyPromotionFormData.couponId}`);
          const coupon = couponResponse.data;
          const newRule = {
            RuleID: couponRankRules.length + 1,
            CouponID: parseInt(applyPromotionFormData.couponId),
            RankID: applyPromotionFormData.rankId,
            UserType: applyPromotionFormData.userType,
            CouponCode: coupon ? (coupon.Code || coupon.code) : `Mã giảm giá ID: ${applyPromotionFormData.couponId}`
          };
          setCouponRankRules(prev => [...prev, newRule]);
        } catch (err) {
          console.error('Error loading coupon:', err);
          const newRule = {
            RuleID: couponRankRules.length + 1,
            CouponID: parseInt(applyPromotionFormData.couponId),
            RankID: applyPromotionFormData.rankId,
            UserType: applyPromotionFormData.userType,
            CouponCode: `Mã giảm giá ID: ${applyPromotionFormData.couponId}`
          };
          setCouponRankRules(prev => [...prev, newRule]);
        }
      }
      
      setSuccess('Áp dụng thành công!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Close modal and reset form
      setIsApplyPromotionModalOpen(false);
      setApplyPromotionFormData({
        serviceId: '',
        couponId: '',
        rankId: '',
        userType: ''
      });
      setApplyPromotionErrors({});
    } catch (err) {
      console.error('Error applying promotion:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi áp dụng ưu đãi. Vui lòng thử lại.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const handleCloseApplyPromotionModal = () => {
    setIsApplyPromotionModalOpen(false);
    setApplyPromotionFormData({
      serviceId: '',
      couponId: '',
      rankId: '',
      userType: ''
    });
    setApplyPromotionErrors({});
  };

  // Validate individual host-field
  const validateField = (name, value) => {
    const errors: { [key: string]: string } = { ...fieldErrors };
    
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          errors.name = 'Họ và tên không được để trống';
        } else if (value.trim().length < 2) {
          errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
        } else {
          delete errors.name;
        }
        break;
      case 'phone':
        if (!value || value.trim() === '') {
          errors.phone = 'Số điện thoại không được để trống';
        } else {
          const phoneRegex = /^[0-9]{10,11}$/;
          if (!phoneRegex.test(value.trim())) {
            errors.phone = 'Số điện thoại phải có 10-11 chữ số';
          } else {
            delete errors.phone;
          }
        }
        break;
      case 'address':
        if (!value || value.trim() === '') {
          errors.address = 'Địa chỉ không được để trống';
        } else {
          delete errors.address;
        }
        break;
      case 'gender':
        if (!value || value.trim() === '') {
          errors.gender = 'Giới tính không được để trống';
        } else {
          delete errors.gender;
        }
        break;
      case 'dob':
        if (!value || value.trim() === '') {
          errors.dob = 'Ngày sinh không được để trống';
        } else {
          const dobDate = new Date(value);
          const today = new Date();
          
          if (dobDate > today) {
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
    // Focus vào host-field đầu tiên
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

      // Validate all host-required fields
      validateField('name', formData.name);
      validateField('phone', formData.phone);
      validateField('address', formData.address);
      validateField('gender', formData.gender);
      validateField('dob', formData.dob);
      
      // Kiểm tra nếu có lỗi validation
      const newErrors: { [key: string]: string } = {};
      
      // Họ và tên (bắt buộc)
      if (!formData.name || formData.name.trim() === '') {
        newErrors.name = 'Họ và tên không được để trống';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
      }
      
      // Số điện thoại (bắt buộc)
      if (!formData.phone || formData.phone.trim() === '') {
        newErrors.phone = 'Số điện thoại không được để trống';
      } else {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }
      }
      
      // Địa chỉ (bắt buộc)
      if (!formData.address || formData.address.trim() === '') {
        newErrors.address = 'Địa chỉ không được để trống';
      }
      
      // Giới tính (bắt buộc)
      if (!formData.gender || formData.gender.trim() === '') {
        newErrors.gender = 'Giới tính không được để trống';
      }
      
      // Ngày sinh (bắt buộc và phải từ 18 tuổi trở lên)
      if (!formData.dob || formData.dob.trim() === '') {
        newErrors.dob = 'Ngày sinh không được để trống';
      } else {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        
        if (dobDate > today) {
          newErrors.dob = 'Ngày sinh không thể trong tương lai';
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
            newErrors.dob = 'Bạn phải từ 18 tuổi trở lên';
          }
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        setError('Vui lòng kiểm tra lại thông tin đã nhập');
        setSaving(false);
        // Scroll to first host-error
        const firstErrorField = document.querySelector('.host-form-input[aria-invalid="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErrorField as HTMLElement).focus();
        }
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
      // Backend requires: Name, Phone, Gender, Address, DOB (all host-required)
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
      console.log(' HostDashboard.handleSave: Payload sẽ gửi đến backend:', JSON.stringify(updateData, null, 2));
      console.log(' HostDashboard.handleSave: Endpoint:', `${API_ENDPOINTS.USER}/profile`);

      const response = await axiosInstance.put(`${API_ENDPOINTS.USER}/profile`, updateData);
      console.log(' HostDashboard: Cập nhật thành công:', response.data);

      // Update userInfo with new data
      const updatedUser = response.data.user || response.data;
      setUserInfo(updatedUser);

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

      // Update original data ref
      originalFormDataRef.current = JSON.stringify(formData);
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
      console.error(' HostDashboard.handleSave: Lỗi khi cập nhật thông tin:', err);
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clear previous errors
    setError(null);
    setFieldErrors(prev => {
      const newErrors: { [key: string]: string } = { ...prev };
      delete newErrors.avatar;
      return newErrors;
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      setFieldErrors(prev => ({ ...prev, avatar: 'File phải là ảnh' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      setFieldErrors(prev => ({ ...prev, avatar: 'Kích thước tối đa: 5MB' }));
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onerror = () => {
      setError('Không thể đọc file ảnh. Vui lòng thử lại.');
    };
    reader.onloadend = () => {
      setFormData((prev: { name: string; email: string; phone: string; dob: string; gender: string; address: string; avatar: string }): { name: string; email: string; phone: string; dob: string; gender: string; address: string; avatar: string } => {
        const newData: { [key: string]: string | ArrayBuffer } = {
          ...prev,
          avatar: reader.result
        };
        // Check for changes
        const newDataString = JSON.stringify(newData);
        setHasChanges(newDataString !== originalFormDataRef.current);
        return newData as { name: string; email: string; phone: string; dob: string; gender: string; address: string; avatar: string };
      });
    };
    reader.readAsDataURL(file);
  };

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

  if (loading) {
    return (
      <>
        <HostHeader />
        <main className="host-hostdashboard-main">
          <LoadingSpinner message="Đang tải thông tin cá nhân..." />
        </main>
      </>
    );
  }

  if (error && !userInfo) {
    return (
      <>
        <HostHeader />
        <main className="host-hostdashboard-main">
          <div className="host-profile-container">
            <div className="host-error-container">
              <h2>Không thể tải thông tin</h2>
              <p>{error}</p>
              <Button variant="default" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </div>
        </div>
      </main>
    </>
    );
  }

  const avatarUrl = formData.avatar || userInfo?.Avatar || userInfo?.avatar || '';
  const displayName = userInfo?.Name || userInfo?.name || 'Người dùng';
  const displayEmail = userInfo?.Email || userInfo?.email || '';
  const roleName = getRoleName();

  // Get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'personal':
        return 'Dịch vụ thêm';
      case 'bookings':
        return 'Quản lý đặt hàng';
      case 'reviews':
        return 'Nhận xét';
      case 'revenue':
        return 'Doanh thu';
      case 'notifications':
        return 'Thông báo';
      case 'services':
        return 'Dịch vụ thêm';
      case 'coupons':
        return 'Mã giảm giá';
      case 'service-combos':
        return 'Gói dịch vụ';
      case 'promotions':
        return 'Ưu đãi (Dịch vụ tặng kèm)';
      case 'settings':
        return 'Cài đặt';
      default:
        return 'Dịch vụ thêm';
    }
  };

  return (
    <>
      <HostHeader />
      <main className="host-hostdashboard-main">
        <div className="host-profile-container">
          {/* Sidebar */}
          <HostSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            avatarUrl={avatarUrl}
            displayName={displayName}
            displayEmail={displayEmail}
            roleName={roleName}
          />

          {/* Main Content */}
          <div className="host-hostdashboard-content">
            <div className="host-profile-content-header">
              <h1 className="host-profile-title">{getTabTitle()}</h1>
              {activeTab === 'services' && (
                <Button 
                  variant="default" 
                  onClick={() => servicesManagementRef.current?.openCreateModal()}
                  className="host-edit-button"
                >
                  Tạo mới
                </Button>
              )}
              {activeTab === 'coupons' && (
                <>
                  {couponToggleState ? (
                    <Button 
                      variant="default" 
                      onClick={() => setIsApplyPromotionModalOpen(true)}
                      className="host-edit-button host-btn-apply-promotion"
                    >
                      Áp dụng ưu đãi
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      onClick={() => couponManagementRef.current?.openCreateModal()}
                      className="host-edit-button"
                    >
                      Tạo mới
                    </Button>
                  )}
                </>
              )}
              {activeTab === 'service-combos' && (
                <Button 
                  variant="default" 
                  onClick={() => serviceComboManagementRef.current?.openCreateModal()}
                  className="host-edit-button"
                >
                  Tạo combo mới
                </Button>
              )}
              {activeTab === 'promotions' && (
                <Button 
                  variant="default" 
                  onClick={() => privilegeManagementRef.current?.openCreateModal()}
                  className="host-edit-button"
                >
                  Tạo ưu đãi
                </Button>
              )}
            </div>

            {error && (
              <div className="host-alert host-alert-error" role="host-alert">
                <AlertCircleIcon className="host-alert-icon" />
                <div className="host-alert-content">
                  <strong>Lỗi</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="host-alert host-alert-success" role="host-alert">
                <CheckCircleIcon className="host-alert-icon" />
                <div className="host-alert-content">
                  <strong>Thành công</strong>
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* Personal Info Tab - Removed */}
            {false && activeTab === 'personal' && (
            <div className="host-profile-form-compact">
              {/* Avatar Section - Top - Chỉ hiện khi đang chỉnh sửa */}
              {isEditing && (
                <div className="host-avatar-section-compact">
                  <div className="host-avatar-wrapper-compact">
                    <div className="host-avatar-preview-compact">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" />
                      ) : (
                        <div className="host-avatar-placeholder-compact">
                          {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <label htmlFor="avatar-upload" className="host-avatar-change-button">
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
                    <span className="host-field-error" role="host-alert">
                      {(fieldErrors as { [key: string]: string }).avatar}
                    </span>
                  )}
                </div>
              )}

              {/* Form Fields - 2 Columns Layout */}
              <div className="host-profile-fields-grid">
                {/* Left Column */}
                <div className="host-profile-fields-column">
                  <div className="host-form-field-compact">
                    <label htmlFor="name" className="host-form-label-compact">
                      <UserIcon className="host-field-icon" />
                      Họ và tên <span className="host-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`host-form-input-compact ${(fieldErrors as { [key: string]: string }).name ? 'host-input-error' : ''}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('name', e.target.value)}
                      disabled={!isEditing}
                      host-required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).name}
                      aria-describedby={(fieldErrors as { [key: string]: string }).name ? 'name-error' : undefined}
                      placeholder="Nhập họ và tên của bạn"
                    />
                    {(fieldErrors as { [key: string]: string }).name && (
                      <span id="name-error" className="host-field-error" role="host-alert">
                        {(fieldErrors as { [key: string]: string }).name}
                      </span>
                    )}
                  </div>

                  <div className="host-form-field-compact">
                    <label htmlFor="phone" className="host-form-label-compact">
                      <svg className="host-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`host-form-input-compact ${(fieldErrors as { [key: string]: string }).phone ? 'host-input-error' : ''}`}
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('phone', e.target.value)}
                      disabled={!isEditing}
                      host-required
                      placeholder="0901234567"
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).phone}
                      aria-describedby={(fieldErrors as { [key: string]: string }).phone ? 'phone-error' : undefined}
                    />
                    {(fieldErrors as { [key: string]: string }).phone && (
                      <span id="phone-error" className="host-field-error" role="host-alert">
                        {(fieldErrors as { [key: string]: string }).phone}
                      </span>
                    )}
                  </div>

                  <div className="host-form-field-compact">
                    <label htmlFor="gender" className="host-form-label-compact">
                      <UserIcon className="host-field-icon" />
                      Giới tính
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className={`host-form-input-compact ${(fieldErrors as { [key: string]: string }).gender ? 'host-input-error' : ''}`}
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('gender', e.target.value)}
                      disabled={!isEditing}
                      host-required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).gender}
                      aria-describedby={(fieldErrors as { [key: string]: string }).gender ? 'gender-error' : undefined}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                    {(fieldErrors as { [key: string]: string }).gender && (
                      <span id="gender-error" className="host-field-error" role="host-alert">
                        {(fieldErrors as { [key: string]: string }).gender}
                      </span>
                    )}
                  </div>

                  <div className="host-form-field-compact">
                    <label htmlFor="address" className="host-form-label-compact">
                      <svg className="host-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className={`host-form-input-compact ${(fieldErrors as { [key: string]: string }).address ? 'host-input-error' : ''}`}
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('address', e.target.value)}
                      host-required
                      aria-invalid={!!(fieldErrors as { [key: string]: string }).address}
                      aria-describedby={(fieldErrors as { [key: string]: string }).address ? 'address-error' : undefined}
                      disabled={!isEditing}
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    />
                    {(fieldErrors as { [key: string]: string }).address && (
                      <span id="address-error" className="host-field-error" role="host-alert">
                        {(fieldErrors as { [key: string]: string }).address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="host-profile-fields-column">
                  <div className="host-form-field-compact">
                    <label htmlFor="email" className="host-form-label-compact">
                      <svg className="host-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="host-form-input-compact"
                      value={formData.email}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="host-form-field-compact">
                    <label htmlFor="dob" className="host-form-label-compact">
                      <CalendarIcon className="host-field-icon" />
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      className={`host-form-input-compact ${(fieldErrors as { [key: string]: string }).dob ? 'host-input-error' : ''}`}
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
                      host-required
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
                      <span id="dob-error" className="host-field-error" role="host-alert">
                        {(fieldErrors as { [key: string]: string }).dob}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="host-tab-content">
                <ReviewManagement
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                />
              </div>
            )}

            {/* Notifications Tab */}
            {/* Services Tab */}
            {activeTab === 'services' && (
              <ServicesManagement
                ref={servicesManagementRef}
                onSuccess={(message) => {
                  setSuccess(message);
                  setTimeout(() => setSuccess(null), 3000);
                }}
                onError={(message) => {
                  setError(message);
                  setTimeout(() => setError(null), 5000);
                }}
              />
            )}

            {activeTab === 'notifications' && (
              <div className="host-tab-content">
                <div className="host-empty-state">
                  <BellIcon className="host-empty-state-icon" />
                  <h3>Chức năng đang phát triển</h3>
                  <p>Chức năng thông báo đang được phát triển. Vui lòng quay lại sau!</p>
                </div>
              </div>
            )}

            {/* Promotions Tab */}
            {activeTab === 'promotions' && (
              <div className="host-tab-content">
                <PrivilegeManagement
                  ref={privilegeManagementRef}
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                />
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <div className="host-tab-content">
                <CouponManagement
                  ref={couponManagementRef}
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                  onApplyPromotionClick={() => setIsApplyPromotionModalOpen(true)}
                  onToggleChange={(isPromotionsList) => {
                    setCouponToggleState(isPromotionsList);
                  }}
                />
              </div>
            )}

            {/* Service Combos Tab */}
            {activeTab === 'service-combos' && (
              <div className="host-tab-content">
                <ServiceComboManagement
                  ref={serviceComboManagementRef}
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                />
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="host-tab-content">
                <BookingManagement
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                />
              </div>
            )}


            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="host-tab-content">
                <RevenueManagement
                  onSuccess={(message) => {
                    setSuccess(message);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  onError={(message) => {
                    setError(message);
                    setTimeout(() => setError(null), 5000);
                  }}
                />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="host-tab-content">
                <div className="host-empty-state">
                  <SettingsIcon className="host-empty-state-icon" />
                  <h3>Chức năng đang phát triển</h3>
                  <p>Chức năng cài đặt đang được phát triển. Vui lòng quay lại sau!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>


      {/* Apply Promotion Modal */}
      {isApplyPromotionModalOpen && (
        <div className="host-modal-overlay" onClick={handleCloseApplyPromotionModal}>
          <div className="host-modal-content host-create-service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="host-modal-header">
              <h2>Áp dụng</h2>
              <button className="host-modal-close" onClick={handleCloseApplyPromotionModal}>
                <XIcon className="host-modal-close-icon" />
              </button>
            </div>
            <div className="host-modal-body">
              <div className="host-disclaimer-text">
                (<span className="host-required-indicator">*</span>) bắt buộc
              </div>
              
              <form onSubmit={handleApplyPromotionSubmit} noValidate>
                {/* Service/Coupon Selection Field */}
                {activeTab === 'services' ? (
                  <div className="host-field">
                    <label htmlFor="apply-promotion-service">
                      Chọn dịch vụ
                      <span className="host-required-indicator">*</span>
                    </label>
                    <select
                      id="apply-promotion-service"
                      name="serviceId"
                      value={applyPromotionFormData.serviceId}
                      onChange={handleApplyPromotionInputChange}
                      className="host-field-select"
                      host-required
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {allServices.map(service => (
                        <option key={service.Id || service.id} value={service.Id || service.id}>
                          {service.Name || service.name}
                        </option>
                      ))}
                    </select>
                    {applyPromotionErrors.serviceId && <div className="host-error">{applyPromotionErrors.serviceId}</div>}
                  </div>
                ) : (
                  <div className="host-field">
                    <label htmlFor="apply-promotion-coupon">
                      Chọn mã giảm giá
                      <span className="host-required-indicator">*</span>
                    </label>
                    <select
                      id="apply-promotion-coupon"
                      name="couponId"
                      value={applyPromotionFormData.couponId}
                      onChange={handleApplyPromotionInputChange}
                      className="host-field-select"
                      host-required
                    >
                      <option value="">-- Chọn coupon --</option>
                      {allCoupons.map(coupon => (
                        <option key={coupon.Id || coupon.id} value={coupon.Id || coupon.id}>
                          {coupon.Code || coupon.code} - {coupon.Description || coupon.description || 'Không có mô tả'}
                        </option>
                      ))}
                    </select>
                    {applyPromotionErrors.couponId && <div className="host-error">{applyPromotionErrors.couponId}</div>}
                  </div>
                )}

                {/* Rank Selection Field */}
                <div className="host-field">
                  <label htmlFor="apply-promotion-rank">
                    Chọn hạng
                    <span className="host-required-indicator">*</span>
                  </label>
                  <select
                    id="apply-promotion-rank"
                    name="rankId"
                    value={applyPromotionFormData.rankId}
                    onChange={handleApplyPromotionInputChange}
                    className="host-field-select"
                    host-required
                  >
                    <option value="">-- Chọn hạng --</option>
                    <option value="Đồng">Đồng</option>
                    <option value="Bạc">Bạc</option>
                    <option value="Vàng">Vàng</option>
                    <option value="Tất cả">Tất cả</option>
                  </select>
                  {applyPromotionErrors.rankId && <div className="host-error">{applyPromotionErrors.rankId}</div>}
                </div>

                {/* User Type Field */}
                <div className="host-field">
                  <label htmlFor="apply-promotion-userType">
                    Loại người dùng
                    <span className="host-required-indicator">*</span>
                  </label>
                  <select
                    id="apply-promotion-userType"
                    name="userType"
                    value={applyPromotionFormData.userType}
                    onChange={handleApplyPromotionInputChange}
                    className="host-field-select"
                    host-required
                  >
                    <option value="">-- Chọn loại người dùng --</option>
                    <option value="Khách hàng">Khách hàng</option>
                    <option value="Công ty">Công ty</option>
                  </select>
                  {applyPromotionErrors.userType && <div className="host-error">{applyPromotionErrors.userType}</div>}
                </div>

                {/* Form Actions */}
                <div className="host-form-action">
                  <button type="submit" className="host-primary" disabled={isApplyingPromotion || !applyPromotionFormData.serviceId || !applyPromotionFormData.rankId || !applyPromotionFormData.userType}>
                    {isApplyingPromotion ? 'Đang xử lý...' : 'Áp dụng'}
                  </button>
                  <button type="button" className="host-secondary" onClick={handleCloseApplyPromotionModal} disabled={isApplyingPromotion}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}




    </>
  );
};

export default HostDashboard;





