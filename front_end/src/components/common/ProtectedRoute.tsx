import { Navigate, Outlet } from 'react-router-dom'

/**
 * ProtectedRoute - Kiểm tra đăng nhập trước khi cho phép truy cập
 * Nếu chưa đăng nhập (không có token), redirect về trang login
 */
export default function ProtectedRoute() {
  const token = localStorage.getItem('token')

  if (!token) {
    // Chưa đăng nhập, redirect về login
    return <Navigate to="/login" replace />
  }

  // Đã đăng nhập, render children routes
  return <Outlet />
}
