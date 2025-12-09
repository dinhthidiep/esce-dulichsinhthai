import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const [paymentData, setPaymentData] = useState<UpgradePaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'momo' | 'bank'>('vnpay')

  useEffect(() => {
    // Lấy dữ liệu từ location.state (được truyền từ RegisterHost/RegisterAgency)
    const data = location.state as UpgradePaymentData
    if (data) {
      setPaymentData(data)
      setLoading(false)
    } else {
      // Nếu không có data, quay lại trang upgrade
      navigate('/upgrade-account')
    }
  }, [location, navigate])

  const handlePayment = async () => {
    if (!paymentData) return

    setProcessing(true)
    setError(null)

    try {
      // TODO: Gọi API thanh toán thực tế
      // Hiện tại mock payment thành công sau 2 giây
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Chuyển tới trang xác nhận thanh toán thành công
      navigate('/upgrade-payment-success', {
        state: {
          type: paymentData.type,
          amount: paymentData.amount,
          paymentMethod: selectedMethod,
          certificateId: paymentData.certificateId
        }
      })
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.')
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
                  <div 
                    className={`upg-pay-payment-method ${selectedMethod === 'vnpay' ? 'upg-pay-selected' : ''}`}
                    onClick={() => setSelectedMethod('vnpay')}
                  >
                    <div className="upg-pay-method-info">
                      <CreditCardIcon className="upg-pay-method-icon" />
                      <div>
                        <div className="upg-pay-method-name">VNPay</div>
                        <div className="upg-pay-method-description">Thanh toán qua cổng VNPay</div>
                      </div>
                    </div>
                    {selectedMethod === 'vnpay' && (
                      <CheckCircleIcon className="upg-pay-check-icon" />
                    )}
                  </div>

                  <div 
                    className={`upg-pay-payment-method ${selectedMethod === 'momo' ? 'upg-pay-selected' : ''}`}
                    onClick={() => setSelectedMethod('momo')}
                  >
                    <div className="upg-pay-method-info">
                      <CreditCardIcon className="upg-pay-method-icon" />
                      <div>
                        <div className="upg-pay-method-name">MoMo</div>
                        <div className="upg-pay-method-description">Ví điện tử MoMo</div>
                      </div>
                    </div>
                    {selectedMethod === 'momo' && (
                      <CheckCircleIcon className="upg-pay-check-icon" />
                    )}
                  </div>

                  <div 
                    className={`upg-pay-payment-method ${selectedMethod === 'bank' ? 'upg-pay-selected' : ''}`}
                    onClick={() => setSelectedMethod('bank')}
                  >
                    <div className="upg-pay-method-info">
                      <CreditCardIcon className="upg-pay-method-icon" />
                      <div>
                        <div className="upg-pay-method-name">Chuyển khoản ngân hàng</div>
                        <div className="upg-pay-method-description">Chuyển khoản trực tiếp</div>
                      </div>
                    </div>
                    {selectedMethod === 'bank' && (
                      <CheckCircleIcon className="upg-pay-check-icon" />
                    )}
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
















