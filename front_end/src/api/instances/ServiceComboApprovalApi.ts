import { fetchWithFallback, getAuthToken } from './httpClient'

export interface ServiceComboDto {
  id: number
  name: string
  description: string
  address: string
  price: number
  availableSlots: number
  image?: string
  status: string
  hostId: number
  hostName?: string
  hostEmail?: string
  createdAt?: string
  updatedAt?: string
  cancellationPolicy?: string
}

export interface UpdateServiceComboStatusDto {
  status: string
}

/**
 * Lấy tất cả ServiceCombo đang pending (Admin only)
 * Endpoint: GET /api/ServiceCombo/admin/pending
 */
export const getAllPendingServiceCombos = async (): Promise<ServiceComboDto[]> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    const endpoint = '/api/ServiceCombo/admin/pending'
    console.log('[ServiceComboApprovalApi] Fetching pending service combos')

    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Không thể lấy danh sách ServiceCombo đang pending')
    }

    const result = await response.json()
    console.log(`[ServiceComboApprovalApi] Fetched ${Array.isArray(result) ? result.length : 0} pending service combos`)

    if (!Array.isArray(result)) {
      return []
    }

    return result.map((item: any) => ({
      id: item.id ?? item.Id ?? 0,
      name: item.name ?? item.Name ?? '',
      description: item.description ?? item.Description ?? '',
      address: item.address ?? item.Address ?? '',
      price: item.price ?? item.Price ?? 0,
      availableSlots: item.availableSlots ?? item.AvailableSlots ?? 0,
      image: item.image ?? item.Image ?? undefined,
      status: item.status ?? item.Status ?? 'pending',
      hostId: item.hostId ?? item.HostId ?? 0,
      hostName: item.host?.name ?? item.host?.Name ?? item.hostName ?? item.HostName ?? undefined,
      hostEmail: item.host?.email ?? item.host?.Email ?? item.hostEmail ?? item.HostEmail ?? undefined,
      createdAt: item.createdAt ?? item.CreatedAt ?? undefined,
      updatedAt: item.updatedAt ?? item.UpdatedAt ?? undefined,
      cancellationPolicy: item.cancellationPolicy ?? item.CancellationPolicy ?? undefined
    }))
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể lấy danh sách ServiceCombo đang pending'
    console.error('[ServiceComboApprovalApi] Error fetching pending service combos:', error)
    throw error
  }
}

/**
 * Phê duyệt ServiceCombo (Admin only)
 * Endpoint: PUT /api/ServiceCombo/{id}/status
 */
export const approveServiceCombo = async (serviceComboId: number): Promise<void> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    const endpoint = `/api/ServiceCombo/${serviceComboId}/status`
    console.log('[ServiceComboApprovalApi] Approving service combo:', { serviceComboId })

    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        Status: 'approved'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Không thể phê duyệt ServiceCombo')
    }

    console.log('[ServiceComboApprovalApi] Service combo approved successfully')
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể phê duyệt ServiceCombo'
    console.error(`[ServiceComboApprovalApi] Error approving service combo ${serviceComboId}:`, error)
    throw error
  }
}

/**
 * Từ chối ServiceCombo (Admin only)
 * Endpoint: PUT /api/ServiceCombo/{id}/status
 */
export const rejectServiceCombo = async (serviceComboId: number, comment: string): Promise<void> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!comment || !comment.trim()) {
      throw new Error('Lý do từ chối không được để trống')
    }

    const endpoint = `/api/ServiceCombo/${serviceComboId}/status`
    console.log('[ServiceComboApprovalApi] Rejecting service combo:', { serviceComboId, comment })

    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        Status: 'rejected',
        Comment: comment.trim()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Không thể từ chối ServiceCombo')
    }

    console.log('[ServiceComboApprovalApi] Service combo rejected successfully')
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể từ chối ServiceCombo'
    console.error(`[ServiceComboApprovalApi] Error rejecting service combo ${serviceComboId}:`, error)
    throw error
  }
}

