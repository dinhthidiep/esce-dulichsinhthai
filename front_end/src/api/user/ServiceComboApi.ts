import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';

// Types
export interface ServiceCombo {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  Description?: string;
  description?: string;
  Price?: number;
  price?: number;
  HostId?: number;
  hostId?: number;
  Status?: string;
  status?: string;
  Images?: string;
  images?: string;
  CreatedAt?: string;
  createdAt?: string;
  UpdatedAt?: string;
  updatedAt?: string;
  Host?: any;
  host?: any;
  ServiceComboDetails?: any[];
  serviceComboDetails?: any[];
}

export interface CreateServiceComboDto {
  Name: string;
  Description?: string;
  Price: number;
  Images?: File;
}

export interface UpdateServiceComboDto {
  Name?: string;
  Description?: string;
  Price?: number;
  Images?: File;
}

// API Functions

/**
 * Lấy tất cả gói dịch vụ (public - đã duyệt)
 */
export const getAllServiceCombos = async (): Promise<ServiceCombo[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.SERVICE_COMBO);
  return response.data;
};

/**
 * Lấy chi tiết một gói dịch vụ theo ID
 */
export const getServiceComboById = async (id: number): Promise<ServiceCombo> => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`);
  return response.data;
};

/**
 * Lấy gói dịch vụ theo tên
 */
export const getServiceComboByName = async (name: string): Promise<ServiceCombo> => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/name/${encodeURIComponent(name)}`);
  return response.data;
};

/**
 * Lấy gói dịch vụ của một Host (đã duyệt) - dùng cho trang profile host
 */
export const getServiceCombosByHostId = async (hostId: number): Promise<ServiceCombo[]> => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${hostId}`);
  return response.data;
};

/**
 * Host lấy tất cả gói dịch vụ của mình (kể cả chưa duyệt)
 */
export const getMyServiceCombos = async (): Promise<ServiceCombo[]> => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/my-combos`);
  return response.data;
};

/**
 * Tạo gói dịch vụ mới (Host only)
 */
export const createServiceCombo = async (data: CreateServiceComboDto): Promise<ServiceCombo> => {
  const formData = new FormData();
  formData.append('Name', data.Name);
  if (data.Description) {
    formData.append('Description', data.Description);
  }
  formData.append('Price', data.Price.toString());
  if (data.Images) {
    formData.append('Images', data.Images);
  }

  const response = await axiosInstance.post(API_ENDPOINTS.SERVICE_COMBO, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Cập nhật gói dịch vụ
 */
export const updateServiceCombo = async (id: number, data: UpdateServiceComboDto): Promise<ServiceCombo> => {
  const formData = new FormData();
  if (data.Name) {
    formData.append('Name', data.Name);
  }
  if (data.Description !== undefined) {
    formData.append('Description', data.Description || '');
  }
  if (data.Price !== undefined) {
    formData.append('Price', data.Price.toString());
  }
  if (data.Images) {
    formData.append('Images', data.Images);
  }

  const response = await axiosInstance.put(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Xóa gói dịch vụ
 */
export const deleteServiceCombo = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`);
};

// Admin APIs

/**
 * Admin lấy tất cả gói dịch vụ (kể cả chưa duyệt)
 */
export const getAllServiceCombosForAdmin = async (): Promise<ServiceCombo[]> => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/admin/all`);
  return response.data;
};

/**
 * Admin cập nhật trạng thái gói dịch vụ (pending, approved, rejected)
 */
export const updateServiceComboStatus = async (id: number, status: string): Promise<{ message: string }> => {
  const response = await axiosInstance.put(`${API_ENDPOINTS.SERVICE_COMBO}/${id}/status`, { Status: status });
  return response.data;
};

export default {
  getAllServiceCombos,
  getServiceComboById,
  getServiceComboByName,
  getServiceCombosByHostId,
  getMyServiceCombos,
  createServiceCombo,
  updateServiceCombo,
  deleteServiceCombo,
  getAllServiceCombosForAdmin,
  updateServiceComboStatus
};


