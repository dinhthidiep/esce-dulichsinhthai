import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'
import { requestOtpForRegister, checkEmail } from '~/api/user/instances/Au'
import { fetchWithFallback, extractErrorMessage } from '~/api/user/instances/httpClient'

interface FormData {
  name: string
  email: string
  password: string
  confirm: string
  phone: string
  agree: boolean
}

interface Errors {
  name?: string
  email?: string
  password?: string
  confirm?: string
  phone?: string
  agree?: string
  submit?: string
}

interface RegisterProps {
  isAdmin?: boolean
}

const Register = ({ isAdmin = false }: RegisterProps) => {
  const navigate = useNavigate()
  const redirectPath = isAdmin ? '/admin/dashboard' : '/'
  const otpPath = isAdmin ? '/admin/otp-verification' : '/otp-verification'
  const loginPath = isAdmin ? '/admin/login' : '/login'
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    agree: false
  })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [showOtpSentModal, setShowOtpSentModal] = useState(false)

  // Password strength checks
  const passwordChecks = {
    hasUppercase: /[A-Z]/.test(form.password),
    hasLowercase: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(form.password),
    hasMinLength: form.password.length >= 8
  }

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google || !(window as any).google.accounts || !(window as any).google.accounts.id) return
      ;(window as any).google.accounts.id.initialize({
        client_id: '281718540202-fgep1miupulamf080uo799stbr4f8ge0.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            setGeneralError('')
            const idToken = response.credential
            
            if (!idToken) {
              setGeneralError('Không nhận được token từ Google. Vui lòng thử lại!')
              return
            }

            const res = await fetchWithFallback('/Auth/logingoogle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                idToken, 
                phoneNumber: form.phone || '' 
              })
            })

            if (!res.ok) {
              const errorMessage = await extractErrorMessage(res, 'Không thể đăng ký/đăng nhập bằng Google. Vui lòng thử lại!')
              setGeneralError(errorMessage)
              return
            }

            const data = await res.json()
            
            const token = data?.token || data?.Token
            if (!token) {
              setGeneralError('Không nhận được token từ server. Vui lòng thử lại!')
              return
            }

            localStorage.setItem('token', token)
            const userInfo = data.UserInfo || data.userInfo
            if (userInfo) {
              localStorage.setItem('userInfo', JSON.stringify(userInfo))
            }

            window.dispatchEvent(new CustomEvent('userStorageChange'))
            navigate(redirectPath)
          } catch (err: any) {
            console.error('Google register/login error:', err)
            setGeneralError(err.message || 'Không thể đăng ký/đăng nhập bằng Google. Vui lòng thử lại!')
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
            text: 'signup_with',
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
  }, [navigate, form.phone])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    // Chỉ cho phép nhập số vào trường phone
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '') // Loại bỏ tất cả ký tự không phải số
      setForm((prev) => ({ ...prev, [name]: numericValue }))
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleEmailBlur = async () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      return
    }

    setCheckingEmail(true)
    try {
      const result = await checkEmail(form.email)
      if (result.isExisting) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.'
        }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          if (newErrors.email && newErrors.email.includes('đã được sử dụng')) {
            delete newErrors.email
          }
          return newErrors
        })
      }
    } catch (error) {
      console.error('Error checking email:', error)
    } finally {
      setCheckingEmail(false)
    }
  }

  const validate = (): Errors => {
    const err: Errors = {}
    // Họ và tên: bắt buộc, không để trống
    if (!form.name || !form.name.trim()) err.name = 'Họ và tên là bắt buộc'
    // Email
    if (!form.email) err.email = 'Email là bắt buộc'
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Email không hợp lệ'
    // Số điện thoại: bắt buộc, phải đủ 10 số và chỉ chứa số
    if (!form.phone) err.phone = 'Số điện thoại là bắt buộc'
    else if (!/^\d+$/.test(form.phone)) err.phone = 'Số điện thoại chỉ được chứa số'
    else if (form.phone.length !== 10) err.phone = 'Số điện thoại phải đủ 10 số'
    // Mật khẩu
    if (!form.password) err.password = 'Mật khẩu là bắt buộc'
    else if (!isPasswordStrong) err.password = 'Mật khẩu chưa đủ mạnh'
    if (!form.confirm) err.confirm = 'Vui lòng xác nhận mật khẩu'
    else if (form.confirm !== form.password) err.confirm = 'Mật khẩu không khớp'
    if (!form.agree) err.agree = 'Bạn cần đồng ý điều khoản'
    return err
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const emailCheck = await checkEmail(form.email)
      if (emailCheck.isExisting) {
        setErrors({
          email: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.'
        })
        setLoading(false)
        return
      }

      await requestOtpForRegister(form.email, form.phone || '')

      localStorage.setItem(
        'pendingRegistration',
        JSON.stringify({
          userEmail: form.email,
          password: form.password,
          fullName: form.name,
          phone: form.phone || ''
        })
      )

      setLoading(false)
      setShowOtpSentModal(true)
    } catch (error: any) {
      if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', error)
        navigate(`${otpPath}?email=${encodeURIComponent(form.email)}&type=register`)
        return
      }
      setErrors({ submit: error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.' })
      setLoading(false)
    }
  }

  const handleCloseOtpModal = () => {
    setShowOtpSentModal(false)
    navigate(`${otpPath}?email=${encodeURIComponent(form.email)}&type=register`)
  }

  return (
    <div className="auth-background w-full flex justify-center items-center">
      {/* Modal thông báo đã gửi OTP */}
      {showOtpSentModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon-wrapper">
              <span className="success-icon">✉️</span>
            </div>
            <h3 className="success-title">Đã gửi mã OTP!</h3>
            <p className="success-message">
              Mã xác thực đã được gửi đến email <strong>{form.email}</strong>. 
              Vui lòng kiểm tra hộp thư và nhập mã OTP để hoàn tất đăng ký.
            </p>
            <button className="success-button" onClick={handleCloseOtpModal}>
              Tiếp tục xác thực
            </button>
          </div>
        </div>
      )}

      <div className="reg-container max-w-[1100px] flex flex-col lg:flex-row w-full">
        <div className="hidden lg:flex flex-col items-center justify-center bg-white/95 rounded-l-[20px] rounded-r-none p-6 w-[380px]">
          <img src="/img/logo_esce.png" alt="Logo ESCE" className="max-w-[75%] h-auto" />
        </div>
        <div className="reg-card !rounded-l-none !rounded-r-[20px] flex-1">
          <h3 className="title">Đăng ký tài khoản</h3>
          <form onSubmit={handleSubmit} className="reg-form">
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <div className="input-wrapper">
                  <input
                    id="name"
                    name="name"
                    placeholder="Nhập họ và tên"
                    value={form.name}
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                  />
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      className={errors.email ? 'error' : ''}
                      disabled={checkingEmail}
                    />
                    {checkingEmail && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#666' }}>
                        Đang kiểm tra...
                      </span>
                    )}
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <div className="input-wrapper">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'error' : ''}
                      required
                    />
                  </div>
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="input-wrapper with-toggle">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tạo mật khẩu mạnh"
                      value={form.password}
                      onChange={handleChange}
                      className={errors.password ? 'error' : ''}
                    />
                    <span
                      className="toggle-icon"
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowPassword((p) => !p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setShowPassword((p) => !p)
                      }}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  {form.password && (
                    <div className="password-strength">
                      <div className="strength-item">
                        <span className={passwordChecks.hasMinLength ? 'check valid' : 'check'}>
                          {passwordChecks.hasMinLength ? '✓' : '○'}
                        </span>
                        <span>Ít nhất 8 ký tự</span>
                      </div>
                      <div className="strength-item">
                        <span className={passwordChecks.hasUppercase ? 'check valid' : 'check'}>
                          {passwordChecks.hasUppercase ? '✓' : '○'}
                        </span>
                        <span>1 chữ in hoa (A-Z)</span>
                      </div>
                      <div className="strength-item">
                        <span className={passwordChecks.hasLowercase ? 'check valid' : 'check'}>
                          {passwordChecks.hasLowercase ? '✓' : '○'}
                        </span>
                        <span>1 chữ thường (a-z)</span>
                      </div>
                      <div className="strength-item">
                        <span className={passwordChecks.hasNumber ? 'check valid' : 'check'}>
                          {passwordChecks.hasNumber ? '✓' : '○'}
                        </span>
                        <span>1 số (0-9)</span>
                      </div>
                      <div className="strength-item">
                        <span className={passwordChecks.hasSpecial ? 'check valid' : 'check'}>
                          {passwordChecks.hasSpecial ? '✓' : '○'}
                        </span>
                        <span>1 ký tự đặc biệt (!@#$...)</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="confirm">Xác nhận mật khẩu</label>
                  <div className="input-wrapper with-toggle">
                    <input
                      id="confirm"
                      name="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirm}
                      onChange={handleChange}
                      className={errors.confirm ? 'error' : ''}
                    />
                    <span
                      className="toggle-icon"
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowConfirm((p) => !p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setShowConfirm((p) => !p)
                      }}
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </span>
                  </div>
                  {errors.confirm && <span className="error-message">{errors.confirm}</span>}
                </div>
              </div>
              <div className="reg-terms">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={form.agree}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  <span>
                    Tôi đồng ý với các điều khoản: <a href="#">Điều khoản sử dụng</a> và{' '}
                    <a href="#">Chính sách bảo mật</a>
                  </span>
                </label>
              </div>
              {errors.submit && (
                <div
                  className="error-message"
                  style={{ marginBottom: '1rem', textAlign: 'center' }}
                >
                  {errors.submit}
                </div>
              )}
              <button
                type="submit"
                className={`login-button ${loading ? 'loading' : ''} max-h-14 mt-2!`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>Đang gửi mã OTP...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>
            <div className="divider">
              <span>HOẶC</span>
            </div>
            {generalError && (
              <div
                className="error-message"
                style={{ marginBottom: '1rem', textAlign: 'center' }}
              >
                {generalError}
              </div>
            )}
          <div ref={googleBtnRef} className="w-full flex justify-center"></div>
          <div className="signup-link">
            Đã có tài khoản? <a href={loginPath}>Đăng nhập ngay</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register





