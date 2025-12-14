import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import LoadingSpinner from './LoadingSpinner'
import { 
  CheckCircleIcon,
  FileTextIcon,
  MapPinIcon,
  HomeIcon
} from './icons/index'
import { formatPrice } from '~/lib/utils'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import './PaymentSuccessPage.css'

interface BookingData {
  Id?: number
  id?: number
  BookingNumber?: string
  bookingNumber?: string
  TotalAmount?: number
  totalAmount?: number
  Status?: string
  status?: string
  Quantity?: number
  quantity?: number
  ServiceCombo?: {
    Id?: number
    id?: number
    Name?: string
    name?: string
    Address?: string
    address?: string
  }
  serviceCombo?: {
    Id?: number
    id?: number
    Name?: string
    name?: string
    Address?: string
    address?: string
  }
  [key: string]: unknown
}

interface PaymentData {
  Id?: number
  id?: number
  Amount?: number
  amount?: number
  Status?: string
  status?: string
  PaymentMethod?: string
  paymentMethod?: string
  CreatedAt?: string
  createdAt?: string
  [key: string]: unknown
}

const PaymentSuccessPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ensuredStatus, setEnsuredStatus] = useState(false)
  const [paymentChecked, setPaymentChecked] = useState(false)

  // QUAN TRỌNG: Tự động check và update payment status từ PayOS khi có orderCode
  // Sử dụng polling với retry và fallback đến localhost để đảm bảo payment được cập nhật
  useEffect(() => {
    const orderCode = searchParams.get('orderCode')
    
    if (!orderCode || paymentChecked) return
    
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 2000 // 2 giây
    
    // Fallback URL: thử gọi trực tiếp đến localhost backend nếu ngrok offline
    const localhostBackendUrl = 'https://localhost:7267/api'
    
    const checkPaymentByOrderCode = async (useLocalhost = false): Promise<void> => {
      try {
        const apiUrl = useLocalhost 
          ? `${localhostBackendUrl}${API_ENDPOINTS.PAYMENT}/check-payment-by-ordercode?orderCode=${orderCode}`
          : `${API_ENDPOINTS.PAYMENT}/check-payment-by-ordercode?orderCode=${orderCode}`
        
        console.log(`[PaymentSuccessPage] Checking payment with orderCode: ${orderCode} (attempt ${retryCount + 1}/${maxRetries}, ${useLocalhost ? 'localhost' : 'normal'})`)
        
        // Gọi endpoint check-payment-by-ordercode để verify và update payment
        const checkResponse = useLocalhost
          ? await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                // Lấy token từ axiosInstance nếu có
                ...(axiosInstance.defaults.headers.common['Authorization'] 
                  ? { 'Authorization': axiosInstance.defaults.headers.common['Authorization'] as string }
                  : {})
              },
              // Bỏ qua SSL certificate validation cho localhost
              // @ts-ignore
              rejectUnauthorized: false
            }).then(res => res.json())
          : await axiosInstance.get(apiUrl).then(res => res.data)
        
        if (checkResponse) {
          const checkData = checkResponse
          console.log(`[PaymentSuccessPage] Payment check result:`, checkData)
          
          if (checkData.wasUpdated || checkData.paymentStatus?.isPaid) {
            console.log(`[PaymentSuccessPage] ✅ Payment status đã được cập nhật: ${checkData.paymentStatus?.status}`)
            // Reload payment data sau khi update
            if (bookingId) {
              try {
                const paymentResponse = await axiosInstance.get<PaymentData>(
                  `${API_ENDPOINTS.PAYMENT}/status/${bookingId}`
                )
                if (paymentResponse.data) {
                  setPayment(paymentResponse.data)
                }
              } catch (err) {
                console.warn('Không thể reload payment data:', err)
              }
            }
            setPaymentChecked(true)
            return
          }
          
          // Nếu payment đã success rồi thì không cần retry nữa
          if (checkData.paymentStatus?.isPaid) {
            setPaymentChecked(true)
            return
          }
        }
        
        // Nếu chưa update được và còn retry, tiếp tục retry
        if (retryCount < maxRetries - 1) {
          retryCount++
          setTimeout(() => {
            checkPaymentByOrderCode(useLocalhost)
          }, retryDelay)
        } else {
          // Nếu đã thử với normal URL và thất bại, thử với localhost
          if (!useLocalhost) {
            console.log('[PaymentSuccessPage] Thử gọi trực tiếp đến localhost backend...')
            retryCount = 0
            setTimeout(() => {
              checkPaymentByOrderCode(true)
            }, retryDelay)
          } else {
            console.warn('[PaymentSuccessPage] Đã hết số lần retry, payment có thể chưa được cập nhật')
            setPaymentChecked(true)
          }
        }
      } catch (err) {
        console.warn(`[PaymentSuccessPage] Lỗi khi check payment (attempt ${retryCount + 1}):`, err)
        
        // Nếu là lỗi network và chưa thử localhost, thử localhost
        const axiosError = err as { code?: string; message?: string; response?: { status?: number } }
        const isNetworkError = axiosError.code === 'ERR_NETWORK' || 
                              axiosError.message?.includes('network') ||
                              axiosError.message?.includes('ngrok') ||
                              axiosError.response?.status === 502 ||
                              axiosError.response?.status === 503
        
        if (isNetworkError && !useLocalhost && retryCount >= maxRetries - 1) {
          // Thử localhost ngay lập tức
          console.log('[PaymentSuccessPage] Network error detected, trying localhost backend...')
          retryCount = 0
          setTimeout(() => {
            checkPaymentByOrderCode(true)
          }, 1000)
        } else if (retryCount < maxRetries - 1) {
          retryCount++
          setTimeout(() => {
            checkPaymentByOrderCode(useLocalhost)
          }, retryDelay)
        } else {
          console.warn('[PaymentSuccessPage] Không thể check payment status sau nhiều lần thử')
          setPaymentChecked(true)
        }
      }
    }
    
    // Bắt đầu check ngay lập tức
    checkPaymentByOrderCode()
  }, [searchParams, paymentChecked, bookingId])

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId || isNaN(parseInt(bookingId))) {
        setError('Không tìm thấy thông tin đặt dịch vụ')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch booking data
        const bookingResponse = await axiosInstance.get<BookingData>(
          `${API_ENDPOINTS.BOOKING}/${bookingId}`
        )
        const bookingData = bookingResponse.data

        if (!bookingData) {
          setError('Không tìm thấy thông tin đặt dịch vụ')
          setLoading(false)
          return
        }

        setBooking(bookingData)

        // Fetch payment data
        try {
          const paymentResponse = await axiosInstance.get<PaymentData>(
            `${API_ENDPOINTS.PAYMENT}/status/${bookingId}`
          )
          if (paymentResponse.data) {
            setPayment(paymentResponse.data)
          }
        } catch (err) {
          console.warn('Không thể lấy thông tin thanh toán:', err)
        }
      } catch (err: unknown) {
        console.error('Lỗi khi tải dữ liệu:', err)
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          setError('Không tìm thấy thông tin đặt dịch vụ')
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này. Vui lòng đăng nhập lại.')
          navigate('/login', { state: { returnUrl: `/payment/success/${bookingId}` } })
        } else {
          setError('Không thể tải thông tin. Vui lòng thử lại sau.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bookingId, navigate])

  // Ensure booking status is marked as success/completed in backend when viewing success page
  useEffect(() => {
    const ensureStatus = async () => {
      if (!bookingId || ensuredStatus || !booking) return
      try {
        const status = booking.Status || booking.status || ''
        const normalized = status.toLowerCase()
        const alreadyCompleted = ['completed', 'success'].includes(normalized)
        if (alreadyCompleted) {
          setEnsuredStatus(true)
          return
        }
        // Backend BookingController.UpdateStatus expects plain string body
        await axiosInstance.put(`${API_ENDPOINTS.BOOKING}/${bookingId}/status`, 'completed')
        setEnsuredStatus(true)
      } catch (err) {
        console.warn('Không thể cập nhật trạng thái booking sang completed:', err)
      }
    }
    ensureStatus()
  }, [bookingId, booking, ensuredStatus])

  if (loading) {
    return (
      <div className="payment-result-page">
        <Header />
        <main className="payment-result-main">
          <LoadingSpinner message="Đang tải thông tin..." />
        </main>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="payment-result-page">
        <Header />
        <main className="payment-result-main">
          <div className="payment-result-container">
            <div className="payment-error-container" role="alert">
              <h2 className="payment-error-title">Không thể tải thông tin</h2>
              <p className="payment-error-message">{error || 'Thông tin đặt dịch vụ không tồn tại'}</p>
              <Button variant="default" onClick={() => navigate('/services')}>
                Quay lại danh sách dịch vụ
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const bookingIdValue = booking.Id || booking.id || 0
  const bookingNumber = booking.BookingNumber || booking.bookingNumber || `#${bookingIdValue}`
  const totalAmount = booking.TotalAmount || booking.totalAmount || 0
  const serviceCombo = booking.ServiceCombo || booking.serviceCombo
  const serviceName = serviceCombo?.Name || serviceCombo?.name || 'Dịch vụ'
  const serviceAddress = serviceCombo?.Address || serviceCombo?.address || ''
  const quantity = booking.Quantity || booking.quantity || 0

  const paymentAmount = payment?.Amount ?? payment?.amount ?? totalAmount
  const paymentMethod = payment?.PaymentMethod || payment?.paymentMethod || 'PayOS'
  const paymentDate = payment?.CreatedAt || payment?.createdAt || new Date().toISOString()

  return (
    <div className="payment-result-page payment-success-page">
      <Header />
      <main className="payment-result-main">
        <div className="payment-result-container">
          {/* Success Icon */}
          <div className="payment-result-icon-wrapper">
            <div className="payment-result-icon-circle">
              <CheckCircleIcon className="payment-result-icon" />
            </div>
          </div>

          {/* Success Title */}
          <h1 className="payment-result-title">Đặt dịch vụ thành công!</h1>
          <p className="payment-result-subtitle">
            Cảm ơn bạn đã lựa chọn du lịch sinh thái! Hành trình khám phá thiên nhiên của bạn đã được xác nhận.
          </p>

          {/* Details Card */}
          <Card className="payment-result-card">
            <CardContent>
              {/* Booking Code */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Mã đặt dịch vụ:</span>
                <span className="payment-detail-value payment-booking-code">{bookingNumber}</span>
              </div>

              {/* Service */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Dịch vụ:</span>
                <span className="payment-detail-value">{serviceName}</span>
              </div>

              {/* Location */}
              {serviceAddress && (
                <div className="payment-detail-item">
                  <span className="payment-detail-label">Địa điểm:</span>
                  <span className="payment-detail-value">{serviceAddress}</span>
                </div>
              )}

              {/* Quantity */}
              {quantity > 0 && (
                <div className="payment-detail-item">
                  <span className="payment-detail-label">Số lượng:</span>
                  <span className="payment-detail-value">{quantity} người</span>
                </div>
              )}

              {/* Amount Paid */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Số tiền đã thanh toán:</span>
                <span className="payment-detail-value payment-amount">{formatPrice(paymentAmount)}</span>
              </div>

              {/* Payment Method */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Phương thức thanh toán:</span>
                <span className="payment-detail-value">{paymentMethod}</span>
              </div>

              {/* Payment Time */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Thời gian thanh toán:</span>
                <span className="payment-detail-value">
                  lúc {new Date(paymentDate).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} {new Date(paymentDate).toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="payment-action-buttons">
            <Button
              onClick={() => navigate(`/payment/${bookingId}`, { state: { returnUrl: '/profile', returnTab: 'bookings' } })}
              variant="default"
              size="lg"
              className="payment-primary-button"
            >
              <FileTextIcon className="payment-button-icon" />
              Xem chi tiết đơn
            </Button>
            <Button
              onClick={() => navigate('/services')}
              variant="outline"
              size="lg"
              className="payment-secondary-button"
            >
              <MapPinIcon className="payment-button-icon" />
              Khám phá thêm
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              className="payment-secondary-button"
            >
              <HomeIcon className="payment-button-icon" />
              Về trang chủ
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PaymentSuccessPage




