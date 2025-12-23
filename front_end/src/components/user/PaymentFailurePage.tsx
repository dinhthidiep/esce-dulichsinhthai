import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import LoadingSpinner from './LoadingSpinner'
import { 
  XCircleIcon,
  RefreshCwIcon,
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
  [key: string]: unknown
}

const PaymentFailurePage = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failureReason, setFailureReason] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      // Kiểm tra query params
      const reason = searchParams.get('reason')
      const errorParam = searchParams.get('error')
      
      if (reason === 'cancelled') {
        setFailureReason('Bạn đã hủy giao dịch thanh toán. Vui lòng thử lại nếu bạn muốn tiếp tục.')
      } else if (errorParam) {
        if (errorParam === 'missing_order_code') {
          setFailureReason('Không tìm thấy thông tin giao dịch. Vui lòng thử lại.')
        } else if (errorParam === 'booking_not_found') {
          setFailureReason('Không tìm thấy thông tin đặt dịch vụ. Vui lòng liên hệ hỗ trợ.')
        } else if (errorParam === 'server_error') {
          setFailureReason('Có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.')
        }
      }

      if (!bookingId || isNaN(parseInt(bookingId)) || parseInt(bookingId) === 0) {
        if (!errorParam && !reason) {
          setError('Không tìm thấy thông tin đặt dịch vụ')
        }
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
            const paymentStatus = paymentResponse.data.Status || paymentResponse.data.status || ''
            if (paymentStatus.toLowerCase() === 'failed' || paymentStatus.toLowerCase() === 'cancelled') {
              if (!failureReason) {
                setFailureReason('Giao dịch đã bị hủy hoặc thất bại. Vui lòng thử lại.')
              }
            } else {
              if (!failureReason) {
                setFailureReason('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.')
              }
            }
          } else {
            if (!failureReason) {
              setFailureReason('Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại.')
            }
          }
        } catch (err) {
          console.warn('Không thể lấy thông tin thanh toán:', err)
          if (!failureReason) {
            setFailureReason('Không thể kết nối đến hệ thống thanh toán. Vui lòng thử lại sau.')
          }
        }
      } catch (err: unknown) {
        console.error('Lỗi khi tải dữ liệu:', err)
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          setError('Không tìm thấy thông tin đặt dịch vụ')
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này. Vui lòng đăng nhập lại.')
          navigate('/login', { state: { returnUrl: `/payment/failure/${bookingId}` } })
        } else {
          setError('Không thể tải thông tin. Vui lòng thử lại sau.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bookingId, navigate, searchParams])

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

  return (
    <div className="payment-result-page payment-failure-page">
      <Header />
      <main className="payment-result-main">
        <div className="payment-result-container">
          {/* Failure Icon */}
          <div className="payment-result-icon-wrapper">
            <div className="payment-result-icon-circle payment-failure-icon-circle">
              <XCircleIcon className="payment-result-icon" />
            </div>
          </div>

          {/* Failure Title */}
          <h1 className="payment-result-title payment-failure-title">Thanh toán thất bại</h1>
          <p className="payment-result-subtitle payment-failure-subtitle">
            Rất tiếc, giao dịch thanh toán của bạn không thể hoàn tất. {failureReason || 'Vui lòng kiểm tra lại thông tin và thử lại.'}
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

              {/* Amount */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Số tiền:</span>
                <span className="payment-detail-value payment-amount">{formatPrice(paymentAmount)}</span>
              </div>

              {/* Payment Method */}
              <div className="payment-detail-item">
                <span className="payment-detail-label">Phương thức thanh toán:</span>
                <span className="payment-detail-value">{paymentMethod}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="payment-action-buttons">
            <Button
              onClick={() => navigate(`/payment/${bookingIdValue}`)}
              variant="default"
              size="lg"
              className="payment-primary-button payment-retry-button"
            >
              <RefreshCwIcon className="payment-button-icon" />
              Thử thanh toán lại
            </Button>
            <Button
              onClick={() => navigate('/services')}
              variant="outline"
              size="lg"
              className="payment-secondary-button"
            >
              <MapPinIcon className="payment-button-icon" />
              Khám phá thêm điểm đến sinh thái
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

export default PaymentFailurePage





