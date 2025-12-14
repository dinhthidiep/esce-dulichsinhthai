import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/common/ProtectedRoute'

// ==================== ADMIN COMPONENTS ====================
// Lazy load MainLayout - Admin dashboard layout
const MainLayout = lazy(() => import('~/components/layout/main-layout'))

// Admin pages
const DashBoard = lazy(() => import('~/components/dashboard'))
const Users = lazy(() => import('~/components/users'))
const Posts = lazy(() => import('~/components/posts'))
const Chat = lazy(() => import('~/components/chat'))
const AdminNews = lazy(() => import('~/components/news'))
const SupportApprovals = lazy(() => import('~/components/supportApprovals'))
const PostApprovals = lazy(() => import('~/components/postApprovals'))
const ServiceApprovals = lazy(() => import('~/components/serviceApprovals'))
const AdminProfile = lazy(() => import('~/components/profile'))
const RoleUpgrade = lazy(() => import('~/components/roleUpgrade'))

// Admin other components
const CreateTour = lazy(() => import('./components/createTour/CreateTour'))
const SocialMedia = lazy(() => import('./components/socialMedia/SocialMedia'))

// ==================== USER COMPONENTS ====================
// User pages - from fe_user
const LandingPage = lazy(() => import('~/components/user/LandingPage'))
const UserLoginForm = lazy(() => import('~/components/user/LoginForm'))
const UserRegister = lazy(() => import('~/components/user/Register'))
const UserForgotPassword = lazy(() => import('~/components/user/ForgotPassword'))
const UserOTPVerification = lazy(() => import('~/components/user/OTPVerification'))
const UserResetPassword = lazy(() => import('~/components/user/ResetPassword'))
const ServicesPage = lazy(() => import('~/components/user/ServicesPage'))
const ServiceDetail = lazy(() => import('~/components/user/ServiceDetail'))
const BookingPage = lazy(() => import('~/components/user/BookingPage'))
const PaymentPage = lazy(() => import('~/components/user/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('~/components/user/PaymentSuccessPage'))
const PaymentFailurePage = lazy(() => import('~/components/user/PaymentFailurePage'))
const ProfilePage = lazy(() => import('~/components/user/ProfilePage'))
const ForumPage = lazy(() => import('~/components/user/ForumPage'))
const NewsPage = lazy(() => import('~/components/user/NewsPage'))
const NewsDetailPage = lazy(() => import('~/components/user/NewsDetailPage'))
const PolicyPage = lazy(() => import('~/components/user/PolicyPage'))
const RegisterAgency = lazy(() => import('~/components/user/RegisterAgency'))
const RegisterHost = lazy(() => import('~/components/user/RegisterHost'))
const UpgradeAccount = lazy(() => import('~/components/user/UpgradeAccount'))
const UpgradePaymentPage = lazy(() => import('~/components/user/UpgradePaymentPage'))
const UpgradePaymentSuccessPage = lazy(() => import('~/components/user/UpgradePaymentSuccessPage'))
const SubscriptionPackages = lazy(() => import('~/components/user/SubscriptionPackages'))

// Host Dashboard
const HostDashboard = lazy(() => import('~/components/user/HostDashboard'))
const AgencyDashboard = lazy(() => import('~/components/user/AgencyDashboard'))
const UserCreateTour = lazy(() => import('~/components/user/CreateTour'))

// User Management pages
const ServiceComboManager = lazy(() => import('~/components/user/ServiceComboManager'))
const ServiceManager = lazy(() => import('~/components/user/ServiceManager'))
const CreateService = lazy(() => import('~/components/user/CreateService'))
const EditService = lazy(() => import('~/components/user/EditService'))
const CreateServiceCombo = lazy(() => import('~/components/user/CreateServiceCombo'))
const EditServiceCombo = lazy(() => import('~/components/user/EditServiceCombo'))
const CreateCoupon = lazy(() => import('~/components/user/CreateCoupon'))
const EditCoupon = lazy(() => import('~/components/user/EditCoupon'))
const BookingManager = lazy(() => import('~/components/user/BookingManager'))
const CouponManager = lazy(() => import('~/components/user/CouponManager'))
const Revenue = lazy(() => import('~/components/user/Revenue'))
const ReviewManager = lazy(() => import('~/components/user/ReviewManager'))

// User Support component
const Support = lazy(() => import('~/components/user/support/Support'))


function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          {/* Support chat widget - hiển thị trên tất cả trang user */}
          <Suspense fallback={null}>
            <Support />
          </Suspense>
          
          <Routes>
            {/* ==================== USER ROUTES ==================== */}
            {/* Trang chủ */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Dịch vụ */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            
            {/* Xác thực User */}
            <Route path="/login" element={<UserLoginForm />} />
            <Route path="/register" element={<UserRegister />} />
            <Route path="/register/agency" element={<RegisterAgency />} />
            <Route path="/register/host" element={<RegisterHost />} />
            <Route path="/forgot-password" element={<UserForgotPassword />} />
            <Route path="/otp-verification" element={<UserOTPVerification />} />
            <Route path="/reset-password" element={<UserResetPassword />} />
            
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
            
            {/* ==================== HOST ROUTES ==================== */}
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/dashboard" element={<HostDashboard />} />
            <Route path="/host/services" element={<ServiceManager />} />
            <Route path="/host/combos" element={<ServiceComboManager />} />
            <Route path="/host/bookings" element={<BookingManager />} />
            <Route path="/host/revenue" element={<Revenue />} />
            <Route path="/host/reviews" element={<ReviewManager />} />
            <Route path="/host/coupons" element={<CouponManager />} />
            
            {/* ==================== AGENCY ROUTES ==================== */}
            <Route path="/agency" element={<AgencyDashboard />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/agency/tours" element={<ServiceComboManager />} />
            <Route path="/agency/bookings" element={<BookingManager />} />
            <Route path="/agency/revenue" element={<Revenue />} />
            
            {/* Legacy routes - giữ lại để tương thích */}
            <Route path="/host-dashboard" element={<HostDashboard />} />
            <Route path="/agency-dashboard" element={<AgencyDashboard />} />
            <Route path="/create-tour" element={<UserCreateTour />} />
            
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

            {/* ==================== ADMIN ROUTES ==================== */}
            {/* Admin Auth - dùng giao diện user với isAdmin prop */}
            <Route path="/admin/login" element={<UserLoginForm isAdmin />} />
            <Route path="/admin/register" element={<UserRegister isAdmin />} />
            <Route path="/admin/forgot-password" element={<UserForgotPassword isAdmin />} />
            <Route path="/admin/otp-verification" element={<UserOTPVerification isAdmin />} />
            <Route path="/admin/reset-password" element={<UserResetPassword isAdmin />} />

            {/* Admin Dashboard - cần đăng nhập Admin */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/admin" element={<DashBoard />} />
                <Route path="/admin/dashboard" element={<DashBoard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/post" element={<Posts />} />
                <Route path="/admin/chat" element={<Chat />} />
                <Route path="/admin/news" element={<AdminNews />} />
                <Route path="/admin/post-approvals" element={<PostApprovals />} />
                <Route path="/admin/service-approvals" element={<ServiceApprovals />} />
                <Route path="/admin/support-approvals" element={<SupportApprovals />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
                <Route path="/admin/role-upgrade" element={<RoleUpgrade />} />
                <Route path="/admin/create-tour" element={<CreateTour />} />
                <Route path="/admin/social-media" element={<SocialMedia />} />
              </Route>
            </Route>

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
    </NotificationProvider>
  )
}

export default App
