import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '~/utils/axiosInstance';
import Header from './Header';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import LazyImage from './LazyImage';
import { 
  ArrowLeftIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CalendarIcon
} from './icons/index';
import { formatPrice, getImageUrl } from '~/lib/utils';
import { API_ENDPOINTS } from '~/config/api';
import ComplementaryServices from './ComplementaryServices';
import { useUserLevel } from '~/hooks/useUserLevel';
import type { MembershipTier } from '~/types/membership';
import * as couponService from '~/services/couponService';
import './BookingPage.css';

const baNaHillImage = '/img/banahills.jpg';

// Helper để lấy userId từ localStorage
const getUserId = () => {
  try {
    // Kiểm tra cả localStorage và sessionStorage
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      // Backend trả về Id là int trong UserProfileDto
      const userId = userInfo.Id || userInfo.id;
      if (userId) {
        const parsedId = parseInt(userId);
        if (!isNaN(parsedId) && parsedId > 0) {
          return parsedId;
        }
      }
    }
    console.warn(' Không tìm thấy UserId hợp lệ trong storage');
    return null;
  } catch (error) {
    console.error(' Error getting user ID:', error);
    return null;
  }
};

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingTotal, setCalculatingTotal] = useState(false);
  
  // Form state
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingType, setBookingType] = useState('single-day'); // 'single-day' hoặc 'multi-day'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00'); // Thời gian bắt đầu cho single-day
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [slotCheckError, setSlotCheckError] = useState(''); // Lỗi khi kiểm tra slot
  const [checkingSlot, setCheckingSlot] = useState(false); // Đang kiểm tra slot
  
  // Additional services state - mỗi service có id và quantity
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState<{id: number, quantity: number}[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Complementary Services state (thay thế cho coupon)
  const [selectedComplementaryServices, setSelectedComplementaryServices] = useState<number[]>([]);
  const [complementaryServicesData, setComplementaryServicesData] = useState<any[]>([]);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ Code: string; DiscountPercent?: number; DiscountAmount?: number } | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Get user level using hook - UserLevel và MembershipTier giờ dùng cùng naming: none/bronze/silver/gold
  const userId = getUserId();
  const { level: userLevel } = useUserLevel(userId);
  // Cast UserLevel sang MembershipTier (cùng values: 'none' | 'bronze' | 'silver' | 'gold')
  const userTier = (userLevel === 'default' ? 'none' : userLevel) as MembershipTier;

  // Validate ID parameter
  useEffect(() => {
    if (id && (isNaN(parseInt(id)) || parseInt(id) <= 0)) {
      setError('ID dịch vụ không hợp lệ');
      setLoading(false);
    }
  }, [id]);

  // Auto-fill ngày mặc định để tránh lỗi validateForm khi người dùng chưa chọn
  useEffect(() => {
    if (service) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

      // Nếu chưa có startDate, set mặc định hôm nay
      if (!startDate) {
        setStartDate(todayStr);
        // Nếu là single-day booking, set giờ hiện tại
        if (bookingType === 'single-day') {
          setStartTime(currentTime);
        }
      } else {
        // Nếu đã chọn ngày, kiểm tra xem có phải hôm nay không
        const selectedDate = new Date(startDate);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        // Nếu chọn ngày hôm nay và là single-day booking, tự động set giờ hiện tại
        if (selectedDate.getTime() === todayDate.getTime() && bookingType === 'single-day') {
          setStartTime(currentTime);
        }
      }

      // Nếu đang ở chế độ multi-day và chưa có endDate, set +1 ngày
      if (bookingType === 'multi-day') {
        const start = startDate ? new Date(startDate) : new Date();
        const next = new Date(start);
        next.setDate(start.getDate() + 1);
        const nextStr = next.toISOString().split('T')[0];
        if (!endDate || new Date(endDate) <= start) {
          setEndDate(nextStr);
        }
      }
    }
  }, [service, bookingType, startDate, endDate]);

  // NOTE: checkSlotAvailability đã bị comment out vì backend không có endpoint /Booking/service-combo/{id}
  // Kiểm tra slot còn lại trong khoảng thời gian đã chọn
  // useEffect(() => {
  //   const checkSlotAvailability = async () => {
  //     if (!service || !id || !startDate || quantity <= 0) {
  //       setSlotCheckError('');
  //       return;
  //     }
  //     // ... rest of the function
  //   };
  //   const timeoutId = setTimeout(() => {
  //     checkSlotAvailability();
  //   }, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [service, id, startDate, startTime, quantity, bookingType]);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      if (!id || isNaN(parseInt(id))) {
        if (import.meta.env.DEV) {
          console.error('❌ [BookingPage] ID không hợp lệ:', id)
        }
        setError('ID dịch vụ không hợp lệ');
        setLoading(false);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log('🔍 [BookingPage] Đang tải service với ID:', id)
      }
      
      try {
        setLoading(true);
        setError(null);
        setValidationError('');
        
        const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`);
        
        if (import.meta.env.DEV) {
          console.log('✅ [BookingPage] Nhận được dữ liệu:', response.data);
        }
        
        const serviceData = response.data;
        
        // Validate service exists
        if (!serviceData) {
          if (import.meta.env.DEV) {
            console.error('❌ [BookingPage] Service data không tồn tại')
          }
          setError('Không tìm thấy dịch vụ này');
          setLoading(false);
          return;
        }

        // Check service status
        // Accept multiple statuses as "available" for booking
        const status = serviceData.Status || serviceData.status || 'open';
        const normalizedStatus = String(status).toLowerCase();
        if (import.meta.env.DEV) {
          console.log('  - Service Status:', status)
          console.log('  - Service Data:', {
            Id: serviceData.Id || serviceData.id,
            Name: serviceData.Name || serviceData.name,
            Price: serviceData.Price || serviceData.price,
            AvailableSlots: serviceData.AvailableSlots || serviceData.availableSlots,
            Status: status
          })
        }
        
        // Allow booking when status is one of: open / approved / active
        const allowedStatuses = ['open', 'approved', 'active', 'available'];
        if (!allowedStatuses.includes(normalizedStatus)) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [BookingPage] Service không ở trạng thái khả dụng:', status)
          }
          setError('Dịch vụ này hiện không khả dụng để đặt');
          setLoading(false);
          return;
        }

        // Đảm bảo service được set trước khi tính toán
        setService(serviceData);
        
        // Tính toán tổng tiền ban đầu
        const price = serviceData.Price || serviceData.price || 0;
        setCalculatedTotal(price);
        
        if (import.meta.env.DEV) {
          console.log('✅ [BookingPage] Service loaded successfully')
          console.log('  - Service set to state:', !!serviceData)
          console.log('  - Calculated total:', price)
        }
      } catch (err: any) {
        console.error('❌ [BookingPage] Lỗi khi tải thông tin dịch vụ:', err);
        console.error('  - Error message:', err?.message);
        console.error('  - Response status:', err?.response?.status);
        console.error('  - Response data:', err?.response?.data);
        
        if (err.response?.status === 404) {
          setError('Không tìm thấy dịch vụ này');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Bạn không có quyền truy cập dịch vụ này. Vui lòng đăng nhập lại.');
          // Redirect to login
          setTimeout(() => {
            navigate('/login', { state: { returnUrl: `/booking/${id}` } });
          }, 2000);
        } else if (err.response?.status === 500) {
          setError('Lỗi server. Vui lòng thử lại sau.');
        } else {
          setError('Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, navigate]);

  // Fetch available services từ ServiceComboDetail (các dịch vụ liên kết với combo)
  useEffect(() => {
    const fetchComboServices = async () => {
      if (!id || isNaN(parseInt(id))) return;
      
      try {
        setLoadingServices(true);
        
        // Lấy các Service từ ServiceComboDetail theo combo ID
        const url = `${API_ENDPOINTS.SERVICE_COMBO_DETAIL}/combo/${id}`;
        
        if (import.meta.env.DEV) {
          console.log(`🔍 [BookingPage] Đang load dịch vụ từ ServiceComboDetail cho combo ${id}`);
        }
        
        const response = await axiosInstance.get(url);
        
        if (response.data && Array.isArray(response.data)) {
          // Lấy Service từ mỗi ServiceComboDetail
          const services = response.data
            .map((detail: any) => detail.Service || detail.service)
            .filter((svc: any) => svc != null);
          
          if (import.meta.env.DEV) {
            console.log(`✅ [BookingPage] Tìm thấy ${services.length} dịch vụ liên kết với combo ${id}`);
          }
          setAvailableServices(services);
        } else {
          setAvailableServices([]);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BookingPage] Không thể tải dịch vụ từ ServiceComboDetail:', err?.message || 'Unknown error');
        }
        // Đặt services = [] và tiếp tục (BookingPage vẫn hoạt động bình thường)
        setAvailableServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    // Fetch ngay khi có combo ID
    fetchComboServices();
  }, [id]);

  // Tính toán tổng tiền khi quantity, selectedServices hoặc discount thay đổi
  useEffect(() => {
    if (!service) return;

    const servicePrice = service.Price || service.price || 0;
    const baseTotal = servicePrice * quantity;
    
    // Tính tổng tiền của các dịch vụ thêm (với số lượng riêng của mỗi service)
    const additionalServicesTotal = selectedServices.reduce((sum, selectedSvc) => {
      if (!availableServices || availableServices.length === 0) return sum;
      
      const availableService = availableServices.find(s => {
        const id = s.Id || s.id;
        const numId = typeof id === 'number' ? id : parseInt(id);
        return numId === selectedSvc.id || id == selectedSvc.id;
      });
      
      if (availableService) {
        const price = availableService.Price || availableService.price || 0;
        return sum + price * selectedSvc.quantity; // Nhân với số lượng của service đó
      }
      return sum;
    }, 0);
    
    const newTotal = baseTotal + additionalServicesTotal;
    setCalculatedTotal(newTotal);
    setValidationError('');

    // Recalculate coupon discount when quantity changes (coupon only applies to baseTotal)
    if (appliedCoupon && appliedCoupon.DiscountPercent) {
      const newDiscount = Math.round(baseTotal * (appliedCoupon.DiscountPercent / 100));
      setCouponDiscount(newDiscount);
    }
  }, [quantity, service, selectedServices, availableServices, appliedCoupon]);

  // Tính toán tổng tiền từ API (memoized)
  const calculateTotalFromAPI = useCallback(async () => {
    if (!service) return calculatedTotal;
    
    setCalculatingTotal(true);
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.BOOKING}/calculate`, {
        ServiceComboId: parseInt(id),
        ServiceId: 0,
        Quantity: quantity,
        ItemType: 'combo'
      });
      
      if (response.data && response.data.TotalAmount !== undefined) {
        const apiTotal = parseFloat(response.data.TotalAmount);
        setCalculatedTotal(apiTotal);
        return apiTotal;
      }
    } catch (err) {
      console.warn(' Không thể tính toán từ API, sử dụng tính toán local:', err);
      // Fallback về tính toán local
      const price = service.Price || service.price || 0;
      const localTotal = price * quantity;
      setCalculatedTotal(localTotal);
      return localTotal;
    } finally {
      setCalculatingTotal(false);
    }
    
    return calculatedTotal;
  }, [service, id, quantity, calculatedTotal]);

  const handleQuantityChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input temporarily
    if (inputValue === '') {
      setQuantity(0);
      return;
    }
    
    const newQuantity = parseInt(inputValue);
    
    // Validate input
    if (isNaN(newQuantity) || newQuantity < 1) {
      setValidationError('Số lượng phải lớn hơn 0');
      return;
    }

    if (!service) {
      setValidationError('Chưa tải được thông tin dịch vụ');
      return;
    }

    const availableSlots = service.AvailableSlots !== undefined 
      ? service.AvailableSlots 
      : (service.availableSlots !== undefined ? service.availableSlots : 0);
    
    if (availableSlots > 0 && newQuantity > availableSlots) {
      setValidationError(`Chỉ còn ${availableSlots} chỗ trống`);
      setQuantity(availableSlots);
      return;
    }

    setQuantity(newQuantity);
    setValidationError('');
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setValidationError('');
    }
  };

  const handleQuantityIncrease = () => {
    if (!service) return;
    
    const availableSlots = service.AvailableSlots !== undefined 
      ? service.AvailableSlots 
      : (service.availableSlots !== undefined ? service.availableSlots : 0);
    
    if (availableSlots === 0 || quantity < availableSlots) {
      setQuantity(quantity + 1);
      setValidationError('');
    }
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      setTimeout(() => setCouponError(''), 5000);
      return;
    }

    if (!service) {
      setCouponError('Chưa tải được thông tin dịch vụ');
      setTimeout(() => setCouponError(''), 5000);
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      // Validate coupon
      const validateResponse = await couponService.validateCoupon(couponCode.trim(), parseInt(id || '0'));
      
      if (!validateResponse.IsValid) {
        setCouponError('Mã giảm giá không hợp lệ');
        setTimeout(() => setCouponError(''), 5000);
        return;
      }

      // Calculate discount based on COMBO PRICE ONLY (not including additional services)
      const servicePrice = service.Price || service.price || 0;
      const baseTotal = servicePrice * quantity; // Giá combo gốc
      
      const discountResponse = await couponService.calculateDiscount(couponCode.trim(), baseTotal);
      const discount = discountResponse.Discount || 0;

      if (discount <= 0) {
        setCouponError('Mã giảm giá không áp dụng được');
        setTimeout(() => setCouponError(''), 5000);
        return;
      }

      // Apply coupon
      setAppliedCoupon({
        Code: couponCode.trim(),
        DiscountPercent: validateResponse.DiscountPercent,
        DiscountAmount: discount
      });
      setCouponDiscount(discount);
      setCouponSuccess('Áp dụng mã giảm giá thành công!');
      setCouponError('');
    } catch (err: any) {
      console.error('Error applying coupon:', err);
      if (err.response?.status === 404) {
        setCouponError('Mã giảm giá không tồn tại');
      } else {
        setCouponError('Không thể áp dụng mã giảm giá');
      }
      setTimeout(() => setCouponError(''), 5000);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Fetch available coupons for the service combo
  const fetchAvailableCoupons = async () => {
    if (!id) return;
    
    setLoadingCoupons(true);
    try {
      const coupons = await couponService.getCouponsForCombo(parseInt(id));
      setAvailableCoupons(coupons || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Open coupon modal
  const handleOpenCouponModal = () => {
    setShowCouponModal(true);
    fetchAvailableCoupons();
  };

  // Check if user is eligible for a coupon based on level and get reason if not
  const getCouponEligibility = (coupon: any): { isEligible: boolean; reason: string } => {
    if (!coupon.TargetAudience) return { isEligible: true, reason: '' };
    
    try {
      const target = JSON.parse(coupon.TargetAudience);
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      let userRoleId = 4; // Default Tourist
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        userRoleId = parseInt(userInfo.RoleId || userInfo.roleId || 4);
      }
      
      const isUserTourist = userRoleId === 4;
      const isUserAgency = userRoleId === 3;
      const userRoleName = isUserAgency ? 'Đại lý' : 'Du khách';
      
      // Map userTier to level number (bronze=1, silver=2, gold=3)
      const userLevelNum = userTier === 'bronze' ? 1 : userTier === 'silver' ? 2 : userTier === 'gold' ? 3 : 0;
      const levelNames: Record<number, string> = { 0: 'Mới bắt đầu', 1: 'Đồng', 2: 'Bạc', 3: 'Vàng' };
      const levelIcons: Record<number, string> = { 0: '⭐', 1: '🥉', 2: '🥈', 3: '🥇' };
      const userLevelName = levelNames[userLevelNum];
      const userLevelIcon = levelIcons[userLevelNum];
      
      // Check tourist eligibility
      if (target.forTourist && target.touristLevels) {
        const requiredLevels = ['level1', 'level2', 'level3'].filter(l => target.touristLevels[l]);
        if (requiredLevels.length > 0) {
          const minRequiredLevel = parseInt(requiredLevels[0].replace('level', ''));
          const minLevelName = levelNames[minRequiredLevel];
          const minLevelIcon = levelIcons[minRequiredLevel];
          
          if (isUserTourist) {
            if (userLevelNum >= minRequiredLevel) {
              return { isEligible: true, reason: '' };
            }
            return { 
              isEligible: false, 
              reason: `Bạn đang ở hạng ${userLevelIcon} ${userLevelName}. Cần hạng ${minLevelIcon} ${minLevelName} trở lên để sử dụng mã này.`
            };
          }
        }
      }
      
      // Check agency eligibility
      if (target.forAgency && target.agencyLevels) {
        const requiredLevels = ['level1', 'level2', 'level3'].filter(l => target.agencyLevels[l]);
        if (requiredLevels.length > 0) {
          const minRequiredLevel = parseInt(requiredLevels[0].replace('level', ''));
          const minLevelName = levelNames[minRequiredLevel];
          const minLevelIcon = levelIcons[minRequiredLevel];
          
          if (isUserAgency) {
            if (userLevelNum >= minRequiredLevel) {
              return { isEligible: true, reason: '' };
            }
            return { 
              isEligible: false, 
              reason: `Bạn đang ở hạng ${userLevelIcon} ${userLevelName}. Cần hạng ${minLevelIcon} ${minLevelName} trở lên để sử dụng mã này.`
            };
          }
        }
      }
      
      // Check if coupon is for specific role that user doesn't have
      if (target.forTourist && !target.forAgency && isUserAgency) {
        return { isEligible: false, reason: 'Mã này chỉ dành cho Du khách, không áp dụng cho Đại lý.' };
      }
      
      if (target.forAgency && !target.forTourist && isUserTourist) {
        return { isEligible: false, reason: 'Mã này chỉ dành cho Đại lý, không áp dụng cho Du khách.' };
      }
      
      // If no specific target, allow all
      if (!target.forTourist && !target.forAgency) return { isEligible: true, reason: '' };
      
      return { isEligible: false, reason: 'Bạn không đủ điều kiện sử dụng mã này.' };
    } catch {
      return { isEligible: true, reason: '' }; // If parsing fails, allow
    }
  };

  // Wrapper for backward compatibility
  const isCouponEligible = (coupon: any): boolean => {
    return getCouponEligibility(coupon).isEligible;
  };

  // Get required level text for coupon with icons
  const getCouponRequiredLevel = (coupon: any): { text: string; badges: { level: string; icon: string; name: string }[] } => {
    const levelNames: Record<string, string> = { level1: 'Đồng', level2: 'Bạc', level3: 'Vàng' };
    const levelIcons: Record<string, string> = { level1: '🥉', level2: '🥈', level3: '🥇' };
    
    if (!coupon.TargetAudience) return { text: '', badges: [] };
    
    try {
      const target = JSON.parse(coupon.TargetAudience);
      const badges: { level: string; icon: string; name: string }[] = [];
      const parts: string[] = [];
      
      if (target.forTourist && target.touristLevels) {
        const levels = ['level1', 'level2', 'level3'].filter(l => target.touristLevels[l]);
        levels.forEach(l => badges.push({ level: l, icon: levelIcons[l], name: levelNames[l] }));
        if (levels.length > 0) {
          parts.push(`Du khách`);
        }
      }
      
      if (target.forAgency && target.agencyLevels) {
        const levels = ['level1', 'level2', 'level3'].filter(l => target.agencyLevels[l]);
        levels.forEach(l => {
          if (!badges.find(b => b.level === l)) {
            badges.push({ level: l, icon: levelIcons[l], name: levelNames[l] });
          }
        });
        if (levels.length > 0) {
          parts.push(`Đại lý`);
        }
      }
      
      return { text: parts.join(', '), badges };
    } catch {
      return { text: '', badges: [] };
    }
  };

  // Select coupon from modal
  const handleSelectCoupon = async (coupon: any) => {
    if (!isCouponEligible(coupon)) return;
    
    setCouponCode(coupon.Code);
    setShowCouponModal(false);
    
    // Auto apply the selected coupon
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    
    try {
      const servicePrice = service?.Price || service?.price || 0;
      const baseTotal = servicePrice * quantity;
      
      const discountResponse = await couponService.calculateDiscount(coupon.Code, baseTotal);
      const discount = discountResponse.Discount || 0;
      
      setAppliedCoupon({
        Code: coupon.Code,
        DiscountPercent: coupon.DiscountPercent,
        DiscountAmount: discount
      });
      setCouponDiscount(discount);
      setCouponSuccess('Áp dụng mã giảm giá thành công!');
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Không thể áp dụng mã giảm giá');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle service selection - thêm/bớt số lượng
  const handleServiceQuantityChange = (serviceId: number, change: number) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.id === serviceId);
      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          // Xóa service nếu quantity = 0
          return prev.filter(s => s.id !== serviceId);
        }
        // Cập nhật quantity
        return prev.map(s => s.id === serviceId ? { ...s, quantity: newQuantity } : s);
      } else if (change > 0) {
        // Thêm service mới với quantity = 1
        return [...prev, { id: serviceId, quantity: 1 }];
      }
      return prev;
    });
  };

  const getServiceQuantity = (serviceId: number): number => {
    const service = selectedServices.find(s => s.id === serviceId);
    return service ? service.quantity : 0;
  };

  const isServiceSelected = (serviceId: number): boolean => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const validateForm = () => {
    if (!service) {
      setValidationError('Chưa tải được thông tin dịch vụ');
      return false;
    }

    // Check authentication
    const userId = getUserId();
    if (!userId) {
      setValidationError('Vui lòng đăng nhập để đặt dịch vụ');
      // Redirect to login
      navigate('/login', { state: { returnUrl: `/booking/${id}` } });
      return false;
    }

    // Validate quantity
    if (!quantity || quantity < 1 || quantity === 0) {
      setValidationError('Vui lòng chọn số lượng người');
      return false;
    }
    
    // Validate quantity is a number
    if (typeof quantity === 'number' && quantity === 0) {
      setValidationError('Vui lòng chọn số lượng người');
      return false;
    }

    // Check available slots
    const availableSlots = service.AvailableSlots !== undefined 
      ? service.AvailableSlots 
      : (service.availableSlots !== undefined ? service.availableSlots : 0);
    
    if (availableSlots > 0 && quantity > availableSlots) {
      setValidationError(`Chỉ còn ${availableSlots} chỗ trống`);
      return false;
    }

    // Check service status
    const status = service.Status || service.status || 'open';
    const normalizedStatus = String(status).toLowerCase();
    const allowedStatuses = ['open', 'approved', 'active', 'available'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      setValidationError('Dịch vụ này không khả dụng');
      return false;
    }

    // Validate dates based on booking type
    if (bookingType === 'single-day') {
      // Đi trong ngày: chỉ cần startDate và startTime
      if (!startDate) {
        setValidationError('Vui lòng chọn ngày đi');
        return false;
      }

      if (!startTime) {
        setValidationError('Vui lòng chọn thời gian bắt đầu');
        return false;
      }

      const selectedDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setValidationError('Ngày đi không được là ngày trong quá khứ');
        return false;
      }

      // Nếu chọn ngày hôm nay, kiểm tra thời gian phải sau giờ hiện tại
      if (selectedDate.toDateString() === today.toDateString()) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        const now = new Date();
        
        // Nếu thời gian đã chọn <= thời gian hiện tại, không cho phép
        if (selectedDateTime <= now) {
          setValidationError('Nếu chọn ngày hôm nay, thời gian phải sau giờ hiện tại');
          return false;
        }
      }
    } else {
      // Đi nhiều ngày: cần startDate và endDate
      if (!startDate) {
        setValidationError('Vui lòng chọn ngày bắt đầu');
        return false;
      }

      if (!endDate) {
        setValidationError('Vui lòng chọn ngày kết thúc');
        return false;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        setValidationError('Ngày bắt đầu không được là ngày trong quá khứ');
        return false;
      }

      // Cho phép endDate = startDate (booking trong 1 ngày)
      // Chỉ từ chối nếu endDate < startDate
      if (end < start) {
        setValidationError('Ngày kết thúc không được trước ngày bắt đầu');
        return false;
      }
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      setValidationError('Ghi chú không được vượt quá 1000 ký tự');
      return false;
    }

    // Kiểm tra slot availability
    if (slotCheckError) {
      setValidationError(slotCheckError);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log(' BookingPage: handleSubmit được gọi');
    
    if (!validateForm()) {
      console.warn(' BookingPage: validateForm failed');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      console.warn(' BookingPage: Không có userId');
      setValidationError('Vui lòng đăng nhập để đặt dịch vụ');
      navigate('/login', { state: { returnUrl: `/booking/${id}` } });
      return;
    }

    // Kiểm tra token trước khi submit (từ localStorage hoặc sessionStorage)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn(' BookingPage: Không có token');
      setValidationError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login', { state: { returnUrl: `/booking/${id}` } });
      return;
    }

    console.log(' BookingPage: Token có tồn tại, UserId:', userId);
    console.log(' BookingPage: selectedServices:', selectedServices);
    console.log(' BookingPage: availableServices.length:', availableServices.length);
    
    setSubmitting(true);
    setCalculatingTotal(false); // Đảm bảo không bị block bởi calculatingTotal
    setValidationError('');

    try {
      // Re-validate service status (có thể đã thay đổi) - phải fetch trước khi tính toán
      const currentServiceResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`);
      const currentService = currentServiceResponse.data;
      
      if (!currentService) {
        setValidationError('Dịch vụ không tồn tại hoặc đã bị xóa.');
        setSubmitting(false);
        return;
      }

      // Tính tổng tiền bao gồm cả dịch vụ thêm (sau khi có currentService)
      const servicePrice = currentService.Price || currentService.price || 0;
      const baseTotal = servicePrice * quantity;
      
      // Tính tổng tiền của các dịch vụ thêm (với số lượng riêng của mỗi service)
      const additionalServicesTotal = selectedServices.reduce((sum, selectedSvc) => {
        if (availableServices.length === 0) return sum;
        
        const availableService = availableServices.find(s => {
          const id = s.Id || s.id;
          const numId = typeof id === 'number' ? id : parseInt(id);
          return numId === selectedSvc.id || id == selectedSvc.id;
        });
        
        if (availableService) {
          const price = availableService.Price || availableService.price || 0;
          return sum + price * selectedSvc.quantity;
        }
        return sum;
      }, 0);
      
      const finalTotal = baseTotal + additionalServicesTotal;
      
      const currentStatus = currentService.Status || currentService.status || 'open';
      const normalizedCurrentStatus = String(currentStatus).toLowerCase();
      const allowedStatuses = ['open', 'approved', 'active', 'available'];
      const currentAvailableSlots = currentService.AvailableSlots !== undefined 
        ? currentService.AvailableSlots 
        : (currentService.availableSlots !== undefined ? currentService.availableSlots : 0);
      
      if (!allowedStatuses.includes(normalizedCurrentStatus)) {
        setValidationError('Dịch vụ này đã không còn khả dụng');
        setSubmitting(false);
        return;
      }

      if (currentAvailableSlots > 0 && quantity > currentAvailableSlots) {
        setValidationError(`Chỉ còn ${currentAvailableSlots} chỗ trống`);
        setSubmitting(false);
        return;
      }

      // Validate bk-selected services - chỉ validate nếu có dịch vụ được chọn
      let validSelectedServices = [];
      
      // Nếu không có dịch vụ được chọn, bỏ qua validation
      if (selectedServices.length === 0) {
        console.log(' BookingPage: Không có dịch vụ thêm được chọn, bỏ qua validation');
        validSelectedServices = [];
      } 
      // Nếu có dịch vụ được chọn nhưng không có danh sách dịch vụ khả dụng, xóa selection
      else if (availableServices.length === 0) {
        console.warn(' BookingPage: Không có dịch vụ khả dụng, đã xóa các lựa chọn dịch vụ thêm');
        setSelectedServices([]);
        validSelectedServices = [];
      } 
      // Validate các dịch vụ đã chọn
      else {
        validSelectedServices = selectedServices.filter(selectedSvc => {
          const service = availableServices.find(s => {
            const id = s.Id || s.id;
            const numId = typeof id === 'number' ? id : parseInt(id);
            return numId === selectedSvc.id || id == selectedSvc.id;
          });
          return service != null;
        });
        
        // Nếu có dịch vụ không hợp lệ, loại bỏ chúng (không báo lỗi, chỉ skip)
        if (validSelectedServices.length !== selectedServices.length) {
          console.warn(' BookingPage: Một số dịch vụ đã chọn không hợp lệ, đã tự động loại bỏ');
          // Cập nhật state để sync (async, không block submit)
          setTimeout(() => {
            setSelectedServices(validSelectedServices);
          }, 0);
        } else {
          validSelectedServices = selectedServices; // Giữ nguyên nếu tất cả đều hợp lệ
        }
        
        console.log(' BookingPage: Số dịch vụ hợp lệ:', validSelectedServices.length, '/', selectedServices.length);
      }

      // UserId sẽ được lấy từ JWT token ở backend, không cần gửi từ frontend
      // Thêm thông tin dịch vụ thêm vào notes (bao gồm số lượng)
      let bookingNotes = notes.trim() || '';
      if (validSelectedServices.length > 0 && availableServices.length > 0) {
        const selectedServiceDetails = validSelectedServices.map(selectedSvc => {
          const availableService = availableServices.find(s => {
            const id = s.Id || s.id;
            const numId = typeof id === 'number' ? id : parseInt(id);
            return numId === selectedSvc.id || id == selectedSvc.id;
          });
          if (availableService) {
            const name = availableService.Name || availableService.name;
            return `${name} x${selectedSvc.quantity}`;
          }
          return '';
        }).filter(detail => detail);
        
        if (selectedServiceDetails.length > 0) {
          const servicesInfo = `\n\nDịch vụ thêm đã chọn: ${selectedServiceDetails.join(', ')}`;
          bookingNotes = bookingNotes ? bookingNotes + servicesInfo : servicesInfo.trim();
        }
        
        // Lưu service IDs và quantities vào notes để backend có thể xử lý
        const serviceIdsInfo = `\n[ADDITIONAL_SERVICES:${validSelectedServices.map(s => `${s.id}:${s.quantity}`).join(',')}]`;
        bookingNotes = bookingNotes + serviceIdsInfo;
        
        console.log(' BookingPage: Gửi các service hợp lệ:', validSelectedServices);
      }

      // Thêm coupon code vào notes nếu có
      if (appliedCoupon) {
        const couponInfo = `\n[COUPON_CODE:${appliedCoupon.Code}]`;
        bookingNotes = bookingNotes + couponInfo;
        console.log(' BookingPage: Gửi coupon code:', appliedCoupon.Code);
      }

      // Thêm thông tin dịch vụ tặng kèm (complementary services) vào notes
      if (selectedComplementaryServices.length > 0 && complementaryServicesData.length > 0) {
        const complementaryServiceNames = selectedComplementaryServices.map(serviceId => {
          const compService = complementaryServicesData.find(s => s.id === serviceId);
          return compService ? compService.name : '';
        }).filter(name => name);
        
        if (complementaryServiceNames.length > 0) {
          const compServicesInfo = `\n\n🎁 Đơn đặt dịch vụ này sẽ được tặng kèm các dịch vụ: ${complementaryServiceNames.join(', ')}`;
          bookingNotes = bookingNotes ? bookingNotes + compServicesInfo : compServicesInfo.trim();
          
          // Lưu complementary service IDs để backend có thể xử lý nếu cần
          const compServiceIdsInfo = `\n[COMPLEMENTARY_SERVICES_IDS:${selectedComplementaryServices.join(',')}]`;
          bookingNotes = bookingNotes + compServiceIdsInfo;
          
          console.log(' BookingPage: Gửi các dịch vụ tặng kèm:', complementaryServiceNames);
        }
      }

      // Xử lý ngày tháng theo loại booking
      let finalStartDate = null;
      let finalEndDate = null;

      if (bookingType === 'single-day') {
        // Đi trong ngày: startDate và endDate là cùng một ngày
        if (startDate) {
          const startDateObj = new Date(startDate);
          finalStartDate = startDateObj.toISOString().split('T')[0];
          finalEndDate = startDateObj.toISOString().split('T')[0]; // Cùng ngày
        }
        
        // Thêm thông tin thời gian vào notes
        if (startTime) {
          bookingNotes = bookingNotes 
            ? `${bookingNotes}\n\nThời gian bắt đầu: ${startTime}`
            : `Thời gian bắt đầu: ${startTime}`;
        }
      } else {
        // Đi nhiều ngày: startDate và endDate khác nhau
        finalStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
        finalEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
      }

      // Lấy UserId từ storage (backend cần UserId để tạo booking)
      const userId = getUserId();
      if (!userId) {
        setValidationError('Vui lòng đăng nhập để đặt dịch vụ');
        navigate('/login', { state: { returnUrl: `/booking/${id}` } });
        setSubmitting(false);
        return;
      }

      // Chuẩn bị booking data - chỉ gửi các field backend cần (theo CreateBookingDto)
      // Backend sẽ tự tính: BookingNumber, UnitPrice, TotalAmount, Status (mặc định "pending")
      const bookingData: any = {
        // Required fields
        UserId: userId,
        ServiceComboId: parseInt(id),
        Quantity: quantity,
        ItemType: 'combo', // Backend expect "combo" hoặc "service"
        BookingDate: new Date().toISOString(),
        // Optional fields
        Notes: bookingNotes || null,
      };
      
      // BookingNumber sẽ được backend tự động generate trong BookingService.CreateAsync
      
      // Validate ServiceComboId
      if (!bookingData.ServiceComboId || isNaN(bookingData.ServiceComboId)) {
        setValidationError('ServiceComboId không hợp lệ');
        setSubmitting(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log('📤 [BookingPage] Gửi dữ liệu booking:', JSON.stringify(bookingData, null, 2));
        console.log('  - UserId:', userId);
        console.log('  - ServiceComboId:', bookingData.ServiceComboId);
        console.log('  - Quantity:', quantity);
        console.log('  - ItemType:', bookingData.ItemType);
        console.log('  - BookingDate:', bookingData.BookingDate);
        console.log('  - Notes:', bookingData.Notes ? 'Có' : 'Không');
      }

      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BOOKING}`,
        bookingData
      );

      if (import.meta.env.DEV) {
        console.log('✅ [BookingPage] Đặt dịch vụ thành công:', response.data);
        console.log('  - Booking ID:', response.data.Id || response.data.id);
      }

      // Lấy bookingId từ response
      const bookingId = response.data.Id || response.data.id;
      
      // Chuyển đến trang thanh toán
      if (!bookingId) {
        console.error(' BookingPage: Không nhận được bookingId từ response');
        setValidationError('Đặt dịch vụ thành công nhưng không thể chuyển đến trang thanh toán. Vui lòng thử lại.');
        return;
      }
      navigate(`/payment/${bookingId}`, { replace: true });
    } catch (err: any) {
      console.error('❌ [BookingPage] Lỗi khi đặt dịch vụ:', err);
      console.error('  - Error message:', err?.message);
      console.error('  - Response status:', err?.response?.status);
      console.error('  - Response data:', err?.response?.data);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('🔒 [BookingPage] Lỗi 401/403 - Token không hợp lệ hoặc đã hết hạn');
        setValidationError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Redirect ngay lập tức thay vì đợi 2 giây
        navigate('/login', { state: { returnUrl: `/booking/${id}` } });
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        
        if (import.meta.env.DEV) {
          console.error('❌ [BookingPage] Chi tiết lỗi 400:', JSON.stringify(errorData, null, 2));
        }
        
        // Xử lý các loại error message khác nhau
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors && Array.isArray(errorData.errors)) {
          // Model validation errors từ ASP.NET Core
          const errorList = errorData.errors.map((e: any) => {
            const field = e.Field || e.Key || e.PropertyName || 'Unknown';
            const message = e.Message || e.ErrorMessage || 'Invalid';
            return `${field}: ${message}`;
          }).join('\n');
          errorMessage = `Lỗi validation:\n${errorList}`;
        } else if (errorData?.title) {
          errorMessage = errorData.title;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        setValidationError(errorMessage);
      } else if (err.response?.status === 409) {
        setValidationError('Dịch vụ này đã hết chỗ hoặc không còn khả dụng');
      } else if (err.response?.status === 500) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.message || errorData?.error || 'Lỗi server. Vui lòng thử lại sau.';
        setValidationError(errorMessage);
      } else {
        setValidationError('Không thể đặt dịch vụ. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bk-booking-page">
        <Header />
        <main className="bk-booking-main">
          <LoadingSpinner message="Đang tải thông tin dịch vụ..." />
        </main>
      </div>
    );
  }

  if (error || !service) {
    // Debug log để hiểu tại sao không render được
    if (import.meta.env.DEV) {
      console.log('⚠️ [BookingPage] Render error state:', {
        hasError: !!error,
        errorMessage: error,
        hasService: !!service,
        serviceData: service
      })
    }
    
    return (
      <div className="bk-booking-page">
        <Header />
        <main className="bk-booking-main">
          <div className="bk-booking-container">
            <div className="bk-error-container" role="bk-alert">
              <h2 className="bk-error-title">Không thể đặt dịch vụ</h2>
              <p className="bk-error-message">{error || 'Dịch vụ không tồn tại'}</p>
              {import.meta.env.DEV && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <strong>Debug Info:</strong>
                  <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify({ error, hasService: !!service, serviceId: id }, null, 2)}
                  </pre>
                </div>
              )}
              <Button variant="default" onClick={() => navigate('/services')}>
                <ArrowLeftIcon className="bk-button-icon" />
                Quay lại danh sách dịch vụ
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Đảm bảo service tồn tại trước khi truy cập properties
  if (!service) {
    if (import.meta.env.DEV) {
      console.error('❌ [BookingPage] Service is null/undefined in render, but passed error check')
    }
    return (
      <div className="bk-booking-page">
        <Header />
        <main className="bk-booking-main">
          <LoadingSpinner message="Đang tải thông tin dịch vụ..." />
        </main>
      </div>
    )
  }

  const serviceName = service.Name || service.name || 'Dịch vụ';
  // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy
  const rawImagePath = service.Image || service.image || '';
  const serviceImages: string[] = rawImagePath && typeof rawImagePath === 'string' && rawImagePath.includes(',')
    ? rawImagePath.split(',').map((img: string) => getImageUrl(img.trim(), baNaHillImage))
    : [getImageUrl(rawImagePath, baNaHillImage)];
  const servicePrice = service.Price || service.price || 0;
  const serviceAddress = service.Address || service.address || '';
  const availableSlots = service.AvailableSlots !== undefined 
    ? service.AvailableSlots 
    : (service.availableSlots !== undefined ? service.availableSlots : 0);
  const status = service.Status || service.status || 'open';
  const normalizedStatus = String(status).toLowerCase();
  // Cho phép đặt khi status nằm trong danh sách khả dụng
  const allowedStatuses = ['open', 'approved', 'active', 'available'];
  const isAvailable = allowedStatuses.includes(normalizedStatus) && (availableSlots === 0 || availableSlots > 0);
  
  if (import.meta.env.DEV) {
    console.log('✅ [BookingPage] Rendering booking form:', {
      serviceName,
      servicePrice,
      availableSlots,
      status,
      isAvailable
    })
  }

  return (
    <div className="bk-booking-page">
      <Header />
      
      <main className="bk-booking-main">
        <div className="bk-booking-container">
          {/* Header */}
          <div className="bk-booking-header">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="bk-back-button"
            >
              <ArrowLeftIcon className="bk-button-icon" />
              Quay lại
            </Button>
            <h1 className="bk-booking-page-title">Đặt dịch vụ</h1>
          </div>

          <div className="bk-booking-content">
            {/* Left Column - Service Info */}
            <div className="bk-booking-left">
              <Card className="bk-service-summary-card">
                <CardContent>
                  <h2 className="bk-summary-title">Thông tin dịch vụ</h2>
                  <div className="bk-service-summary-new">
                    {/* Service Info Header */}
                    <div className="bk-service-info-header">
                      <h3 className="bk-service-name-large">{serviceName}</h3>
                      {serviceAddress && (
                        <div className="bk-service-location">
                          <MapPinIcon className="bk-location-icon" />
                          <span>{serviceAddress}</span>
                        </div>
                      )}
                      <div className="bk-service-meta">
                        <div className="bk-service-price-tag">
                          <span className="bk-price-amount">{formatPrice(servicePrice)}</span>
                          <span className="bk-price-unit">/ người</span>
                        </div>
                        {availableSlots > 0 ? (
                          <div className="bk-slots-badge bk-slots-available">
                            <UsersIcon className="bk-slots-icon" />
                            <span>Còn {availableSlots} chỗ</span>
                          </div>
                        ) : (
                          <div className="bk-slots-badge bk-slots-full">
                            <UsersIcon className="bk-slots-icon" />
                            <span>Hết chỗ</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Image Gallery */}
                    <div className="bk-service-images-grid">
                      {serviceImages.map((img, index) => (
                        <div 
                          key={index} 
                          className={`bk-image-item ${index === 0 ? 'bk-image-main' : ''}`}
                          onClick={() => setLightboxImage(img)}
                        >
                          <LazyImage
                            src={img}
                            alt={`${serviceName} - Ảnh ${index + 1}`}
                            className="bk-grid-image"
                            fallbackSrc={baNaHillImage}
                          />
                          <div className="bk-image-overlay">
                            <span>🔍</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Form */}
              <Card className="bk-booking-form-card">
                <CardContent>
                  <h2 className="bk-form-title">Thông tin đặt dịch vụ</h2>
                  <form onSubmit={handleSubmit} className="bk-booking-form">
                    {validationError && (
                      <div className="bk-alert bk-alert-error">
                        <AlertCircleIcon className="bk-alert-icon" />
                        <div className="bk-alert-content">
                          <strong>Lỗi xác thực</strong>
                          <p>{validationError}</p>
                        </div>
                      </div>
                    )}

                    <div className="bk-form-group">
                      <label htmlFor="quantity" className="bk-form-label">
                        Số lượng người <span className="bk-required">*</span>
                      </label>
                      <div className="bk-quantity-input-wrapper">
                        <button
                          type="button"
                          className="bk-quantity-btn quantity-btn-decrease"
                          onClick={handleQuantityDecrease}
                          disabled={quantity <= 1 || !isAvailable}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          id="quantity"
                          className="bk-quantity-input"
                          value={quantity}
                          onChange={handleQuantityChange}
                          min="1"
                          max={availableSlots > 0 ? availableSlots : undefined}
                          required
                          disabled={!isAvailable}
                        />
                        <button
                          type="button"
                          className="bk-quantity-btn quantity-btn-increase"
                          onClick={handleQuantityIncrease}
                          disabled={!isAvailable || (availableSlots > 0 && quantity >= availableSlots)}
                        >
                          +
                        </button>
                      </div>
                      {availableSlots > 0 && (
                        <p className="bk-form-hint">
                          Tối đa {availableSlots} người
                        </p>
                      )}
                      {availableSlots === 0 && (
                        <p className="bk-form-hint bk-form-hint-error">
                          Dịch vụ đã hết chỗ
                        </p>
                      )}
                    </div>



                    {/* Ngày đi */}
                    <div className="bk-form-group">
                      <label htmlFor="startDate" className="bk-form-label">
                        Ngày đi <span className="bk-required">*</span>
                      </label>
                      <div className="bk-date-input-wrapper">
                        <CalendarIcon className="bk-date-input-icon" />
                        <input
                          type="date"
                          id="startDate"
                          className="bk-date-input"
                          value={startDate}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            setStartDate(selectedDate);
                            setValidationError('');
                            
                            // Nếu chọn ngày hôm nay, tự động set giờ hiện tại
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            if (selectedDate === todayStr) {
                              const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                              setStartTime(currentTime);
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          disabled={!isAvailable}
                          placeholder="dd / mm / yyyy"
                        />
                        {!startDate && (
                          <span className="bk-date-placeholder">dd / mm / yyyy</span>
                        )}
                      </div>
                      <p className="bk-form-hint">
                        Chọn ngày bạn muốn sử dụng dịch vụ
                      </p>
                    </div>

                    {/* Thời gian bắt đầu */}
                    <div className="bk-form-group">
                      <label htmlFor="startTime" className="bk-form-label">
                        Thời gian bắt đầu <span className="bk-required">*</span>
                      </label>
                      <div className="bk-time-input-wrapper">
                        <svg className="bk-time-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <input
                          type="time"
                          id="startTime"
                          className="bk-time-input"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            setValidationError('');
                            setSlotCheckError(''); // Reset lỗi khi thay đổi thời gian
                          }}
                          required
                          disabled={!isAvailable}
                        />
                      </div>
                      {checkingSlot ? (
                        <p className="bk-form-hint" style={{ color: '#64748b', fontStyle: 'italic' }}>
                          Đang kiểm tra slot...
                        </p>
                      ) : slotCheckError ? (
                        <p className="bk-form-hint bk-form-hint-error" style={{ marginTop: '0.5rem' }}>
                          {slotCheckError}
                        </p>
                      ) : (
                        <p className="bk-form-hint">
                          Chọn thời gian bắt đầu sử dụng dịch vụ
                        </p>
                      )}
                    </div>



                    {/* Additional Services Section */}
                    {loadingServices ? (
                      <div className="bk-form-group">
                        <label className="bk-form-label">Dịch vụ thêm (tùy chọn)</label>
                        <div className="bk-services-loading">Dịch vụ tặng kèm </div>
                      </div>
                    ) : availableServices.length > 0 ? (
                      <div className="bk-form-group">
                        <label className="bk-form-label">
                          Dịch vụ thêm (tùy chọn)
                          {selectedServices.length > 0 && (
                            <span className="bk-selected-count">
                              ({selectedServices.reduce((sum, s) => sum + s.quantity, 0)} đã chọn)
                            </span>
                          )}
                        </label>
                        <div className="bk-services-list">
                          {availableServices.map((svc) => {
                              const serviceId = svc.Id || svc.id;
                              const serviceName = svc.Name || svc.name || 'Dịch vụ';
                              const servicePrice = svc.Price || svc.price || 0;
                              const serviceDescription = svc.Description || svc.description || '';
                              const currentQuantity = getServiceQuantity(serviceId);
                              const isSelected = currentQuantity > 0;
                              
                              return (
                                <div
                                  key={serviceId}
                                  className={`bk-service-item ${isSelected ? 'bk-selected' : ''}`}
                                >
                                  <div className="bk-service-item-content" style={{ flex: 1 }}>
                                    <div className="bk-service-item-header">
                                      <h4 className="bk-service-item-name">{serviceName}</h4>
                                      <span className="bk-service-item-price">{formatPrice(servicePrice)}</span>
                                    </div>
                                    {serviceDescription && (
                                      <p className="bk-service-item-description">{serviceDescription}</p>
                                    )}
                                  </div>
                                  <div className="bk-service-quantity-controls">
                                    <button
                                      type="button"
                                      className="bk-service-qty-btn"
                                      onClick={() => handleServiceQuantityChange(serviceId, -1)}
                                      disabled={!isAvailable || currentQuantity <= 0}
                                    >
                                      −
                                    </button>
                                    <span className="bk-service-qty-value">{currentQuantity}</span>
                                    <button
                                      type="button"
                                      className="bk-service-qty-btn"
                                      onClick={() => handleServiceQuantityChange(serviceId, 1)}
                                      disabled={!isAvailable}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {selectedServices.length > 0 && availableServices.length > 0 && (
                          <p className="bk-form-hint">
                            Tổng tiền dịch vụ thêm: {formatPrice(
                              selectedServices.reduce((sum, selectedSvc) => {
                                const availableService = availableServices.find(s => {
                                  const id = s.Id || s.id;
                                  const numId = typeof id === 'number' ? id : parseInt(id);
                                  return numId === selectedSvc.id || id == selectedSvc.id;
                                });
                                if (availableService) {
                                  const price = availableService.Price || availableService.price || 0;
                                  return sum + price * selectedSvc.quantity;
                                }
                                return sum;
                              }, 0)
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bk-form-group">
                        <label className="bk-form-label">Dịch vụ thêm (tùy chọn)</label>
                        <p className="bk-form-hint" style={{ color: '#64748b', fontStyle: 'italic' }}>
                          Không có dịch vụ thêm nào cho combo này
                        </p>
                      </div>
                    )}

                    {/* Complementary Services Section */}
                    {isAvailable && (
                      <ComplementaryServices
                        userTier={userTier}
                        selectedServices={selectedComplementaryServices}
                        onSelectionChange={setSelectedComplementaryServices}
                        disabled={submitting}
                        hostId={service?.HostId || service?.hostId}
                        onServicesLoaded={setComplementaryServicesData}
                        maxSelectable={quantity}
                      />
                    )}

                    <div className="bk-form-group">
                      <label htmlFor="notes" className="bk-form-label">
                        Ghi chú (tùy chọn)
                        {notes.length > 0 && (
                          <span className="bk-notes-counter">
                            {notes.length}/1000
                          </span>
                        )}
                      </label>
                      <textarea
                        id="notes"
                        className="bk-form-textarea"
                        value={notes}
                        onChange={(e) => {
                          if (e.target.value.length <= 1000) {
                            setNotes(e.target.value);
                          }
                        }}
                        rows={4}
                        placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt...&#10;Ví dụ: Tôi muốn 2 phần Ăn trưa và 1 phần Uống sâm panh"
                        disabled={!isAvailable}
                        maxLength={1000}
                      />
                    </div>

                    {!isAvailable && (
                      <div className="bk-alert bk-alert-warning">
                        <AlertCircleIcon className="bk-alert-icon" />
                        <div className="bk-alert-content">
                          <strong>Dịch vụ không khả dụng</strong>
                          <p>
                            {status.toLowerCase() === 'closed' 
                              ? 'Dịch vụ này đã đóng.' 
                              : availableSlots === 0 
                              ? 'Dịch vụ này đã hết chỗ.' 
                              : 'Dịch vụ này không khả dụng.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bk-form-actions">
                      <Button
                        type="submit"
                        variant="default"
                        size="lg"
                        className="bk-submit-button"
                        disabled={!isAvailable || submitting}
                      >
                        {submitting 
                          ? 'Đang xử lý...' 
                          : calculatingTotal
                          ? 'Đang tính toán...'
                          : 'Xác nhận đặt dịch vụ'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="bk-booking-right">
              <Card className="bk-order-summary-card">
                <CardContent>
                  <h2 className="bk-summary-title">Tóm tắt đơn hàng</h2>
                  
                  <div className="bk-order-summary-content">
                    <div className="bk-summary-row">
                      <span className="bk-summary-label">Dịch vụ</span>
                      <span className="bk-summary-value">{serviceName}</span>
                    </div>
                    
                    <div className="bk-summary-row">
                      <span className="bk-summary-label">Số lượng</span>
                      <span className="bk-summary-value">{quantity} người</span>
                    </div>
                    
                    <div className="bk-summary-row">
                      <span className="bk-summary-label">Đơn giá</span>
                      <span className="bk-summary-value">{formatPrice(servicePrice)}</span>
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <>
                        <div className="bk-summary-row bk-summary-row-subtotal">
                          <span className="bk-summary-label">Tổng combo</span>
                          <span className="bk-summary-value">
                            {formatPrice((servicePrice || 0) * quantity)}
                          </span>
                        </div>
                        <div className="bk-summary-row" style={{ marginTop: '0.5rem' }}>
                          <span className="bk-summary-label" style={{ fontWeight: '600' }}>Dịch vụ thêm</span>
                          <span className="bk-summary-value"></span>
                        </div>
                        {selectedServices.map(({ id: serviceId, quantity: serviceQty }) => {
                          const selectedService = availableServices.find(s => {
                            const sId = s.Id || s.id;
                            const numId = typeof sId === 'number' ? sId : parseInt(sId);
                            const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(String(serviceId));
                            return numId === numServiceId || sId == serviceId;
                          });
                          if (!selectedService) return null;
                          const price = selectedService.Price || selectedService.price || 0;
                          const name = selectedService.Name || selectedService.name || 'Dịch vụ';
                          return (
                            <div key={serviceId} className="bk-summary-row bk-summary-row-additional" style={{ paddingLeft: '0.5rem' }}>
                              <span className="bk-summary-label">+ {name} x{serviceQty}</span>
                              <span className="bk-summary-value">
                                {formatPrice(price * serviceQty)}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Complementary Services in Summary */}
                    {selectedComplementaryServices.length > 0 && complementaryServicesData.length > 0 && (
                      <>
                        <div className="bk-summary-row bk-summary-row-divider">
                          <span className="bk-summary-label" style={{ fontWeight: '600' }}>Ưu đãi của bạn</span>
                          <span className="bk-summary-value bk-summary-value-free" style={{ color: '#16a34a', fontWeight: '600' }}>Miễn phí</span>
                        </div>
                        {selectedComplementaryServices.map(serviceId => {
                          const compService = complementaryServicesData.find(s => s.id === serviceId)
                          if (!compService) return null
                          return (
                            <div key={serviceId} className="bk-summary-row bk-summary-row-complementary" style={{ paddingLeft: '0.5rem' }}>
                              <span className="bk-summary-label" style={{ color: '#16a34a' }}>✓ {compService.name}</span>
                              <span className="bk-summary-value" style={{ color: '#16a34a', fontSize: '0.875rem' }}>Miễn phí</span>
                            </div>
                          )
                        })}
                      </>
                    )}

                    {/* Coupon Section */}
                    <div className="bk-coupon-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <label className="bk-form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Mã giảm giá</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã giảm giá"
                          disabled={!!appliedCoupon || validatingCoupon}
                          className="bk-form-input"
                          style={{ 
                            flex: 1,
                            opacity: appliedCoupon ? 0.6 : 1,
                            backgroundColor: appliedCoupon ? '#f3f4f6' : '#fff'
                          }}
                        />
                        {appliedCoupon ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemoveCoupon}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            Hủy
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            onClick={handleOpenCouponModal}
                            disabled={validatingCoupon}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {validatingCoupon ? 'Đang kiểm tra...' : 'Chọn mã'}
                          </Button>
                        )}
                      </div>
                      {couponSuccess && (
                        <p style={{ color: '#16a34a', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                          ✓ {couponSuccess}
                        </p>
                      )}
                      {couponError && (
                        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                          ✗ {couponError}
                        </p>
                      )}
                    </div>

                    {/* Coupon Discount Row */}
                    {appliedCoupon && couponDiscount > 0 && (
                      <div className="bk-summary-row" style={{ marginTop: '0.75rem', color: '#16a34a' }}>
                        <span className="bk-summary-label">Giảm giá ({appliedCoupon.Code})</span>
                        <span className="bk-summary-value" style={{ color: '#16a34a', fontWeight: '600' }}>
                          -{formatPrice(couponDiscount)}
                        </span>
                      </div>
                    )}
                    
                    <div className="bk-summary-row bk-summary-row-total">
                      <span className="bk-summary-label">Thành tiền</span>
                      <span className="bk-summary-value bk-summary-total">
                        {calculatingTotal ? (
                          <span className="bk-calculating-text">Đang tính...</span>
                        ) : (
                          formatPrice(Math.max(0, calculatedTotal - couponDiscount))
                        )}
                      </span>
                    </div>

                    {/* Thông báo về 10% phí giữ slot */}
                    <div className="bk-payment-notice" style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                        💡 Lưu ý về thanh toán:
                      </strong>
                      <p style={{ margin: 0, lineHeight: '1.5' }}>
                        Bạn sẽ chỉ thanh toán <strong>10% phí giữ slot</strong> khi đặt dịch vụ. 
                        Số tiền còn lại sẽ thanh toán khi tham gia trải nghiệm dịch vụ.
                      </p>
                    </div>
                  </div>

                  <div className="bk-booking-info-box">
                    <CheckCircleIcon className="bk-info-box-icon" />
                    <div className="bk-info-box-content">
                      <strong>Thông tin quan trọng</strong>
                      <ul>
                        <li>Bạn sẽ nhận được email xác nhận sau khi đặt dịch vụ</li>
                        <li>Thanh toán sẽ được thực hiện sau khi xác nhận</li>
                        <li>Vui lòng kiểm tra lại thông tin trước khi xác nhận</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Coupon Selection Modal */}
      {showCouponModal && (
        <div className="bk-coupon-modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="bk-coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bk-coupon-modal-header">
              <h3>Chọn mã giảm giá</h3>
              <button 
                className="bk-coupon-modal-close"
                onClick={() => setShowCouponModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="bk-coupon-modal-body">
              {loadingCoupons ? (
                <div className="bk-coupon-modal-loading">
                  <LoadingSpinner />
                  <p>Đang tải mã giảm giá...</p>
                </div>
              ) : availableCoupons.length === 0 ? (
                <div className="bk-coupon-modal-empty">
                  <p>Không có mã giảm giá nào cho dịch vụ này</p>
                </div>
              ) : (
                <div className="bk-coupon-list">
                  {availableCoupons.map((coupon) => {
                    const { isEligible, reason } = getCouponEligibility(coupon);
                    const { text: targetText, badges } = getCouponRequiredLevel(coupon);
                    return (
                      <div 
                        key={coupon.Id || coupon.id}
                        className={`bk-coupon-item ${isEligible ? '' : 'bk-coupon-item-locked'}`}
                        onClick={() => isEligible && handleSelectCoupon(coupon)}
                        style={{ cursor: isEligible ? 'pointer' : 'not-allowed' }}
                      >
                        <div className="bk-coupon-item-left">
                          <div className="bk-coupon-item-discount">
                            {coupon.DiscountPercent ? `${coupon.DiscountPercent}%` : formatPrice(coupon.DiscountAmount || 0)}
                          </div>
                          <span className="bk-coupon-item-label">GIẢM</span>
                        </div>
                        <div className="bk-coupon-item-right">
                          <div className="bk-coupon-item-code">{coupon.Code}</div>
                          <div className="bk-coupon-item-desc">{coupon.Description || 'Mã giảm giá'}</div>
                          {badges.length > 0 && (
                            <div className="bk-coupon-item-target">
                              <span className="bk-coupon-target-label">Dành cho {targetText}:</span>
                              <div className="bk-coupon-level-badges">
                                {badges.map(badge => (
                                  <span key={badge.level} className={`bk-coupon-level-badge bk-coupon-level-${badge.level}`}>
                                    <span className="bk-coupon-level-icon">{badge.icon}</span>
                                    <span className="bk-coupon-level-name">{badge.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {coupon.ExpiryDate && (
                            <div className="bk-coupon-item-expiry">
                              HSD: {new Date(coupon.ExpiryDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                          {!isEligible && reason && (
                            <div className="bk-coupon-item-locked-reason">
                              🔒 {reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="bk-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="bk-lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <img src={lightboxImage} alt="Xem ảnh lớn" className="bk-lightbox-image" />
        </div>
      )}
    </div>
  );
};

export default BookingPage;



