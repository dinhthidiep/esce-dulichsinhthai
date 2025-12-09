import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import LoadingSpinner from './LoadingSpinner'
import { 
  XCircleIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  CreditCardIcon
} from './icons/index'
import { formatPrice } from '~/lib/utils'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import './PaymentFailurePage.css'

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

const PaymentFailurePage = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failureReason, setFailureReason] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId || isNaN(parseInt(bookingId))) {
        // Nếu không có bookingId hợp lệ, sử dụng mock data để demo
        console.log('⚠️ Không có bookingId hợp lệ, sử dụng mock data để demo')
        const mockBooking: BookingData = {
          Id: 1,
          BookingNumber: 'BK-2024-001',
          TotalAmount: 2500000,
          Status: 'pending',
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
        setBooking(mockBooking)
        setFailureReason('Giao dịch bị từ chối bởi ngân hàng. Vui lòng kiểm tra lại thông tin thẻ thanh toán.')
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
              setFailureReason('Giao dịch đã bị hủy hoặc thất bại. Vui lòng thử lại.')
            } else {
              setFailureReason('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.')
            }
          } else {
            setFailureReason('Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại.')
          }
        } catch (err) {
          console.warn('Không thể lấy thông tin thanh toán:', err)
          setFailureReason('Không thể kết nối đến hệ thống thanh toán. Vui lòng thử lại sau.')
        }
      } catch (err: unknown) {
        console.error('Lỗi khi tải dữ liệu:', err)
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          // Nếu không tìm thấy, sử dụng mock data để demo
          console.log('⚠️ Không tìm thấy booking, sử dụng mock data để demo')
          const bookingIdNum = parseInt(bookingId) || 1
          const bookingIdStr = String(bookingIdNum).padStart(3, '0')
          
          // Mock data khác nhau tùy theo bookingId để test
          const mockServices = [
            {
              Name: 'Tour Đà Lạt 3 ngày 2 đêm',
              Address: 'Đà Lạt, Lâm Đồng',
              Price: 2500000
            },
            {
              Name: 'Tour Hà Nội - Sapa 4 ngày 3 đêm',
              Address: 'Sapa, Lào Cai',
              Price: 3500000
            },
            {
              Name: 'Tour Phú Quốc 5 ngày 4 đêm',
              Address: 'Phú Quốc, Kiên Giang',
              Price: 4500000
            }
          ]
          
          const serviceIndex = (bookingIdNum - 1) % mockServices.length
          const selectedService = mockServices[serviceIndex]
          
          const mockBooking: BookingData = {
            Id: bookingIdNum,
            BookingNumber: `BK-2024-${bookingIdStr}`,
            TotalAmount: selectedService.Price,
            Status: 'pending',
            StartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            EndDate: new Date(Date.now() + (7 + serviceIndex + 2) * 24 * 60 * 60 * 1000).toISOString(),
            Quantity: bookingIdNum % 3 + 1, // 1-3 người
            ServiceCombo: {
              Id: bookingIdNum,
              Name: selectedService.Name,
              Address: selectedService.Address,
              Image: '/img/banahills.jpg'
            }
          }
          setBooking(mockBooking)
          
          // Lý do thất bại khác nhau tùy theo bookingId
          const failureReasons = [
            'Giao dịch bị từ chối bởi ngân hàng. Vui lòng kiểm tra lại thông tin thẻ thanh toán.',
            'Số dư tài khoản không đủ để thực hiện giao dịch. Vui lòng nạp thêm tiền và thử lại.',
            'Thẻ thanh toán đã hết hạn hoặc bị khóa. Vui lòng sử dụng thẻ khác hoặc liên hệ ngân hàng.',
            'Vượt quá hạn mức giao dịch trong ngày. Vui lòng thử lại vào ngày mai hoặc liên hệ ngân hàng.',
            'Lỗi kết nối với hệ thống thanh toán. Vui lòng thử lại sau vài phút.'
          ]
          const reasonIndex = (bookingIdNum - 1) % failureReasons.length
          setFailureReason(failureReasons[reasonIndex])
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          setError('Bạn không có quyền xem thông tin này. Vui lòng đăng nhập lại.')
          navigate('/login', { state: { returnUrl: `/payment-failure/${bookingId}` } })
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
      <div className="pay-fail-payment-failure-page">
        <Header />
        <main className="pay-fail-payment-failure-main">
          <LoadingSpinner message="Đang tải thông tin..." />
        </main>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="pay-fail-payment-failure-page">
        <Header />
        <main className="pay-fail-payment-failure-main">
          <div className="pay-fail-payment-failure-container">
            <div className="pay-fail-error-container" role="alert">
              <h2 className="pay-fail-error-title">Không thể tải thông tin</h2>
              <p className="pay-fail-error-message">{error || 'Thông tin đặt dịch vụ không tồn tại'}</p>
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
    <div className="pay-fail-payment-failure-page">
      <Header />
      <main className="pay-fail-payment-failure-main">
        <div className="pay-fail-payment-failure-container">
          {/* Failure Icon */}
          <div className="pay-fail-failure-icon-wrapper">
            <XCircleIcon className="pay-fail-failure-icon" />
          </div>

          {/* Failure Message */}
          <Card className="pay-fail-failure-card">
            <CardContent>
              <h1 className="pay-fail-failure-title">Thanh toán thất bại</h1>
              <p className="pay-fail-failure-message">
                Rất tiếc, giao dịch thanh toán của bạn không thể hoàn tất. Vui lòng kiểm tra lại thông tin và thử lại.
              </p>

              {/* Failure Reason */}
              {failureReason && (
                <div className="pay-fail-failure-reason-box">
                  <AlertCircleIcon className="pay-fail-alert-icon" />
                  <p className="pay-fail-failure-reason-text">{failureReason}</p>
                </div>
              )}

              {/* Booking Details */}
              <div className="pay-fail-details-section">
                <h2 className="pay-fail-details-title">Thông tin đặt dịch vụ</h2>
                <div className="pay-fail-details-list">
                  <div className="pay-fail-detail-item">
                    <span className="pay-fail-detail-label">Mã đặt dịch vụ:</span>
                    <span className="pay-fail-detail-value">{bookingNumber}</span>
                  </div>
                  <div className="pay-fail-detail-item">
                    <span className="pay-fail-detail-label">Dịch vụ:</span>
                    <span className="pay-fail-detail-value">{serviceName}</span>
                  </div>
                  {serviceAddress && (
                    <div className="pay-fail-detail-item">
                      <span className="pay-fail-detail-label">Địa điểm:</span>
                      <span className="pay-fail-detail-value">{serviceAddress}</span>
                    </div>
                  )}
                  {quantity > 0 && (
                    <div className="pay-fail-detail-item">
                      <span className="pay-fail-detail-label">Số lượng:</span>
                      <span className="pay-fail-detail-value">{quantity} người</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="pay-fail-details-section">
                <h2 className="pay-fail-details-title">Thông tin thanh toán</h2>
                <div className="pay-fail-details-list">
                  <div className="pay-fail-detail-item">
                    <span className="pay-fail-detail-label">Số tiền:</span>
                    <span className="pay-fail-detail-value pay-fail-amount">
                      {formatPrice(paymentAmount)}
                    </span>
                  </div>
                  <div className="pay-fail-detail-item">
                    <span className="pay-fail-detail-label">
                      <CreditCardIcon className="pay-fail-detail-icon" />
                      Phương thức thanh toán:
                    </span>
                    <span className="pay-fail-detail-value">{paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Common Issues */}
              <div className="pay-fail-common-issues-section">
                <h3 className="pay-fail-common-issues-title">Các nguyên nhân thường gặp:</h3>
                <ul className="pay-fail-issues-list">
                  <li className="pay-fail-issue-item">
                    <span className="pay-fail-issue-icon">•</span>
                    <span className="pay-fail-issue-text">Thông tin thẻ thanh toán không chính xác</span>
                  </li>
                  <li className="pay-fail-issue-item">
                    <span className="pay-fail-issue-icon">•</span>
                    <span className="pay-fail-issue-text">Số dư tài khoản không đủ</span>
                  </li>
                  <li className="pay-fail-issue-item">
                    <span className="pay-fail-issue-icon">•</span>
                    <span className="pay-fail-issue-text">Thẻ bị khóa hoặc hết hạn</span>
                  </li>
                  <li className="pay-fail-issue-item">
                    <span className="pay-fail-issue-icon">•</span>
                    <span className="pay-fail-issue-text">Vượt quá hạn mức giao dịch</span>
                  </li>
                  <li className="pay-fail-issue-item">
                    <span className="pay-fail-issue-icon">•</span>
                    <span className="pay-fail-issue-text">Lỗi kết nối mạng hoặc hệ thống</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pay-fail-action-buttons">
                <Button
                  onClick={() => navigate(`/payment/${bookingIdValue}`)}
                  variant="default"
                  size="lg"
                  className="pay-fail-retry-payment-button"
                >
                  <RefreshCwIcon className="pay-fail-button-icon" />
                  Thử thanh toán lại
                </Button>
                <Button
                  onClick={() => navigate('/profile', { state: { activeTab: 'bookings' } })}
                  variant="outline"
                  size="lg"
                  className="pay-fail-view-booking-button"
                >
                  Xem đơn đặt dịch vụ
                  <ArrowRightIcon className="pay-fail-button-icon" />
                </Button>
                <Button
                  onClick={() => navigate('/services')}
                  variant="outline"
                  size="lg"
                  className="pay-fail-view-services-button"
                >
                  Xem thêm dịch vụ
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="pay-fail-home-button"
                >
                  Về trang chủ
                </Button>
              </div>

              {/* Support Info */}
              <div className="pay-fail-support-info-box">
                <AlertCircleIcon className="pay-fail-support-icon" />
                <div className="pay-fail-support-content">
                  <strong>Cần hỗ trợ?</strong>
                  <p>Nếu bạn gặp vấn đề liên tục, vui lòng liên hệ bộ phận hỗ trợ khách hàng của chúng tôi để được hỗ trợ.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PaymentFailurePage

