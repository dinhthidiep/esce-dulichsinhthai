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
    <div className="upg-success-upgrade-payment-success-page">
      <Header />
      <main className="upg-success-upgrade-payment-success-main">
        <div className="upg-success-upgrade-payment-success-container">
          {/* Success Icon */}
          <div className="upg-success-success-icon-wrapper">
            <CheckCircleIcon className="upg-success-success-icon" />
          </div>

              {/* Success Message */}
              <Card className="upg-success-success-card">
                <CardContent>
                  <h1 className="upg-success-success-title">
                    {isFreeUpgrade ? 'Yêu cầu nâng cấp đã được gửi thành công!' : 'Thanh toán thành công!'}
                  </h1>
                  <p className="upg-success-success-message">
                    Yêu cầu nâng cấp lên {typeLabel} của bạn đã được gửi thành công.
                  </p>
                  {isFreeUpgrade && successData.type === 'host' && (
                    <div className="upg-success-host-fee-notice">
                      <p className="upg-success-host-fee-notice-text">
                        <strong>Lưu ý:</strong> Nâng cấp tài khoản Host là miễn phí. Tuy nhiên, khi bạn bán dịch vụ, sẽ có một khoản phí 10% của giá trị đơn dịch vụ được trả cho admin của hệ thống.
                      </p>
                    </div>
                  )}

              {/* Payment Details */}
              <div className="upg-success-payment-details-section">
                <h2 className="upg-success-details-title">Chi tiết thanh toán</h2>
                <div className="upg-success-details-list">
                  <div className="upg-success-detail-item">
                    <span className="upg-success-detail-label">Loại nâng cấp:</span>
                    <span className="upg-success-detail-value">Nâng cấp lên {typeLabel}</span>
                  </div>
                  {!isFreeUpgrade && (
                    <div className="upg-success-detail-item">
                      <span className="upg-success-detail-label">Số tiền:</span>
                      <span className="upg-success-detail-value upg-success-amount">
                        {new Intl.NumberFormat('vi-VN').format(successData.amount)} <span className="upg-success-currency">VNĐ</span>
                      </span>
                    </div>
                  )}
                  {isFreeUpgrade && (
                    <div className="upg-success-detail-item">
                      <span className="upg-success-detail-label">Phí nâng cấp:</span>
                      <span className="upg-success-detail-value upg-success-amount">Miễn phí</span>
                    </div>
                  )}
                  <div className="upg-success-detail-item">
                    <span className="upg-success-detail-label">Phương thức thanh toán:</span>
                    <span className="upg-success-detail-value">{methodLabel}</span>
                  </div>
                  {successData.certificateId && (
                    <div className="upg-success-detail-item">
                      <span className="upg-success-detail-label">Mã yêu cầu:</span>
                      <span className="upg-success-detail-value">#{successData.certificateId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="upg-success-next-steps-section">
                <div className="upg-success-step-item">
                  <div className="upg-success-step-icon">
                    <ClockIcon />
                  </div>
                  <div className="upg-success-step-content">
                    <h3 className="upg-success-step-title">Đang chờ xét duyệt</h3>
                    <p className="upg-success-step-description">
                      Yêu cầu của bạn đã được gửi tới Admin. Thời gian xét duyệt: <strong>1-3 ngày làm việc</strong>.
                    </p>
                  </div>
                </div>

                {!isFreeUpgrade && (
                  <div className="upg-success-step-item">
                    <div className="upg-success-step-icon">
                      <ShieldCheckIcon />
                    </div>
                    <div className="upg-success-step-content">
                      <h3 className="upg-success-step-title">Bảo vệ quyền lợi</h3>
                      <p className="upg-success-step-description">
                        Nếu yêu cầu bị từ chối, bạn sẽ được <strong>hoàn lại 100%</strong> phí đã thanh toán.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="upg-success-action-buttons">
                <Button
                  onClick={() => navigate('/profile', { state: { activeTab: 'certificates' } })}
                  variant="default"
                  size="lg"
                  className="upg-success-view-status-button"
                >
                  Xem trạng thái yêu cầu
                  <ArrowRightIcon className="upg-success-button-icon" />
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="upg-success-home-button"
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









