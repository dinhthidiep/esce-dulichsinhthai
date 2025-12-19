import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import LoadingSpinner from './LoadingSpinner'
import './UpgradePaymentSuccessPage.css'

/**
 * Trang callback xử lý kết quả thanh toán từ PayOS
 * PayOS sẽ redirect về đây với các query params:
 * - orderCode: Mã đơn hàng
 * - status: Trạng thái (PAID, CANCELLED, etc.)
 * - code: Mã kết quả (00 = thành công)
 * - cancel: true nếu user hủy
 */
const UpgradePaymentCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // Lấy params từ PayOS
        const orderCode = searchParams.get('orderCode')
        const status = searchParams.get('status')
        const code = searchParams.get('code')
        const cancel = searchParams.get('cancel')
        const id = searchParams.get('id') // Transaction ID

        console.log('🔧 [PaymentCallback] Params:', { orderCode, status, code, cancel, id })

        // Kiểm tra nếu user hủy thanh toán
        if (cancel === 'true') {
          console.log('🔧 [PaymentCallback] User cancelled payment')
          navigate('/upgrade-payment-failure?reason=cancelled')
          return
        }

        // Kiểm tra thanh toán thành công
        // PayOS trả về code=00 hoặc status=PAID khi thành công
        const isPaid = code === '00' || status?.toUpperCase() === 'PAID'

        if (isPaid) {
          console.log('🔧 [PaymentCallback] Payment successful')
          // Redirect đến trang success với thông tin
          navigate(`/upgrade-payment-success?type=agency&orderCode=${orderCode}`)
        } else {
          console.log('🔧 [PaymentCallback] Payment failed or pending')
          navigate(`/upgrade-payment-failure?reason=failed&orderCode=${orderCode}`)
        }
      } catch (err) {
        console.error('❌ [PaymentCallback] Error:', err)
        setError('Có lỗi xảy ra khi xử lý kết quả thanh toán')
        setProcessing(false)
      }
    }

    processPaymentResult()
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="upg-success-upgrade-payment-success-page">
        <Header />
        <main className="upg-success-upgrade-payment-success-main">
          <div className="upg-success-upgrade-payment-success-container">
            <p style={{ color: '#dc2626', textAlign: 'center' }}>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="upg-success-upgrade-payment-success-page">
      <Header />
      <main className="upg-success-upgrade-payment-success-main">
        <div className="upg-success-upgrade-payment-success-container">
          <LoadingSpinner message="Đang xử lý kết quả thanh toán..." />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default UpgradePaymentCallback
