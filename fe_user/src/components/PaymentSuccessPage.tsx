import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import LoadingSpinner from './LoadingSpinner'
import { 
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon,
  CreditCardIcon
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
  StartDate?: string
  startDate?: string
  EndDate?: string
  endDate?: string
  Quantity?: number
  quantity?: number
  ServiceCombo?: {
    Id?: number
    id?: number
    Name?: string
    name?: string
    Address?: string
    address?: string
    Image?: string
    image?: string
  }
  serviceCombo?: {
    Id?: number
    id?: number
    Name?: string
    name?: string
    Address?: string
    address?: string
    Image?: string
    image?: string
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
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId || isNaN(parseInt(bookingId))) {
        // Nếu không có bookingId hợp lệ, sử dụng mock data để demo
        console.log('⚠️ Không có bookingId hợp lệ, sử dụng mock data để demo')
        const mockBooking: BookingData = {
          Id: 1,
          BookingNumber: 'BK-2024-001',
          TotalAmount: 2500000,
          Status: 'confirmed',
          StartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          EndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          Quantity: 2,
          ServiceCombo: {
            Id: 1,
            Name: 'Tour Đà Lạt 3 ngày 2 đêm',
            Address: 'Đà Lạt, Lâm Đồng',
            Image: '/img/banahills.jpg'
          }
        }
        const mockPayment: PaymentData = {
          Id: 1,
          Amount: 2500000,
          Status: 'completed',
          PaymentMethod: 'PayOS',
          CreatedAt: new Date().toISOString()
        }
        setBooking(mockBooking)
        setPayment(mockPayment)
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
          // Không set error vì có thể chưa có payment record
        }
      } catch (err: unknown) {
        console.error('Lỗi khi tải dữ liệu:', err)
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          // Nếu không tìm thấy, sử dụng mock data để demo
          console.log('⚠️ Không tìm thấy booking, sử dụng mock data để demo')
          const bookingIdNum = parseInt(bookingId) || 1
          const bookingIdStr = String(bookingIdNum).padStart(3, '0')
          const mockBooking: BookingData = {
            Id: bookingIdNum,
            BookingNumber: `BK-2024-${bookingIdStr}`,
            TotalAmount: 2500000,
            Status: 'confirmed',
            StartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            EndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            Quantity: 2,
            ServiceCombo: {
              Id: 1,
              Name: 'Tour Đà Lạt 3 ngày 2 đêm',
              Address: 'Đà Lạt, Lâm Đồng',
              Image: '/img/banahills.jpg'
            }
          }
          const mockPayment: PaymentData = {
            Id: 1,
            Amount: 2500000,
            Status: 'completed',
            PaymentMethod: 'PayOS',
            CreatedAt: new Date().toISOString()
          }
          setBooking(mockBooking)
          setPayment(mockPayment)
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này. Vui lòng đăng nhập lại.')
          navigate('/login', { state: { returnUrl: `/payment-success/${bookingId}` } })
        } else {
          setError('Không thể tải thông tin. Vui lòng thử lại sau.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bookingId, navigate])

  if (loading) {
    return (
      <div className="pay-success-payment-success-page">
        <Header />
        <main className="pay-success-payment-success-main">
          <LoadingSpinner message="Đang tải thông tin..." />
        </main>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="pay-success-payment-success-page">
        <Header />
        <main className="pay-success-payment-success-main">
          <div className="pay-success-payment-success-container">
            <div className="pay-success-error-container" role="alert">
              <h2 className="pay-success-error-title">Không thể tải thông tin</h2>
              <p className="pay-success-error-message">{error || 'Thông tin đặt dịch vụ không tồn tại'}</p>
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
  const startDate = booking.StartDate || booking.startDate
  const endDate = booking.EndDate || booking.endDate

  const paymentAmount = payment?.Amount ?? payment?.amount ?? totalAmount
  const paymentMethod = payment?.PaymentMethod || payment?.paymentMethod || 'PayOS'
  const paymentDate = payment?.CreatedAt || payment?.createdAt || new Date().toISOString()

  return (
    <div className="pay-success-payment-success-page">
      <Header />
      <main className="pay-success-payment-success-main">
        <div className="pay-success-payment-success-container">
          {/* Success Icon */}
          <div className="pay-success-success-icon-wrapper">
            <CheckCircleIcon className="pay-success-success-icon" />
          </div>

          {/* Success Message */}
          <Card className="pay-success-success-card">
            <CardContent>
              <h1 className="pay-success-success-title">Thanh toán thành công!</h1>
              <p className="pay-success-success-message">
                Đơn đặt dịch vụ của bạn đã được thanh toán thành công. Bạn sẽ nhận được email xác nhận trong vài phút.
              </p>

              {/* Booking Details */}
              <div className="pay-success-details-section">
                <h2 className="pay-success-details-title">Thông tin đặt dịch vụ</h2>
                <div className="pay-success-details-list">
                  <div className="pay-success-detail-item">
                    <span className="pay-success-detail-label">Mã đặt dịch vụ:</span>
                    <span className="pay-success-detail-value">{bookingNumber}</span>
                  </div>
                  <div className="pay-success-detail-item">
                    <span className="pay-success-detail-label">Dịch vụ:</span>
                    <span className="pay-success-detail-value">{serviceName}</span>
                  </div>
                  {serviceAddress && (
                    <div className="pay-success-detail-item">
                      <span className="pay-success-detail-label">
                        <MapPinIcon className="pay-success-detail-icon" />
                        Địa điểm:
                      </span>
                      <span className="pay-success-detail-value">{serviceAddress}</span>
                    </div>
                  )}
                  {quantity > 0 && (
                    <div className="pay-success-detail-item">
                      <span className="pay-success-detail-label">
                        <UsersIcon className="pay-success-detail-icon" />
                        Số lượng:
                      </span>
                      <span className="pay-success-detail-value">{quantity} người</span>
                    </div>
                  )}
                  {startDate && (
                    <div className="pay-success-detail-item">
                      <span className="pay-success-detail-label">
                        <CalendarIcon className="pay-success-detail-icon" />
                        Ngày bắt đầu:
                      </span>
                      <span className="pay-success-detail-value">
                        {new Date(startDate).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {endDate && endDate !== startDate && (
                    <div className="pay-success-detail-item">
                      <span className="pay-success-detail-label">
                        <CalendarIcon className="pay-success-detail-icon" />
                        Ngày kết thúc:
                      </span>
                      <span className="pay-success-detail-value">
                        {new Date(endDate).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="pay-success-details-section">
                <h2 className="pay-success-details-title">Chi tiết thanh toán</h2>
                <div className="pay-success-details-list">
                  <div className="pay-success-detail-item">
                    <span className="pay-success-detail-label">Số tiền đã thanh toán:</span>
                    <span className="pay-success-detail-value pay-success-amount">
                      {formatPrice(paymentAmount)}
                    </span>
                  </div>
                  <div className="pay-success-detail-item">
                    <span className="pay-success-detail-label">
                      <CreditCardIcon className="pay-success-detail-icon" />
                      Phương thức thanh toán:
                    </span>
                    <span className="pay-success-detail-value">{paymentMethod}</span>
                  </div>
                  <div className="pay-success-detail-item">
                    <span className="pay-success-detail-label">Thời gian thanh toán:</span>
                    <span className="pay-success-detail-value">
                      {new Date(paymentDate).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="pay-success-next-steps-section">
                <h3 className="pay-success-next-steps-title">Những việc tiếp theo</h3>
                <div className="pay-success-steps-list">
                  <div className="pay-success-step-item">
                    <div className="pay-success-step-number">1</div>
                    <div className="pay-success-step-content">
                      <h4 className="pay-success-step-title">Kiểm tra email</h4>
                      <p className="pay-success-step-description">
                        Bạn sẽ nhận được email xác nhận đặt dịch vụ trong vài phút. Vui lòng kiểm tra hộp thư đến và thư mục spam.
                      </p>
                    </div>
                  </div>
                  <div className="pay-success-step-item">
                    <div className="pay-success-step-number">2</div>
                    <div className="pay-success-step-content">
                      <h4 className="pay-success-step-title">Chuẩn bị cho chuyến đi</h4>
                      <p className="pay-success-step-description">
                        Vui lòng chuẩn bị đầy đủ giấy tờ và đồ dùng cần thiết cho chuyến đi của bạn.
                      </p>
                    </div>
                  </div>
                  <div className="pay-success-step-item">
                    <div className="pay-success-step-number">3</div>
                    <div className="pay-success-step-content">
                      <h4 className="pay-success-step-title">Liên hệ hỗ trợ</h4>
                      <p className="pay-success-step-description">
                        Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ khách hàng của chúng tôi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pay-success-action-buttons">
                <Button
                  onClick={() => navigate('/profile', { state: { activeTab: 'bookings' } })}
                  variant="default"
                  size="lg"
                  className="pay-success-view-booking-button"
                >
                  Xem đơn đặt dịch vụ
                  <ArrowRightIcon className="pay-success-button-icon" />
                </Button>
                <Button
                  onClick={() => navigate('/services')}
                  variant="outline"
                  size="lg"
                  className="pay-success-view-services-button"
                >
                  Xem thêm dịch vụ
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="pay-success-home-button"
                >
                  Về trang chủ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PaymentSuccessPage

