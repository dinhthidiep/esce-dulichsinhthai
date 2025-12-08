import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../LoadingSpinner';
import { GridIcon } from '../icons/index';
import CreateServiceComboModal from './CreateServiceComboModal';
import EditServiceComboModal from './EditServiceComboModal';
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
    image: null,
    startDate: '',
    endDate: '',
    numberOfDays: '',
    numberOfNights: ''
  });
  const [createServiceComboErrors, setCreateServiceComboErrors] = useState({});
  const [isCreatingServiceCombo, setIsCreatingServiceCombo] = useState(false);
  const [createServiceComboImagePreview, setCreateServiceComboImagePreview] = useState(null);
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
    image: null,
    startDate: '',
    endDate: '',
    numberOfDays: '',
    numberOfNights: ''
  });
  const [editServiceComboErrors, setEditServiceComboErrors] = useState({});
  const [isEditingServiceCombo, setIsEditingServiceCombo] = useState(false);
  const [editServiceComboImagePreview, setEditServiceComboImagePreview] = useState(null);
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
  
  const DEFAULT_IMAGE_URL = '/img/banahills.jpg';
  
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

  // Load service combos - use mock data
  useEffect(() => {
    setLoadingServiceCombos(true);
    
    // Generate mock service combos data (30 combos)
    const mockServiceCombos = Array.from({ length: 30 }, (_, i) => {
      const createdDate = new Date(Date.now() - i * 86400000);
      const statuses = ['open', 'closed', 'canceled'];
      const status = statuses[i % statuses.length];
      const startDate = new Date(Date.now() + i * 86400000);
      const endDate = new Date(startDate.getTime() + (i % 7 + 1) * 86400000);
      const numberOfDays = Math.floor(Math.random() * 5) + 1;
      const numberOfNights = Math.floor(Math.random() * 5) + 1;
      
      return {
        Id: `mock-combo-${i + 1}`,
        id: `mock-combo-${i + 1}`,
        Name: `Gói dịch vụ ${i + 1}`,
        name: `Gói dịch vụ ${i + 1}`,
        Address: `Địa chỉ ${i + 1}, Thành phố Hồ Chí Minh`,
        address: `Địa chỉ ${i + 1}, Thành phố Hồ Chí Minh`,
        Description: `Mô tả gói dịch vụ ${i + 1}. Đây là một gói dịch vụ chất lượng cao.`,
        description: `Mô tả gói dịch vụ ${i + 1}. Đây là một gói dịch vụ chất lượng cao.`,
        Price: Math.floor(Math.random() * 10000000) + 2000000,
        price: Math.floor(Math.random() * 10000000) + 2000000,
        AvailableSlots: Math.floor(Math.random() * 50) + 10,
        availableSlots: Math.floor(Math.random() * 50) + 10,
        Status: status,
        status: status,
        CancellationPolicy: `Chính sách hủy cho gói ${i + 1}`,
        cancellationPolicy: `Chính sách hủy cho gói ${i + 1}`,
        Image: '/img/banahills.jpg',
        image: '/img/banahills.jpg',
        CreatedAt: createdDate.toISOString(),
        createdAt: createdDate.toISOString(),
        StartDate: startDate.toISOString(),
        startDate: startDate.toISOString(),
        EndDate: endDate.toISOString(),
        endDate: endDate.toISOString(),
        NumberOfDays: numberOfDays,
        numberOfDays: numberOfDays,
        NumberOfNights: numberOfNights,
        numberOfNights: numberOfNights
      };
    });
    
    setServiceCombos(mockServiceCombos);
    setLoadingServiceCombos(false);
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    const filtered = applyServiceComboFilters(serviceCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
    setFilteredServiceCombos(filtered);
    setServiceComboCurrentPage(1);
    setServiceComboPageInput('');
  }, [serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder, serviceCombos, applyServiceComboFilters]);

  // Calculate pagination values using useMemo - with safe defaults
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

  // Handle delete service combo
  const handleDeleteServiceCombo = (serviceComboId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa combo dịch vụ này? Hành động này không thể hoàn tác.')) {
      // Mock delete - remove from state
      setTimeout(() => {
        setServiceCombos(prevCombos => prevCombos.filter(s => (s.Id || s.id) !== serviceComboId));
        setFilteredServiceCombos(prevFiltered => prevFiltered.filter(s => (s.Id || s.id) !== serviceComboId));
        if (onSuccess) {
          onSuccess('Combo dịch vụ đã được xóa thành công!');
        }
      }, 500);
    }
  };

  // Handle open create service combo modal
  const handleOpenCreateServiceComboModal = () => {
    setIsCreateServiceComboModalOpen(true);
    setCreateServiceComboFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      availableSlots: '',
      status: 'open',
      cancellationPolicy: '',
      image: null,
      startDate: '',
      endDate: '',
      numberOfDays: '',
      numberOfNights: ''
    });
    setCreateServiceComboErrors({});
    setCreateServiceComboImagePreview(null);
    setCreateServiceComboSelectedServices({});
    setCreateServiceComboServicesPage(1);
    setCreateServiceComboSelectedPromotions({});
    setCreateServiceComboPromotionsPage(1);
    setCreateServiceComboPromotionsPageInput('');
    setIsPromotionsTableOpen(false);
    setCreateServiceComboPromotionFilterName('');
    setCreateServiceComboPromotionFilterRank('all');
    
    // Load services (mock data only)
    const mockServices = Array.from({ length: 20 }, (_, i) => ({
      Id: i + 1,
      Name: `Dịch vụ ${i + 1}`,
      Description: `Mô tả dịch vụ ${i + 1}`,
      Price: Math.floor(Math.random() * 5000000) + 1000000
    }));
    setCreateServiceComboAllServices(mockServices);
    
    // Load promotions (mock data)
    const mockPromotions = Array.from({ length: 15 }, (_, i) => ({
      Id: i + 1,
      ServiceName: `Dịch vụ ${i + 1}`,
      Rank: ['Đồng', 'Bạc', 'Vàng'][i % 3]
    }));
    setCreateServiceComboAllPromotions(mockPromotions);
    
    // Load coupons (mock data)
    const mockCoupons = Array.from({ length: 15 }, (_, i) => ({
      Id: i + 1,
      Code: `COUPON${i + 1}`,
      Rank: ['Đồng', 'Bạc', 'Vàng'][i % 3],
      UserType: ['Khách hàng', 'Công ty'][i % 2]
    }));
    setCreateServiceComboAllCoupons(mockCoupons);
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
      image: null,
      startDate: '',
      endDate: '',
      numberOfDays: '',
      numberOfNights: ''
    });
    setCreateServiceComboErrors({});
    setCreateServiceComboImagePreview(null);
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

  // Handle create service combo image change
  const handleCreateServiceComboImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCreateServiceComboImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCreateServiceComboImagePreview(null);
    }
    handleCreateServiceComboInputChange(e);
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
        quantity: prev[promotionId]?.quantity || 0
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

  // Handle create service combo promotion quantity change
  const handleCreateServiceComboPromotionQuantityChange = (promotionId, quantity) => {
    setCreateServiceComboSelectedPromotions(prev => ({
      ...prev,
      [promotionId]: {
        selected: prev[promotionId]?.selected || false,
        quantity: parseInt(quantity) || 0
      }
    }));
  };

  // Handle create service combo submit
  const handleCreateServiceComboSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: { name?: string; address?: string; startDate?: string; endDate?: string; numberOfDays?: string; numberOfNights?: string; price?: string; availableSlots?: string } = {};
    if (!createServiceComboFormData.name || createServiceComboFormData.name.trim() === '') {
      newErrors.name = 'Tên combo dịch vụ không được để trống';
    }
    if (!createServiceComboFormData.address || createServiceComboFormData.address.trim() === '') {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    if (!createServiceComboFormData.startDate || createServiceComboFormData.startDate.trim() === '') {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }
    if (!createServiceComboFormData.endDate || createServiceComboFormData.endDate.trim() === '') {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    }
    if (createServiceComboFormData.startDate && createServiceComboFormData.endDate) {
      const startDate = new Date(createServiceComboFormData.startDate);
      const endDate = new Date(createServiceComboFormData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    if (!createServiceComboFormData.numberOfDays || createServiceComboFormData.numberOfDays.trim() === '' || parseInt(createServiceComboFormData.numberOfDays) < 0) {
      newErrors.numberOfDays = 'Số ngày không được để trống và phải >= 0';
    }
    if (!createServiceComboFormData.numberOfNights || createServiceComboFormData.numberOfNights.trim() === '' || parseInt(createServiceComboFormData.numberOfNights) < 0) {
      newErrors.numberOfNights = 'Số đêm không được để trống và phải >= 0';
    }
    if (!createServiceComboFormData.price || parseFloat(createServiceComboFormData.price) < 0) {
      newErrors.price = 'Giá phải là số >= 0';
    }
    if (!createServiceComboFormData.availableSlots || parseInt(createServiceComboFormData.availableSlots) < 1) {
      newErrors.availableSlots = 'Số chỗ trống phải là số nguyên >= 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setCreateServiceComboErrors(newErrors);
      return;
    }
    
    setIsCreatingServiceCombo(true);
    setCreateServiceComboErrors({});
    
    // Mock create - add to state
    setTimeout(() => {
      const newCombo = {
        Id: `mock-combo-${Date.now()}`,
        id: `mock-combo-${Date.now()}`,
        Name: createServiceComboFormData.name.trim(),
        name: createServiceComboFormData.name.trim(),
        Address: createServiceComboFormData.address.trim(),
        address: createServiceComboFormData.address.trim(),
        Description: createServiceComboFormData.description?.trim() || '',
        description: createServiceComboFormData.description?.trim() || '',
        Price: parseFloat(createServiceComboFormData.price) || 0,
        price: parseFloat(createServiceComboFormData.price) || 0,
        AvailableSlots: parseInt(createServiceComboFormData.availableSlots) || 0,
        availableSlots: parseInt(createServiceComboFormData.availableSlots) || 0,
        Status: createServiceComboFormData.status || 'open',
        status: createServiceComboFormData.status || 'open',
        CancellationPolicy: createServiceComboFormData.cancellationPolicy?.trim() || '',
        cancellationPolicy: createServiceComboFormData.cancellationPolicy?.trim() || '',
        Image: createServiceComboImagePreview || DEFAULT_IMAGE_URL,
        image: createServiceComboImagePreview || DEFAULT_IMAGE_URL,
        CreatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        StartDate: createServiceComboFormData.startDate || '',
        startDate: createServiceComboFormData.startDate || '',
        EndDate: createServiceComboFormData.endDate || '',
        endDate: createServiceComboFormData.endDate || '',
        NumberOfDays: parseInt(createServiceComboFormData.numberOfDays) || 0,
        numberOfDays: parseInt(createServiceComboFormData.numberOfDays) || 0,
        NumberOfNights: parseInt(createServiceComboFormData.numberOfNights) || 0,
        numberOfNights: parseInt(createServiceComboFormData.numberOfNights) || 0
      };
      
      const updatedCombos = [newCombo, ...serviceCombos];
      setServiceCombos(updatedCombos);
      const filtered = applyServiceComboFilters(updatedCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
      setFilteredServiceCombos(filtered);
      
      if (onSuccess) {
        onSuccess('Combo dịch vụ đã được tạo thành công!');
      }
      handleCloseCreateServiceComboModal();
      setIsCreatingServiceCombo(false);
    }, 500);
  };

  // Handle open edit service combo modal
  const handleOpenEditServiceComboModal = (serviceComboId) => {
    setEditingServiceComboId(serviceComboId);
    setIsEditServiceComboModalOpen(true);
    setLoadingEditServiceComboData(true);
    setEditServiceComboErrors({});
    setEditServiceComboImagePreview(null);
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
    
    // Load service combo data - use mock data
    setTimeout(() => {
      const serviceCombo = serviceCombos.find(sc => (sc.Id || sc.id) === serviceComboId);
      if (!serviceCombo) {
        if (onError) {
          onError('Không tìm thấy combo dịch vụ.');
        }
        handleCloseEditServiceComboModal();
        return;
      }
      
      const existingImage = serviceCombo.Image || serviceCombo.image || null;
      
      // Format datetime-local from ISO string
      const formatDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setEditServiceComboFormData({
        name: serviceCombo.Name || serviceCombo.name || '',
        address: serviceCombo.Address || serviceCombo.address || '',
        description: serviceCombo.Description || serviceCombo.description || '',
        price: String(serviceCombo.Price || serviceCombo.price || ''),
        availableSlots: String(serviceCombo.AvailableSlots || serviceCombo.availableSlots || ''),
        status: serviceCombo.Status || serviceCombo.status || 'open',
        cancellationPolicy: serviceCombo.CancellationPolicy || serviceCombo.cancellationPolicy || '',
        image: existingImage,
        startDate: formatDateTimeLocal(serviceCombo.StartDate || serviceCombo.startDate),
        endDate: formatDateTimeLocal(serviceCombo.EndDate || serviceCombo.endDate),
        numberOfDays: String(serviceCombo.NumberOfDays || serviceCombo.numberOfDays || ''),
        numberOfNights: String(serviceCombo.NumberOfNights || serviceCombo.numberOfNights || '')
      });
      
      if (existingImage && (existingImage.startsWith('data:image') || existingImage.startsWith('http://') || existingImage.startsWith('https://'))) {
        setEditServiceComboImagePreview(existingImage);
      } else if (existingImage) {
        setEditServiceComboImagePreview(`http://localhost:5002/images/${existingImage}`);
      }
      
      // Load services - use mock data
      const mockServices = Array.from({ length: 20 }, (_, i) => ({
        Id: i + 1,
        Name: `Dịch vụ ${i + 1}`,
        Description: `Mô tả dịch vụ ${i + 1}`,
        Price: Math.floor(Math.random() * 5000000) + 1000000
      }));
      setEditServiceComboAllServices(mockServices);
      
      // Load promotions (mock data)
      const mockPromotions = Array.from({ length: 15 }, (_, i) => ({
        Id: i + 1,
        ServiceName: `Dịch vụ ${i + 1}`,
        Rank: ['Đồng', 'Bạc', 'Vàng'][i % 3]
      }));
      setEditServiceComboAllPromotions(mockPromotions);
      
      // Load existing service combo details - use mock data
      const mockDetails = Array.from({ length: 3 }, (_, i) => ({
        Id: `mock-detail-${i + 1}`,
        id: `mock-detail-${i + 1}`,
        ServiceId: i + 1,
        serviceId: i + 1,
        Quantity: Math.floor(Math.random() * 5) + 1,
        quantity: Math.floor(Math.random() * 5) + 1
      }));
      const detailsArray = mockDetails;
      
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
      setLoadingEditServiceComboData(false);
    }, 500);
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
      image: null,
      startDate: '',
      endDate: '',
      numberOfDays: '',
      numberOfNights: ''
    });
    setEditServiceComboErrors({});
    setEditServiceComboImagePreview(null);
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

  // Handle edit service combo image change
  const handleEditServiceComboImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditServiceComboImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    handleEditServiceComboInputChange(e);
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
        quantity: prev[promotionId]?.quantity || 0
      }
    }));
  };

  // Handle edit service combo promotion quantity change
  const handleEditServiceComboPromotionQuantityChange = (promotionId, quantity) => {
    setEditServiceComboSelectedPromotions(prev => ({
      ...prev,
      [promotionId]: {
        selected: prev[promotionId]?.selected || false,
        quantity: parseInt(quantity) || 0
      }
    }));
  };

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
  const handleEditServiceComboSubmit = (e) => {
    e.preventDefault();
    
    if (!editingServiceComboId) {
      if (onError) {
        onError('Không tìm thấy ID combo dịch vụ');
      }
      return;
    }
    
    // Validate required fields
    const newErrors: { name?: string; address?: string; startDate?: string; endDate?: string; numberOfDays?: string; numberOfNights?: string; price?: string; availableSlots?: string } = {};
    if (!editServiceComboFormData.name || editServiceComboFormData.name.trim() === '') {
      newErrors.name = 'Tên combo dịch vụ không được để trống';
    }
    if (!editServiceComboFormData.address || editServiceComboFormData.address.trim() === '') {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    if (!editServiceComboFormData.startDate || editServiceComboFormData.startDate.trim() === '') {
      newErrors.startDate = 'Ngày triển khai không được để trống';
    }
    if (!editServiceComboFormData.endDate || editServiceComboFormData.endDate.trim() === '') {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    }
    if (editServiceComboFormData.startDate && editServiceComboFormData.endDate) {
      const startDate = new Date(editServiceComboFormData.startDate);
      const endDate = new Date(editServiceComboFormData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày triển khai';
      }
    }
    if (!editServiceComboFormData.numberOfDays || editServiceComboFormData.numberOfDays.trim() === '' || parseInt(editServiceComboFormData.numberOfDays) < 0) {
      newErrors.numberOfDays = 'Số ngày không được để trống và phải >= 0';
    }
    if (!editServiceComboFormData.numberOfNights || editServiceComboFormData.numberOfNights.trim() === '' || parseInt(editServiceComboFormData.numberOfNights) < 0) {
      newErrors.numberOfNights = 'Số đêm không được để trống và phải >= 0';
    }
    if (!editServiceComboFormData.price || parseFloat(editServiceComboFormData.price) < 0) {
      newErrors.price = 'Giá phải là số >= 0';
    }
    if (!editServiceComboFormData.availableSlots || parseInt(editServiceComboFormData.availableSlots) < 1) {
      newErrors.availableSlots = 'Số chỗ trống phải là số nguyên >= 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setEditServiceComboErrors(newErrors);
      return;
    }
    
    setIsEditingServiceCombo(true);
    setEditServiceComboErrors({});
    
    // Mock update - update in state
    setTimeout(() => {
      const updatedCombos = serviceCombos.map(sc => {
        if ((sc.Id || sc.id) === editingServiceComboId) {
          return {
            ...sc,
            Name: editServiceComboFormData.name.trim(),
            name: editServiceComboFormData.name.trim(),
            Address: editServiceComboFormData.address.trim(),
            address: editServiceComboFormData.address.trim(),
            Description: editServiceComboFormData.description?.trim() || '',
            description: editServiceComboFormData.description?.trim() || '',
            Price: parseFloat(editServiceComboFormData.price) || 0,
            price: parseFloat(editServiceComboFormData.price) || 0,
            AvailableSlots: parseInt(editServiceComboFormData.availableSlots) || 0,
            availableSlots: parseInt(editServiceComboFormData.availableSlots) || 0,
            Status: editServiceComboFormData.status || 'open',
            status: editServiceComboFormData.status || 'open',
            CancellationPolicy: editServiceComboFormData.cancellationPolicy?.trim() || '',
            cancellationPolicy: editServiceComboFormData.cancellationPolicy?.trim() || '',
            Image: editServiceComboImagePreview || sc.Image || sc.image || DEFAULT_IMAGE_URL,
            image: editServiceComboImagePreview || sc.Image || sc.image || DEFAULT_IMAGE_URL,
            StartDate: editServiceComboFormData.startDate ? new Date(editServiceComboFormData.startDate).toISOString() : '',
            startDate: editServiceComboFormData.startDate ? new Date(editServiceComboFormData.startDate).toISOString() : '',
            EndDate: editServiceComboFormData.endDate ? new Date(editServiceComboFormData.endDate).toISOString() : '',
            endDate: editServiceComboFormData.endDate ? new Date(editServiceComboFormData.endDate).toISOString() : '',
            NumberOfDays: parseInt(editServiceComboFormData.numberOfDays) || 0,
            numberOfDays: parseInt(editServiceComboFormData.numberOfDays) || 0,
            NumberOfNights: parseInt(editServiceComboFormData.numberOfNights) || 0,
            numberOfNights: parseInt(editServiceComboFormData.numberOfNights) || 0
          };
        }
        return sc;
      });
      
      setServiceCombos(updatedCombos);
      const filtered = applyServiceComboFilters(updatedCombos, serviceComboFilterName, serviceComboFilterStatus, serviceComboSortOrder);
      setFilteredServiceCombos(filtered);
      
      if (onSuccess) {
        onSuccess('Combo dịch vụ đã được cập nhật thành công!');
      }
      handleCloseEditServiceComboModal();
      setIsEditingServiceCombo(false);
    }, 500);
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
          <div className="service-filter-container">
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="service-combo-filter-name">Lọc theo tên:</label>
                <input
                  id="service-combo-filter-name"
                  type="text"
                  className="filter-input"
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
              <div className="filter-field">
                <label htmlFor="service-combo-filter-status">Trạng thái:</label>
                <select
                  id="service-combo-filter-status"
                  className="filter-select"
                  value={serviceComboFilterStatus}
                  onChange={(e) => setServiceComboFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="open">Mở</option>
                  <option value="closed">Đóng</option>
                  <option value="canceled">Đã hủy</option>
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="service-combo-sort-order">Thứ tự:</label>
                <select
                  id="service-combo-sort-order"
                  className="filter-select"
                  value={serviceComboSortOrder}
                  onChange={(e) => setServiceComboSortOrder(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <button className="btn-search" onClick={handleServiceComboSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Service Combos List */}
          {filteredServiceCombos.length === 0 ? (
            <div className="empty-state">
              <GridIcon className="empty-state-icon" />
              <h3>Chưa có gói dịch vụ nào</h3>
              <p>Bạn chưa tạo gói dịch vụ nào. Hãy tạo gói dịch vụ mới để bắt đầu!</p>
              <Button variant="default" onClick={handleOpenCreateServiceComboModal}>
                Tạo gói dịch vụ mới
              </Button>
            </div>
          ) : (
            <>
              <div className="services-grid">
                {paginationData.paginatedServiceCombos.map((s) => {
                    const imageName = s.Image || s.image || '';
                    const isAbsolute = imageName.startsWith('data:image') || imageName.startsWith('http://') || imageName.startsWith('https://');
                    const candidates = [];
                    if (imageName && imageName.trim() !== '') {
                      if (isAbsolute) {
                        candidates.push(imageName);
                      } else {
                        // Use relative paths for images
                        candidates.push(`/img/uploads/${imageName}`);
                        candidates.push(`http://localhost:5002/img/uploads/${imageName}`);
                        candidates.push(`http://localhost:5002/images/${imageName}`);
                      }
                    }
                    if (candidates.length === 0) {
                      candidates.push(DEFAULT_IMAGE_URL);
                    }
                    
                    return (
                      <div key={s.Id || s.id} className="servicecombo-card">
                        <div className="service-card-left">
                          <div className="service-image">
                            <img
                              src={candidates[0]}
                              data-candidates={JSON.stringify(candidates)}
                              data-idx="0"
                              alt={s.Name || s.name}
                              className="service-image-img"
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
                          <div className="service-details">
                            <h3 className="service-name">{s.Name || s.name}</h3>
                            <p className="service-date">
                              Thời gian: {s.StartDate || s.startDate ? new Date(s.StartDate || s.startDate).toLocaleDateString('vi-VN') : 'N/A'} - {s.EndDate || s.endDate ? new Date(s.EndDate || s.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                            </p>
                            <p className="service-duration">
                              Trong: {s.NumberOfDays || s.numberOfDays || 0} ngày {s.NumberOfNights || s.numberOfNights || 0} đêm
                            </p>
                            <p className="service-status-gray">Trạng thái: {s.Status || s.status}</p>
                            <p className="service-price">Giá tiền: {(s.Price || s.price || 0).toLocaleString('vi-VN')} VND</p>
                          </div>
                        </div>
                        <div className="service-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-edit-service"
                            onClick={() => handleOpenEditServiceComboModal(s.Id || s.id)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cancel-booking-btn"
                            onClick={() => handleDeleteServiceCombo(s.Id || s.id)}
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
                      <div className="pagination">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => {
                            const newPage = Math.max(1, serviceComboCurrentPage - 1);
                            setServiceComboCurrentPage(newPage);
                            setServiceComboPageInput('');
                          }}
                          disabled={serviceComboCurrentPage === 1}
                        >
                          <span>←</span> Trước
                        </button>
                        
                        <div className="pagination-controls">
                          <div className="pagination-numbers">
                            {Array.from({ length: paginationData?.totalPages || 1 }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                className={`pagination-number ${serviceComboCurrentPage === page ? 'active' : ''}`}
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
                          className="pagination-btn"
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
        imagePreview={createServiceComboImagePreview}
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
        onServiceSelect={handleCreateServiceComboServiceSelect}
        onServiceQuantityChange={handleCreateServiceComboServiceQuantityChange}
        onPromotionSelect={handleCreateServiceComboPromotionSelect}
        onPromotionQuantityChange={handleCreateServiceComboPromotionQuantityChange}
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
        imagePreview={editServiceComboImagePreview}
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
        onServiceSelect={handleEditServiceComboServiceSelect}
        onServiceQuantityChange={handleEditServiceComboServiceQuantityChange}
        onPromotionSelect={handleEditServiceComboPromotionSelect}
        onPromotionQuantityChange={handleEditServiceComboPromotionQuantityChange}
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
    </div>
  );
});

ServiceComboManagement.displayName = 'ServiceComboManagement';

export default ServiceComboManagement;
