import React, { useEffect, useRef, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import './LoginForm.css'
import { login } from '~/API/instances/Au'
import { useNavigate } from 'react-router-dom'
import { fetchWithFallback, extractErrorMessage } from '~/API/instances/httpClient'

interface FormData {
  email: string
  password: string
}

interface Errors {
  email?: string
  password?: string
}

const LoginForm = () => {
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google || !(window as any).google.accounts || !(window as any).google.accounts.id) return
      
      // Initialize Google OAuth
      (window as any).google.accounts.id.initialize({
        client_id: '772898465184-2lct3e00mcjggjn5tm33m95bquejphv2.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            setGeneralError('')
            const idToken = response.credential
            
            if (!idToken) {
              setGeneralError('Không nhận được token từ Google. Vui lòng thử lại!')
              return
            }

            // Gọi API login với Google
            const res = await fetchWithFallback('/api/Auth/logingoogle', {
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
            navigate('/')
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
      navigate('/')
    } catch (error: any) {
      if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', error)
        navigate('/')
        return
      }
      console.error('Login error:', error)
      setGeneralError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại!')
    } finally {
      setIsLoading(false)
    }
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
          <form onSubmit={handleSubmit} className="login-form">
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
              <a href="/forgot-password" className="forgot-password">
                Quên mật khẩu?
              </a>
            </div>
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Đang đăng nhập...
                </>
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
              Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
