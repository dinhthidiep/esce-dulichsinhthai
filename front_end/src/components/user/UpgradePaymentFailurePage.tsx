import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { 
  AlertCircleIcon,
  ArrowLeftIcon,
  RefreshCwIcon
} from './icons/index'
import './UpgradePaymentFailurePage.css'

interface PaymentFailureData {
  type: 'host' | 'agency'
  reason?: string
  userId?: string
}

const UpgradePaymentFailurePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [failureData, setFailureData] = useState<PaymentFailureData | null>(null)

  useEffect(() => {
    const typeParam = searchParams.get('type')
    const reasonParam = searchParams.get('reason')
    const userIdParam = searchParams.get('userId')
    
    if (typeParam) {
      setFailureData({
        type: typeParam.toLowerCase() as 'host' | 'agency',
        reason: reasonParam || undefined,
        userId: userIdParam || undefined
      })
    } else {
      // Default to agency if no type specified
      setFailureData({
        type: 'agency',
        reason: reasonParam || undefined
      })
    }
  }, [searchParams])

  const typeLabel = failureData?.type === 'host' ? 'Host' : 'Agency'
  
  const getReasonMessage = () => {
    if (failureData?.reason === 'cancelled') {
      return 'Bạn đã hủy giao dịch thanh toán.'
    }
    return 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.'
  }

  return (
    <div className="upg-fail-upgrade-payment-failure-page">
      <Header />
      <main className="upg-fail-upgrade-payment-failure-main">
        <div className="upg-fail-upgrade-payment-failure-container">
          {/* Failure Icon */}
          <div className="upg-fail-failure-icon-wrapper">
            <AlertCircleIcon className="upg-fail-failure-icon" />
          </div>

          {/* Failure Message */}
          <Card className="upg-fail-failure-card">
            <CardContent>
              <h1 className="upg-fail-failure-title">Thanh toán không thành công</h1>
              <p className="upg-fail-failure-message">
                {getReasonMessage()}
              </p>

              {/* Details */}
              <div className="upg-fail-failure-details-section">
                <div className="upg-fail-detail-item">
                  <span className="upg-fail-detail-label">Loại nâng cấp:</span>
                  <span className="upg-fail-detail-value">Nâng cấp lên {typeLabel}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="upg-fail-action-buttons">
                <Button
                  onClick={() => navigate(`/register/${failureData?.type || 'agency'}`)}
                  variant="default"
                  size="lg"
                  className="upg-fail-retry-button"
                >
                  <RefreshCwIcon className="upg-fail-button-icon" />
                  Thử lại
                </Button>
                <Button
                  onClick={() => navigate('/upgrade-account')}
                  variant="outline"
                  size="lg"
                  className="upg-fail-back-button"
                >
                  <ArrowLeftIcon className="upg-fail-button-icon" />
                  Quay lại
                </Button>
              </div>

              <div className="upg-fail-help-note">
                <p>Nếu bạn gặp vấn đề, vui lòng liên hệ hỗ trợ qua email hoặc hotline.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default UpgradePaymentFailurePage
