import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import type { ServiceComboResponse } from '~/types/serviceCombo'

export const useTours = () => {
  const [tours, setTours] = useState<ServiceComboResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = API_ENDPOINTS.SERVICE_COMBO
      const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7267/api'
      const fullUrl = `${baseURL}${url}`
      
      console.log('🔍 [useTours] Đang gọi API ServiceCombo:')
      console.log('  - Endpoint:', url)
      console.log('  - Base URL:', baseURL)
      console.log('  - Full URL:', fullUrl)

      const response = await axiosInstance.get(url)
      console.log('✅ [useTours] API Response thành công:')
      console.log('  - Status:', response.status)
      console.log('  - Data type:', typeof response.data)
      console.log('  - Is Array:', Array.isArray(response.data))
      console.log('  - Data length:', Array.isArray(response.data) ? response.data.length : 'N/A')
      console.log('  - Data sample:', response.data?.[0] || 'No data')

      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          console.log(`✅ [useTours] Tìm thấy ${response.data.length} service combo(s)`)
          setTours(response.data)
          setError(null)
        } else {
          console.warn('⚠️ [useTours] API trả về mảng rỗng - không có service combo nào')
          setTours([])
          setError('Không có dịch vụ nào trong hệ thống. Vui lòng thử lại sau.')
        }
      } else {
        console.error('❌ [useTours] API response không phải là mảng:', response.data)
        console.error('  - Response data:', JSON.stringify(response.data, null, 2))
        setTours([])
        setError('Dữ liệu từ server không đúng định dạng. Vui lòng kiểm tra lại.')
      }
    } catch (err) {
      console.error('❌ [useTours] Lỗi khi tải danh sách tour:', err)
      
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
        // Request đã được gửi nhưng không nhận được response
        console.error('❌ [useTours] Không nhận được response từ server')
        console.error('  - Error:', err)
        setError('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend có đang chạy không (https://localhost:7267)\n2. Kết nối mạng\n3. CORS configuration')
      } else {
        // Lỗi khi setup request
        const axiosError = err as { code?: string; message?: string }
        const errorCode = axiosError.code
        const errorMessage = axiosError.message || (err instanceof Error ? err.message : 'Unknown error')
        
        console.error('❌ [useTours] Lỗi setup request:')
        console.error('  - Error code:', errorCode)
        console.error('  - Error message:', errorMessage)
        
        if (errorCode === 'ERR_NETWORK' || errorCode === 'ECONNREFUSED') {
          setError('Không thể kết nối đến backend server. Vui lòng đảm bảo backend đang chạy tại https://localhost:7267')
        } else {
          setError(`Lỗi kết nối: ${errorMessage}`)
        }
      }
      setTours([])
    } finally {
      setLoading(false)
      console.log('🏁 [useTours] Hoàn thành fetch tours, loading = false')
    }
  }, [])

  useEffect(() => {
    fetchTours()
  }, [fetchTours])

  return { tours, loading, error, refetch: fetchTours }
}


