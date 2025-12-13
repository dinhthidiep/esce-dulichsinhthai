import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoadingSpinner from '~/components/LoadingSpinner'

// Core pages - keep synchronous for faster initial load
import LandingPage from '~/components/LandingPage'
import LoginForm from '~/components/LoginForm'
import Register from '~/components/Register'
import Support from '~/components/support/Support'

// Lazy load heavy components
const ServicesPage = lazy(() => import('~/components/ServicesPage'))
const ServiceDetail = lazy(() => import('~/components/ServiceDetail'))
const ForgotPassword = lazy(() => import('~/components/ForgotPassword'))
const OTPVerification = lazy(() => import('~/components/OTPVerification'))
const ResetPassword = lazy(() => import('~/components/ResetPassword'))
const BookingPage = lazy(() => import('~/components/BookingPage'))
const PaymentPage = lazy(() => import('~/components/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('~/components/PaymentSuccessPage'))
const PaymentFailurePage = lazy(() => import('~/components/PaymentFailurePage'))
const ProfilePage = lazy(() => import('~/components/ProfilePage'))
const ForumPage = lazy(() => import('~/components/ForumPage'))
const NewsPage = lazy(() => import('~/components/NewsPage'))
const NewsDetailPage = lazy(() => import('~/components/NewsDetailPage'))
const PolicyPage = lazy(() => import('~/components/PolicyPage'))
const RegisterAgency = lazy(() => import('~/components/RegisterAgency'))
const RegisterHost = lazy(() => import('~/components/RegisterHost'))
const UpgradeAccount = lazy(() => import('~/components/UpgradeAccount'))
const UpgradePaymentPage = lazy(() => import('~/components/UpgradePaymentPage'))
const UpgradePaymentSuccessPage = lazy(() => import('~/components/UpgradePaymentSuccessPage'))
const SubscriptionPackages = lazy(() => import('~/components/SubscriptionPackages'))

// Host Dashboard - large component
const HostDashboard = lazy(() => import('~/components/HostDashboard'))

// Management pages - large components
const CreateTour = lazy(() => import('~/components/CreateTour'))
const ServiceComboManager = lazy(() => import('~/components/ServiceComboManager'))
const ServiceManager = lazy(() => import('~/components/ServiceManager'))
const CreateService = lazy(() => import('~/components/CreateService'))
const EditService = lazy(() => import('~/components/EditService'))
const CreateServiceCombo = lazy(() => import('~/components/CreateServiceCombo'))
const EditServiceCombo = lazy(() => import('~/components/EditServiceCombo'))
const CreateCoupon = lazy(() => import('~/components/CreateCoupon'))
const EditCoupon = lazy(() => import('~/components/EditCoupon'))
const BookingManager = lazy(() => import('~/components/BookingManager'))
const CouponManager = lazy(() => import('~/components/CouponManager'))
const Revenue = lazy(() => import('~/components/Revenue'))
const ReviewManager = lazy(() => import('~/components/ReviewManager'))

function App() {
  return (
    <BrowserRouter>
      <Support />
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh'
        }}>
          <LoadingSpinner message="Đang tải trang..." />
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
          <Route path="/upgrade-account" element={<UpgradeAccount />} />
          <Route path="/upgrade/payment/:upgradeRequestId" element={<UpgradePaymentPage />} />
          <Route path="/upgrade/payment/success/:upgradeRequestId" element={<UpgradePaymentSuccessPage />} />
          <Route path="/upgrade-payment-success" element={<UpgradePaymentSuccessPage />} />
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
          <Route path="/edit-coupon" element={<EditCoupon />} />
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
