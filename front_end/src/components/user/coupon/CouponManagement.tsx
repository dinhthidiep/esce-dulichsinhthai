import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon, AlertCircleIcon } from '../icons/index';
import CreateCouponModal from './CreateCouponModal';
import EditCouponModal from './EditCouponModal';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './CouponManagement.css';

interface CouponManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onApplyPromotionClick?: () => void;
  onToggleChange?: (isPromotionsList: boolean) => void;
}

export interface CouponManagementRef {
  openCreateModal: () => void;
  openApplyPromotionModal: () => void;
  getToggleState: () => boolean; // true = promotions list, false = coupons list
}

const CouponManagement = forwardRef<CouponManagementRef, CouponManagementProps>(({ 
  onSuccess, 
  onError,
  onApplyPromotionClick,
  onToggleChange
}, ref) => {
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

  // Coupon Rank Rules states
  const [couponRankRules, setCouponRankRules] = useState([]);

  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [couponFilterName, setCouponFilterName] = useState('');
  const [couponFilterStatus, setCouponFilterStatus] = useState('all');
  const [couponSortOrder, setCouponSortOrder] = useState('newest');
  
  // Pagination for coupons
  const [couponCurrentPage, setCouponCurrentPage] = useState(1);
  const [couponItemsPerPage] = useState(5);
  const [couponPageInput, setCouponPageInput] = useState('');
  
  // Toggle for coupon tab: coupon list vs promotions list
  const [showCouponPromotionsList, setShowCouponPromotionsList] = useState(false);
  
  // Pagination for promotions in coupon tab
  const [couponPromotionCurrentPage, setCouponPromotionCurrentPage] = useState(1);
  const [couponPromotionPageInput, setCouponPromotionPageInput] = useState('');
  const couponPromotionItemsPerPage = 5;

  // Create Coupon Modal states
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false);
  const [createCouponFormData, setCreateCouponFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    usageLimit: '',
    startDate: '',
    expiryDate: '',
    forAgency: false,
    agencyLevel0: false,
    agencyLevel1: false,
    agencyLevel2: false,
    agencyLevel3: false,
    forTourist: false,
    touristLevel0: false,
    touristLevel1: false,
    touristLevel2: false,
    touristLevel3: false
  });
  const [createCouponErrors, setCreateCouponErrors] = useState({});
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Edit Coupon Modal states
  const [isEditCouponModalOpen, setIsEditCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [loadingEditCouponData, setLoadingEditCouponData] = useState(false);
  const [editCouponFormData, setEditCouponFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    usageLimit: '',
    startDate: '',
    expiryDate: '',
    isActive: true,
    forAgency: false,
    agencyLevel0: false,
    agencyLevel1: false,
    agencyLevel2: false,
    agencyLevel3: false,
    forTourist: false,
    touristLevel0: false,
    touristLevel1: false,
    touristLevel2: false,
    touristLevel3: false
  });
  const [editCouponErrors, setEditCouponErrors] = useState<{ code?: string; description?: string; discountType?: string; discountValue?: string; usageLimit?: string; startDate?: string; expiryDate?: string; isActive?: boolean }>({});
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);

  // Delete Confirm Modal states
  const [isDeleteCouponModalOpen, setIsDeleteCouponModalOpen] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<number | null>(null);
  const [deletingCouponCode, setDeletingCouponCode] = useState('');
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

  // Load coupons from API
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          setCoupons([]);
          setFilteredCoupons([]);
          return;
        }

        // Load coupons for host
        const response = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/host/${userId}`);
        const couponsData = response.data || [];
        setCoupons(couponsData);
        const filtered = applyCouponFilters(couponsData, couponFilterName, couponFilterStatus, couponSortOrder);
        setFilteredCoupons(filtered);
      } catch (err) {
        console.error('Error loading coupons:', err);
        if (onError) {
          onError('Không thể tải danh sách coupon. Vui lòng thử lại.');
        }
        setCoupons([]);
        setFilteredCoupons([]);
      }
    };

    loadCoupons();
  }, [getUserId, couponFilterName, couponFilterStatus, couponSortOrder]);

  // Apply filters when they change
  useEffect(() => {
    const filtered = applyCouponFilters(coupons, couponFilterName, couponFilterStatus, couponSortOrder);
    setFilteredCoupons(filtered);
    setCouponCurrentPage(1);
  }, [couponFilterName, couponFilterStatus, couponSortOrder, coupons]);

  // Filter and sort function for coupons
  const applyCouponFilters = (couponList, nameFilter, statusFilter, order) => {
    let filtered = [...couponList];

    // Filter by code or description
    if (nameFilter && nameFilter.trim() !== '') {
      filtered = filtered.filter(c => {
        const code = (c.Code || c.code || '').toLowerCase();
        const description = (c.Description || c.description || '').toLowerCase();
        const searchTerm = nameFilter.toLowerCase().trim();
        return code.includes(searchTerm) || description.includes(searchTerm);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        const isActive = c.IsActive || c.isActive;
        const isActiveBool = isActive === true || isActive === 1 || isActive === 'true' || isActive === '1';
        
        if (statusFilter === 'coupon-active') {
          return isActiveBool;
        } else if (statusFilter === 'expired') {
          return !isActiveBool;
        }
        return true;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.CreatedAt || a.Created_At || 0);
      const dateB = new Date(b.CreatedAt || b.Created_At || 0);
      return order === 'newest' ? (dateB as any) - (dateA as any) : (dateA as any) - (dateB as any);
    });

    return filtered;
  };

  // Handle coupon search
  const handleCouponSearch = () => {
    const filtered = applyCouponFilters(coupons, couponFilterName, couponFilterStatus, couponSortOrder);
    setFilteredCoupons(filtered);
    setCouponCurrentPage(1);
  };

  // Handle coupon page input change
  const handleCouponPageInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCouponPageInput(value);
    }
  };

  // Handle coupon page jump
  const handleCouponPageJump = (e) => {
    e.preventDefault();
    const totalPages = Math.ceil(filteredCoupons.length / couponItemsPerPage);
    const pageNum = parseInt(couponPageInput);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCouponCurrentPage(pageNum);
      setCouponPageInput('');
    }
  };

  // Handle open delete confirm modal
  const handleOpenDeleteCouponModal = (couponId: number, couponCode: string) => {
    setDeletingCouponId(couponId);
    setDeletingCouponCode(couponCode);
    setIsDeleteCouponModalOpen(true);
  };

  // Handle close delete confirm modal
  const handleCloseDeleteCouponModal = () => {
    setIsDeleteCouponModalOpen(false);
    setDeletingCouponId(null);
    setDeletingCouponCode('');
  };

  // Handle confirm delete coupon
  const handleConfirmDeleteCoupon = async () => {
    if (!deletingCouponId) return;
    
    setIsDeletingCoupon(true);
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.COUPON}/${deletingCouponId}`);
      setCoupons(prevCoupons => prevCoupons.filter(c => (c.Id || c.id) !== deletingCouponId));
      setFilteredCoupons(prevFiltered => prevFiltered.filter(c => (c.Id || c.id) !== deletingCouponId));
      if (onSuccess) {
        onSuccess('Coupon đã được xóa thành công!');
      }
      handleCloseDeleteCouponModal();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi xóa coupon. Vui lòng thử lại.');
      }
    } finally {
      setIsDeletingCoupon(false);
    }
  };

  // Helper functions
  const getCouponStatusDisplay = (isActive) => {
    if (isActive === true || isActive === 1 || isActive === 'true' || isActive === '1') {
      return { text: 'Khả dụng', className: 'coupon-status-confirmed' };
    } else {
      return { text: 'Khóa', className: 'coupon-status-expired' };
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.DiscountPercent !== null && coupon.DiscountPercent !== undefined) {
      return `-${coupon.DiscountPercent}%`;
    } else if (coupon.DiscountAmount !== null && coupon.DiscountAmount !== undefined) {
      return `-${parseFloat(coupon.DiscountAmount).toLocaleString('vi-VN')} VND`;
    }
    return 'Không có';
  };

  const formatDateRange = (coupon) => {
    const startDate = coupon.StartDate || coupon.startDate;
    const endDate = coupon.EndDate || coupon.endDate || coupon.ExpiryDate || coupon.expiryDate;
    
    if (!startDate && !endDate) return 'Không có';
    
    try {
      let startStr = '';
      let endStr = '';
      
      if (startDate) {
        const start = new Date(startDate);
        startStr = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
      }
      
      if (startStr && endStr) {
        return `${startStr} đến ${endStr}`;
      } else if (startStr) {
        return `${startStr} đến -`;
      } else if (endStr) {
        return `- đến ${endStr}`;
      }
      
      return 'Không có';
    } catch (e) {
      return 'Không có';
    }
  };

  // Create Coupon Modal handlers
  const handleCreateCouponInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue: string | boolean = value;
    
    if (type === 'radio') {
      fieldValue = value;
    } else if (type === 'checkbox') {
      fieldValue = checked;
    }
    
    setCreateCouponFormData(prev => {
      const newData = { ...prev, [name]: fieldValue };
      
      // Logic: Nếu chọn "Tất cả" (level0) thì bỏ tick các hạng khác
      // Nếu chọn hạng cụ thể (level1/2/3) thì bỏ tick "Tất cả"
      if (type === 'checkbox' && checked) {
        // Agency levels
        if (name === 'agencyLevel0') {
          newData.agencyLevel1 = false;
          newData.agencyLevel2 = false;
          newData.agencyLevel3 = false;
        } else if (['agencyLevel1', 'agencyLevel2', 'agencyLevel3'].includes(name)) {
          newData.agencyLevel0 = false;
        }
        // Tourist levels
        if (name === 'touristLevel0') {
          newData.touristLevel1 = false;
          newData.touristLevel2 = false;
          newData.touristLevel3 = false;
        } else if (['touristLevel1', 'touristLevel2', 'touristLevel3'].includes(name)) {
          newData.touristLevel0 = false;
        }
      }
      
      return newData;
    });

    if (createCouponErrors[name]) {
      setCreateCouponErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateCreateCouponField = (name, value) => {
    const config = {
      maxCodeLength: 50,
      maxDescriptionLength: 255,
      maxDiscountPercent: 100,
      minUsageLimit: 1
    };

    switch (name) {
      case 'code':
        if (!value || value.trim() === '') {
          return 'Mã coupon không được để trống';
        }
        if (value.includes(' ')) {
          return 'Mã giảm giá không được có dấu cách.';
        }
        if (value.trim().length > config.maxCodeLength) {
          return `Mã coupon không được vượt quá ${config.maxCodeLength} ký tự`;
        }
        const couponRegex = /^[A-Za-z0-9\-_]+$/;
        if (!couponRegex.test(value.trim())) {
          return 'Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới';
        }
        return '';

      case 'description':
        if (value && value.length > config.maxDescriptionLength) {
          return `Mô tả không được vượt quá ${config.maxDescriptionLength} ký tự`;
        }
        return '';

      case 'discountValue':
        if (!value || value.trim() === '') {
          return createCouponFormData.discountType === 'percentage' 
            ? 'Phần trăm giảm giá không được để trống'
            : 'Số tiền giảm giá không được để trống';
        }
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Giá trị phải là số dương';
        }
        if (createCouponFormData.discountType === 'percentage' && num > config.maxDiscountPercent) {
          return `Phần trăm không được vượt quá ${config.maxDiscountPercent}%`;
        }
        return '';

      case 'usageLimit':
        if (!value || value.trim() === '') {
          return 'Giới hạn sử dụng không được để trống';
        }
        const limit = parseInt(value);
        if (isNaN(limit) || limit < config.minUsageLimit) {
          return `Giới hạn sử dụng phải là số nguyên >= ${config.minUsageLimit}`;
        }
        return '';

      case 'startDate':
        if (!value || value.trim() === '') {
          return 'Ngày bắt đầu không được để trống';
        }
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          return 'Ngày bắt đầu không được là ngày trong quá khứ';
        }
        if (createCouponFormData.expiryDate && createCouponFormData.expiryDate.trim() !== '') {
          const expiryDate = new Date(createCouponFormData.expiryDate);
          if (startDate > expiryDate) {
            return 'Ngày bắt đầu không được sau ngày hết hạn';
          }
        }
        return '';

      case 'expiryDate':
        if (!value || value.trim() === '') {
          return 'Ngày hết hạn không được để trống';
        }
        const selectedDate = new Date(value);
        const todayForExpiry = new Date();
        todayForExpiry.setHours(0, 0, 0, 0);
        if (selectedDate < todayForExpiry) {
          return 'Ngày hết hạn không được là ngày trong quá khứ';
        }
        if (createCouponFormData.startDate && createCouponFormData.startDate.trim() !== '') {
          const startDateForExpiry = new Date(createCouponFormData.startDate);
          if (selectedDate < startDateForExpiry) {
            return 'Ngày hết hạn không được trước ngày bắt đầu';
          }
        }
        return '';

      default:
        return '';
    }
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    
    if (isCreatingCoupon) return;
    
    setIsCreatingCoupon(true);
    setCreateCouponErrors({});

    const newErrors: Record<string, string> = {};
    Object.keys(createCouponFormData).forEach(key => {
      if (key !== 'discountType') {
        const fieldError = validateCreateCouponField(key, createCouponFormData[key]);
        if (fieldError) {
          newErrors[key] = fieldError;
        }
      }
    });

    // Validate target audience - phải chọn ít nhất 1 role và 1 hạng
    const hasAgencyLevel = createCouponFormData.forAgency && (
      createCouponFormData.agencyLevel0 || createCouponFormData.agencyLevel1 || 
      createCouponFormData.agencyLevel2 || createCouponFormData.agencyLevel3
    );
    const hasTouristLevel = createCouponFormData.forTourist && (
      createCouponFormData.touristLevel0 || createCouponFormData.touristLevel1 || 
      createCouponFormData.touristLevel2 || createCouponFormData.touristLevel3
    );
    
    if (!hasAgencyLevel && !hasTouristLevel) {
      newErrors['targetAudience'] = 'Vui lòng chọn ít nhất 1 vai trò và 1 hạng';
    }

    if (Object.keys(newErrors).length > 0) {
      setCreateCouponErrors(newErrors);
      setIsCreatingCoupon(false);
      return;
    }

    try {
      const userId = getUserId();
      if (!userId) {
        if (onError) {
          onError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }
        setIsCreatingCoupon(false);
        return;
      }

      // Parse values with fallbacks
      const usageLimit = parseInt(createCouponFormData.usageLimit) || 1;
      const discountValue = parseFloat(createCouponFormData.discountValue) || 0;
      
      // Build target audience JSON
      const targetAudience = {
        forAgency: createCouponFormData.forAgency,
        agencyLevels: createCouponFormData.forAgency ? {
          level0: createCouponFormData.agencyLevel0,
          level1: createCouponFormData.agencyLevel1,
          level2: createCouponFormData.agencyLevel2,
          level3: createCouponFormData.agencyLevel3
        } : null,
        forTourist: createCouponFormData.forTourist,
        touristLevels: createCouponFormData.forTourist ? {
          level0: createCouponFormData.touristLevel0,
          level1: createCouponFormData.touristLevel1,
          level2: createCouponFormData.touristLevel2,
          level3: createCouponFormData.touristLevel3
        } : null
      };
      
      const couponData = {
        Code: createCouponFormData.code.trim(),
        Description: createCouponFormData.description.trim() || null,
        DiscountPercent: createCouponFormData.discountType === 'percentage' ? discountValue : null,
        DiscountAmount: createCouponFormData.discountType === 'amount' ? discountValue : null,
        UsageLimit: usageLimit,
        UsageCount: 0,
        IsActive: true,
        StartDate: createCouponFormData.startDate ? new Date(createCouponFormData.startDate).toISOString() : null,
        ExpiryDate: createCouponFormData.expiryDate ? new Date(createCouponFormData.expiryDate).toISOString() : null,
        HostId: userId,
        RequiredLevel: 0,
        TargetAudience: JSON.stringify(targetAudience)
      };

      console.log('📤 Creating coupon with data:', JSON.stringify(couponData, null, 2));
      const response = await axiosInstance.post(API_ENDPOINTS.COUPON, couponData);
      const newCoupon = response.data;

      const updatedCoupons = [...coupons, newCoupon];
      setCoupons(updatedCoupons);
      const filtered = applyCouponFilters(updatedCoupons, couponFilterName, couponFilterStatus, couponSortOrder);
      setFilteredCoupons(filtered);

      if (onSuccess) {
        onSuccess('Coupon đã được tạo thành công!');
      }
      handleCloseCreateCouponModal();
    } catch (err: any) {
      console.error('Error creating coupon:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Validation errors detail:', JSON.stringify(err.response?.data?.errors, null, 2));
      let errorMessage = 'Có lỗi xảy ra khi tạo coupon. Vui lòng thử lại.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.errors) {
          // Handle validation errors
          const errors = err.response.data.errors;
          console.error('Parsed validation errors:', errors);
          errorMessage = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        } else if (err.response.data.title) {
          errorMessage = err.response.data.title;
        }
      }
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleCloseCreateCouponModal = () => {
    setIsCreateCouponModalOpen(false);
    setCreateCouponFormData({ 
      code: '', 
      description: '', 
      discountType: 'percentage', 
      discountValue: '', 
      usageLimit: '', 
      startDate: '', 
      expiryDate: '',
      forAgency: false,
      agencyLevel0: false,
      agencyLevel1: false,
      agencyLevel2: false,
      agencyLevel3: false,
      forTourist: false,
      touristLevel0: false,
      touristLevel1: false,
      touristLevel2: false,
      touristLevel3: false
    });
    setCreateCouponErrors({});
  };

  // Edit Coupon Modal handlers
  const handleOpenEditCouponModal = async (couponId) => {
    setEditingCouponId(couponId);
    setIsEditCouponModalOpen(true);
    setEditCouponErrors({});
    setLoadingEditCouponData(true);

    try {
      // Load coupon from API
      const response = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/${couponId}`);
      const coupon = response.data;
      
      if (coupon) {
        // Helper function to format date without timezone conversion
        const formatDateForInput = (dateStr: string | null | undefined): string => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          // Use local date parts to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        // Parse StartDate - backend returns StartDate
        const startDate = coupon.StartDate || coupon.startDate;
        const startDateValue = formatDateForInput(startDate);
        
        // Parse ExpiryDate - backend returns ExpiryDate (not EndDate)
        const expiryDate = coupon.ExpiryDate || coupon.expiryDate;
        const expiryDateValue = formatDateForInput(expiryDate);
        
        console.log('📥 Loaded coupon data:', { startDate, expiryDate, startDateValue, expiryDateValue });
        
        // Parse target audience
        let targetAudience = { forAgency: false, agencyLevels: null, forTourist: true, touristLevels: { level0: true, level1: false, level2: false, level3: false } };
        try {
          const taStr = coupon.TargetAudience || coupon.targetAudience;
          if (taStr) {
            targetAudience = JSON.parse(taStr);
          }
        } catch (e) {
          console.log('Could not parse TargetAudience, using defaults');
        }
        
        setEditCouponFormData({
          code: coupon.Code || coupon.code || '',
          description: coupon.Description || coupon.description || '',
          discountType: (coupon.DiscountPercent || coupon.discountPercent) !== null && (coupon.DiscountPercent || coupon.discountPercent) !== undefined ? 'percentage' : 'amount',
          discountValue: (coupon.DiscountPercent || coupon.discountPercent) !== null && (coupon.DiscountPercent || coupon.discountPercent) !== undefined 
            ? String(coupon.DiscountPercent || coupon.discountPercent || '')
            : String(coupon.DiscountAmount || coupon.discountAmount || ''),
          usageLimit: String(coupon.UsageLimit || coupon.usageLimit || ''),
          startDate: startDateValue,
          expiryDate: expiryDateValue,
          isActive: coupon.IsActive !== undefined ? coupon.IsActive : (coupon.isActive !== undefined ? coupon.isActive : true),
          forAgency: targetAudience.forAgency || false,
          agencyLevel0: targetAudience.agencyLevels?.level0 ?? true,
          agencyLevel1: targetAudience.agencyLevels?.level1 ?? false,
          agencyLevel2: targetAudience.agencyLevels?.level2 ?? false,
          agencyLevel3: targetAudience.agencyLevels?.level3 ?? false,
          forTourist: targetAudience.forTourist ?? true,
          touristLevel0: targetAudience.touristLevels?.level0 ?? true,
          touristLevel1: targetAudience.touristLevels?.level1 ?? false,
          touristLevel2: targetAudience.touristLevels?.level2 ?? false,
          touristLevel3: targetAudience.touristLevels?.level3 ?? false
        });
      }
    } catch (err) {
      console.error('Error loading coupon:', err);
      if (onError) {
        onError('Không thể tải thông tin coupon. Vui lòng thử lại.');
      }
      setIsEditCouponModalOpen(false);
    } finally {
      setLoadingEditCouponData(false);
    }
  };

  const handleEditCouponInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue;
    
    if (type === 'radio') {
      fieldValue = value;
    } else if (type === 'checkbox') {
      fieldValue = checked;
    } else if (type === 'select-one' && name === 'isActive') {
      fieldValue = value === 'true';
    } else {
      fieldValue = value;
    }
    
    setEditCouponFormData(prev => {
      const newData = { ...prev, [name]: fieldValue };
      
      // Logic: Nếu chọn "Tất cả" (level0) thì bỏ tick các hạng khác
      // Nếu chọn hạng cụ thể (level1/2/3) thì bỏ tick "Tất cả"
      if (type === 'checkbox' && checked) {
        // Agency levels
        if (name === 'agencyLevel0') {
          newData.agencyLevel1 = false;
          newData.agencyLevel2 = false;
          newData.agencyLevel3 = false;
        } else if (['agencyLevel1', 'agencyLevel2', 'agencyLevel3'].includes(name)) {
          newData.agencyLevel0 = false;
        }
        // Tourist levels
        if (name === 'touristLevel0') {
          newData.touristLevel1 = false;
          newData.touristLevel2 = false;
          newData.touristLevel3 = false;
        } else if (['touristLevel1', 'touristLevel2', 'touristLevel3'].includes(name)) {
          newData.touristLevel0 = false;
        }
      }
      
      return newData;
    });

    if (editCouponErrors[name]) {
      setEditCouponErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditCouponField = (name, value) => {
    const config = {
      maxCodeLength: 50,
      maxDescriptionLength: 255,
      maxDiscountPercent: 100,
      minUsageLimit: 1
    };

    switch (name) {
      case 'code':
        if (!value || value.trim() === '') {
          return 'Mã coupon không được để trống';
        }
        if (value.includes(' ')) {
          return 'Mã giảm giá không được có dấu cách.';
        }
        if (value.trim().length > config.maxCodeLength) {
          return `Mã coupon không được vượt quá ${config.maxCodeLength} ký tự`;
        }
        const couponRegex = /^[A-Za-z0-9\-_]+$/;
        if (!couponRegex.test(value.trim())) {
          return 'Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới';
        }
        return '';

      case 'description':
        if (value && value.length > config.maxDescriptionLength) {
          return `Mô tả không được vượt quá ${config.maxDescriptionLength} ký tự`;
        }
        return '';

      case 'discountValue':
        if (!value || value.trim() === '') {
          return editCouponFormData.discountType === 'percentage' 
            ? 'Phần trăm giảm giá không được để trống'
            : 'Số tiền giảm giá không được để trống';
        }
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Giá trị phải là số dương';
        }
        if (editCouponFormData.discountType === 'percentage' && num > config.maxDiscountPercent) {
          return `Phần trăm không được vượt quá ${config.maxDiscountPercent}%`;
        }
        return '';

      case 'usageLimit':
        if (!value || value.trim() === '') {
          return 'Giới hạn sử dụng không được để trống';
        }
        const limit = parseInt(value);
        if (isNaN(limit) || limit < config.minUsageLimit) {
          return `Giới hạn sử dụng phải là số nguyên >= ${config.minUsageLimit}`;
        }
        return '';

      case 'startDate':
        if (!value || value.trim() === '') {
          return 'Ngày bắt đầu không được để trống';
        }
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          return 'Ngày bắt đầu không được là ngày trong quá khứ';
        }
        if (editCouponFormData.expiryDate && editCouponFormData.expiryDate.trim() !== '') {
          const expiryDate = new Date(editCouponFormData.expiryDate);
          if (startDate > expiryDate) {
            return 'Ngày bắt đầu không được sau ngày hết hạn';
          }
        }
        return '';

      case 'expiryDate':
        if (!value || value.trim() === '') {
          return 'Ngày hết hạn không được để trống';
        }
        const selectedDate = new Date(value);
        const todayForExpiry = new Date();
        todayForExpiry.setHours(0, 0, 0, 0);
        if (selectedDate < todayForExpiry) {
          return 'Ngày hết hạn không được là ngày trong quá khứ';
        }
        if (editCouponFormData.startDate && editCouponFormData.startDate.trim() !== '') {
          const startDateForExpiry = new Date(editCouponFormData.startDate);
          if (selectedDate < startDateForExpiry) {
            return 'Ngày hết hạn không được trước ngày bắt đầu';
          }
        }
        return '';

      default:
        return '';
    }
  };

  const handleEditCouponSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditingCoupon || !editingCouponId) return;
    
    setIsEditingCoupon(true);
    setEditCouponErrors({});

    const newErrors: Record<string, string> = {};
    Object.keys(editCouponFormData).forEach(key => {
      if (key !== 'discountType' && key !== 'isActive') {
        const fieldError = validateEditCouponField(key, editCouponFormData[key]);
        if (fieldError) {
          newErrors[key] = fieldError;
        }
      }
    });

    // Validate target audience - phải chọn ít nhất 1 role và 1 hạng
    const hasAgencyLevel = editCouponFormData.forAgency && (
      editCouponFormData.agencyLevel0 || editCouponFormData.agencyLevel1 || 
      editCouponFormData.agencyLevel2 || editCouponFormData.agencyLevel3
    );
    const hasTouristLevel = editCouponFormData.forTourist && (
      editCouponFormData.touristLevel0 || editCouponFormData.touristLevel1 || 
      editCouponFormData.touristLevel2 || editCouponFormData.touristLevel3
    );
    
    if (!hasAgencyLevel && !hasTouristLevel) {
      newErrors['targetAudience'] = 'Vui lòng chọn ít nhất 1 vai trò và 1 hạng';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditCouponErrors(newErrors);
      setIsEditingCoupon(false);
      return;
    }

    try {
      // Build target audience JSON
      const targetAudience = {
        forAgency: editCouponFormData.forAgency,
        agencyLevels: editCouponFormData.forAgency ? {
          level0: editCouponFormData.agencyLevel0,
          level1: editCouponFormData.agencyLevel1,
          level2: editCouponFormData.agencyLevel2,
          level3: editCouponFormData.agencyLevel3
        } : null,
        forTourist: editCouponFormData.forTourist,
        touristLevels: editCouponFormData.forTourist ? {
          level0: editCouponFormData.touristLevel0,
          level1: editCouponFormData.touristLevel1,
          level2: editCouponFormData.touristLevel2,
          level3: editCouponFormData.touristLevel3
        } : null
      };
      
      const couponData = {
        Code: editCouponFormData.code.trim(),
        Description: editCouponFormData.description.trim() || null,
        DiscountPercent: editCouponFormData.discountType === 'percentage' ? parseFloat(editCouponFormData.discountValue) : null,
        DiscountAmount: editCouponFormData.discountType === 'amount' ? parseFloat(editCouponFormData.discountValue) : null,
        UsageLimit: parseInt(editCouponFormData.usageLimit) || 1,
        StartDate: editCouponFormData.startDate ? new Date(editCouponFormData.startDate).toISOString() : null,
        ExpiryDate: editCouponFormData.expiryDate ? new Date(editCouponFormData.expiryDate).toISOString() : null,
        IsActive: editCouponFormData.isActive,
        RequiredLevel: 0,
        TargetAudience: JSON.stringify(targetAudience)
      };

      const response = await axiosInstance.put(`${API_ENDPOINTS.COUPON}/${editingCouponId}`, couponData);
      const updatedCoupon = response.data;

      const updatedCoupons = coupons.map(c => {
        if ((c.Id || c.id) === editingCouponId) {
          return updatedCoupon;
        }
        return c;
      });

      setCoupons(updatedCoupons);
      const filtered = applyCouponFilters(updatedCoupons, couponFilterName, couponFilterStatus, couponSortOrder);
      setFilteredCoupons(filtered);

      if (onSuccess) {
        onSuccess('Coupon đã được cập nhật thành công!');
      }
      handleCloseEditCouponModal();
    } catch (err) {
      console.error('Error updating coupon:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi cập nhật coupon. Vui lòng thử lại.');
      }
    } finally {
      setIsEditingCoupon(false);
    }
  };

  const handleCloseEditCouponModal = () => {
    setIsEditCouponModalOpen(false);
    setEditingCouponId(null);
    setEditCouponFormData({ 
      code: '', 
      description: '', 
      discountType: 'percentage', 
      discountValue: '', 
      usageLimit: '', 
      startDate: '', 
      expiryDate: '', 
      isActive: true,
      forAgency: false,
      agencyLevel0: false,
      agencyLevel1: false,
      agencyLevel2: false,
      agencyLevel3: false,
      forTourist: false,
      touristLevel0: false,
      touristLevel1: false,
      touristLevel2: false,
      touristLevel3: false
    });
    setEditCouponErrors({});
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setIsCreateCouponModalOpen(true);
    },
    openApplyPromotionModal: () => {
      if (onApplyPromotionClick) {
        onApplyPromotionClick();
      }
    },
    getToggleState: () => {
      return showCouponPromotionsList;
    }
  }));

  return (
    <div className="coupon-management">
      <>
              {/* Filter Section */}
              <div className="coupon-coupon-filter-container">
                <div className="coupon-filter-row">
                  <div className="coupon-filter-field">
                    <label htmlFor="coupon-filter-name">Lọc theo mã/ mô tả:</label>
                    <input
                      id="coupon-filter-name"
                      type="text"
                      className="coupon-filter-input"
                      placeholder="Nhập mã coupon hoặc mô tả..."
                      value={couponFilterName}
                      onChange={(e) => setCouponFilterName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCouponSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="coupon-filter-field">
                    <label htmlFor="coupon-filter-status">Trạng thái:</label>
                    <select
                      id="coupon-filter-status"
                      className="coupon-filter-select"
                      value={couponFilterStatus}
                      onChange={(e) => setCouponFilterStatus(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="coupon-active">Khả dụng</option>
                      <option value="expired">Khóa</option>
                    </select>
                  </div>
                  <div className="coupon-filter-field">
                    <label htmlFor="coupon-sort-order">Thứ tự:</label>
                    <select
                      id="coupon-sort-order"
                      className="coupon-filter-select"
                      value={couponSortOrder}
                      onChange={(e) => {
                        setCouponSortOrder(e.target.value);
                        const filtered = applyCouponFilters(coupons, couponFilterName, couponFilterStatus, e.target.value);
                        setFilteredCoupons(filtered);
                        setCouponCurrentPage(1);
                      }}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                    </select>
                  </div>
                  <button className="coupon-btn-search" onClick={handleCouponSearch}>
                    Tìm kiếm
                  </button>
                </div>
              </div>

              {/* Coupons List */}
              {filteredCoupons.length === 0 ? (
                <div className="coupon-empty-state">
                  <GridIcon className="coupon-empty-state-icon" />
                  <h3>Chưa có coupon nào</h3>
                  <p>Bạn chưa tạo coupon nào. Hãy tạo coupon mới để bắt đầu!</p>
                  <Button variant="default" onClick={() => setIsCreateCouponModalOpen(true)}>
                    Tạo coupon mới
                  </Button>
                </div>
              ) : (
                <>
                  <div className="coupon-coupons-table-container">
                    <table className="coupon-coupons-table">
                      <thead>
                        <tr>
                          <th>Mã giảm giá</th>
                          <th>Mô tả</th>
                          <th>Giảm</th>
                          <th>Thời hạn</th>
                          <th>Trạng thái</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalPages = Math.ceil(filteredCoupons.length / couponItemsPerPage);
                          const startIndex = (couponCurrentPage - 1) * couponItemsPerPage;
                          const endIndex = startIndex + couponItemsPerPage;
                          const currentPageCoupons = filteredCoupons.slice(startIndex, endIndex);
                          
                          if (currentPageCoupons.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="coupon-empty-state-cell">
                                  <div className="coupon-empty-state">
                                    <GridIcon className="coupon-empty-state-icon" />
                                    <h3>Chưa có coupon nào</h3>
                                    <p>Bạn chưa tạo coupon nào. Hãy tạo coupon mới để bắt đầu!</p>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                          
                          return currentPageCoupons.map(coupon => {
                            const statusDisplay = getCouponStatusDisplay(coupon.IsActive || coupon.isActive);
                            
                            return (
                              <tr key={coupon.Id || coupon.id}>
                                <td className="coupon-coupon-code-cell">
                                  <strong>{coupon.Code || coupon.code}</strong>
                                </td>
                                <td className="coupon-coupon-description-cell">
                                  {coupon.Description || coupon.description || 'Không có'}
                                </td>
                                <td className="coupon-coupon-discount-cell">
                                  {formatDiscount(coupon)}
                                </td>
                                <td className="coupon-coupon-date-cell">
                                  {formatDateRange(coupon)}
                                </td>
                                <td className="coupon-coupon-status-cell">
                                  <Badge className={`coupon-status-badge ${statusDisplay.className}`}>
                                    {statusDisplay.text}
                                  </Badge>
                                </td>
                                <td className="coupon-coupon-actions-cell">
                                  <div className="coupon-coupon-table-actions">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="btn-edit-service"
                                      onClick={() => handleOpenEditCouponModal(coupon.Id || coupon.id)}
                                    >
                                      Sửa
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="cancel-booking-btn"
                                      onClick={() => handleOpenDeleteCouponModal(coupon.Id || coupon.id, coupon.Code || coupon.code)}
                                    >
                                      Xóa
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {(() => {
                    const totalPages = Math.ceil(filteredCoupons.length / couponItemsPerPage);
                    if (totalPages <= 1) return null;

                    return (
                      <div className="coupon-pagination">
                        <button
                          type="button"
                          className="coupon-pagination-btn"
                          onClick={() => {
                            const newPage = Math.max(1, couponCurrentPage - 1);
                            setCouponCurrentPage(newPage);
                            setCouponPageInput('');
                          }}
                          disabled={couponCurrentPage === 1}
                        >
                          <span>←</span> Trước
                        </button>
                        
                        <div className="coupon-pagination-controls">
                          <div className="coupon-pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                className={`coupon-pagination-number ${couponCurrentPage === page ? 'coupon-active' : ''}`}
                                onClick={() => {
                                  setCouponCurrentPage(page);
                                  setCouponPageInput('');
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
                            value={couponPageInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setCouponPageInput(value);
                                const pageNum = parseInt(value);
                                if (value !== '' && pageNum >= 1 && pageNum <= totalPages) {
                                  setCouponCurrentPage(pageNum);
                                  setCouponPageInput('');
                                }
                              }
                            }}
                            placeholder={couponCurrentPage.toString()}
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
                          className="coupon-pagination-btn"
                          onClick={() => {
                            const newPage = Math.min(totalPages, couponCurrentPage + 1);
                            setCouponCurrentPage(newPage);
                            setCouponPageInput('');
                          }}
                          disabled={couponCurrentPage === totalPages}
                        >
                          Sau <span>→</span>
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}

          {/* Create Coupon Modal */}
          <CreateCouponModal
            isOpen={isCreateCouponModalOpen}
            onClose={handleCloseCreateCouponModal}
            formData={createCouponFormData as any}
            errors={createCouponErrors}
            isSubmitting={isCreatingCoupon}
            onInputChange={handleCreateCouponInputChange}
            onSubmit={handleCreateCouponSubmit}
          />

          {/* Edit Coupon Modal */}
          <EditCouponModal
            isOpen={isEditCouponModalOpen}
            onClose={handleCloseEditCouponModal}
            loading={loadingEditCouponData}
            formData={editCouponFormData as any}
            errors={editCouponErrors as Record<string, string>}
            isSubmitting={isEditingCoupon}
            onInputChange={handleEditCouponInputChange}
            onSubmit={handleEditCouponSubmit}
          />

          {/* Delete Confirm Modal */}
          {isDeleteCouponModalOpen && (
            <div className="coupon-modal-overlay" onClick={handleCloseDeleteCouponModal}>
              <div className="coupon-delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="coupon-delete-modal-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="coupon-delete-modal-title">Xác nhận xóa coupon</h3>
                <p className="coupon-delete-modal-message">
                  Bạn có chắc chắn muốn xóa coupon <strong>"{deletingCouponCode}"</strong>?
                </p>
                <p className="coupon-delete-modal-warning">
                  Hành động này không thể hoàn tác.
                </p>
                <div className="coupon-delete-modal-actions">
                  <button
                    type="button"
                    className="coupon-delete-modal-btn coupon-delete-modal-btn-cancel"
                    onClick={handleCloseDeleteCouponModal}
                    disabled={isDeletingCoupon}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="coupon-delete-modal-btn coupon-delete-modal-btn-confirm"
                    onClick={handleConfirmDeleteCoupon}
                    disabled={isDeletingCoupon}
                  >
                    {isDeletingCoupon ? 'Đang xóa...' : 'Xóa coupon'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
    </div>
  );
});

CouponManagement.displayName = 'CouponManagement';

export default CouponManagement;





