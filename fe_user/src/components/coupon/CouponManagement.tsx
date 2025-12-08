import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon, AlertCircleIcon } from '../icons/index';
import CreateCouponModal from './CreateCouponModal';
import EditCouponModal from './EditCouponModal';
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
  // Hardcoded sample coupon data for testing
  const [sampleCoupons] = useState([
    {
      Id: 1001,
      Code: 'SPRING2025',
      Description: 'Giảm 10% cho đơn từ 200k',
      DiscountPercent: 10,
      DiscountAmount: null,
      UsageLimit: 500,
      UsageCount: 0,
      IsActive: true,
      CreatedAt: new Date('2024-12-15').toISOString(),
      StartDate: new Date('2025-03-01').toISOString(),
      EndDate: new Date('2025-03-31').toISOString()
    },
    {
      Id: 1002,
      Code: 'SUMMER50',
      Description: 'Ưu đãi mùa hè - Giảm 50% cho tất cả dịch vụ du lịch',
      DiscountPercent: 50,
      DiscountAmount: null,
      UsageLimit: 200,
      UsageCount: 45,
      IsActive: true,
      CreatedAt: new Date('2024-11-20').toISOString(),
      StartDate: new Date('2025-06-01').toISOString(),
      EndDate: new Date('2025-08-31').toISOString()
    },
    {
      Id: 1003,
      Code: 'VIP100K',
      Description: 'Coupon VIP - Giảm 100.000 VND cho đơn hàng từ 500.000 VND',
      DiscountPercent: null,
      DiscountAmount: 100000,
      UsageLimit: 1000,
      UsageCount: 234,
      IsActive: true,
      CreatedAt: new Date('2024-10-10').toISOString(),
      StartDate: new Date('2025-01-01').toISOString(),
      EndDate: new Date('2025-12-31').toISOString()
    },
    {
      Id: 1004,
      Code: 'WEEKEND30',
      Description: 'Giảm giá cuối tuần - Áp dụng cho đơn hàng đặt vào thứ 7 và chủ nhật',
      DiscountPercent: 30,
      DiscountAmount: null,
      UsageLimit: 300,
      UsageCount: 89,
      IsActive: false,
      CreatedAt: new Date('2024-09-05').toISOString(),
      StartDate: new Date('2025-01-01').toISOString(),
      EndDate: new Date('2025-12-31').toISOString()
    },
    {
      Id: 1005,
      Code: 'FIRSTTIME15',
      Description: 'Giảm giá cho khách hàng lần đầu - Giảm 15% cho đơn hàng đầu tiên',
      DiscountPercent: 15,
      DiscountAmount: null,
      UsageLimit: 800,
      UsageCount: 156,
      IsActive: true,
      CreatedAt: new Date('2024-12-01').toISOString(),
      StartDate: new Date('2025-02-01').toISOString(),
      EndDate: new Date('2025-02-28').toISOString()
    },
    {
      Id: 1006,
      Code: 'BIGSALE200K',
      Description: 'Sale lớn - Giảm 200.000 VND cho đơn hàng từ 1.000.000 VND trở lên',
      DiscountPercent: null,
      DiscountAmount: 200000,
      UsageLimit: 150,
      UsageCount: 67,
      IsActive: true,
      CreatedAt: new Date('2024-11-25').toISOString(),
      StartDate: new Date('2025-04-01').toISOString(),
      EndDate: new Date('2025-04-30').toISOString()
    },
    {
      Id: 1007,
      Code: 'LOYALTY20',
      Description: 'Coupon trung thành - Giảm 20% cho khách hàng đã sử dụng dịch vụ trên 5 lần',
      DiscountPercent: 20,
      DiscountAmount: null,
      UsageLimit: 400,
      UsageCount: 123,
      IsActive: true,
      CreatedAt: new Date('2024-10-20').toISOString(),
      StartDate: new Date('2025-01-01').toISOString(),
      EndDate: new Date('2025-06-30').toISOString()
    },
    {
      Id: 1008,
      Code: 'EARLYBIRD10',
      Description: 'Giảm giá sớm - Giảm 10% cho đơn hàng đặt trước 14 ngày',
      DiscountPercent: 10,
      DiscountAmount: null,
      UsageLimit: 600,
      UsageCount: 201,
      IsActive: true,
      CreatedAt: new Date('2024-08-15').toISOString(),
      StartDate: new Date('2025-05-01').toISOString(),
      EndDate: new Date('2025-05-31').toISOString()
    }
  ]);

  // Coupon Rank Rules states
  const [couponRankRules, setCouponRankRules] = useState([
    { RuleID: 1, CouponID: 1001, RankID: 'Vàng', UserType: 'Khách hàng', CouponCode: 'SPRING2025' },
    { RuleID: 2, CouponID: 1002, RankID: 'Bạc', UserType: 'Công ty', CouponCode: 'SUMMER50' },
    { RuleID: 3, CouponID: 1003, RankID: 'Vàng', UserType: 'Khách hàng', CouponCode: 'VIP100K' },
    { RuleID: 4, CouponID: 1004, RankID: 'Tất cả', UserType: 'Công ty', CouponCode: 'WEEKEND30' },
    { RuleID: 5, CouponID: 1005, RankID: 'Đồng', UserType: 'Khách hàng', CouponCode: 'FIRSTTIME15' },
    { RuleID: 6, CouponID: 1006, RankID: 'Vàng', UserType: 'Công ty', CouponCode: 'BIGSALE200K' },
    { RuleID: 7, CouponID: 1007, RankID: 'Bạc', UserType: 'Khách hàng', CouponCode: 'LOYALTY20' },
    { RuleID: 8, CouponID: 1008, RankID: 'Tất cả', UserType: 'Công ty', CouponCode: 'EARLYBIRD10' }
  ]);

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
    expiryDate: ''
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
    isActive: true
  });
  const [editCouponErrors, setEditCouponErrors] = useState<{ code?: string; description?: string; discountType?: string; discountValue?: string; usageLimit?: string; startDate?: string; expiryDate?: string; isActive?: boolean }>({});
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);

  // Load initial mock data
  useEffect(() => {
    setCoupons(sampleCoupons);
    const filtered = applyCouponFilters(sampleCoupons, couponFilterName, couponFilterStatus, couponSortOrder);
    setFilteredCoupons(filtered);
  }, []);

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
        
        if (statusFilter === 'active') {
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

  // Handle delete coupon
  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa coupon này?')) {
      try {
        // Mock delete - just remove from state
        setCoupons(prevCoupons => prevCoupons.filter(c => (c.Id || c.id) !== couponId));
        setFilteredCoupons(prevFiltered => prevFiltered.filter(c => (c.Id || c.id) !== couponId));
        if (onSuccess) {
          onSuccess('Coupon đã được xóa thành công!');
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        if (onError) {
          onError('Có lỗi xảy ra khi xóa coupon. Vui lòng thử lại.');
        }
      }
    }
  };

  // Helper functions
  const getCouponStatusDisplay = (isActive) => {
    if (isActive === true || isActive === 1 || isActive === 'true' || isActive === '1') {
      return { text: 'Hoạt động', className: 'status-confirmed' };
    } else {
      return { text: 'Hết hạn', className: 'status-expired' };
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
    const { name, value, type } = e.target;
    let fieldValue = value;
    
    if (type === 'radio') {
      fieldValue = value;
    }
    
    setCreateCouponFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

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

    const newErrors = {};
    Object.keys(createCouponFormData).forEach(key => {
      if (key !== 'discountType') {
        const error = validateCreateCouponField(key, createCouponFormData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setCreateCouponErrors(newErrors);
      setIsCreatingCoupon(false);
      return;
    }

    // Mock create - add to state
    const newCoupon = {
      Id: Math.max(...sampleCoupons.map(c => c.Id), 0) + 1,
      Code: createCouponFormData.code.trim(),
      Description: createCouponFormData.description.trim() || null,
      DiscountPercent: createCouponFormData.discountType === 'percentage' ? parseFloat(createCouponFormData.discountValue) : null,
      DiscountAmount: createCouponFormData.discountType === 'amount' ? parseFloat(createCouponFormData.discountValue) : null,
      UsageLimit: parseInt(createCouponFormData.usageLimit),
      UsageCount: 0,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
      StartDate: createCouponFormData.startDate ? new Date(createCouponFormData.startDate).toISOString() : null,
      EndDate: createCouponFormData.expiryDate ? new Date(createCouponFormData.expiryDate).toISOString() : null
    };

    const updatedCoupons = [...coupons, newCoupon];
    setCoupons(updatedCoupons);
    const filtered = applyCouponFilters(updatedCoupons, couponFilterName, couponFilterStatus, couponSortOrder);
    setFilteredCoupons(filtered);

    if (onSuccess) {
      onSuccess('Coupon đã được tạo thành công!');
    }
    handleCloseCreateCouponModal();
    setIsCreatingCoupon(false);
  };

  const handleCloseCreateCouponModal = () => {
    setIsCreateCouponModalOpen(false);
    setCreateCouponFormData({ code: '', description: '', discountType: 'percentage', discountValue: '', usageLimit: '', startDate: '', expiryDate: '' });
    setCreateCouponErrors({});
  };

  // Edit Coupon Modal handlers
  const handleOpenEditCouponModal = async (couponId) => {
    setEditingCouponId(couponId);
    setIsEditCouponModalOpen(true);
    setEditCouponErrors({});

    // Mock load - get from state
    const coupon = coupons.find(c => (c.Id || c.id) === couponId);
    if (coupon) {
      const startDate = coupon.StartDate || coupon.startDate;
      const startDateValue = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDate = coupon.EndDate || coupon.endDate;
      const expiryDateValue = endDate ? new Date(endDate).toISOString().split('T')[0] : '';
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
        isActive: coupon.IsActive !== undefined ? coupon.IsActive : (coupon.isActive !== undefined ? coupon.isActive : true)
      });
    }
  };

  const handleEditCouponInputChange = (e) => {
    const { name, value, type } = e.target;
    let fieldValue;
    
    if (type === 'radio') {
      fieldValue = value;
    } else if (type === 'select-one' && name === 'isActive') {
      fieldValue = value === 'true';
    } else {
      fieldValue = value;
    }
    
    setEditCouponFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

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

    const newErrors = {};
    Object.keys(editCouponFormData).forEach(key => {
      if (key !== 'discountType' && key !== 'isActive') {
        const error = validateEditCouponField(key, editCouponFormData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setEditCouponErrors(newErrors);
      setIsEditingCoupon(false);
      return;
    }

    // Mock update - update in state
    const updatedCoupons = coupons.map(c => {
      if ((c.Id || c.id) === editingCouponId) {
        return {
          ...c,
          Code: editCouponFormData.code.trim(),
          Description: editCouponFormData.description.trim() || null,
          DiscountPercent: editCouponFormData.discountType === 'percentage' ? parseFloat(editCouponFormData.discountValue) : null,
          DiscountAmount: editCouponFormData.discountType === 'amount' ? parseFloat(editCouponFormData.discountValue) : null,
          UsageLimit: parseInt(editCouponFormData.usageLimit),
          StartDate: editCouponFormData.startDate ? new Date(editCouponFormData.startDate).toISOString() : null,
          EndDate: editCouponFormData.expiryDate ? new Date(editCouponFormData.expiryDate).toISOString() : null,
          IsActive: editCouponFormData.isActive
        };
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
    setIsEditingCoupon(false);
  };

  const handleCloseEditCouponModal = () => {
    setIsEditCouponModalOpen(false);
    setEditingCouponId(null);
    setEditCouponFormData({ code: '', description: '', discountType: 'percentage', discountValue: '', usageLimit: '', startDate: '', expiryDate: '', isActive: true });
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
          {/* Toggle Buttons */}
          <div className="coupon-toggle-buttons">
            <button
              className={`toggle-btn ${!showCouponPromotionsList ? 'active' : ''}`}
              onClick={() => {
                setShowCouponPromotionsList(false);
                if (onToggleChange) {
                  onToggleChange(false);
                }
              }}
            >
              Danh sách mã giảm giá
            </button>
            <button
              className={`toggle-btn ${showCouponPromotionsList ? 'active' : ''}`}
              onClick={() => {
                setShowCouponPromotionsList(true);
                if (onToggleChange) {
                  onToggleChange(true);
                }
              }}
            >
              Danh sách ưu đãi
            </button>
          </div>

          {!showCouponPromotionsList ? (
            <>
              {/* Filter Section */}
              <div className="coupon-filter-container">
                <div className="filter-row">
                  <div className="filter-field">
                    <label htmlFor="coupon-filter-name">Lọc theo mã/ mô tả:</label>
                    <input
                      id="coupon-filter-name"
                      type="text"
                      className="filter-input"
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
                  <div className="filter-field">
                    <label htmlFor="coupon-filter-status">Trạng thái:</label>
                    <select
                      id="coupon-filter-status"
                      className="filter-select"
                      value={couponFilterStatus}
                      onChange={(e) => setCouponFilterStatus(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                  <div className="filter-field">
                    <label htmlFor="coupon-sort-order">Thứ tự:</label>
                    <select
                      id="coupon-sort-order"
                      className="filter-select"
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
                  <button className="btn-search" onClick={handleCouponSearch}>
                    Tìm kiếm
                  </button>
                </div>
              </div>

              {/* Coupons List */}
              {filteredCoupons.length === 0 ? (
                <div className="empty-state">
                  <GridIcon className="empty-state-icon" />
                  <h3>Chưa có coupon nào</h3>
                  <p>Bạn chưa tạo coupon nào. Hãy tạo coupon mới để bắt đầu!</p>
                  <Button variant="default" onClick={() => setIsCreateCouponModalOpen(true)}>
                    Tạo coupon mới
                  </Button>
                </div>
              ) : (
                <>
                  <div className="coupons-table-container">
                    <table className="coupons-table">
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
                                <td colSpan={6} className="empty-state-cell">
                                  <div className="empty-state">
                                    <GridIcon className="empty-state-icon" />
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
                                <td className="coupon-code-cell">
                                  <strong>{coupon.Code || coupon.code}</strong>
                                </td>
                                <td className="coupon-description-cell">
                                  {coupon.Description || coupon.description || 'Không có'}
                                </td>
                                <td className="coupon-discount-cell">
                                  {formatDiscount(coupon)}
                                </td>
                                <td className="coupon-date-cell">
                                  {formatDateRange(coupon)}
                                </td>
                                <td className="coupon-status-cell">
                                  <Badge className={`status-badge ${statusDisplay.className}`}>
                                    {statusDisplay.text}
                                  </Badge>
                                </td>
                                <td className="coupon-actions-cell">
                                  <div className="coupon-table-actions">
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
                                      onClick={() => handleDeleteCoupon(coupon.Id || coupon.id)}
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
                      <div className="pagination">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => {
                            const newPage = Math.max(1, couponCurrentPage - 1);
                            setCouponCurrentPage(newPage);
                            setCouponPageInput('');
                          }}
                          disabled={couponCurrentPage === 1}
                        >
                          <span>←</span> Trước
                        </button>
                        
                        <div className="pagination-controls">
                          <div className="pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                className={`pagination-number ${couponCurrentPage === page ? 'active' : ''}`}
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
                          className="pagination-btn"
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
            </>
          ) : (
            /* Promotions List in Coupon Tab */
            <div className="promotions-list">
              {couponRankRules.length === 0 ? (
                <div className="empty-state">
                  <GridIcon className="empty-state-icon" />
                  <h3>Chưa có ưu đãi nào</h3>
                  <p>Bạn chưa áp dụng ưu đãi cho coupon nào. Hãy tạo ưu đãi mới để bắt đầu!</p>
                  {onApplyPromotionClick && (
                    <Button variant="default" onClick={onApplyPromotionClick}>
                      Áp dụng ưu đãi
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="promotions-table">
                    <table className="promotions-table-content">
                      <thead>
                        <tr>
                          <th>Mã giảm giá</th>
                          <th>Hạng</th>
                          <th>Loại người dùng</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalPages = Math.ceil(couponRankRules.length / couponPromotionItemsPerPage);
                          const startIndex = (couponPromotionCurrentPage - 1) * couponPromotionItemsPerPage;
                          const endIndex = startIndex + couponPromotionItemsPerPage;
                          const currentPageData = couponRankRules.slice(startIndex, endIndex);
                          
                          return currentPageData.map((rule: any) => {
                            const couponId = rule.CouponID || rule.couponId;
                            const coupon = coupons.find(c => (c.Id || c.id) === couponId);
                            const rankId = rule.RankID || rule.rankId || '';
                            const userType = rule.UserType || rule.userType || '';
                            const ruleId = rule.RuleID || rule.ruleId || rule.id;
                            const couponCode = rule.CouponCode || (coupon ? (coupon.Code || coupon.code) : `Mã giảm giá ID: ${couponId}`);
                            
                            return (
                              <tr key={ruleId}>
                                <td className="service-name-cell">
                                  <span className="service-name-text" title={couponCode}>
                                    {couponCode}
                                  </span>
                                </td>
                                <td>
                                  <span className={`rank-badge rank-${rankId.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {rankId || 'Không có'}
                                  </span>
                                </td>
                                <td className="user-type-cell">
                                  {userType || 'Không có'}
                                </td>
                                <td>
                                  <button
                                    className="btn-delete-rule"
                                    onClick={() => {
                                      setCouponRankRules(prev => prev.filter((r: any) => (r.RuleID || r.ruleId || r.id) !== ruleId));
                                      const newTotalPages = Math.ceil((couponRankRules.length - 1) / couponPromotionItemsPerPage);
                                      if (couponPromotionCurrentPage > newTotalPages && newTotalPages > 0) {
                                        setCouponPromotionCurrentPage(newTotalPages);
                                      }
                                    }}
                                  >
                                    Xóa
                                  </button>
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
                    const totalPages = Math.ceil(couponRankRules.length / couponPromotionItemsPerPage);
                    if (totalPages <= 1) return null;
                    
                    return (
                      <div className="pagination">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => {
                            const newPage = Math.max(1, couponPromotionCurrentPage - 1);
                            setCouponPromotionCurrentPage(newPage);
                            setCouponPromotionPageInput('');
                          }}
                          disabled={couponPromotionCurrentPage === 1}
                        >
                          <span>←</span> Trước
                        </button>
                        
                        <div className="pagination-controls">
                          <div className="pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                className={`pagination-number ${couponPromotionCurrentPage === page ? 'active' : ''}`}
                                onClick={() => {
                                  setCouponPromotionCurrentPage(page);
                                  setCouponPromotionPageInput('');
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
                            value={couponPromotionPageInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setCouponPromotionPageInput(value);
                                const pageNum = parseInt(value);
                                if (value !== '' && pageNum >= 1 && pageNum <= totalPages) {
                                  setCouponPromotionCurrentPage(pageNum);
                                  setCouponPromotionPageInput('');
                                }
                              }
                            }}
                            placeholder={couponPromotionCurrentPage.toString()}
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
                            const newPage = Math.min(totalPages, couponPromotionCurrentPage + 1);
                            setCouponPromotionCurrentPage(newPage);
                            setCouponPromotionPageInput('');
                          }}
                          disabled={couponPromotionCurrentPage === totalPages}
                        >
                          Sau <span>→</span>
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Create Coupon Modal */}
          <CreateCouponModal
            isOpen={isCreateCouponModalOpen}
            onClose={handleCloseCreateCouponModal}
            formData={createCouponFormData as { code: string; description: string; discountType: 'percentage' | 'amount'; discountValue: string; usageLimit: string; startDate: string; expiryDate: string }}
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
            formData={editCouponFormData as { code: string; description: string; discountType: 'percentage' | 'amount'; discountValue: string; usageLimit: string; startDate: string; expiryDate: string; isActive: boolean }}
            errors={editCouponErrors as Record<string, string>}
            isSubmitting={isEditingCoupon}
            onInputChange={handleEditCouponInputChange}
            onSubmit={handleEditCouponSubmit}
          />
        </>
    </div>
  );
});

CouponManagement.displayName = 'CouponManagement';

export default CouponManagement;
