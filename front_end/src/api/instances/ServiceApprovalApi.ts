/**
 * ServiceApprovalApi.ts
 * API cho chức năng phê duyệt dịch vụ ServiceCombo (Admin)
 */

import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export type ServiceStatus = 'pending' | 'approved' | 'rejected' | 'open' | 'closed' | string | null | undefined

export interface ServiceComboForApproval {
  id: number
  name: string
  address?: string | null
  description?: string | null
  price: number
  availableSlots?: number | null
  image?: string | null
  status?: ServiceStatus
  cancellationPolicy?: string | null
  hostId: number
  hostName?: string | null
  hostEmail?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

const ensureAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  if (response.status === 204) {
    return null as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  const text = await response.text()
  return text as T
}

const normalizeServiceCombo = (payload: any): ServiceComboForApproval => {
  return {
    id: Number(payload?.id ?? payload?.Id ?? 0),
    name: payload?.name ?? payload?.Name ?? '',
    address: payload?.address ?? payload?.Address ?? null,
    description: payload?.description ?? payload?.Description ?? null,
    price: Number(payload?.price ?? payload?.Price ?? 0),
    availableSlots: payload?.availableSlots ?? payload?.AvailableSlots ?? null,
    image: payload?.image ?? payload?.Image ?? null,
    status: payload?.status ?? payload?.Status ?? 'pending',
    cancellationPolicy: payload?.cancellationPolicy ?? payload?.CancellationPolicy ?? null,
    hostId: Number(payload?.hostId ?? payload?.HostId ?? payload?.host_Id ?? 0),
    hostName: payload?.hostName ?? payload?.HostName ?? payload?.host?.name ?? null,
    hostEmail: payload?.hostEmail ?? payload?.HostEmail ?? payload?.host?.email ?? null,
    createdAt: payload?.createdAt ?? payload?.CreatedAt ?? payload?.created_At ?? null,
    updatedAt: payload?.updatedAt ?? payload?.UpdatedAt ?? payload?.updated_At ?? null
  }
}

/**
 * Lấy tất cả ServiceCombo cho Admin (bao gồm cả pending)
 * Endpoint: GET /api/ServiceCombo/admin/all
 */
export const getAllServiceCombosForAdmin = async (): Promise<ServiceComboForApproval[]> => {
  try {
    const endpoint = '/api/ServiceCombo/admin/all'
    console.log('[ServiceApprovalApi] Fetching all service combos for admin')
    
    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: ensureAuthHeaders()
    })
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        console.warn('[ServiceApprovalApi] No service combos found, returning empty array')
        return []
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await handleResponse<any[]>(response)
    
    if (result == null || !Array.isArray(result)) {
      return []
    }
    
    const normalized = result.map(normalizeServiceCombo)
    console.log(`[ServiceApprovalApi] Fetched ${normalized.length} service combos`)
    return normalized
  } catch (error: any) {
    console.error('[ServiceApprovalApi] Error fetching service combos:', error)
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến server.')
    }
    return []
  }
}

/**
 * Lấy danh sách ServiceCombo chờ duyệt (filter từ all)
 */
export const getPendingServiceCombos = async (): Promise<ServiceComboForApproval[]> => {
  const all = await getAllServiceCombosForAdmin()
  return all.filter(s => 
    s.status?.toLowerCase() === 'pending' || 
    s.status === null || 
    s.status === undefined
  )
}

/**
 * Cập nhật status của ServiceCombo (Admin)
 * Endpoint: PUT /api/ServiceCombo/{id}/status
 * @param status - 'pending' | 'approved' | 'rejected' | 'open' | 'closed'
 */
export const updateServiceComboStatus = async (id: number, status: string): Promise<string> => {
  try {
    if (!status?.trim()) {
      throw new Error('Status không được để trống')
    }
    
    const endpoint = `/api/ServiceCombo/${id}/status`
    console.log('[ServiceApprovalApi] Updating service combo status:', { id, status })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        Status: status.trim()
      })
    })
    
    const result = await handleResponse<any>(response)
    console.log('[ServiceApprovalApi] Service combo status updated successfully')
    return result?.message || `Đã cập nhật trạng thái thành: ${status}`
  } catch (error: any) {
    console.error('[ServiceApprovalApi] Error updating service combo status:', error)
    throw error
  }
}

/**
 * Phê duyệt ServiceCombo (Admin)
 */
export const approveServiceCombo = async (id: number): Promise<string> => {
  return updateServiceComboStatus(id, 'approved')
}

/**
 * Từ chối ServiceCombo (Admin)
 */
export const rejectServiceCombo = async (id: number): Promise<string> => {
  return updateServiceComboStatus(id, 'rejected')
}
