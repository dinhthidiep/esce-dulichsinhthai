import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import LoadingSpinner from './LoadingSpinner'
import { 
  ArrowLeftIcon, 
  CreditCardIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from './icons/index'
import './UpgradePaymentPage.css'

interface UpgradePaymentData {
  type: 'host' | 'agency'
  amount: number
  businessName?: string
  companyName?: string
  certificateId?: number
}

const UpgradePaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { upgradeRequestId } = useParams<{ upgradeRequestId: string }>()
  const [paymentData, setPaymentData] = useState<UpgradePaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('🔧 [UpgradePaymentPage] Component rendered')
  console.log('🔧 [UpgradePaymentPage] upgradeRequestId:', upgradeRequestId)
  console.log('🔧 [UpgradePaymentPage] location.state:', location.state)
  console.log('🔧 [UpgradePaymentPage] location.pathname:', location.pathname)

  useEffect(() => {
    console.log('🔧 [UpgradePaymentPage] useEffect running')
    
    // Ưu tiên lấy dữ liệu từ location.state (được truyền từ RegisterHost/RegisterAgency)
    const stateData = location.state as UpgradePaymentData
    if (stateData) {
      console.log('🔧 [UpgradePaymentPage] Got data from state:', stateData)
      setPaymentData(stateData)
      setLoading(false)
      return
    }

    // Fallback: Lấy type từ URL params (ví dụ: /upgrade/payment/agency)
    if (upgradeRequestId) {
      const typeFromUrl = upgradeRequestId.toLowerCase()
      console.log('🔧 [UpgradePaymentPage] typeFromUrl:', typeFromUrl)
      if (typeFromUrl === 'agency' || typeFromUrl === 'host') {
        setPaymentData({
          type: typeFromUrl as 'host' | 'agency',
          amount: typeFromUrl === 'agency' ? 5000 : 0 // Test amount
        })
        setLoading(false)
        return
      }
    }

    // Nếu không có data nào, quay lại trang upgrade
    console.log('🔧 [UpgradePaymentPage] No data, redirecting to /upgrade-account')
    navigate('/upgrade-account')
  }, [location, navigate, upgradeRequestId])

  // Get userId helper
  const getUserId = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const userId = userInfo.Id || userInfo.id
        if (userId) {
          const parsedId = parseInt(userId)
          if (!isNaN(parsedId) && parsedId > 0) {
            return parsedId
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }

  const handlePayment = async () => {
    if (!paymentData) return

    setProcessing(true)
    setError(null)

    try {
      const userId = getUserId()
      console.log('🔧 [UpgradePayment] userId:', userId)
      
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        setProcessing(false)
        return
      }

      // Backend yêu cầu UpgradeType phải là "Host" hoặc "Agency" (chữ hoa)
      // Và Host upgrade là miễn phí, chỉ Agency cần thanh toán
      if (paymentData.type === 'host') {
        // Host upgrade miễn phí, không cần gọi payment API
        navigate('/upgrade-payment-success', {
          state: {
            type: paymentData.type,
            amount: 0,
            paymentMethod: 'free',
            certificateId: paymentData.certificateId
          }
        })
        return
      }

      // Gọi API tạo upgrade payment cho Agency
      // PayOS chỉ cho phép description tối đa 25 ký tự
      const description = `Nâng cấp Agency`.substring(0, 25)
      
      const requestBody = {
        UserId: userId,
        UpgradeType: 'Agency', // Backend yêu cầu chữ hoa
        Amount: paymentData.amount,
        Description: description
      }
      
      console.log('🔧 [UpgradePayment] Calling API:', `${API_ENDPOINTS.PAYMENT}/create-upgrade-payment`)
      console.log('🔧 [UpgradePayment] Request body:', requestBody)
      
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.PAYMENT}/create-upgrade-payment`,
        requestBody
      )

      console.log('🔧 [UpgradePayment] Response:', response.data)

      // Nếu có payment URL từ PayOS, redirect đến đó
      if (response.data?.checkoutUrl) {
        console.log('🔧 [UpgradePayment] Redirecting to PayOS:', response.data.checkoutUrl)
        window.location.href = response.data.checkoutUrl
        return
      }

      console.log('🔧 [UpgradePayment] No checkoutUrl, navigating to success page')
      // Nếu không có checkout URL, chuyển tới trang success
      navigate('/upgrade-payment-success', {
        state: {
          type: paymentData.type,
          amount: paymentData.amount,
          paymentMethod: 'payos',
          certificateId: paymentData.certificateId,
          paymentId: response.data?.paymentId
        }
      })
    } catch (err: any) {
      console.error('❌ [UpgradePayment] Error:', err)
      console.error('❌ [UpgradePayment] Error response:', err.response?.data)
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.'
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="upg-pay-upgrade-payment-page">
        <Header />
        <main className="upg-pay-upgrade-payment-main">
          <div className="upg-pay-upgrade-payment-container">
            <LoadingSpinner message="Đang tải thông tin thanh toán..." />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!paymentData) {
    return null
  }

  const typeLabel = paymentData.type === 'host' ? 'Host' : 'Agency'
  const name = paymentData.businessName || paymentData.companyName || ''

  return (
    <div className="upg-pay-upgrade-payment-page">
      <Header />
      <main className="upg-pay-upgrade-payment-main">
        <div className="upg-pay-upgrade-payment-container">
          {/* Header */}
          <div className="upg-pay-payment-header">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/upgrade-account')}
              className="upg-pay-back-button"
            >
              <ArrowLeftIcon className="upg-pay-back-icon" />
              Quay lại
            </Button>
            <h1 className="upg-pay-payment-title">Thanh toán nâng cấp tài khoản</h1>
            <p className="upg-pay-payment-subtitle">
              Thanh toán phí nâng cấp lên {typeLabel}
            </p>
          </div>

          <div className="upg-pay-payment-content-grid">
            {/* Payment Info */}
            <Card className="upg-pay-payment-info-card">
              <CardContent>
                <h2 className="upg-pay-info-card-title">Thông tin thanh toán</h2>
                <div className="upg-pay-payment-details">
                  <div className="upg-pay-detail-row">
                    <span className="upg-pay-detail-label">Loại nâng cấp:</span>
                    <span className="upg-pay-detail-value">Nâng cấp lên {typeLabel}</span>
                  </div>
                  {name && (
                    <div className="upg-pay-detail-row">
                      <span className="upg-pay-detail-label">
                        {paymentData.type === 'host' ? 'Tên doanh nghiệp:' : 'Tên công ty:'}
                      </span>
                      <span className="upg-pay-detail-value">{name}</span>
                    </div>
                  )}
                  <div className="upg-pay-detail-row upg-pay-total-row">
                    <span className="upg-pay-detail-label">Tổng tiền:</span>
                    <span className="upg-pay-detail-value upg-pay-total-amount">
                      {new Intl.NumberFormat('vi-VN').format(paymentData.amount)} <span className="upg-pay-currency">VNĐ</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="upg-pay-payment-method-card">
              <CardContent>
                <h2 className="upg-pay-info-card-title">Phương thức thanh toán</h2>
                <div className="upg-pay-payment-methods">
                  <div className="upg-pay-payment-method upg-pay-selected">
                    <div className="upg-pay-method-info">
                      <CreditCardIcon className="upg-pay-method-icon" />
                      <div>
                        <div className="upg-pay-method-name">PayOS</div>
                        <div className="upg-pay-method-description">Thanh toán qua cổng PayOS (Thẻ ngân hàng, QR Code)</div>
                      </div>
                    </div>
                    <CheckCircleIcon className="upg-pay-check-icon" />
                  </div>
                </div>

                {error && (
                  <div className="upg-pay-error-alert">
                    <AlertCircleIcon className="upg-pay-error-icon" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  variant="default"
                  size="lg"
                  className="upg-pay-pay-button"
                >
                  {processing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="upg-pay-spinner-small"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    <>
                      Thanh toán {new Intl.NumberFormat('vi-VN').format(paymentData.amount)} VNĐ
                    </>
                  )}
                </Button>

                <div className="upg-pay-payment-note">
                  <p>• Sau khi thanh toán thành công, yêu cầu của bạn sẽ được gửi tới Admin để xét duyệt.</p>
                  <p>• Thời gian xét duyệt: 1-3 ngày làm việc.</p>
                  <p>• Nếu yêu cầu bị từ chối, bạn sẽ được hoàn lại 100% phí đã thanh toán.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default UpgradePaymentPage





















