import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'

export interface ServiceResponse {
  Id: number
  Name: string
  Description?: string
  Price: number
  HostId: number
  Status?: string // Pending, Approved, Rejected, Review
  RejectComment?: string
  ReviewComments?: string
  Images?: string
  HostName?: string
  CreatedAt?: string
  UpdatedAt?: string
}

export const useServices = (status?: string) => {
  const [services, setServices] = useState<ServiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Backend route là /api/service (lowercase)
      let url = '/service'
      if (status) {
        url += `?status=${encodeURIComponent(status)}`
      }
      
      console.log('🔍 [useServices] Đang gọi API Service:')
      console.log('  - Endpoint:', url)
      console.log('  - Status filter:', status || 'all')

      const response = await axiosInstance.get<ServiceResponse[]>(url)
      console.log('✅ [useServices] API Response thành công:')
      console.log('  - Status:', response.status)
      console.log('  - Data type:', typeof response.data)
      console.log('  - Is Array:', Array.isArray(response.data))
      console.log('  - Data length:', Array.isArray(response.data) ? response.data.length : 'N/A')
      console.log('  - Data sample:', response.data?.[0] || 'No data')

      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          console.log(`✅ [useServices] Tìm thấy ${response.data.length} service(s)`)
          setServices(response.data)
          setError(null)
        } else {
          console.warn('⚠️ [useServices] API trả về mảng rỗng - không có service nào')
          setServices([])
          setError('Không có dịch vụ nào trong hệ thống. Vui lòng thử lại sau.')
        }
      } else {
        console.error('❌ [useServices] API response không phải là mảng:', response.data)
        console.error('  - Response data:', JSON.stringify(response.data, null, 2))
        setServices([])
        setError('Dữ liệu từ server không đúng định dạng. Vui lòng kiểm tra lại.')
      }
    } catch (err) {
      console.error('❌ [useServices] Lỗi khi tải danh sách service:', err)
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            status?: number
            data?: { message?: string; title?: string }
            statusText?: string
          }
          message?: string
          code?: string
        }
        
        const status = axiosError.response?.status
        const statusText = axiosError.response?.statusText
        const errorData = axiosError.response?.data
        
        console.error('  - Response status:', status)
        console.error('  - Status text:', statusText)
        console.error('  - Response data:', errorData)
        
        let errorMessage = 'Không thể tải danh sách dịch vụ.'
        
        if (status === 404) {
          errorMessage = 'Không tìm thấy endpoint API. Vui lòng kiểm tra lại cấu hình backend.'
        } else if (status === 401 || status === 403) {
          errorMessage = 'Bạn không có quyền truy cập. API này có thể yêu cầu xác thực.'
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        } else if (errorData?.message) {
          errorMessage = errorData.message
        } else if (errorData?.title) {
          errorMessage = errorData.title
        } else if (status) {
          errorMessage = `Lỗi ${status}: ${statusText || 'Unknown error'}`
        }
        
        setError(errorMessage)
      } else if (err && typeof err === 'object' && 'request' in err) {
        console.error('❌ [useServices] Không nhận được response từ server')
        console.error('  - Error:', err)
        setError('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend có đang chạy không (https://localhost:7267)\n2. Kết nối mạng\n3. CORS configuration')
      } else {
        const axiosError = err as { code?: string; message?: string }
        const errorCode = axiosError.code
        const errorMessage = axiosError.message || (err instanceof Error ? err.message : 'Unknown error')
        
        console.error('❌ [useServices] Lỗi setup request:')
        console.error('  - Error code:', errorCode)
        console.error('  - Error message:', errorMessage)
        
        if (errorCode === 'ERR_NETWORK' || errorCode === 'ECONNREFUSED') {
          setError('Không thể kết nối đến backend server. Vui lòng đảm bảo backend đang chạy tại https://localhost:7267')
        } else {
          setError(`Lỗi kết nối: ${errorMessage}`)
        }
      }
      setServices([])
    } finally {
      setLoading(false)
      console.log('🏁 [useServices] Hoàn thành fetch services, loading = false')
    }
  }, [status])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return { services, loading, error, refetch: fetchServices }
}















