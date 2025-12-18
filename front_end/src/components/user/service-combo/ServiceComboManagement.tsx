import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import CreateServiceComboModal from './CreateServiceComboModal';
import EditServiceComboModal from './EditServiceComboModal';
import axiosInstance from '~/utils/axiosInstance';
import { API_BASE_URL, API_ENDPOINTS } from '~/config/api';
import { uploadImageToFirebase, deleteImageFromFirebase } from '~/services/firebaseStorage';
import './ServiceComboManagement.css';

interface ServiceComboManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface ServiceComboManagementRef {
  openCreateModal: () => void;
}

const ServiceComboManagement = forwardRef<ServiceComboManagementRef, ServiceComboManagementProps>(({ onSuccess, onError }, ref) => {
  // Service Combos state
  const [serviceCombos, setServiceCombos] = useState([]);
  const [filteredServiceCombos, setFilteredServiceCombos] = useState([]);
  const [loadingServiceCombos, setLoadingServiceCombos] = useState(false);
  const [serviceComboFilterName, setServiceComboFilterName] = useState('');
  const [serviceComboFilterStatus, setServiceComboFilterStatus] = useState('all');
  const [serviceComboSortOrder, setServiceComboSortOrder] = useState('newest');
  const [serviceComboCurrentPage, setServiceComboCurrentPage] = useState(1);
  const [serviceComboPageInput, setServiceComboPageInput] = useState('');
  const [serviceComboItemsPerPage] = useState(5);
  
  // Create Service Combo Modal states
  const [isCreateServiceComboModalOpen, setIsCreateServiceComboModalOpen] = useState(false);
  const [createServiceComboFormData, setCreateServiceComboFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    availableSlots: '',
    status: 'open',
    cancellationPolicy: '',
    images: [] as File[],
  });
  const [createServiceComboErrors, setCreateServiceComboErrors] = useState({});
  const [isCreatingServiceCombo, setIsCreatingServiceCombo] = useState(false);
  const [createServiceComboImagePreviews, setCreateServiceComboImagePreviews] = useState<string[]>([]);
  const [createServiceComboSelectedServices, setCreateServiceComboSelectedServices] = useState({});
  const [createServiceComboAllServices, setCreateServiceComboAllServices] = useState([]);
  const [createServiceComboServicesPage, setCreateServiceComboServicesPage] = useState(1);
  const createServiceComboServicesPerPage = 10;
  const [createServiceComboServicesPageInput, setCreateServiceComboServicesPageInput] = useState('');
  const [createServiceComboServiceFilterName, setCreateServiceComboServiceFilterName] = useState('');
  const [createServiceComboServiceFilterPrice, setCreateServiceComboServiceFilterPrice] = useState('');
  const [createServiceComboSelectedPromotions, setCreateServiceComboSelectedPromotions] = useState({});
  const [createServiceComboAllPromotions, setCreateServiceComboAllPromotions] = useState([]);
  const [createServiceComboPromotionsPage, setCreateServiceComboPromotionsPage] = useState(1);
  const [createServiceComboPromotionsPerPage] = useState(10);
  const [createServiceComboPromotionsPageInput, setCreateServiceComboPromotionsPageInput] = useState('');
  const [isPromotionsTableOpen, setIsPromotionsTableOpen] = useState(false);
  const [isServicesTableOpen, setIsServicesTableOpen] = useState(true);
  const [isCouponsTableOpen, setIsCouponsTableOpen] = useState(false);
  const [createServiceComboPromotionFilterName, setCreateServiceComboPromotionFilterName] = useState('');
  const [createServiceComboPromotionFilterRank, setCreateServiceComboPromotionFilterRank] = useState('all');
  const [createServiceComboSelectedCoupons, setCreateServiceComboSelectedCoupons] = useState({});
  const [createServiceComboAllCoupons, setCreateServiceComboAllCoupons] = useState([]);
  const [createServiceComboCouponsPage, setCreateServiceComboCouponsPage] = useState(1);
  const [createServiceComboCouponsPerPage] = useState(10);
  const [createServiceComboCouponsPageInput, setCreateServiceComboCouponsPageInput] = useState('');
  const [createServiceComboCouponFilterCode, setCreateServiceComboCouponFilterCode] = useState('');
  const [createServiceComboCouponFilterRank, setCreateServiceComboCouponFilterRank] = useState('all');
  const [createServiceComboCouponFilterUserType, setCreateServiceComboCouponFilterUserType] = useState('all');
  
  // Edit Service Combo Modal states
  const [isEditServiceComboModalOpen, setIsEditServiceComboModalOpen] = useState(false);
  const [editingServiceComboId, setEditingServiceComboId] = useState(null);
  const [loadingEditServiceComboData, setLoadingEditServiceComboData] = useState(false);
  const [editServiceComboFormData, setEditServiceComboFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    availableSlots: '',
    status: 'open',
    cancellationPolicy: '',
    images: [] as (File | string)[],
  });
  const [editServiceComboErrors, setEditServiceComboErrors] = useState({});
  const [isEditingServiceCombo, setIsEditingServiceCombo] = useState(false);
  const [editServiceComboImagePreviews, setEditServiceComboImagePreviews] = useState<string[]>([]);
  const [oldImageUrlsToDelete, setOldImageUrlsToDelete] = useState<string[]>([]); // Track ảnh cũ cần xóa khỏi Firebase
  const [editServiceComboSelectedServices, setEditServiceComboSelectedServices] = useState({});
  const [editServiceComboAllServices, setEditServiceComboAllServices] = useState([]);
  const [editServiceComboServicesPage, setEditServiceComboServicesPage] = useState(1);
  const editServiceComboServicesPerPage = 10;
  const [editServiceComboServicesPageInput, setEditServiceComboServicesPageInput] = useState('');
  const [editServiceComboServiceFilterName, setEditServiceComboServiceFilterName] = useState('');
  const [editServiceComboServiceFilterPrice, setEditServiceComboServiceFilterPrice] = useState('');
  const [editServiceComboSelectedPromotions, setEditServiceComboSelectedPromotions] = useState({});
  const [editServiceComboAllPromotions, setEditServiceComboAllPromotions] = useState([]);
  const [editServiceComboPromotionsPage, setEditServiceComboPromotionsPage] = useState(1);
  const [editServiceComboPromotionsPerPage] = useState(10);
  const [editServiceComboPromotionsPageInput, setEditServiceComboPromotionsPageInput] = useState('');
  const [editServiceComboPromotionFilterName, setEditServiceComboPromotionFilterName] = useState('');
  const [editServiceComboPromotionFilterRank, setEditServiceComboPromotionFilterRank] = useState('all');
  const [editServiceComboSelectedCoupons, setEditServiceComboSelectedCoupons] = useState({});
  const [editServiceComboAllCoupons, setEditServiceComboAllCoupons] = useState([]);
  const [editServiceComboCouponsPage, setEditServiceComboCouponsPage] = useState(1);
  const [editServiceComboCouponsPerPage] = useState(10);
  const [editServiceComboCouponsPageInput, setEditServiceComboCouponsPageInput] = useState('');
  const [editServiceComboCouponFilterCode, setEditServiceComboCouponFilterCode] = useState('');
  const [editServiceComboCouponFilterRank, setEditServiceComboCouponFilterRank] = useState('all');
  const [editServiceComboCouponFilterUserType, setEditServiceComboCouponFilterUserType] = useState('all');
  const [isEditServicesTableOpen, setIsEditServicesTableOpen] = useState(true);
  const [isEditPromotionsTableOpen, setIsEditPromotionsTableOpen] = useState(false);
  const [isEditCouponsTableOpen, setIsEditCouponsTableOpen] = useState(false);
  
  // Confirmation modal states
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [pendingEditComboId, setPendingEditComboId] = useState<number | null>(null);
  const [pendingDeleteComboId, setPendingDeleteComboId] = useState<number | null>(null);
  const [pendingDeleteComboName, setPendingDeleteComboName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const DEFAULT_IMAGE_URL = '/img/banahills.jpg';

  // Enrich coupons: /Coupon/host/{id} sometimes returns a slim shape (missing RequiredLevel/TargetAudience).
  // Option B: fetch each coupon detail via /Coupon/{id} and merge extra fields.
  const enrichCouponsWithDetails = useCallback(async (coupons: any[]) => {
    if (!Array.isArray(coupons) || coupons.length === 0) return [];

    const tasks = coupons.map(async (c) => {
      const id = c?.Id ?? c?.id;
      if (!id) return c;

      // If fields are already present, don't refetch
      const hasRequiredLevel = c?.RequiredLevel !== undefined || c?.requiredLevel !== undefined;
      const hasTargetAudience = c?.TargetAudience !== undefined || c?.targetAudience !== undefined;
      if (hasRequiredLevel || hasTargetAudience) return c;

      try {
        const detailRes = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/${id}`);
        const detail = detailRes?.data;
        if (!detail) return c;
        return { ...c, ...detail };
      } catch (e) {
        // Non-fatal: keep original coupon
        return c;
      }
    });

    return await Promise.all(tasks);
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
  
  // Filter and sort function for service combos
  const applyServiceComboFilters = useCallback((comboList, nameFilter, statusFilter, order) => {
    if (!Array.isArray(comboList) || comboList.length === 0) {
      return [];
    }
    
    let filtered = [...comboList];

    // Filter by name
    if (nameFilter && nameFilter.trim() !== '') {
      filtered = filtered.filter(s => {
        const name = (s.Name || s.name || '').toLowerCase();
        return name.includes(nameFilter.toLowerCase().trim());
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        const status = (s.Status || s.status || '').toLowerCase();
        const statusMap = {
          'open': ['mở', 'open'],
          'closed': ['đóng', 'closed'],
          'canceled': ['đã hủy', 'canceled']
        };
        const statusOptions = statusMap[statusFilter] || [];
        return statusOptions.some(opt => status === opt);
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.CreatedAt || a.createdAt || 0);
      const dateB = new Date(b.CreatedAt || b.createdAt || 0);
      return order === 'newest' ? (dateB as any) - (dateA as any) : (dateA as any) - (dateB as any);
    });

    return filtered;
  }, []);

  // Load service combos from API
  useEffect(() => {
    const loadServiceCombos = async () => {
      try {
        setLoadingServiceCombos(true);
        const userId = getUserId();
        console.log('[ServiceComboManagement] Loading combos for userId:', userId);
        if (!userId) {
          console.log('[ServiceComboManagement] No userId found');
          setServiceCombos([]);
          setLoadingServiceCombos(false);
          return;
        }

        // Get service combos for host
        const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${userId}`);
        const combosData = response.data || [];
        console.log('[ServiceComboManagement] Loaded combos:', combosData.length, combosData);
        setServiceCombos(combosData);
      } catch (err) {
        console.error('[ServiceComboManagement] Error loading service combos:', err);
        if (onError) {
          onError('Không thể tải danh sách gói dịch vụ. Vui lòng thử lại.');
        }
        setServiceCombos([]);
      } finally {
        setLoadingServiceCombos(false);
      }
    };

    loadServiceCombos();
  }, [getUserId, onError]);

  // Apply filters when filter values change
  useEffect(() => {
    const filtered = applyServiceComboFilters(serviceCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
    setFilteredServiceCombos(filtered);
    setServiceComboCurrentPage(1);
    setServiceComboPageInput('');
  }, [serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder, serviceCombos, applyServiceComboFilters]);

  // Calculate combo-pagination values using useMemo - with safe defaults
  const paginationData = useMemo(() => {
    // Safe defaults
    const safeFiltered = Array.isArray(filteredServiceCombos) ? filteredServiceCombos : [];
    const safeItemsPerPage = serviceComboItemsPerPage || 5;
    
    if (safeFiltered.length === 0 || !safeItemsPerPage) {
      return {
        totalPages: 1,
        startIndex: 0,
        endIndex: safeItemsPerPage,
        paginatedServiceCombos: [],
        isLastPage: true
      };
    }
    
    const totalPages = Math.max(1, Math.ceil(safeFiltered.length / safeItemsPerPage));
    const startIndex = Math.max(0, (serviceComboCurrentPage - 1) * safeItemsPerPage);
    const endIndex = Math.min(startIndex + safeItemsPerPage, safeFiltered.length);
    const paginatedServiceCombos = safeFiltered.slice(startIndex, endIndex);
    const isLastPage = serviceComboCurrentPage >= totalPages || totalPages <= 1;
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedServiceCombos,
      isLastPage
    };
  }, [filteredServiceCombos, serviceComboItemsPerPage, serviceComboCurrentPage]);

  // Handle service combo search
  const handleServiceComboSearch = () => {
    const filtered = applyServiceComboFilters(serviceCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
    setFilteredServiceCombos(filtered);
    setServiceComboCurrentPage(1);
    setServiceComboPageInput('');
  };

  // Handle delete service combo - show confirmation modal
  const handleDeleteServiceCombo = (serviceComboId: number, comboName?: string) => {
    setPendingDeleteComboId(serviceComboId);
    setPendingDeleteComboName(comboName || 'combo này');
    setIsConfirmDeleteModalOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!pendingDeleteComboId) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.SERVICE_COMBO}/${pendingDeleteComboId}`);
      setServiceCombos(prevCombos => prevCombos.filter(s => (s.Id || s.id) !== pendingDeleteComboId));
      setFilteredServiceCombos(prevFiltered => prevFiltered.filter(s => (s.Id || s.id) !== pendingDeleteComboId));
      if (onSuccess) {
        onSuccess('Combo dịch vụ đã được xóa thành công!');
      }
    } catch (err) {
      console.error('Error deleting service combo:', err);
      if (onError) {
        onError('Có lỗi xảy ra khi xóa combo dịch vụ. Vui lòng thử lại.');
      }
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteModalOpen(false);
      setPendingDeleteComboId(null);
      setPendingDeleteComboName('');
    }
  };

  // Cancel delete action
  const handleCancelDelete = () => {
    setIsConfirmDeleteModalOpen(false);
    setPendingDeleteComboId(null);
    setPendingDeleteComboName('');
  };

  // Handle open create service combo modal
  const handleOpenCreateServiceComboModal = async () => {
    setIsCreateServiceComboModalOpen(true);
    setCreateServiceComboFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      availableSlots: '',
      status: 'open',
      cancellationPolicy: '',
      images: [],
    });
    setCreateServiceComboErrors({});
    setCreateServiceComboImagePreviews([]);
    setCreateServiceComboSelectedServices({});
    setCreateServiceComboServicesPage(1);
    setCreateServiceComboSelectedPromotions({});
    setCreateServiceComboPromotionsPage(1);
    setCreateServiceComboPromotionsPageInput('');
    setIsPromotionsTableOpen(false);
    setCreateServiceComboPromotionFilterName('');
    setCreateServiceComboPromotionFilterRank('all');
    
    // Load services from API
    try {
      const userId = getUserId();
      if (userId) {
        // Get all services and filter by hostId (backend doesn't have /host/{hostId} endpoint)
        const servicesResponse = await axiosInstance.get(API_ENDPOINTS.SERVICE);
        const allServices = servicesResponse.data || [];
        // So sánh bằng String để tránh lỗi type mismatch
        const hostServices = allServices.filter((s: any) => {
          const serviceHostId = String(s.HostId || s.hostId || '');
          const currentUserId = String(userId || '');
          return serviceHostId === currentUserId && serviceHostId !== '';
        });
        setCreateServiceComboAllServices(hostServices);
      } else {
        setCreateServiceComboAllServices([]);
      }
      
      // Load promotions - TODO: Implement promotion API endpoint
      // For now, set empty array
      if (userId) {
        const promotionsResponse = await axiosInstance.get(`${API_ENDPOINTS.BONUS_SERVICE}/host/${userId}`);
        setCreateServiceComboAllPromotions(promotionsResponse.data || []);
      } else {
        setCreateServiceComboAllPromotions([]);
      }
      
      // Load coupons from API
      if (userId) {
        const couponsResponse = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/host/${userId}`);
        const coupons = couponsResponse.data || [];
        const enriched = await enrichCouponsWithDetails(coupons);
        setCreateServiceComboAllCoupons(enriched);
      } else {
        setCreateServiceComboAllCoupons([]);
      }
    } catch (err) {
      console.error('Error loading data for create modal:', err);
      setCreateServiceComboAllServices([]);
      setCreateServiceComboAllPromotions([]);
      setCreateServiceComboAllCoupons([]);
    }
  };

  // Handle close create service combo modal
  const handleCloseCreateServiceComboModal = () => {
    setIsCreateServiceComboModalOpen(false);
    setCreateServiceComboFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      availableSlots: '',
      status: 'open',
      cancellationPolicy: '',
        images: [],

    });
    setCreateServiceComboErrors({});
    setCreateServiceComboImagePreviews([]);
    setCreateServiceComboSelectedServices({});
    setCreateServiceComboServicesPage(1);
    setCreateServiceComboSelectedPromotions({});
    setCreateServiceComboPromotionsPage(1);
    setCreateServiceComboPromotionsPageInput('');
    setIsPromotionsTableOpen(false);
    setCreateServiceComboPromotionFilterName('');
    setCreateServiceComboPromotionFilterRank('all');
  };

  // Handle create service combo input change
  const handleCreateServiceComboInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setCreateServiceComboFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    if (createServiceComboErrors[name]) {
      setCreateServiceComboErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle create service combo image change (multiple images, max 10)
  const handleCreateServiceComboImageChange = (e) => {
    const files = Array.from(e.target.files || []) as File[];
    const MAX_IMAGES = 10;
    
    if (files.length === 0) {
      setCreateServiceComboImagePreviews([]);
      setCreateServiceComboFormData(prev => ({ ...prev, images: [] }));
      return;
    }

    // Limit to max 10 images
    const filesToAdd = files.slice(0, MAX_IMAGES);
    const currentCount = createServiceComboFormData.images.length;
    const remainingSlots = MAX_IMAGES - currentCount;
    
    if (remainingSlots <= 0) {
      if (onError) {
        onError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
      }
      return;
    }

    const finalFiles = [...createServiceComboFormData.images, ...filesToAdd.slice(0, remainingSlots)];
    setCreateServiceComboFormData(prev => ({ ...prev, images: finalFiles }));

    // Create previews for new files
    const newPreviews: string[] = [];
    filesToAdd.slice(0, remainingSlots).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target.result as string);
        if (newPreviews.length === filesToAdd.slice(0, remainingSlots).length) {
          setCreateServiceComboImagePreviews([...createServiceComboImagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from create modal
  const handleRemoveCreateImage = (index: number) => {
    const newImages = createServiceComboFormData.images.filter((_, i) => i !== index);
    const newPreviews = createServiceComboImagePreviews.filter((_, i) => i !== index);
    setCreateServiceComboFormData(prev => ({ ...prev, images: newImages }));
    setCreateServiceComboImagePreviews(newPreviews);
  };

  // Handle create service combo service select
  const handleCreateServiceComboServiceSelect = (serviceId, checked) => {
    setCreateServiceComboSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        selected: checked,
        quantity: prev[serviceId]?.quantity || 0
      }
    }));
  };

  // Handle create service combo service quantity change
  const handleCreateServiceComboServiceQuantityChange = (serviceId, quantity) => {
    setCreateServiceComboSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        selected: prev[serviceId]?.selected || false,
        quantity: parseInt(quantity) || 0
      }
    }));
  };

  // Handle create service combo promotion select
  const handleCreateServiceComboPromotionSelect = (promotionId, selected) => {
    setCreateServiceComboSelectedPromotions(prev => ({
      ...prev,
      [promotionId]: {
        selected: selected,
      }
    }));
  };
  
  const handleCreateServiceComboCouponSelect = (couponId, checked) => {
    setCreateServiceComboSelectedCoupons(prev => {
      const newSelected = { ...prev };
      if (checked) {
        newSelected[couponId] = { selected: true };
      } else {
        delete newSelected[couponId];
      }
      return newSelected;
    });
  };

  // Promotions (BonusService) selection has no quantity: backend doesn't store it for ServiceCombo

  // Handle create service combo submit
  const handleCreateServiceComboSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: { name?: string; address?: string; price?: string; availableSlots?: string } = {};
    if (!createServiceComboFormData.name || createServiceComboFormData.name.trim() === '') {
      newErrors.name = 'Tên combo dịch vụ không được để trống';
    }
    if (!createServiceComboFormData.address || createServiceComboFormData.address.trim() === '') {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    if (!createServiceComboFormData.price || isNaN(parseFloat(createServiceComboFormData.price)) || parseFloat(createServiceComboFormData.price) < 0) {
      newErrors.price = 'Giá phải là số >= 0';
    }
    if (!createServiceComboFormData.availableSlots || isNaN(parseInt(createServiceComboFormData.availableSlots)) || parseInt(createServiceComboFormData.availableSlots) < 1) {
      newErrors.availableSlots = 'Số chỗ trống phải là số nguyên >= 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setCreateServiceComboErrors(newErrors);
      return;
    }
    
    setIsCreatingServiceCombo(true);
    setCreateServiceComboErrors({});
    
    try {
      const userId = getUserId();
      if (!userId) {
        if (onError) {
          onError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }
        setIsCreatingServiceCombo(false);
        return;
      }

      // Upload all images to Firebase
      let imageUrls: string[] = [];
      if (createServiceComboFormData.images.length > 0) {
        try {
          const uploadPromises = createServiceComboFormData.images.map(file => 
            uploadImageToFirebase(file, 'service-combos')
          );
          imageUrls = await Promise.all(uploadPromises);
          console.log('[ServiceComboManagement] Đã upload', imageUrls.length, 'ảnh lên Firebase');
        } catch (error) {
          console.error('[ServiceComboManagement] Lỗi upload ảnh lên Firebase:', error);
          if (onError) {
            onError('Không thể upload ảnh. Vui lòng thử lại.');
          }
          setIsCreatingServiceCombo(false);
          return;
        }
      }
      
      // Join image URLs with commas for backend
      const imageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;

      // Send the minimal payload the backend ServiceCombo model expects.
      // Avoid sending optional fields when empty/null to prevent model-binding edge cases.
      const requestBody: any = {
        Name: createServiceComboFormData.name.trim(),
        Address: createServiceComboFormData.address.trim(),
        Price: parseFloat(createServiceComboFormData.price) || 0,
        AvailableSlots: parseInt(createServiceComboFormData.availableSlots) || 1,
      };
      const desc = createServiceComboFormData.description?.trim();
      if (desc) requestBody.Description = desc;
      const cancel = createServiceComboFormData.cancellationPolicy?.trim();
      if (cancel) requestBody.CancellationPolicy = cancel;
      // Backend overwrites Status to "pending" on create, so we omit it.
      if (imageUrl) requestBody.Image = imageUrl;
      
      // Fetch user account data to construct Host object for model binding
      // Model binding requires Host navigation property with Role, so we need to provide it
      try {
        const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          const roleId = userInfo.RoleId || userInfo.roleId || 2; // Default to 2 (Host role)
          const roleName = userInfo.Role?.Name || userInfo.role?.name || userInfo.RoleName || userInfo.roleName || 'Host';
          
          // Construct Host object with available data including Role navigation property
          // Note: PasswordHash is required but we don't have it - backend should ignore this since HostId is set
          requestBody.Host = {
            Id: userId,
            Name: userInfo.Name || userInfo.name || '',
            Email: userInfo.Email || userInfo.email || '',
            PasswordHash: '', // Empty string - backend should ignore this since HostId is set
            RoleId: roleId,
            Role: {
              Id: roleId,
              Name: roleName,
              Description: null // Optional field
            }
          };
        } else {
          // Fallback: minimal Host object with Role
          requestBody.Host = {
            Id: userId,
            RoleId: 2, // Host role
            Role: {
              Id: 2,
              Name: 'Host',
              Description: null
            }
          };
        }
      } catch (error) {
        console.error('Error parsing userInfo for Host object:', error);
        // Fallback: minimal Host object with Role
        requestBody.Host = {
          Id: userId,
          RoleId: 2, // Host role
          Role: {
            Id: 2,
            Name: 'Host',
            Description: null
          }
        };
      }
      
      // Also send HostId - the controller will set it, but sending it helps
      requestBody.HostId = userId;

      const response = await axiosInstance.post(API_ENDPOINTS.SERVICE_COMBO, requestBody);
      const newCombo = response.data;
      
      // Add service combo details if services are selected
      const selectedServiceIds = Object.keys(createServiceComboSelectedServices).filter(
        id => createServiceComboSelectedServices[id]?.selected
      );
      
      for (const serviceId of selectedServiceIds) {
        const quantity = createServiceComboSelectedServices[serviceId]?.quantity || 1;
        await axiosInstance.post(API_ENDPOINTS.SERVICE_COMBO_DETAIL, {
          ServicecomboId: newCombo.Id || newCombo.id,
          ServiceId: parseInt(serviceId),
          Quantity: quantity
        });
      }
      
      const updatedCombos = [newCombo, ...serviceCombos];
      setServiceCombos(updatedCombos);
      const filtered = applyServiceComboFilters(updatedCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
      setFilteredServiceCombos(filtered);
      
      if (onSuccess) {
        onSuccess('Combo dịch vụ đã được tạo thành công!');
      }
      handleCloseCreateServiceComboModal();
    } catch (err: any) {
      console.error('Error creating service combo:', err);
      console.error('Create ServiceCombo response data:', err?.response?.data);
      // Try to surface backend validation errors (ApiController 400) to the UI
      let errorMessage = 'Có lỗi xảy ra khi tạo combo dịch vụ. Vui lòng thử lại.'
      const data = err?.response?.data
      if (data?.errors && typeof data.errors === 'object') {
        try {
          const parts = Object.entries(data.errors).flatMap(([key, val]: any) => {
            if (Array.isArray(val)) return val.map((m) => `${key}: ${m}`)
            return [`${key}: ${String(val)}`]
          })
          if (parts.length > 0) errorMessage = parts.join(' | ')
        } catch {}
      } else if (typeof data === 'string' && data.trim()) {
        errorMessage = data
      } else if (data?.title) {
        errorMessage = data.title
      }
      if (onError) onError(errorMessage)
    } finally {
      setIsCreatingServiceCombo(false);
    }
  };

  // Handle open edit service combo modal
  // Show edit confirmation modal
  const handleEditServiceComboClick = (serviceComboId: number) => {
    setPendingEditComboId(serviceComboId);
    setIsConfirmEditModalOpen(true);
  };

  // Confirm edit action - proceed to open edit modal
  const handleConfirmEdit = () => {
    if (!pendingEditComboId) return;
    setIsConfirmEditModalOpen(false);
    handleOpenEditServiceComboModal(pendingEditComboId);
    setPendingEditComboId(null);
  };

  // Cancel edit action
  const handleCancelEdit = () => {
    setIsConfirmEditModalOpen(false);
    setPendingEditComboId(null);
  };

  const handleOpenEditServiceComboModal = async (serviceComboId: number) => {
    setEditingServiceComboId(serviceComboId);
    setIsEditServiceComboModalOpen(true);
    setLoadingEditServiceComboData(true);
    setEditServiceComboErrors({});
    setEditServiceComboImagePreviews([]);
    setEditServiceComboSelectedServices({});
    setEditServiceComboServicesPage(1);
    setEditServiceComboServicesPageInput('');
    setEditServiceComboSelectedPromotions({});
    setEditServiceComboPromotionsPage(1);
    setEditServiceComboPromotionsPageInput('');
    setIsEditPromotionsTableOpen(false);
    setEditServiceComboPromotionFilterName('');
    setEditServiceComboPromotionFilterRank('all');
    setEditServiceComboSelectedCoupons({});
    setEditServiceComboCouponsPage(1);
    setEditServiceComboCouponsPageInput('');
    setIsEditCouponsTableOpen(false);
    setEditServiceComboCouponFilterCode('');
    setEditServiceComboCouponFilterRank('all');
    setEditServiceComboCouponFilterUserType('all');
    setEditServiceComboServiceFilterName('');
    setEditServiceComboServiceFilterPrice('');
    setIsEditServicesTableOpen(true);
    
    // Load service combo data from API
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${serviceComboId}`);
      const serviceCombo = response.data;
      
      if (!serviceCombo) {
        if (onError) {
          onError('Không tìm thấy combo dịch vụ.');
        }
        handleCloseEditServiceComboModal();
        return;
      }
      
      const existingImageField = serviceCombo.Image || serviceCombo.image || null;
      
      // Parse comma-separated image URLs
      const parseImages = (imageField: string | null): string[] => {
        if (!imageField || typeof imageField !== 'string') return [];
        return imageField.split(',').map(img => img.trim()).filter(img => img !== '');
      };
      
      const existingImageUrls = parseImages(existingImageField);
      
      // Lưu ảnh cũ để có thể xóa khỏi Firebase sau khi update thành công
      // Chỉ lưu nếu là Firebase URL (bắt đầu với https://firebasestorage.googleapis.com)
      const firebaseUrls = existingImageUrls.filter(url => url.startsWith('https://firebasestorage.googleapis.com'));
      setOldImageUrlsToDelete(firebaseUrls);
      
      setEditServiceComboFormData({
        name: serviceCombo.Name || serviceCombo.name || '',
        address: serviceCombo.Address || serviceCombo.address || '',
        description: serviceCombo.Description || serviceCombo.description || '',
        price: String(serviceCombo.Price || serviceCombo.price || ''),
        availableSlots: String(serviceCombo.AvailableSlots || serviceCombo.availableSlots || ''),
        status: serviceCombo.Status || serviceCombo.status || 'open',
        cancellationPolicy: serviceCombo.CancellationPolicy || serviceCombo.cancellationPolicy || '',
        images: existingImageUrls, // Store as string array
      });
      
      // Create previews for existing images
      const previews = existingImageUrls.map(img => {
        if (img.startsWith('data:image') || img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        } else {
          const backendRoot = API_BASE_URL.replace('/api', '');
          return `${backendRoot}/images/${img}`;
        }
      });
      setEditServiceComboImagePreviews(previews);
      
      // Load services from API
      const userId = getUserId();
      if (userId) {
        // Get all services and filter by hostId (backend doesn't have /host/{hostId} endpoint)
        const servicesResponse = await axiosInstance.get(API_ENDPOINTS.SERVICE);
        const allServices = servicesResponse.data || [];
        // So sánh bằng String để tránh lỗi type mismatch
        const hostServices = allServices.filter((s: any) => {
          const serviceHostId = String(s.HostId || s.hostId || '');
          const currentUserId = String(userId || '');
          return serviceHostId === currentUserId && serviceHostId !== '';
        });
        setEditServiceComboAllServices(hostServices);
      } else {
        setEditServiceComboAllServices([]);
      }
      
      // Load promotions - TODO: Implement promotion API endpoint
      if (userId) {
        const promotionsResponse = await axiosInstance.get(`${API_ENDPOINTS.BONUS_SERVICE}/host/${userId}`);
        setEditServiceComboAllPromotions(promotionsResponse.data || []);
      } else {
        setEditServiceComboAllPromotions([]);
      }

      // Load coupons (and enrich with details)
      if (userId) {
        try {
          const couponsResponse = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/host/${userId}`);
          const coupons = couponsResponse.data || [];
          const enriched = await enrichCouponsWithDetails(coupons);
          setEditServiceComboAllCoupons(enriched);
        } catch {
          setEditServiceComboAllCoupons([]);
        }
      } else {
        setEditServiceComboAllCoupons([]);
      }
      
      // Load existing service combo details from API
      const detailsResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO_DETAIL}/combo/${serviceComboId}`);
      const detailsArray = detailsResponse.data || [];
      
      const selected = {};
      detailsArray.forEach(detail => {
        const serviceId = String(detail.ServiceId || detail.serviceId);
        selected[serviceId] = {
          selected: true,
          quantity: detail.Quantity || detail.quantity || 0,
          detailId: detail.Id || detail.id
        };
      });
      
      setEditServiceComboSelectedServices(selected);
    } catch (err) {
      console.error('Error loading service combo:', err);
      if (onError) {
        onError('Không thể tải thông tin combo dịch vụ. Vui lòng thử lại.');
      }
      handleCloseEditServiceComboModal();
    } finally {
      setLoadingEditServiceComboData(false);
    }
  };

  // Handle close edit service combo modal
  const handleCloseEditServiceComboModal = () => {
    setIsEditServiceComboModalOpen(false);
    setEditingServiceComboId(null);
    setEditServiceComboFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      availableSlots: '',
      status: 'open',
      cancellationPolicy: '',
        images: [],
    });
    setEditServiceComboErrors({});
    setEditServiceComboImagePreviews([]);
    setOldImageUrlsToDelete([]); // Reset ảnh cũ cần xóa
    setEditServiceComboSelectedServices({});
    setEditServiceComboServicesPage(1);
    setEditServiceComboServicesPageInput('');
    setEditServiceComboServiceFilterName('');
    setEditServiceComboServiceFilterPrice('');
    setEditServiceComboSelectedPromotions({});
    setEditServiceComboPromotionsPage(1);
    setEditServiceComboPromotionsPageInput('');
    setIsEditPromotionsTableOpen(false);
    setEditServiceComboPromotionFilterName('');
    setEditServiceComboPromotionFilterRank('all');
    setEditServiceComboSelectedCoupons({});
    setEditServiceComboCouponsPage(1);
    setEditServiceComboCouponsPageInput('');
    setIsEditCouponsTableOpen(false);
    setEditServiceComboCouponFilterCode('');
    setEditServiceComboCouponFilterRank('all');
    setEditServiceComboCouponFilterUserType('all');
    setIsEditServicesTableOpen(true);
  };

  // Handle edit service combo input change
  const handleEditServiceComboInputChange = (e) => {
    const { name, value, files } = e.target;
    const fieldValue = files ? files[0] : value;
    
    setEditServiceComboFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    if (editServiceComboErrors[name]) {
      setEditServiceComboErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle edit service combo image change (multiple images, max 10)
  const handleEditServiceComboImageChange = (e) => {
    const files = Array.from(e.target.files || []) as File[];
    const MAX_IMAGES = 10;
    
    if (files.length === 0) {
      return;
    }

    const currentCount = editServiceComboFormData.images.length;
    const remainingSlots = MAX_IMAGES - currentCount;
    
    if (remainingSlots <= 0) {
      if (onError) {
        onError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
      }
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    const finalFiles = [...editServiceComboFormData.images, ...filesToAdd];
    setEditServiceComboFormData(prev => ({ ...prev, images: finalFiles }));

    // Create previews for new files
    const newPreviews: string[] = [];
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target.result as string);
        if (newPreviews.length === filesToAdd.length) {
          setEditServiceComboImagePreviews([...editServiceComboImagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle remove image khi edit
  const handleRemoveEditImage = (index: number) => {
    const imageToRemove = editServiceComboFormData.images[index];
    
    // If it's an existing URL (string), mark it for deletion from Firebase
    if (typeof imageToRemove === 'string' && imageToRemove.startsWith('https://firebasestorage.googleapis.com')) {
      setOldImageUrlsToDelete(prev => [...prev, imageToRemove]);
    }
    
    // Remove from arrays
    const newImages = editServiceComboFormData.images.filter((_, i) => i !== index);
    const newPreviews = editServiceComboImagePreviews.filter((_, i) => i !== index);
    setEditServiceComboFormData(prev => ({ ...prev, images: newImages }));
    setEditServiceComboImagePreviews(newPreviews);
    
    // Reset file input
    const fileInput = document.getElementById('edit-service-combo-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle edit service combo service select
  const handleEditServiceComboServiceSelect = (serviceId, checked) => {
    setEditServiceComboSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        selected: checked,
        quantity: prev[serviceId]?.quantity || 0,
        detailId: prev[serviceId]?.detailId
      }
    }));
  };

  // Handle edit service combo service quantity change
  const handleEditServiceComboServiceQuantityChange = (serviceId, quantity) => {
    setEditServiceComboSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        selected: prev[serviceId]?.selected || false,
        quantity: parseInt(quantity) || 0,
        detailId: prev[serviceId]?.detailId
      }
    }));
  };

  // Handle edit service combo promotion select
  const handleEditServiceComboPromotionSelect = (promotionId, selected) => {
    setEditServiceComboSelectedPromotions(prev => ({
      ...prev,
      [promotionId]: {
        selected: selected,
      }
    }));
  };

  // Promotions (BonusService) selection has no quantity: backend doesn't store it for ServiceCombo

  // Handle edit service combo coupon select
  const handleEditServiceComboCouponSelect = (couponId, checked) => {
    setEditServiceComboSelectedCoupons(prev => {
      const newSelected = { ...prev };
      if (checked) {
        newSelected[couponId] = { selected: true };
      } else {
        delete newSelected[couponId];
      }
      return newSelected;
    });
  };

  // Handle edit service combo submit
  const handleEditServiceComboSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingServiceComboId) {
      if (onError) {
        onError('Không tìm thấy ID combo dịch vụ');
      }
      return;
    }
    
    // Validate required fields
    const newErrors: { name?: string; address?: string; price?: string; availableSlots?: string } = {};
    if (!editServiceComboFormData.name || editServiceComboFormData.name.trim() === '') {
      newErrors.name = 'Tên combo dịch vụ không được để trống';
    }
    if (!editServiceComboFormData.address || editServiceComboFormData.address.trim() === '') {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    if (!editServiceComboFormData.price || isNaN(parseFloat(editServiceComboFormData.price)) || parseFloat(editServiceComboFormData.price) < 0) {
      newErrors.price = 'Giá phải là số >= 0';
    }
    if (!editServiceComboFormData.availableSlots || isNaN(parseInt(editServiceComboFormData.availableSlots)) || parseInt(editServiceComboFormData.availableSlots) < 1) {
      newErrors.availableSlots = 'Số chỗ trống phải là số nguyên >= 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setEditServiceComboErrors(newErrors);
      return;
    }
    
    setIsEditingServiceCombo(true);
    setEditServiceComboErrors({});
    
    try {
      // Process images: separate existing URLs from new Files
      const existingImageUrls: string[] = [];
      const newImageFiles: File[] = [];
      
      editServiceComboFormData.images.forEach(img => {
        if (img instanceof File) {
          newImageFiles.push(img);
        } else if (typeof img === 'string') {
          existingImageUrls.push(img);
        }
      });
      
      // Upload new images to Firebase
      let uploadedImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        try {
          const uploadPromises = newImageFiles.map(file => 
            uploadImageToFirebase(file, 'service-combos')
          );
          uploadedImageUrls = await Promise.all(uploadPromises);
          console.log('✅ [ServiceComboManagement] Đã upload', uploadedImageUrls.length, 'ảnh mới lên Firebase');
        } catch (error) {
          console.error('❌ [ServiceComboManagement] Lỗi upload ảnh lên Firebase:', error);
          if (onError) {
            onError('Không thể upload ảnh. Vui lòng thử lại.');
          }
          setIsEditingServiceCombo(false);
          return;
        }
      }
      
      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const imageUrl = allImageUrls.length > 0 ? allImageUrls.join(',') : null;

      // Fetch the complete existing ServiceCombo to satisfy backend validation
      const existingComboResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${editingServiceComboId}`);
      const existingCombo = existingComboResponse.data;
      
      // Fetch Host data to satisfy backend validation (Host is required navigation property)
      const hostId = existingCombo.HostId || existingCombo.hostId;
      let hostData: any = null;
      if (hostId) {
        try {
          const hostResponse = await axiosInstance.get(`${API_ENDPOINTS.USER}/${hostId}`);
          const userData = hostResponse.data;
          // Construct Host object with required fields for backend validation
          // The User API returns a DTO without PasswordHash and full Role object
          hostData = {
            Id: userData.Id || userData.id,
            Name: userData.Name || userData.name,
            Email: userData.Email || userData.email,
            PasswordHash: 'placeholder', // Required by model but not used in Update
            RoleId: userData.RoleId || userData.roleId,
            Role: {
              Id: userData.RoleId || userData.roleId,
              Name: userData.RoleName || userData.roleName || 'Host',
            },
            Avatar: userData.Avatar || userData.avatar,
            Phone: userData.Phone || userData.phone,
            Address: userData.Address || userData.address,
          };
        } catch (err) {
          console.warn('[ServiceComboManagement] Could not fetch host data:', err);
        }
      }
      
      // Merge changes into the existing complete object
      const requestBody: any = {
        ...existingCombo,
        Name: editServiceComboFormData.name.trim(),
        Address: editServiceComboFormData.address.trim(),
        Price: parseFloat(editServiceComboFormData.price) || 0,
        AvailableSlots: parseInt(editServiceComboFormData.availableSlots) || 1,
        Host: hostData, // Include Host to satisfy backend validation
      };
      const desc = editServiceComboFormData.description?.trim();
      if (desc) requestBody.Description = desc;
      else requestBody.Description = existingCombo.Description || null;
      const cancel = editServiceComboFormData.cancellationPolicy?.trim();
      if (cancel) requestBody.CancellationPolicy = cancel;
      else requestBody.CancellationPolicy = existingCombo.CancellationPolicy || null;
      // For update, keep Status if present (backend Update copies it).
      if (editServiceComboFormData.status) requestBody.Status = editServiceComboFormData.status;
      if (imageUrl) requestBody.Image = imageUrl;

      const response = await axiosInstance.put(`${API_ENDPOINTS.SERVICE_COMBO}/${editingServiceComboId}`, requestBody);
      const updatedCombo = response.data;
      
      // Update service combo details
      // First, get existing details
      const detailsResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO_DETAIL}/combo/${editingServiceComboId}`);
      const existingDetails = detailsResponse.data || [];
      
      // Delete existing details
      for (const detail of existingDetails) {
        await axiosInstance.delete(`${API_ENDPOINTS.SERVICE_COMBO_DETAIL}/${detail.Id || detail.id}`);
      }
      
      // Create new details for selected services
      const selectedServiceIds = Object.keys(editServiceComboSelectedServices).filter(
        id => editServiceComboSelectedServices[id]?.selected
      );
      
      for (const serviceId of selectedServiceIds) {
        const quantity = editServiceComboSelectedServices[serviceId]?.quantity || 1;
        await axiosInstance.post(API_ENDPOINTS.SERVICE_COMBO_DETAIL, {
          ServicecomboId: editingServiceComboId,
          ServiceId: parseInt(serviceId),
          Quantity: quantity
        });
      }
      
      const updatedCombos = serviceCombos.map(sc => {
        if ((sc.Id || sc.id) === editingServiceComboId) {
          return updatedCombo;
        }
        return sc;
      });
      
      setServiceCombos(updatedCombos);
      const filtered = applyServiceComboFilters(updatedCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
      setFilteredServiceCombos(filtered);
      
      // Sau khi update thành công, xóa ảnh cũ khỏi Firebase nếu user đã remove chúng
      if (oldImageUrlsToDelete.length > 0) {
        // Xóa các ảnh đã bị remove (không còn trong allImageUrls)
        const urlsToDelete = oldImageUrlsToDelete.filter(oldUrl => !allImageUrls.includes(oldUrl));
        
        if (urlsToDelete.length > 0) {
          // Use Promise.allSettled to handle individual failures gracefully
          const results = await Promise.allSettled(urlsToDelete.map(url => deleteImageFromFirebase(url)));
          const succeeded = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          if (succeeded > 0) {
            console.log('✅ [ServiceComboManagement] Đã xóa', succeeded, 'ảnh cũ khỏi Firebase');
          }
          if (failed > 0) {
            console.warn('⚠️ [ServiceComboManagement]', failed, 'ảnh không tồn tại hoặc đã bị xóa trước đó');
          }
        }
      }
      
      if (onSuccess) {
        onSuccess('Combo dịch vụ đã được cập nhật thành công!');
      }
      handleCloseEditServiceComboModal();
    } catch (err: any) {
      console.error('Error updating service combo:', err);
      console.error('Update ServiceCombo response data:', err?.response?.data);
      if (onError) {
        onError('Có lỗi xảy ra khi cập nhật combo dịch vụ. Vui lòng thử lại.');
      }
    } finally {
      setIsEditingServiceCombo(false);
    }
  };

  // Expose function to open create modal
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      handleOpenCreateServiceComboModal();
    }
  }));

  return (
    <div className="service-combo-management">
      {loadingServiceCombos ? (
        <LoadingSpinner message="Đang tải gói dịch vụ..." />
      ) : (
        <>
          {/* Filter Section */}
          <div className="combo-service-filter-container">
            <div className="combo-filter-row">
              <div className="combo-filter-field">
                <label htmlFor="service-combo-filter-name">Lọc theo tên:</label>
                <input
                  id="service-combo-filter-name"
                  type="text"
                  className="combo-filter-input"
                  placeholder="Nhập tên combo..."
                  value={serviceComboFilterName}
                  onChange={(e) => setServiceComboFilterName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleServiceComboSearch();
                    }
                  }}
                />
              </div>
              <div className="combo-filter-field">
                <label htmlFor="service-combo-filter-status">Trạng thái:</label>
                <select
                  id="service-combo-filter-status"
                  className="combo-filter-select"
                  value={serviceComboFilterStatus}
                  onChange={(e) => setServiceComboFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="open">Mở</option>
                  <option value="closed">Đóng</option>
                  <option value="canceled">Đã hủy</option>
                </select>
              </div>
              <div className="combo-filter-field">
                <label htmlFor="service-combo-sort-order">Thứ tự:</label>
                <select
                  id="service-combo-sort-order"
                  className="combo-filter-select"
                  value={serviceComboSortOrder}
                  onChange={(e) => setServiceComboSortOrder(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <button className="combo-btn-search" onClick={handleServiceComboSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Service Combos List */}
          {filteredServiceCombos.length === 0 ? (
            <div className="combo-empty-state">
              <GridIcon className="combo-empty-state-icon" />
              <h3>Chưa có gói dịch vụ nào</h3>
              <p>Bạn chưa tạo gói dịch vụ nào. Hãy tạo gói dịch vụ mới để bắt đầu!</p>
              <Button variant="default" onClick={handleOpenCreateServiceComboModal}>
                Tạo gói dịch vụ mới
              </Button>
            </div>
          ) : (
            <>
              <div className="combo-services-grid">
                {paginationData.paginatedServiceCombos.map((s) => {
                    const imageName = s.Image || s.image || '';
                    const isAbsolute = imageName.startsWith('data:image') || imageName.startsWith('http://') || imageName.startsWith('https://');
                    const candidates = [];
                    if (imageName && imageName.trim() !== '') {
                      if (isAbsolute) {
                        candidates.push(imageName);
                      } else {
                        // Use relative paths cho FE và backend deploy
                        const backendRoot = API_BASE_URL.replace('/api', '');
                        candidates.push(`/img/uploads/${imageName}`);
                        candidates.push(`${backendRoot}/img/uploads/${imageName}`);
                        candidates.push(`${backendRoot}/images/${imageName}`);
                      }
                    }
                    if (candidates.length === 0) {
                      candidates.push(DEFAULT_IMAGE_URL);
                    }
                    
                    return (
                      <div key={s.Id || s.id} className="combo-servicecombo-card">
                        <div className="combo-service-card-left">
                          <div className="combo-service-image">
                            <img
                              src={candidates[0]}
                              data-candidates={JSON.stringify(candidates)}
                              data-idx="0"
                              alt={s.Name || s.name}
                              className="combo-service-image-img"
                              onError={(e) => {
                                try {
                                  const list = JSON.parse((e.target as HTMLImageElement).dataset.candidates || '[]');
                                  const idx = parseInt((e.target as HTMLImageElement).dataset.idx || '0', 10);
                                  const nextIdx = idx + 1;
                                  if (nextIdx < list.length) {
                                    (e.target as HTMLImageElement).dataset.idx = String(nextIdx);
                                    (e.target as HTMLImageElement).src = list[nextIdx];
                                  } else {
                                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
                                  }
                                } catch {
                                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
                                }
                              }}
                            />
                          </div>
                          <div className="combo-service-details">
                            <h3 className="combo-service-name">{s.Name || s.name}</h3>
                            <p className="service-duration">
                              Trong: {s.NumberOfDays || s.numberOfDays || 0} ngày {s.NumberOfNights || s.numberOfNights || 0} đêm
                            </p>
                            <p className="combo-service-status-gray">Trạng thái: {s.Status || s.status}</p>
                            <p className="combo-service-price">Giá tiền: {(s.Price || s.price || 0).toLocaleString('vi-VN')} VND</p>
                          </div>
                        </div>
                        <div className="combo-service-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-edit-service"
                            onClick={() => handleEditServiceComboClick(s.Id || s.id)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cancel-booking-btn"
                            onClick={() => handleDeleteServiceCombo(s.Id || s.id, s.Name || s.name)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Pagination */}
              {(!paginationData || paginationData.totalPages <= 1) ? null : (
                      <div className="combo-pagination">
                        <button
                          type="button"
                          className="combo-pagination-btn"
                          onClick={() => {
                            const newPage = Math.max(1, serviceComboCurrentPage - 1);
                            setServiceComboCurrentPage(newPage);
                            setServiceComboPageInput('');
                          }}
                          disabled={serviceComboCurrentPage === 1}
                        >
                          <span>←</span> Trước
                        </button>
                        
                        <div className="combo-pagination-controls">
                          <div className="combo-pagination-numbers">
                            {Array.from({ length: paginationData?.totalPages || 1 }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                className={`combo-pagination-number ${serviceComboCurrentPage === page ? 'combo-active' : ''}`}
                                onClick={() => {
                                  setServiceComboCurrentPage(page);
                                  setServiceComboPageInput('');
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
                            value={serviceComboPageInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setServiceComboPageInput(value);
                                const pageNum = parseInt(value);
                                const currentTotalPages = paginationData?.totalPages || 1;
                                if (value !== '' && pageNum >= 1 && pageNum <= currentTotalPages) {
                                  setServiceComboCurrentPage(pageNum);
                                  setServiceComboPageInput('');
                                }
                              }
                            }}
                            placeholder={serviceComboCurrentPage.toString()}
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
                          className="combo-pagination-btn"
                          onClick={() => {
                            const currentTotalPages = paginationData?.totalPages || 1;
                            const newPage = Math.min(currentTotalPages, serviceComboCurrentPage + 1);
                            setServiceComboCurrentPage(newPage);
                            setServiceComboPageInput('');
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

      {/* Create Service Combo Modal */}
      <CreateServiceComboModal
        isOpen={isCreateServiceComboModalOpen}
        onClose={handleCloseCreateServiceComboModal}
        formData={createServiceComboFormData}
        errors={createServiceComboErrors}
        imagePreviews={createServiceComboImagePreviews}
        isSubmitting={isCreatingServiceCombo}
        allServices={createServiceComboAllServices}
        selectedServices={createServiceComboSelectedServices}
        servicesPage={createServiceComboServicesPage}
        servicesPageInput={createServiceComboServicesPageInput}
        servicesPerPage={createServiceComboServicesPerPage}
        serviceFilterName={createServiceComboServiceFilterName}
        serviceFilterPrice={createServiceComboServiceFilterPrice}
        isServicesTableOpen={isServicesTableOpen}
        allPromotions={createServiceComboAllPromotions}
        selectedPromotions={createServiceComboSelectedPromotions}
        promotionsPage={createServiceComboPromotionsPage}
        promotionsPageInput={createServiceComboPromotionsPageInput}
        promotionsPerPage={createServiceComboPromotionsPerPage}
        promotionFilterName={createServiceComboPromotionFilterName}
        promotionFilterRank={createServiceComboPromotionFilterRank}
        isPromotionsTableOpen={isPromotionsTableOpen}
        allCoupons={createServiceComboAllCoupons}
        selectedCoupons={createServiceComboSelectedCoupons}
        couponsPage={createServiceComboCouponsPage}
        couponsPageInput={createServiceComboCouponsPageInput}
        couponsPerPage={createServiceComboCouponsPerPage}
        couponFilterCode={createServiceComboCouponFilterCode}
        couponFilterRank={createServiceComboCouponFilterRank}
        couponFilterUserType={createServiceComboCouponFilterUserType}
        isCouponsTableOpen={isCouponsTableOpen}
        onInputChange={handleCreateServiceComboInputChange}
        onImageChange={handleCreateServiceComboImageChange}
        onRemoveImage={handleRemoveCreateImage}
        onServiceSelect={handleCreateServiceComboServiceSelect}
        onServiceQuantityChange={handleCreateServiceComboServiceQuantityChange}
        onPromotionSelect={handleCreateServiceComboPromotionSelect}
        onCouponSelect={handleCreateServiceComboCouponSelect}
        onServicesPageChange={setCreateServiceComboServicesPage}
        onServicesPageInputChange={setCreateServiceComboServicesPageInput}
        onServiceFilterNameChange={setCreateServiceComboServiceFilterName}
        onServiceFilterPriceChange={setCreateServiceComboServiceFilterPrice}
        onToggleServicesTable={() => setIsServicesTableOpen(!isServicesTableOpen)}
        onPromotionsPageChange={setCreateServiceComboPromotionsPage}
        onPromotionsPageInputChange={setCreateServiceComboPromotionsPageInput}
        onPromotionFilterNameChange={setCreateServiceComboPromotionFilterName}
        onPromotionFilterRankChange={setCreateServiceComboPromotionFilterRank}
        onTogglePromotionsTable={() => setIsPromotionsTableOpen(!isPromotionsTableOpen)}
        onCouponsPageChange={setCreateServiceComboCouponsPage}
        onCouponsPageInputChange={setCreateServiceComboCouponsPageInput}
        onCouponFilterCodeChange={setCreateServiceComboCouponFilterCode}
        onCouponFilterRankChange={setCreateServiceComboCouponFilterRank}
        onCouponFilterUserTypeChange={setCreateServiceComboCouponFilterUserType}
        onToggleCouponsTable={() => setIsCouponsTableOpen(!isCouponsTableOpen)}
        onSubmit={handleCreateServiceComboSubmit}
      />

      {/* Edit Service Combo Modal */}
      <EditServiceComboModal
        isOpen={isEditServiceComboModalOpen}
        onClose={handleCloseEditServiceComboModal}
        loading={loadingEditServiceComboData}
        formData={editServiceComboFormData}
        errors={editServiceComboErrors}
        imagePreviews={editServiceComboImagePreviews}
        isSubmitting={isEditingServiceCombo}
        allServices={editServiceComboAllServices}
        selectedServices={editServiceComboSelectedServices}
        servicesPage={editServiceComboServicesPage}
        servicesPageInput={editServiceComboServicesPageInput}
        servicesPerPage={editServiceComboServicesPerPage}
        serviceFilterName={editServiceComboServiceFilterName}
        serviceFilterPrice={editServiceComboServiceFilterPrice}
        isServicesTableOpen={isEditServicesTableOpen}
        allPromotions={editServiceComboAllPromotions}
        selectedPromotions={editServiceComboSelectedPromotions}
        promotionsPage={editServiceComboPromotionsPage}
        promotionsPageInput={editServiceComboPromotionsPageInput}
        promotionsPerPage={editServiceComboPromotionsPerPage}
        promotionFilterName={editServiceComboPromotionFilterName}
        promotionFilterRank={editServiceComboPromotionFilterRank}
        isPromotionsTableOpen={isEditPromotionsTableOpen}
        allCoupons={editServiceComboAllCoupons}
        selectedCoupons={editServiceComboSelectedCoupons}
        couponsPage={editServiceComboCouponsPage}
        couponsPageInput={editServiceComboCouponsPageInput}
        couponsPerPage={editServiceComboCouponsPerPage}
        couponFilterCode={editServiceComboCouponFilterCode}
        couponFilterRank={editServiceComboCouponFilterRank}
        couponFilterUserType={editServiceComboCouponFilterUserType}
        isCouponsTableOpen={isEditCouponsTableOpen}
        onInputChange={handleEditServiceComboInputChange}
        onImageChange={handleEditServiceComboImageChange}
        onRemoveImage={handleRemoveEditImage}
        onServiceSelect={handleEditServiceComboServiceSelect}
        onServiceQuantityChange={handleEditServiceComboServiceQuantityChange}
        onPromotionSelect={handleEditServiceComboPromotionSelect}
        onCouponSelect={handleEditServiceComboCouponSelect}
        onServicesPageChange={setEditServiceComboServicesPage}
        onServicesPageInputChange={setEditServiceComboServicesPageInput}
        onServiceFilterNameChange={setEditServiceComboServiceFilterName}
        onServiceFilterPriceChange={setEditServiceComboServiceFilterPrice}
        onToggleServicesTable={() => setIsEditServicesTableOpen(!isEditServicesTableOpen)}
        onPromotionsPageChange={setEditServiceComboPromotionsPage}
        onPromotionsPageInputChange={setEditServiceComboPromotionsPageInput}
        onPromotionFilterNameChange={setEditServiceComboPromotionFilterName}
        onPromotionFilterRankChange={setEditServiceComboPromotionFilterRank}
        onTogglePromotionsTable={() => setIsEditPromotionsTableOpen(!isEditPromotionsTableOpen)}
        onCouponsPageChange={setEditServiceComboCouponsPage}
        onCouponsPageInputChange={setEditServiceComboCouponsPageInput}
        onCouponFilterCodeChange={setEditServiceComboCouponFilterCode}
        onCouponFilterRankChange={setEditServiceComboCouponFilterRank}
        onCouponFilterUserTypeChange={setEditServiceComboCouponFilterUserType}
        onToggleCouponsTable={() => setIsEditCouponsTableOpen(!isEditCouponsTableOpen)}
        onSubmit={handleEditServiceComboSubmit}
      />

      {/* Confirmation Modal for Edit */}
      {isConfirmEditModalOpen && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-modal-header">
              <h3>Xác nhận chỉnh sửa</h3>
            </div>
            <div className="confirmation-modal-body">
              <p>Bạn có muốn chỉnh sửa combo dịch vụ này không?</p>
            </div>
            <div className="confirmation-modal-footer">
              <Button variant="outline" onClick={handleCancelEdit}>
                Hủy
              </Button>
              <Button variant="default" onClick={handleConfirmEdit}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {isConfirmDeleteModalOpen && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="confirmation-modal confirmation-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-modal-header">
              <h3>Xác nhận xóa</h3>
            </div>
            <div className="confirmation-modal-body">
              <p>Bạn có chắc chắn muốn xóa <strong>{pendingDeleteComboName}</strong>?</p>
              <p className="warning-text">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="confirmation-modal-footer">
              <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
                Hủy
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ServiceComboManagement.displayName = 'ServiceComboManagement';

export default ServiceComboManagement;





