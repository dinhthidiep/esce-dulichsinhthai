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
import type { MembershipTier } from '~/types/membership';
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
  
  // Additional services state
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Complementary Services state (thay thế cho coupon)
  const [userTier, setUserTier] = useState<MembershipTier>('none');
  const [selectedComplementaryServices, setSelectedComplementaryServices] = useState<number[]>([]);

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

  // Kiểm tra slot còn lại trong khoảng thời gian đã chọn
  useEffect(() => {
    const checkSlotAvailability = async () => {
      if (!service || !id || !startDate || quantity <= 0) {
        setSlotCheckError('');
        return;
      }

      // Chỉ kiểm tra cho single-day booking với startTime
      if (bookingType === 'single-day' && startTime) {
        try {
          setCheckingSlot(true);
          setSlotCheckError('');

          // Gọi API để lấy tất cả booking của service combo này
          const response = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/service-combo/${id}`);
          const bookings = response.data || [];

          // Lọc các booking trong cùng ngày và giờ
          const selectedDateTime = new Date(`${startDate}T${startTime}`);
          const conflictingBookings = bookings.filter((booking: any) => {
            if (!booking.StartDate || !booking.EndDate) return false;
            
            const bookingStart = new Date(booking.StartDate);
            const bookingEnd = new Date(booking.EndDate);
            
            // Kiểm tra nếu booking trùng với thời gian đã chọn
            // Nếu booking là single-day và cùng ngày, kiểm tra thời gian
            if (bookingStart.toDateString() === selectedDateTime.toDateString()) {
              // Nếu booking có StartTime, kiểm tra trùng giờ
              if (booking.StartTime) {
                const bookingTime = booking.StartTime.split(':');
                const selectedTime = startTime.split(':');
                const bookingHours = parseInt(bookingTime[0]);
                const bookingMinutes = parseInt(bookingTime[1]);
                const selectedHours = parseInt(selectedTime[0]);
                const selectedMinutes = parseInt(selectedTime[1]);
                
                // Nếu cùng giờ (chấp nhận sai số 1 giờ)
                if (Math.abs(bookingHours - selectedHours) <= 1) {
                  return true;
                }
              } else {
                // Nếu không có StartTime, coi như trùng nếu cùng ngày
                return true;
              }
            }
            
            // Kiểm tra nếu selectedDateTime nằm trong khoảng booking
            return selectedDateTime >= bookingStart && selectedDateTime <= bookingEnd;
          });

          // Tính tổng số slot đã đặt trong các booking trùng
          const totalBookedSlots = conflictingBookings.reduce((sum: number, booking: any) => {
            const bookedQuantity = booking.BookingNumber || booking.bookingNumber || 0;
            return sum + bookedQuantity;
          }, 0);

          // Kiểm tra xem còn đủ slot không
          const availableSlots = service.AvailableSlots !== undefined 
            ? service.AvailableSlots 
            : (service.availableSlots !== undefined ? service.availableSlots : 0);

          const remainingSlots = availableSlots - totalBookedSlots;

          if (remainingSlots < quantity) {
            setSlotCheckError('Thời gian bạn đặt dịch vụ đã hết slot. Vui lòng chọn thời gian khác.');
          } else {
            setSlotCheckError('');
          }
        } catch (err: any) {
          // Nếu không thể kiểm tra, không hiển thị lỗi (có thể do API chưa có endpoint)
          if (import.meta.env.DEV) {
            console.warn('⚠️ [BookingPage] Không thể kiểm tra slot:', err?.message);
          }
          setSlotCheckError('');
        } finally {
          setCheckingSlot(false);
        }
      } else {
        setSlotCheckError('');
      }
    };

    // Debounce để tránh gọi API quá nhiều
    const timeoutId = setTimeout(() => {
      checkSlotAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [service, id, startDate, startTime, quantity, bookingType]);

  // Lấy userTier từ user info
  useEffect(() => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        // Lấy membership tier từ user info
        const tier = (userInfo.MembershipTier || userInfo.membershipTier || userInfo.tier) as MembershipTier;
        if (tier && ['silver', 'gold', 'diamond', 'none'].includes(tier)) {
          setUserTier(tier);
        } else {
          // Nếu không có tier trong userInfo, mặc định là 'none' (level 0)
          setUserTier('none');
        }
      } else {
        setUserTier('none');
      }
    } catch (error) {
      console.error('Error getting user tier:', error);
      setUserTier('none');
    }
  }, []);

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
            console.warn('⚠️ [BookingPage] ServiceCombo không có HostId, không thể load dịch vụ thêm');
          }
          setAvailableServices([]);
          return;
        }
        
        // Lấy tất cả Service của host đó
        const url = `${API_ENDPOINTS.SERVICE}/host/${hostId}`;
        
        if (import.meta.env.DEV) {
          console.log(`🔍 [BookingPage] Đang load dịch vụ của host ${hostId}`);
        }
        
        const response = await axiosInstance.get(url);
        
        if (response.data && Array.isArray(response.data)) {
          // Chỉ lấy các Service có status = "Approved"
          const approvedServices = response.data.filter((svc: any) => {
            const status = (svc.Status || svc.status || '').toLowerCase();
            return status === 'approved';
          });
          
          if (import.meta.env.DEV) {
            console.log(`✅ [BookingPage] Tìm thấy ${approvedServices.length} dịch vụ đơn lẻ của host ${hostId}`);
          }
          setAvailableServices(approvedServices);
        } else {
          setAvailableServices([]);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BookingPage] Không thể tải dịch vụ thêm của host:', err?.message || 'Unknown error');
        }
        // Đặt services = [] và tiếp tục (BookingPage vẫn hoạt động bình thường)
        setAvailableServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    // Chỉ fetch khi đã có service data (có HostId)
    if (service) {
      fetchHostServices();
    }
  }, [service, id]);

  // Tính toán tổng tiền khi quantity, selectedServices hoặc discount thay đổi
  useEffect(() => {
    if (!service) return;

    const servicePrice = service.Price || service.price || 0;
    const baseTotal = servicePrice * quantity;
    
    // Tính tổng tiền của các dịch vụ thêm
    const additionalServicesTotal = selectedServices.reduce((sum, serviceId) => {
      if (!availableServices || availableServices.length === 0) return sum;
      
      const selectedService = availableServices.find(s => {
        const id = s.Id || s.id;
        const numId = typeof id === 'number' ? id : parseInt(id);
        const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
        return numId === numServiceId || id == serviceId;
      });
      
      if (selectedService) {
        const price = selectedService.Price || selectedService.price || 0;
        return sum + price * quantity; // Nhân với số lượng người
      }
      return sum;
    }, 0);
    
    const newTotal = baseTotal + additionalServicesTotal;
    setCalculatedTotal(newTotal);
    setValidationError('');
  }, [quantity, service, selectedServices, availableServices]);

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

  // Handle service selection
  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const isServiceSelected = (serviceId) => {
    return selectedServices.includes(serviceId);
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
      
      // Tính tổng tiền của các dịch vụ thêm (chỉ tính các dịch vụ hợp lệ)
      const additionalServicesTotal = selectedServices.reduce((sum, serviceId) => {
        if (availableServices.length === 0) return sum;
        
        const selectedService = availableServices.find(s => {
          const id = s.Id || s.id;
          const numId = typeof id === 'number' ? id : parseInt(id);
          const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
          return numId === numServiceId || id == serviceId;
        });
        
        if (selectedService) {
          const price = selectedService.Price || selectedService.price || 0;
          return sum + price * quantity;
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
        validSelectedServices = selectedServices.filter(serviceId => {
          const service = availableServices.find(s => {
            const id = s.Id || s.id;
            const numId = typeof id === 'number' ? id : parseInt(id);
            const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
            return numId === numServiceId || id == serviceId; // Loose equality để handle type mismatch
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
      // Thêm thông tin dịch vụ thêm vào notes
      let bookingNotes = notes.trim() || '';
      if (validSelectedServices.length > 0 && availableServices.length > 0) {
        const selectedServiceNames = validSelectedServices.map(serviceId => {
          const selectedService = availableServices.find(s => {
            const id = s.Id || s.id;
            const numId = typeof id === 'number' ? id : parseInt(id);
            const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
            return numId === numServiceId || id == serviceId;
          });
          return selectedService ? (selectedService.Name || selectedService.name) : '';
        }).filter(name => name);
        
        if (selectedServiceNames.length > 0) {
          const servicesInfo = `\n\nDịch vụ thêm đã chọn: ${selectedServiceNames.join(', ')}`;
          bookingNotes = bookingNotes ? bookingNotes + servicesInfo : servicesInfo.trim();
        }
        
        // Lưu service IDs vào notes để backend có thể xử lý
        const serviceIdsInfo = `\n[ADDITIONAL_SERVICES_IDS:${validSelectedServices.join(',')}]`;
        bookingNotes = bookingNotes + serviceIdsInfo;
        
        console.log(' BookingPage: Gửi các service ID hợp lệ:', validSelectedServices);
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
  // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên
  let imagePath = service.Image || service.image || '';
  if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
    imagePath = imagePath.split(',')[0].trim();
  }
  const serviceImage = getImageUrl(imagePath, baNaHillImage);
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
                  <div className="bk-service-summary">
                    <div className="bk-service-summary-image">
                      <LazyImage
                        src={serviceImage}
                        alt={serviceName}
                        className="bk-summary-image"
                        fallbackSrc={baNaHillImage}
                      />
                    </div>
                    <div className="bk-service-summary-info">
                      <h3 className="bk-summary-service-name">{serviceName}</h3>
                      {serviceAddress && (
                        <div className="bk-summary-address">
                          <MapPinIcon className="bk-summary-icon" />
                          <span>{serviceAddress}</span>
                        </div>
                      )}
                      <div className="bk-summary-price">
                        <span className="bk-summary-price-label">Giá:</span>
                        <span className="bk-summary-price-value">{formatPrice(servicePrice)}</span>
                        <span className="bk-summary-price-unit">/ người</span>
                      </div>
                      {availableSlots > 0 && (
                        <div className="bk-summary-slots">
                          <UsersIcon className="bk-summary-icon" />
                          <span>Còn {availableSlots} chỗ trống</span>
                        </div>
                      )}
                      {availableSlots === 0 && (
                        <div className="bk-summary-slots bk-summary-slots-full">
                          <UsersIcon className="bk-summary-icon" />
                          <span>Đã hết chỗ</span>
                        </div>
                      )}
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

                    {/* Booking Type Selection */}
                    <div className="bk-form-group">
                      <label className="bk-form-label">
                        Loại đặt dịch vụ <span className="bk-required">*</span>
                      </label>
                      <div className="bk-booking-type-selector">
                        <label className={`bk-booking-type-option ${bookingType === 'single-day' ? 'bk-active' : ''}`}>
                          <input
                            type="radio"
                            name="bookingType"
                            value="single-day"
                            checked={bookingType === 'single-day'}
                            onChange={(e) => {
                              setBookingType(e.target.value);
                              setEndDate(''); // Reset endDate khi chuyển sang single-day
                              setStartTime(startTime || '08:00'); // Đảm bảo có giá trị mặc định
                              setValidationError('');
                            }}
                            disabled={!isAvailable}
                          />
                          <div className="bk-booking-type-content">
                            <span className="bk-booking-type-title">Đi trong ngày</span>
                            <span className="bk-booking-type-desc">Chọn ngày và thời gian cụ thể</span>
                          </div>
                        </label>
                        <label className={`bk-booking-type-option ${bookingType === 'multi-day' ? 'bk-active' : ''}`}>
                          <input
                            type="radio"
                            name="bookingType"
                            value="multi-day"
                            checked={bookingType === 'multi-day'}
                            onChange={(e) => {
                              setBookingType(e.target.value);
                              setStartTime('08:00'); // Reset time khi chuyển sang multi-day
                              // Nếu chưa có endDate hoặc endDate = startDate, tự động set endDate = startDate + 1 ngày
                              if (startDate && (!endDate || endDate === startDate)) {
                                const nextDay = new Date(startDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                setEndDate(nextDay.toISOString().split('T')[0]);
                              }
                              setValidationError('');
                            }}
                            disabled={!isAvailable}
                          />
                          <div className="bk-booking-type-content">
                            <span className="bk-booking-type-title">Đi nhiều ngày</span>
                            <span className="bk-booking-type-desc">Chọn khoảng thời gian từ ngày này đến ngày khác</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Single Day Booking Fields */}
                    {bookingType === 'single-day' && (
                      <>
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
                      </>
                    )}

                    {/* Multi-Day Booking Fields */}
                    {bookingType === 'multi-day' && (
                      <>
                        <div className="bk-form-group">
                          <label htmlFor="startDate" className="bk-form-label">
                            Ngày bắt đầu <span className="bk-required">*</span>
                          </label>
                          <div className="bk-date-input-wrapper">
                            <CalendarIcon className="bk-date-input-icon" />
                            <input
                              type="date"
                              id="startDate"
                              className="bk-date-input"
                              value={startDate}
                              onChange={(e) => {
                                setStartDate(e.target.value);
                                // Nếu endDate nhỏ hơn hoặc bằng startDate, tự động cập nhật endDate
                                if (e.target.value) {
                                  const newStartDate = new Date(e.target.value);
                                  if (!endDate || new Date(endDate) <= newStartDate) {
                                    const newEndDate = new Date(newStartDate);
                                    newEndDate.setDate(newEndDate.getDate() + 1);
                                    setEndDate(newEndDate.toISOString().split('T')[0]);
                                  }
                                }
                                setValidationError('');
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
                            Chọn ngày bắt đầu sử dụng dịch vụ
                          </p>
                        </div>

                        <div className="bk-form-group">
                          <label htmlFor="endDate" className="bk-form-label">
                            Ngày kết thúc <span className="bk-required">*</span>
                          </label>
                          <div className="bk-date-input-wrapper">
                            <CalendarIcon className="bk-date-input-icon" />
                            <input
                              type="date"
                              id="endDate"
                              className="bk-date-input"
                              value={endDate}
                              onChange={(e) => {
                                setEndDate(e.target.value);
                                setValidationError('');
                              }}
                              min={startDate || new Date().toISOString().split('T')[0]}
                              required
                              disabled={!isAvailable}
                              placeholder="dd / mm / yyyy"
                            />
                            {!endDate && (
                              <span className="bk-date-placeholder">dd / mm / yyyy</span>
                            )}
                          </div>
                          <p className="bk-form-hint">
                            Chọn ngày kết thúc sử dụng dịch vụ
                          </p>
                        </div>
                      </>
                    )}

                    {/* Additional Services Section */}
                    {loadingServices ? (
                      <div className="bk-form-group">
                        <label className="bk-form-label">Dịch vụ thêm (tùy chọn)</label>
                        <div className="bk-services-loading">Đang tải danh sách dịch vụ...</div>
                      </div>
                    ) : availableServices.length > 0 ? (
                      <div className="bk-form-group">
                        <label className="bk-form-label">
                          Dịch vụ thêm (tùy chọn)
                          {selectedServices.length > 0 && (
                            <span className="bk-selected-count">
                              ({selectedServices.length} đã chọn)
                            </span>
                          )}
                        </label>
                        <div className="bk-services-list">
                          {availableServices.map((svc) => {
                              const serviceId = svc.Id || svc.id;
                              const serviceName = svc.Name || svc.name || 'Dịch vụ';
                              const servicePrice = svc.Price || svc.price || 0;
                              const serviceDescription = svc.Description || svc.description || '';
                              const isSelected = isServiceSelected(serviceId);
                              
                              return (
                                <div
                                  key={serviceId}
                                  className={`bk-service-item ${isSelected ? 'bk-selected' : ''}`}
                                  onClick={() => isAvailable && handleServiceToggle(serviceId)}
                                >
                                  <div className="bk-service-item-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleServiceToggle(serviceId)}
                                      disabled={!isAvailable}
                                    />
                                  </div>
                                  <div className="bk-service-item-content">
                                    <div className="bk-service-item-header">
                                      <h4 className="bk-service-item-name">{serviceName}</h4>
                                      <span className="bk-service-item-price">{formatPrice(servicePrice)}</span>
                                    </div>
                                    {serviceDescription && (
                                      <p className="bk-service-item-description">{serviceDescription}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {selectedServices.length > 0 && availableServices.length > 0 && (
                          <p className="bk-form-hint">
                            Tổng tiền dịch vụ thêm: {formatPrice(
                              selectedServices.reduce((sum, serviceId) => {
                                const selectedService = availableServices.find(s => {
                                  const id = s.Id || s.id;
                                  const numId = typeof id === 'number' ? id : parseInt(id);
                                  const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
                                  return numId === numServiceId || id == serviceId;
                                });
                                if (selectedService) {
                                  const price = selectedService.Price || selectedService.price || 0;
                                  return sum + price * quantity;
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
                        placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
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
                        {selectedServices.map(serviceId => {
                          const selectedService = availableServices.find(s => {
                            const id = s.Id || s.id;
                            const numId = typeof id === 'number' ? id : parseInt(id);
                            const numServiceId = typeof serviceId === 'number' ? serviceId : parseInt(serviceId);
                            return numId === numServiceId || id == serviceId;
                          });
                          if (!selectedService) return null;
                          const price = selectedService.Price || selectedService.price || 0;
                          const name = selectedService.Name || selectedService.name || 'Dịch vụ';
                          return (
                            <div key={serviceId} className="bk-summary-row bk-summary-row-additional">
                              <span className="bk-summary-label">+ {name}</span>
                              <span className="bk-summary-value">
                                {formatPrice(price * quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Complementary Services in Summary */}
                    {selectedComplementaryServices.length > 0 && (
                      <div className="bk-summary-row bk-summary-row-divider">
                        <span className="bk-summary-label">Ưu đãi của bạn</span>
                        <span className="bk-summary-value bk-summary-value-free">Đang cập nhật</span>
                      </div>
                    )}
                    
                    <div className="bk-summary-row bk-summary-row-total">
                      <span className="bk-summary-label">Thành tiền</span>
                      <span className="bk-summary-value bk-summary-total">
                        {calculatingTotal ? (
                          <span className="bk-calculating-text">Đang tính...</span>
                        ) : (
                          formatPrice(calculatedTotal)
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
    </div>
  );
};

export default BookingPage;





