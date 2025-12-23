import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * ProtectedRoute - Kiểm tra đăng nhập trước khi cho phép truy cập
 * Nếu chưa đăng nhập (không có token), redirect về trang login
 * Admin routes redirect về /admin/login
 */
export default function ProtectedRoute() {
  const token = localStorage.getItem('token')
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (!token) {
    // Chưa đăng nhập, redirect về login tương ứng
    const loginPath = isAdminRoute ? '/admin/login' : '/login'
    return <Navigate to={loginPath} replace />
  }

  // Kiểm tra role nếu là admin route
  if (isAdminRoute) {
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const roleId = userInfo.RoleId || userInfo.roleId
        // Chỉ Admin (roleId = 1) mới được truy cập admin routes
        if (roleId !== 1) {
          return <Navigate to="/" replace />
        }
      }
    } catch (error) {
      console.error('Error parsing userInfo:', error)
      return <Navigate to="/admin/login" replace />
    }
  }

  // Đã đăng nhập và có quyền, render children routes
  return <Outlet />
}
