import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy load MainLayout - nó chứa SideBar và nhiều dependencies nặng
const MainLayout = lazy(() => import('~/components/layout/main-layout'))

// Lazy load pages - Route-based code splitting
// Import directly from component folders since they export default
const DashBoard = lazy(() => import('~/components/dashboard'))
const Users = lazy(() => import('~/components/users'))
const Posts = lazy(() => import('~/components/posts'))
const Chat = lazy(() => import('~/components/chat'))
const News = lazy(() => import('~/components/news'))
const Supports = lazy(() => import('~/components/supports'))
const SupportApprovals = lazy(() => import('~/components/supportApprovals'))
const Profile = lazy(() => import('~/components/profile'))
const RoleUpgrade = lazy(() => import('~/components/roleUpgrade'))

// Lazy load auth components
const LoginForm = lazy(() => import('./components/authenticate/login/LoginForm'))
const ForgotPassword = lazy(() => import('./components/authenticate/forgotPassword/ForgotPassword'))
const Register = lazy(() => import('./components/authenticate/register/Register'))
const OTPVerification = lazy(() => import('./components/authenticate/OTPVerify/OTPVerification'))
const ResetPassword = lazy(() => import('./components/authenticate/resetPassword/ResetPassword'))

// Lazy load other components
const CreateTour = lazy(() => import('./components/createTour/CreateTour'))
const SocialMedia = lazy(() => import('./components/socialMedia/SocialMedia'))

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Các route KHÔNG dùng MainLayout */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* <Route path="/service-combo-manager" element={<ServiceComboManager />} />
          <Route path="/service-manager" element={<ServiceManager />} />
          <Route path="/booking-manager" element={<BookingManager />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/review-manager" element={<ReviewManager />} />
          <Route path="/notification" element={<Notification />} /> */}

            {/* Các route DÙNG MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashBoard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/post" element={<Posts />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/news" element={<News />} />
              <Route path="/supports" element={<Supports />} />
              <Route path="/support-approvals" element={<SupportApprovals />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/role-upgrade" element={<RoleUpgrade />} />
              <Route path="/create-tour" element={<CreateTour />} />
              <Route path="/social-media" element={<SocialMedia />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
