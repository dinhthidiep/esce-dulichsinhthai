import axios from 'axios'
import { API_BASE_URL } from '~/config/api'

// Log API_BASE_URL để debug (chỉ log một lần)
if (import.meta.env.DEV && !(window as any).__AXIOS_INSTANCE_LOGGED) {
  console.log('🔧 [axiosInstance] API_BASE_URL:', API_BASE_URL)
  ;(window as any).__AXIOS_INSTANCE_LOGGED = true
}

// Tạo axios instance với base URL
const realAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (tăng lên để tránh timeout khi backend chậm)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Không dùng withCredentials vì backend có AllowAnyOrigin
  withCredentials: false,
  // Bỏ qua SSL verification trong development (chỉ dùng khi cần)
  // httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Chỉ dùng trong dev
})

// Helper function để lấy token từ localStorage hoặc sessionStorage
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

realAxiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Nếu data là FormData, xóa Content-Type để axios tự set với boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    // Chỉ log trong development mode để tránh spam console
    if (import.meta.env.DEV) {
      console.log('📤 [axiosInstance] Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        isFormData: config.data instanceof FormData,
      })
    }
    return config
  },
  (error) => {
    console.error('❌ [axiosInstance] Request error:', error)
    return Promise.reject(error)
  }
)


realAxiosInstance.interceptors.response.use(
  (response) => {
    // Chỉ log trong development mode để tránh spam console
    if (import.meta.env.DEV) {
      console.log('✅ [axiosInstance] Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      })
    }
    return response
  },
  (error: any) => {
    // Chỉ log error trong development mode, và chỉ log lỗi quan trọng
    if (import.meta.env.DEV) {
      const status = error.response?.status
      const url = error.config?.url || ''
      
      // Không log chi tiết cho lỗi 500 từ ServiceComboDetail (circular reference - đã xử lý)
      if (status === 500 && url.includes('ServiceComboDetail')) {
        // Bỏ qua log chi tiết cho lỗi này
        return Promise.reject(error)
      }
      
      // Không log 404 cho endpoint Booking/user/{userId} - đây là trường hợp bình thường (user chưa có booking)
      if (status === 404 && url.includes('/Booking/user/')) {
        // Bỏ qua log cho trường hợp này - không phải lỗi
        // User chưa có booking là trạng thái hợp lệ, không cần log error
        // Component sẽ xử lý 404 này như trạng thái bình thường
        return Promise.reject(error)
      }
      
      // Không log 404 cho ServiceCombo nếu đã được xử lý trong component (để giảm noise)
      // Component sẽ hiển thị thông báo phù hợp cho user
      if (status === 404 && url.includes('/ServiceCombo/')) {
        // Vẫn reject error để component xử lý, nhưng không log chi tiết
        return Promise.reject(error)
      }
      
      console.error('❌ [axiosInstance] Response error:', {
        message: error.message,
        code: error.code,
        status: status,
        statusText: error.response?.statusText,
        url: url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
        responseData: error.response?.data,
      })
    }
    
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ - chỉ logout khi 401 (Unauthorized)
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
      // Redirect to login nếu đang ở trang cần auth
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Chỉ redirect nếu không phải trang public
        const publicPaths = ['/', '/services', '/services/', '/about', '/forum']
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      }
    }
    // 403 Forbidden - không logout, chỉ log lỗi (user có thể không có quyền cho action cụ thể)
    // Component sẽ xử lý hiển thị thông báo phù hợp
    
    // Xử lý lỗi network/SSL
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'CERT_HAS_EXPIRED') {
      console.error('❌ [axiosInstance] Lỗi kết nối:', error.code)
      console.error('  - Nếu gặp lỗi SSL, thử đặt VITE_API_URL=http://localhost:5002/api trong file .env')
    }
    
    return Promise.reject(error)
  }
)

export default realAxiosInstance


