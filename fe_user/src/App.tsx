import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
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
import HostDashboard from '~/components/HostDashboard'
import CreateTour from '~/components/CreateTour'
import ServiceComboManager from '~/components/ServiceComboManager'
import ServiceManager from '~/components/ServiceManager'
import CreateService from '~/components/CreateService'
import EditService from '~/components/EditService'
import CreateServiceCombo from '~/components/CreateServiceCombo'
import EditServiceCombo from '~/components/EditServiceCombo'
import CreateCoupon from '~/components/CreateCoupon'
import BookingManager from '~/components/BookingManager'
import CouponManager from '~/components/CouponManager'
import Revenue from '~/components/Revenue'
import ReviewManager from '~/components/ReviewManager'

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#64748b'
        }}>
          Đang tải...
        </div>
      }>
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
          
          {/* Host Dashboard và quản lý */}
          <Route path="/host-dashboard" element={<HostDashboard />} />
          <Route path="/create-tour" element={<CreateTour />} />
          
          {/* Quản lý dịch vụ */}
          <Route path="/service-combo-manager" element={<ServiceComboManager />} />
          <Route path="/service-manager" element={<ServiceManager />} />
          <Route path="/create-service" element={<CreateService />} />
          <Route path="/edit-service" element={<EditService />} />
          <Route path="/create-service-combo" element={<CreateServiceCombo />} />
          <Route path="/edit-service-combo" element={<EditServiceCombo />} />
          
          {/* Quản lý coupon */}
          <Route path="/create-coupon" element={<CreateCoupon />} />
          <Route path="/coupon-manager" element={<CouponManager />} />
          
          {/* Quản lý khác */}
          <Route path="/booking-manager" element={<BookingManager />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/review-manager" element={<ReviewManager />} />
          
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
