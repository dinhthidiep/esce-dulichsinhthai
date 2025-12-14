import axiosInstance from '~/utils/axiosInstance';
import { API_BASE_URL } from '~/config/api';

const BONUS_SERVICE_URL = `${API_BASE_URL}/BonusService`;

export interface BonusService {
  Id: number;
  Name: string;
  Description?: string;
  Price: number;
  HostId: number;
  ServiceId?: number;
  Image?: string;
  Status?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CreateBonusServiceDto {
  Name: string;
  Description?: string;
  Price: number;
  HostId: number;
  ServiceId?: number;
  Image?: File;
}

export interface UpdateBonusServiceDto {
  Name?: string;
  Description?: string;
  Price?: number;
  ServiceId?: number;
  Status?: string;
  Image?: File;
}

// Lấy tất cả dịch vụ tặng kèm của Host
export const getBonusServicesByHost = async (hostId: number): Promise<BonusService[]> => {
  const response = await axiosInstance.get(`${BONUS_SERVICE_URL}/host/${hostId}`);
  return response.data;
};

// Lấy chi tiết một dịch vụ tặng kèm
export const getBonusServiceById = async (id: number): Promise<BonusService> => {
  const response = await axiosInstance.get(`${BONUS_SERVICE_URL}/${id}`);
  return response.data;
};

// Tạo dịch vụ tặng kèm mới
export const createBonusService = async (data: CreateBonusServiceDto): Promise<BonusService> => {
  const formData = new FormData();
  formData.append('Name', data.Name);
  formData.append('Price', data.Price.toString());
  formData.append('HostId', data.HostId.toString());
  
  if (data.Description) {
    formData.append('Description', data.Description);
  }
  if (data.ServiceId) {
    formData.append('ServiceId', data.ServiceId.toString());
  }
  if (data.Image) {
    formData.append('Image', data.Image);
  }

  const response = await axiosInstance.post(BONUS_SERVICE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Cập nhật dịch vụ tặng kèm
export const updateBonusService = async (id: number, data: UpdateBonusServiceDto): Promise<BonusService> => {
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
  if (data.ServiceId !== undefined) {
    formData.append('ServiceId', data.ServiceId?.toString() || '0');
  }
  if (data.Status) {
    formData.append('Status', data.Status);
  }
  if (data.Image) {
    formData.append('Image', data.Image);
  }

  const response = await axiosInstance.put(`${BONUS_SERVICE_URL}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Xóa dịch vụ tặng kèm
export const deleteBonusService = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BONUS_SERVICE_URL}/${id}`);
};

export default {
  getBonusServicesByHost,
  getBonusServiceById,
  createBonusService,
  updateBonusService,
  deleteBonusService,
};


