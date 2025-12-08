import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from '~/components/LandingPage'
import ServicesPage from '~/components/ServicesPage'
import ServiceDetail from '~/components/ServiceDetail'
import LoginForm from '~/components/LoginForm'
import Register from '~/components/Register'
import ForgotPassword from '~/components/ForgotPassword'
import OTPVerification from '~/components/OTPVerification'
import ResetPassword from '~/components/ResetPassword'
import BookingPage from '~/components/BookingPage'
import PaymentPage from '~/components/PaymentPage'
import PaymentSuccessPage from '~/components/PaymentSuccessPage'
import PaymentFailurePage from '~/components/PaymentFailurePage'
import ProfilePage from '~/components/ProfilePage'
import ForumPage from '~/components/ForumPage'
import NewsPage from '~/components/NewsPage'
import NewsDetailPage from '~/components/NewsDetailPage'
import PolicyPage from '~/components/PolicyPage'
import RegisterAgency from '~/components/RegisterAgency'
import RegisterHost from '~/components/RegisterHost'
import UpgradeAccount from '~/components/UpgradeAccount'
import UpgradePaymentPage from '~/components/UpgradePaymentPage'
import UpgradePaymentSuccessPage from '~/components/UpgradePaymentSuccessPage'
import SubscriptionPackages from '~/components/SubscriptionPackages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Dịch vụ */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        
        {/* Xác thực */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/agency" element={<RegisterAgency />} />
        <Route path="/register/host" element={<RegisterHost />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Đặt dịch vụ và thanh toán */}
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/payment/success/:bookingId" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure/:bookingId" element={<PaymentFailurePage />} />
        
        {/* Nâng cấp tài khoản */}
        <Route path="/upgrade" element={<UpgradeAccount />} />
        <Route path="/upgrade/payment/:upgradeRequestId" element={<UpgradePaymentPage />} />
        <Route path="/upgrade/payment/success/:upgradeRequestId" element={<UpgradePaymentSuccessPage />} />
        <Route path="/subscription-packages" element={<SubscriptionPackages />} />
        
        {/* Trang người dùng */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/policy" element={<PolicyPage />} />
        
        {/* 404 */}
        <Route path="*" element={
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#dc2626' }}>404</h1>
            <p style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '2rem' }}>
              Không tìm thấy trang
            </p>
            <a 
              href="/" 
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#059669',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Về trang chủ
            </a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
