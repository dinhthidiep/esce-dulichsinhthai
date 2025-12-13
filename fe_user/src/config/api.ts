// API Configuration
// Backend chạy trên port 7267 (https) hoặc 5002 (http)
const envApiUrl = import.meta.env.VITE_API_URL

// Xác định API URL: ưu tiên biến môi trường
// Backend có UseHttpsRedirection() nên sẽ redirect HTTP -> HTTPS, gây lỗi CORS
// Do đó mặc định dùng HTTPS để tránh redirect
// Nếu backend chạy HTTPS, set VITE_API_URL=https://localhost:7267/api trong file .env
// Nếu backend chạy HTTP (không có redirect), set VITE_API_URL=http://localhost:5002/api trong file .env
export const API_BASE_URL = envApiUrl || 'https://localhost:7267/api'

// Log để debug (chỉ log một lần khi khởi động)
if (import.meta.env.DEV) {
  // Chỉ log một lần để tránh spam
  if (!(window as any).__API_CONFIG_LOGGED) {
    console.log('🔧 [api.ts] Environment check:')
    console.log('  - VITE_API_URL:', envApiUrl || '(not set - using default HTTPS)')
    console.log('  - API_BASE_URL:', API_BASE_URL)
    console.log('  - Backend URL:', API_BASE_URL.replace('/api', ''))
    console.log('  - ⚠️ Backend có UseHttpsRedirection() nên HTTP sẽ bị redirect -> lỗi CORS')
    console.log('  - 💡 Tạo file .env trong thư mục fe_user với nội dung:')
    console.log('     VITE_API_URL=https://localhost:7267/api (khuyến nghị - tránh redirect)')
    console.log('     hoặc')
    console.log('     VITE_API_URL=http://localhost:5002/api (nếu backend không redirect)')
    ;(window as any).__API_CONFIG_LOGGED = true
  }
}

export const API_ENDPOINTS = {
  SERVICE_COMBO: '/ServiceCombo',
  SERVICE: '/Service',
  BOOKING: '/Booking',
  PAYMENT: '/Payment',
  SERVICE_COMBO_DETAIL: '/ServiceComboDetail',
  USER: '/user',
  REVIEW: '/Review',
  COUPON: '/Coupon',
  NEWS: '/news', // Note: backend uses lowercase 'news'
  AUTH: '/Auth',
  POST: '/Post',
  POST_REACTION: '/PostReaction',
  POST_SAVE: '/PostSave',
  COMMENT: '/Comment',
  COMMENT_REACTION: '/CommentReaction',
  NOTIFICATION: '/notification',
  BONUS_SERVICE: '/BonusService',
  // PROMOTION: '/Promotion', // TODO: Backend chưa có PromotionController
} as const


