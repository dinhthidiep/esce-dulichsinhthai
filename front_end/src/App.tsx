import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { MainLayout } from '~/components/layout'
import {
  DashBoard,
  Users,
  Posts,
  Chat,
  News,
  Supports,
  SupportApprovals,
  Profile,
  RoleUpgrade
} from '~/pages'
import LoginForm from './components/authenticate/login/LoginForm'
import ForgotPassword from './components/authenticate/forgotPassword/ForgotPassword'
import Register from './components/authenticate/register/Register'
import OTPVerification from './components/authenticate/OTPVerify/OTPVerification'
import ResetPassword from './components/authenticate/resetPassword/ResetPassword'
import CreateTour from './components/createTour/CreateTour'
import SocialMedia from './components/socialMedia/SocialMedia'
import { NotificationProvider } from './contexts/NotificationContext'

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Đang tải...</div>}>
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
