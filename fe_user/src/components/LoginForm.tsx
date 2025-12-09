import React, { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './LoginForm.css'
import googleAuthService from '~/services/googleAuth'
import { login } from '~/API/instances/Au'

interface FormData {
  email: string
  password: string
}

interface Errors {
  email?: string
  password?: string
}

interface LocationState {
  returnUrl?: string
}

const LoginForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear login-error when user starts typing
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = (): Errors => {
    const newErrors: Errors = {}

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setGeneralError('')

    try {
      if (import.meta.env.DEV) {
        console.log('🔐 [LoginForm] Đang đăng nhập với:', { email: formData.email })
      }
      
      const response = await login(formData.email, formData.password)

      if (import.meta.env.DEV) {
        console.log('✅ [LoginForm] Login response:', response)
      }

      // Chọn storage dựa trên "Ghi nhớ đăng nhập"
      const storage = rememberMe ? localStorage : sessionStorage

      // Lưu token vào storage (localStorage hoặc sessionStorage)
      const token = (response as { Token?: string; token?: string }).Token || (response as { token?: string }).token
      if (token) {
        storage.setItem('token', token)
        if (import.meta.env.DEV) {
          console.log('✅ [LoginForm] Token đã được lưu vào', rememberMe ? 'localStorage' : 'sessionStorage')
        }
        // Xóa token cũ từ storage khác nếu có
        if (rememberMe) {
          sessionStorage.removeItem('token')
        } else {
          localStorage.removeItem('token')
        }
      } else {
        console.warn('⚠️ [LoginForm] Không tìm thấy token trong response')
      }

      // Lưu thông tin user nếu có
      const userInfo = (response as { UserInfo?: unknown; userInfo?: unknown }).UserInfo || (response as { userInfo?: unknown }).userInfo
      if (userInfo) {
        storage.setItem('userInfo', JSON.stringify(userInfo))
        if (import.meta.env.DEV) {
          console.log('✅ [LoginForm] UserInfo đã được lưu:', userInfo)
        }
        // Xóa userInfo cũ từ storage khác nếu có
        if (rememberMe) {
          sessionStorage.removeItem('userInfo')
        } else {
          localStorage.removeItem('userInfo')
        }
      } else {
        console.warn('⚠️ [LoginForm] Không tìm thấy UserInfo trong response')
      }

      // Trigger custom event để Header tự động cập nhật
      window.dispatchEvent(new CustomEvent('userStorageChange'))

      // Đăng nhập thành công - chuyển hướng hoặc hiển thị thông báo
      // Set flag để hiển thị welcome message trên landing page
      sessionStorage.setItem('justLoggedIn', 'true')

      // Kiểm tra returnUrl từ location.state
      const returnUrl = (location.state as LocationState)?.returnUrl
      if (returnUrl) {
        // Chuyển về trang ban đầu mà người dùng muốn truy cập
        navigate(returnUrl, { replace: true })
      } else {
        // Chuyển hướng đến trang landing page
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = (error as Error).message || 'Đăng nhập thất bại. Vui lòng thử lại!'
      setGeneralError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)

    try {
      const result = await googleAuthService.signIn()

      if (result.success) {
        console.log('Google Login Success:', result.user)
        alert(`Đăng nhập Google thành công! Chào mừng ${result.user.name}!`)
        // Here you would typically send the user data to your backend
        // to create/login the user account
      } else {
        alert(`Đăng nhập Google thất bại: ${result.error}`)
      }
    } catch (error) {
      console.error('Google Login Error:', error)
      alert('Có lỗi xảy ra khi đăng nhập Google. Vui lòng thử lại!')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="login-login-container">
      <div className="login-login-card">
        <div className="login-brand">
          <h2 className="login-brand-name">ESCE</h2>
          <p className="login-brand-sub">Du lịch sinh thái</p>
        </div>

        <h3 className="login-title">Đăng nhập</h3>
        <p className="login-subtitle">Nhập thông tin tài khoản để đăng nhập</p>

        <form onSubmit={handleSubmit} className="login-login-form">
          <div className="login-form-group">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nhập email của bạn"
                className={errors.email ? 'login-error' : ''}
              />
            </div>
            {errors.email && <span className="login-error-message">{errors.email}</span>}
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="login-input-wrapper with-toggle">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="nhập mật khẩu"
                className={errors.password ? 'login-error' : ''}
              />
              <span className="login-toggle-icon" aria-hidden></span>
            </div>
            {errors.password && <span className="login-error-message">{errors.password}</span>}
          </div>

          {generalError && (
            <div
              className="login-error-message general-error"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              {generalError}
            </div>
          )}

          <div className="login-form-options">
            <label className="login-remember-me">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span className="login-checkmark"></span>
              Ghi nhớ đăng nhập
            </label>
            <a href="/login-forgot-password" className="login-forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className={`login-login-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="login-spinner"></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>HOẶC</span>
        </div>

        <button className="login-google-button" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <>
              <div className="login-spinner"></div>
              Đang đăng nhập...
            </>
          ) : (
            <>
              <span className="login-g-icon">G</span>
              Đăng nhập bằng Google
            </>
          )}
        </button>

        <div className="login-signup-link">
          <p>
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm

