import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { 
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowRightIcon
} from './icons/index'
import { formatPrice } from '~/lib/utils'
import './PayOSTestPage.css'

interface PaymentTestData {
  bookingId: number
  amount: number
  description: string
  paymentMethod: 'payos' | 'vnpay' | 'momo'
  status: 'pending' | 'processing' | 'payos-success' | 'payos-failed'
}

const PayOSTestPage = () => {
  const navigate = useNavigate()
  const [testData, setTestData] = useState<PaymentTestData>({
    bookingId: 1,
    amount: 2500000,
    description: 'Thanh toán cho đặt dịch vụ #1',
    paymentMethod: 'payos',
    status: 'pending'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const handleInputChange = (field: keyof PaymentTestData, value: string | number) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }))
    setShowResult(false)
  }

  const simulatePayment = async () => {
    setIsProcessing(true)
    setShowResult(false)

    // Mô phỏng quá trình thanh toán PayOS
    // Bước 1: Tạo payment intent (giả lập)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Bước 2: Chuyển đến PayOS checkout (giả lập)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Bước 3: Xử lý thanh toán (giả lập)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Random kết quả: 70% thành công, 30% thất bại
    const isSuccess = Math.random() > 0.3
    const newStatus = isSuccess ? 'payos-success' : 'payos-failed'
    
    setTestData(prev => ({
      ...prev,
      status: newStatus
    }))
    
    setIsProcessing(false)
    setShowResult(true)
  }

  const handleRetry = () => {
    setTestData(prev => ({
      ...prev,
      status: 'pending'
    }))
    setShowResult(false)
  }

  const handleNavigateToResult = () => {
    if (testData.status === 'payos-success') {
      navigate(`/payment-success/${testData.bookingId}`)
    } else {
      navigate(`/payment-failure/${testData.bookingId}`)
    }
  }

  return (
    <div className="payos-payos-test-page">
      <Header />
      <main className="payos-payos-test-main">
        <div className="payos-payos-test-container">
          <div className="payos-test-header">
            <h1 className="payos-test-title">🧪 Test PayOS Payment</h1>
            <p className="payos-test-subtitle">
              Trang test để mô phỏng quá trình thanh toán PayOS. Bạn có thể điều chỉnh các thông tin và test các kịch bản khác nhau.
            </p>
          </div>

          <div className="payos-test-content">
            {/* Input Form */}
            <Card className="payos-test-form-card">
              <CardContent>
                <h2 className="payos-card-title">Thông tin thanh toán</h2>
                
                <div className="payos-form-group">
                  <label className="payos-form-label">Booking ID</label>
                  <input
                    type="number"
                    className="payos-form-input"
                    value={testData.bookingId}
                    onChange={(e) => handleInputChange('bookingId', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                <div className="payos-form-group">
                  <label className="payos-form-label">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    className="payos-form-input"
                    value={testData.amount}
                    onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                    min="0"
                    step="1000"
                  />
                  <p className="payos-form-hint">Số tiền: {formatPrice(testData.amount)}</p>
                </div>

                <div className="payos-form-group">
                  <label className="payos-form-label">Mô tả</label>
                  <input
                    type="text"
                    className="payos-form-input"
                    value={testData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Mô tả giao dịch"
                  />
                </div>

                <div className="payos-form-group">
                  <label className="payos-form-label">Phương thức thanh toán</label>
                  <select
                    className="payos-form-select"
                    value={testData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'payos' | 'vnpay' | 'momo')}
                  >
                    <option value="payos">PayOS</option>
                    <option value="vnpay">VNPay</option>
                    <option value="momo">MoMo</option>
                  </select>
                </div>

                <div className="payos-form-actions">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={simulatePayment}
                    disabled={isProcessing || testData.amount <= 0}
                    className="payos-test-button"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCwIcon className="payos-button-icon payos-spinning" />
                        Đang xử lý thanh toán...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="payos-button-icon" />
                        Test Thanh toán
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Flow Steps */}
            <Card className="payos-test-steps-card">
              <CardContent>
                <h2 className="payos-card-title">Quy trình thanh toán PayOS</h2>
                <div className="payos-steps-list">
                  <div className={`payos-step-item ${isProcessing || showResult ? 'payos-completed' : ''}`}>
                    <div className="payos-step-number">1</div>
                    <div className="payos-step-content">
                      <h3 className="payos-step-title">Tạo Payment Intent</h3>
                      <p className="payos-step-description">
                        Gửi yêu cầu tạo payment intent đến backend
                      </p>
                    </div>
                    {isProcessing && <div className="payos-step-loader"></div>}
                  </div>

                  <div className={`payos-step-item ${(isProcessing && testData.status !== 'pending') || showResult ? 'payos-completed' : ''}`}>
                    <div className="payos-step-number">2</div>
                    <div className="payos-step-content">
                      <h3 className="payos-step-title">Chuyển đến PayOS Checkout</h3>
                      <p className="payos-step-description">
                        Redirect đến trang thanh toán PayOS
                      </p>
                    </div>
                    {isProcessing && testData.status !== 'pending' && <div className="payos-step-loader"></div>}
                  </div>

                  <div className={`payos-step-item ${showResult ? 'payos-completed' : ''}`}>
                    <div className="payos-step-number">3</div>
                    <div className="payos-step-content">
                      <h3 className="payos-step-title">Xử lý thanh toán</h3>
                      <p className="payos-step-description">
                        PayOS xử lý và trả kết quả về
                      </p>
                    </div>
                    {isProcessing && showResult && <div className="payos-step-loader"></div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result Display */}
            {showResult && (
              <Card className={`payos-test-result-card ${testData.status === 'payos-success' ? 'payos-success' : 'payos-failed'}`}>
                <CardContent>
                  <div className="payos-result-header">
                    {testData.status === 'payos-success' ? (
                      <CheckCircleIcon className="payos-result-icon payos-success-icon" />
                    ) : (
                      <XCircleIcon className="payos-result-icon payos-failed-icon" />
                    )}
                    <h2 className="payos-result-title">
                      {testData.status === 'payos-success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại!'}
                    </h2>
                  </div>

                  <div className="payos-result-details">
                    <div className="payos-detail-row">
                      <span className="payos-detail-label">Booking ID:</span>
                      <span className="payos-detail-value">#{testData.bookingId}</span>
                    </div>
                    <div className="payos-detail-row">
                      <span className="payos-detail-label">Số tiền:</span>
                      <span className="payos-detail-value">{formatPrice(testData.amount)}</span>
                    </div>
                    <div className="payos-detail-row">
                      <span className="payos-detail-label">Phương thức:</span>
                      <span className="payos-detail-value">{testData.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="payos-detail-row">
                      <span className="payos-detail-label">Mô tả:</span>
                      <span className="payos-detail-value">{testData.description}</span>
                    </div>
                    <div className="payos-detail-row">
                      <span className="payos-detail-label">Trạng thái:</span>
                      <span className={`payos-detail-value payos-status-badge status-${testData.status}`}>
                        {testData.status === 'payos-success' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </div>
                  </div>

                  <div className="payos-result-actions">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleNavigateToResult}
                      className="payos-view-result-button"
                    >
                      {testData.status === 'payos-success' ? (
                        <>
                          Xem trang thành công
                          <ArrowRightIcon className="payos-button-icon" />
                        </>
                      ) : (
                        <>
                          Xem trang thất bại
                          <ArrowRightIcon className="payos-button-icon" />
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleRetry}
                      className="payos-retry-button"
                    >
                      <RefreshCwIcon className="payos-button-icon" />
                      Test lại
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            <Card className="payos-test-info-card">
              <CardContent>
                <div className="payos-info-header">
                  <AlertCircleIcon className="payos-info-icon" />
                  <h3 className="payos-info-title">Lưu ý khi test</h3>
                </div>
                <ul className="payos-info-list">
                  <li>Trang này chỉ mô phỏng quá trình thanh toán PayOS, không thực sự kết nối đến PayOS.</li>
                  <li>Kết quả thanh toán được random: 70% thành công, 30% thất bại.</li>
                  <li>Bạn có thể điều chỉnh Booking ID, số tiền và các thông tin khác để test.</li>
                  <li>Sau khi test, bạn có thể xem trang kết quả (thành công/thất bại) tương ứng.</li>
                  <li>Trong môi trường thực tế, PayOS sẽ redirect về URL callback đã cấu hình.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PayOSTestPage


















