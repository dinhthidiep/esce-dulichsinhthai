import React, { useEffect, useRef, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import './LoginForm.css'
import { login } from '~/api/user/instances/Au'
import { useNavigate } from 'react-router-dom'
import { fetchWithFallback, extractErrorMessage } from '~/api/user/instances/httpClient'
import { API_BASE_URL } from '~/config/api'

interface FormData {
  email: string
  password: string
}

interface Errors {
  email?: string
  password?: string
}

interface LoginFormProps {
  isAdmin?: boolean
}

// Helper function để xác định redirect path dựa trên role
const getRedirectPathByRole = (roleId: number | undefined): string => {
  switch (roleId) {
    case 1: return '/admin'    // Admin - redirect to admin panel
    case 2: return '/host'     // Host - redirect to host panel
    case 3: return '/agency'   // Agency - redirect to agency panel
    case 4: return '/'         // Tourist - redirect to home
    default: return '/'
  }
}

const LoginForm = ({ isAdmin = false }: LoginFormProps) => {
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null)
  const [checkingBackend, setCheckingBackend] = useState(true)
  const [isBanned, setIsBanned] = useState(false)

  // Kiểm tra backend có đang chạy không
  useEffect(() => {
    const checkBackendStatus = async () => {
      setCheckingBackend(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout 5 giây
        
        // API_BASE_URL đã bao gồm /api rồi, nên chỉ cần thêm /Auth/health
        const response = await fetch(`${API_BASE_URL}/Auth/health`, {
          method: 'GET',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        setIsBackendOnline(response.ok)
      } catch (error) {
        console.warn('Backend không khả dụng:', error)
        setIsBackendOnline(false)
      } finally {
        setCheckingBackend(false)
      }
    }

    checkBackendStatus()
    
    // Kiểm tra lại mỗi 30 giây
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google || !(window as any).google.accounts || !(window as any).google.accounts.id) return
      
      // Initialize Google OAuth
      (window as any).google.accounts.id.initialize({
        client_id: '281718540202-fgep1miupulamf080uo799stbr4f8ge0.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            setGeneralError('')
            const idToken = response.credential
            
            if (!idToken) {
              setGeneralError('Không nhận được token từ Google. Vui lòng thử lại!')
              return
            }

            // Gọi API login với Google
            const res = await fetchWithFallback('/Auth/logingoogle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            })

            if (!res.ok) {
              const errorMessage = await extractErrorMessage(res, 'Không thể đăng nhập với Google. Vui lòng thử lại!')
              setGeneralError(errorMessage)
              return
            }

            const data = await res.json()
            
            const token = data?.token || data?.Token
            if (!token) {
              setGeneralError('Không nhận được token từ server. Vui lòng thử lại!')
              return
            }

            const userInfo = data.UserInfo || data.userInfo
            if (userInfo) {
              localStorage.setItem('userInfo', JSON.stringify(userInfo))
            }

            localStorage.setItem('token', token)
            window.dispatchEvent(new CustomEvent('userStorageChange'))
            sessionStorage.setItem('justLoggedIn', 'true')
            
            // Redirect theo role
            const roleId = userInfo?.RoleId || userInfo?.roleId
            navigate(getRedirectPathByRole(roleId))
          } catch (err: any) {
            console.error('Google login error:', err)
            setGeneralError(err.message || 'Không thể đăng nhập với Google. Vui lòng thử lại!')
          }
        }
      })
      
      const renderButton = () => {
        if (googleBtnRef.current && (window as any).google?.accounts?.id) {
          googleBtnRef.current.innerHTML = ''
          ;(window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular'
          })
        }
      }
      
      renderButton()
      setTimeout(renderButton, 100)
    }
    
    if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
      initGoogle()
    } else {
      const handle = setInterval(() => {
        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
          clearInterval(handle)
          initGoogle()
        }
      }, 200)
      return () => clearInterval(handle)
    }
  }, [navigate])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
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
      const response = await login(formData.email, formData.password) as any

      const userInfo = response.UserInfo || response.userInfo
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      }

      if (response.Token || response.token) {
        localStorage.setItem('token', response.Token || response.token)
      }

      window.dispatchEvent(new CustomEvent('userStorageChange'))
      sessionStorage.setItem('justLoggedIn', 'true')
      
      // Redirect theo role
      const roleId = userInfo?.RoleId || userInfo?.roleId
      navigate(getRedirectPathByRole(roleId))
    } catch (error: any) {
      if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', error)
        // Fallback redirect khi network error
        const storedUserInfo = localStorage.getItem('userInfo')
        if (storedUserInfo) {
          const parsed = JSON.parse(storedUserInfo)
          navigate(getRedirectPathByRole(parsed?.RoleId || parsed?.roleId))
        } else {
          navigate('/')
        }
        return
      }
      console.error('Login error:', error)
      
      // Kiểm tra nếu user bị ban
      const errorMsg = error.message || ''
      if (errorMsg.includes('bị khóa') || errorMsg.includes('banned') || errorMsg.includes('locked')) {
        setIsBanned(true)
        setGeneralError('')
      } else {
        setGeneralError(errorMsg || 'Đăng nhập thất bại. Vui lòng thử lại!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Kiểm tra backend trước khi submit
  const handleSubmitWithCheck = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isBackendOnline) {
      setGeneralError('Hệ thống đang bảo trì. Vui lòng thử lại sau!')
      return
    }
    
    handleSubmit(e)
  }

  return (
    <div className="auth-background w-full flex justify-center">
      <div className="login-container max-w-[65%] grid grid-col-1 gap-[2.4rem] lg:gap-0 lg:grid-cols-[1fr_1fr] w-full place-content-center text-[160%]!">
        <div className="lg:flex flex-col gap-[2.4rem] bg-white/90 items-center hidden justify-center rounded-l-2xl">
          <img src="/img/logo_esce.png" alt="Logo ESCE" className="max-w-[80%] h-auto" />
        </div>
        <div className="login-card rounded-none! lg:rounded-r-2xl">
          <div className="brand"></div>
          <h3 className="title">Đăng nhập</h3>
          
          {/* Thông báo khi backend offline */}
          {checkingBackend && (
            <div
              className="backend-status-message"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fff3cd',
                color: '#856404',
                borderRadius: '4px',
                textAlign: 'center',
                border: '1px solid #ffc107'
              }}
            >
              <div className="spinner" style={{ display: 'inline-block', marginRight: '8px' }}></div>
              Đang kiểm tra kết nối hệ thống...
            </div>
          )}
          
          {!checkingBackend && isBackendOnline === false && (
            <div
              className="backend-offline-message"
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                textAlign: 'center',
                border: '1px solid #f5c6cb'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <strong>Hệ thống đang bảo trì</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Không thể kết nối đến máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmitWithCheck} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper with-toggle">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className={errors.password ? 'error' : ''}
                />
                <span className="toggle-icon" aria-hidden>
                  👁️
                </span>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            {generalError && (
              <div
                className="error-message general-error"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#fee',
                  color: '#c33',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}
              >
                {generalError}
              </div>
            )}
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Ghi nhớ đăng nhập
              </label>
              <a href={isAdmin ? "/admin/forgot-password" : "/forgot-password"} className="forgot-password">
                Quên mật khẩu?
              </a>
            </div>
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''} ${!isBackendOnline && !checkingBackend ? 'disabled' : ''}`}
              disabled={isLoading || checkingBackend || !isBackendOnline}
            >
              {checkingBackend ? (
                <>
                  <div className="spinner"></div>
                  Đang kiểm tra...
                </>
              ) : isLoading ? (
                <>
                  <div className="spinner"></div>
                  Đang đăng nhập...
                </>
              ) : !isBackendOnline ? (
                'Không thể đăng nhập'
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
          <div className="divider">
            <span>HOẶC</span>
          </div>
          <div ref={googleBtnRef} className="w-full flex justify-center"></div>
          <div className="signup-link">
            <p>
              Chưa có tài khoản? <a href={isAdmin ? "/admin/register" : "/register"}>Đăng ký ngay</a>
            </p>
          </div>
        </div>
      </div>

      {/* Modal thông báo tài khoản bị khóa */}
      {isBanned && (
        <div className="banned-modal-overlay">
          <div className="banned-modal">
            <div className="banned-modal-icon">🚫</div>
            <h2 className="banned-modal-title">Tài khoản bị khóa</h2>
            <p className="banned-modal-message">
              Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng hoặc theo yêu cầu của quản trị viên.
            </p>
            <p className="banned-modal-contact">
              Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ qua email: <strong>support@esce.vn</strong>
            </p>
            <button 
              className="banned-modal-button"
              onClick={() => setIsBanned(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginForm





