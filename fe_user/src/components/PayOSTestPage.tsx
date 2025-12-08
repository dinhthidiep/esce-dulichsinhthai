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
  status: 'pending' | 'processing' | 'success' | 'failed'
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
    const newStatus = isSuccess ? 'success' : 'failed'
    
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
    if (testData.status === 'success') {
      navigate(`/payment-success/${testData.bookingId}`)
    } else {
      navigate(`/payment-failure/${testData.bookingId}`)
    }
  }

  return (
    <div className="payos-test-page">
      <Header />
      <main className="payos-test-main">
        <div className="payos-test-container">
          <div className="test-header">
            <h1 className="test-title">🧪 Test PayOS Payment</h1>
            <p className="test-subtitle">
              Trang test để mô phỏng quá trình thanh toán PayOS. Bạn có thể điều chỉnh các thông tin và test các kịch bản khác nhau.
            </p>
          </div>

          <div className="test-content">
            {/* Input Form */}
            <Card className="test-form-card">
              <CardContent>
                <h2 className="card-title">Thông tin thanh toán</h2>
                
                <div className="form-group">
                  <label className="form-label">Booking ID</label>
                  <input
                    type="number"
                    className="form-input"
                    value={testData.bookingId}
                    onChange={(e) => handleInputChange('bookingId', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={testData.amount}
                    onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                    min="0"
                    step="1000"
                  />
                  <p className="form-hint">Số tiền: {formatPrice(testData.amount)}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Mô tả giao dịch"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phương thức thanh toán</label>
                  <select
                    className="form-select"
                    value={testData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'payos' | 'vnpay' | 'momo')}
                  >
                    <option value="payos">PayOS</option>
                    <option value="vnpay">VNPay</option>
                    <option value="momo">MoMo</option>
                  </select>
                </div>

                <div className="form-actions">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={simulatePayment}
                    disabled={isProcessing || testData.amount <= 0}
                    className="test-button"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCwIcon className="button-icon spinning" />
                        Đang xử lý thanh toán...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="button-icon" />
                        Test Thanh toán
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Flow Steps */}
            <Card className="test-steps-card">
              <CardContent>
                <h2 className="card-title">Quy trình thanh toán PayOS</h2>
                <div className="steps-list">
                  <div className={`step-item ${isProcessing || showResult ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3 className="step-title">Tạo Payment Intent</h3>
                      <p className="step-description">
                        Gửi yêu cầu tạo payment intent đến backend
                      </p>
                    </div>
                    {isProcessing && <div className="step-loader"></div>}
                  </div>

                  <div className={`step-item ${(isProcessing && testData.status !== 'pending') || showResult ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3 className="step-title">Chuyển đến PayOS Checkout</h3>
                      <p className="step-description">
                        Redirect đến trang thanh toán PayOS
                      </p>
                    </div>
                    {isProcessing && testData.status !== 'pending' && <div className="step-loader"></div>}
                  </div>

                  <div className={`step-item ${showResult ? 'completed' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3 className="step-title">Xử lý thanh toán</h3>
                      <p className="step-description">
                        PayOS xử lý và trả kết quả về
                      </p>
                    </div>
                    {isProcessing && showResult && <div className="step-loader"></div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result Display */}
            {showResult && (
              <Card className={`test-result-card ${testData.status === 'success' ? 'success' : 'failed'}`}>
                <CardContent>
                  <div className="result-header">
                    {testData.status === 'success' ? (
                      <CheckCircleIcon className="result-icon success-icon" />
                    ) : (
                      <XCircleIcon className="result-icon failed-icon" />
                    )}
                    <h2 className="result-title">
                      {testData.status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại!'}
                    </h2>
                  </div>

                  <div className="result-details">
                    <div className="detail-row">
                      <span className="detail-label">Booking ID:</span>
                      <span className="detail-value">#{testData.bookingId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Số tiền:</span>
                      <span className="detail-value">{formatPrice(testData.amount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phương thức:</span>
                      <span className="detail-value">{testData.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Mô tả:</span>
                      <span className="detail-value">{testData.description}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Trạng thái:</span>
                      <span className={`detail-value status-badge status-${testData.status}`}>
                        {testData.status === 'success' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </div>
                  </div>

                  <div className="result-actions">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleNavigateToResult}
                      className="view-result-button"
                    >
                      {testData.status === 'success' ? (
                        <>
                          Xem trang thành công
                          <ArrowRightIcon className="button-icon" />
                        </>
                      ) : (
                        <>
                          Xem trang thất bại
                          <ArrowRightIcon className="button-icon" />
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleRetry}
                      className="retry-button"
                    >
                      <RefreshCwIcon className="button-icon" />
                      Test lại
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            <Card className="test-info-card">
              <CardContent>
                <div className="info-header">
                  <AlertCircleIcon className="info-icon" />
                  <h3 className="info-title">Lưu ý khi test</h3>
                </div>
                <ul className="info-list">
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













