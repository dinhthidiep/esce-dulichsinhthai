import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { 
  CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  ShieldCheckIcon
} from './icons/index'
import './UpgradePaymentSuccessPage.css'

interface PaymentSuccessData {
  type: 'host' | 'agency'
  amount: number
  paymentMethod: string
  certificateId?: number
}

const UpgradePaymentSuccessPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(null)

  useEffect(() => {
    // Lấy dữ liệu từ location.state
    const data = location.state as PaymentSuccessData
    if (data) {
      setSuccessData(data)
    } else {
      // Nếu không có data, quay lại trang upgrade
      navigate('/upgrade-account')
    }
  }, [location, navigate])

  if (!successData) {
    return null
  }

  const typeLabel = successData.type === 'host' ? 'Host' : 'Agency'
  const isFreeUpgrade = successData.paymentMethod === 'free'
  const methodLabel = 
    isFreeUpgrade ? 'Miễn phí' :
    successData.paymentMethod === 'vnpay' ? 'VNPay' :
    successData.paymentMethod === 'momo' ? 'MoMo' :
    'Chuyển khoản ngân hàng'

  return (
    <div className="upgrade-payment-success-page">
      <Header />
      <main className="upgrade-payment-success-main">
        <div className="upgrade-payment-success-container">
          {/* Success Icon */}
          <div className="success-icon-wrapper">
            <CheckCircleIcon className="success-icon" />
          </div>

              {/* Success Message */}
              <Card className="success-card">
                <CardContent>
                  <h1 className="success-title">
                    {isFreeUpgrade ? 'Yêu cầu nâng cấp đã được gửi thành công!' : 'Thanh toán thành công!'}
                  </h1>
                  <p className="success-message">
                    Yêu cầu nâng cấp lên {typeLabel} của bạn đã được gửi thành công.
                  </p>
                  {isFreeUpgrade && successData.type === 'host' && (
                    <div className="host-fee-notice">
                      <p className="host-fee-notice-text">
                        <strong>Lưu ý:</strong> Nâng cấp tài khoản Host là miễn phí. Tuy nhiên, khi bạn bán dịch vụ, sẽ có một khoản phí 10% của giá trị đơn dịch vụ được trả cho admin của hệ thống.
                      </p>
                    </div>
                  )}

              {/* Payment Details */}
              <div className="payment-details-section">
                <h2 className="details-title">Chi tiết thanh toán</h2>
                <div className="details-list">
                  <div className="detail-item">
                    <span className="detail-label">Loại nâng cấp:</span>
                    <span className="detail-value">Nâng cấp lên {typeLabel}</span>
                  </div>
                  {!isFreeUpgrade && (
                    <div className="detail-item">
                      <span className="detail-label">Số tiền:</span>
                      <span className="detail-value amount">
                        {new Intl.NumberFormat('vi-VN').format(successData.amount)} <span className="currency">VNĐ</span>
                      </span>
                    </div>
                  )}
                  {isFreeUpgrade && (
                    <div className="detail-item">
                      <span className="detail-label">Phí nâng cấp:</span>
                      <span className="detail-value amount">Miễn phí</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Phương thức thanh toán:</span>
                    <span className="detail-value">{methodLabel}</span>
                  </div>
                  {successData.certificateId && (
                    <div className="detail-item">
                      <span className="detail-label">Mã yêu cầu:</span>
                      <span className="detail-value">#{successData.certificateId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="next-steps-section">
                <div className="step-item">
                  <div className="step-icon">
                    <ClockIcon />
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">Đang chờ xét duyệt</h3>
                    <p className="step-description">
                      Yêu cầu của bạn đã được gửi tới Admin. Thời gian xét duyệt: <strong>1-3 ngày làm việc</strong>.
                    </p>
                  </div>
                </div>

                {!isFreeUpgrade && (
                  <div className="step-item">
                    <div className="step-icon">
                      <ShieldCheckIcon />
                    </div>
                    <div className="step-content">
                      <h3 className="step-title">Bảo vệ quyền lợi</h3>
                      <p className="step-description">
                        Nếu yêu cầu bị từ chối, bạn sẽ được <strong>hoàn lại 100%</strong> phí đã thanh toán.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Button
                  onClick={() => navigate('/profile', { state: { activeTab: 'certificates' } })}
                  variant="default"
                  size="lg"
                  className="view-status-button"
                >
                  Xem trạng thái yêu cầu
                  <ArrowRightIcon className="button-icon" />
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="home-button"
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

export default UpgradePaymentSuccessPage




