import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'
import { requestOtpForRegister, checkEmail } from '~/api/instances/Au'
import { fetchWithFallback, extractErrorMessage } from '~/api/instances/httpClient'

const Register = () => {
  const navigate = useNavigate()
  const googleBtnRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    agree: false
  })
  const [errors, setErrors] = useState()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return
      window.google.accounts.id.initialize({
        client_id: '772898465184-2lct3e00mcjggjn5tm33m95bquejphv2.apps.googleusercontent.com',
        callback: async (response) => {
          try {
            setGeneralError('')
            const idToken = response.credential
            
            if (!idToken) {
              setGeneralError('Không nhận được token từ Google. Vui lòng thử lại!')
              return
            }

            // Gọi API login với Google - backend sẽ tự động tạo user nếu chưa tồn tại
            const res = await fetchWithFallback('/api/Auth/logingoogle', {
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
              console.error('Google register/login failed:', res.status, errorMessage)
              return
            }

            const data = await res.json()
            
            // Kiểm tra token
            const token = data?.token || data?.Token
            if (!token) {
              setGeneralError('Không nhận được token từ server. Vui lòng thử lại!')
              console.error('No token in response:', data)
              return
            }

            // Lưu token và userInfo
            localStorage.setItem('token', token)
            const userInfo = data.UserInfo || data.userInfo
            if (userInfo) {
              localStorage.setItem('userInfo', JSON.stringify(userInfo))
            }

            // Chuyển đến trang chủ
            navigate('/')
          } catch (err) {
            console.error('Google register/login error:', err)
            const errorMessage = err.message || 'Không thể đăng ký/đăng nhập bằng Google. Vui lòng thử lại!'
            setGeneralError(errorMessage)
          }
        }
      })
      
      // Render button when ref is available
      const renderButton = () => {
        if (googleBtnRef.current && window.google?.accounts?.id) {
          // Clear any existing button first
          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular'
          })
        }
      }
      
      // Try to render immediately
      renderButton()
      
      // Also try after a short delay in case ref isn't ready yet
      setTimeout(renderButton, 100)
    }
    
    if (window.google && window.google.accounts && window.google.accounts.id) {
      initGoogle()
    } else {
      const handle = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(handle)
          initGoogle()
        }
      }, 200)
      return () => clearInterval(handle)
    }
  }, [navigate, form.phone])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleEmailBlur = async () => {
    // Check email when user leaves the email field
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
        // Clear email error if email is available
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
      // Don't show error if check fails, allow user to proceed
    } finally {
      setCheckingEmail(false)
    }
  }

  const validate = () => {
    const err = {}
    if (!form.email) err.email = 'Email là bắt buộc'
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Email không hợp lệ'
    if (!form.password) err.password = 'Mật khẩu là bắt buộc'
    else if (form.password.length < 6) err.password = 'Ít nhất 6 ký tự'
    if (!form.confirm) err.confirm = 'Vui lòng xác nhận mật khẩu'
    else if (form.confirm !== form.password) err.confirm = 'Mật khẩu không khớp'
    if (!form.agree) err.agree = 'Bạn cần đồng ý điều khoản'
    return err
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Check if email already exists before requesting OTP
      const emailCheck = await checkEmail(form.email)
      if (emailCheck.isExisting) {
        setErrors({
          email: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.'
        })
        setLoading(false)
        return
      }

      // Request OTP for registration
      await requestOtpForRegister(form.email, form.phone || '')

      // Store registration data temporarily to complete registration after OTP verification
      localStorage.setItem(
        'pendingRegistration',
        JSON.stringify({
          userEmail: form.email,
          password: form.password,
          fullName: form.name,
          phone: form.phone || ''
        })
      )

      // Navigate to OTP verification page
      navigate(`/otp-verification?email=${encodeURIComponent(form.email)}&type=register`)
    } catch (error) {
      // Bỏ qua lỗi network/fetch
      if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', error)
        // Cho phép tiếp tục flow mà không hiển thị lỗi
        navigate(`/otp-verification?email=${encodeURIComponent(form.email)}&type=register`)
        return
      }
      setErrors({ submit: error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.' })
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="reg-container max-w-[70%] grid grid-col-1 gap-[2.4rem] lg:gap-0 lg:grid-cols-[50rem_1fr] w-full place-content-center">
        <div className="lg:flex flex-col gap-[2.4rem] bg-[#ede8df] items-center hidden">
          <img src="/images/logo.png" alt="Logo" className="max-w-full h-auto" />
        </div>
        <div className="reg-card flex flex-col items-start h-full rounded-none! w-full">
          <h3 className="title flex justify-center w-full">Đăng ký tài khoản</h3>
          <div className="flex flex-col w-full">
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
                    className={errors?.name ? 'error' : ''}
                  />
                </div>
                {errors?.name && <span className="error-message">{errors?.name}</span>}
              </div>
              <div className="flex flex-col sm:flex-row gap-[2.4rem] items-center w-full">
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
                      className={errors?.email ? 'error' : ''}
                      disabled={checkingEmail}
                    />
                    {checkingEmail && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#666' }}>
                        Đang kiểm tra...
                      </span>
                    )}
                  </div>
                  {errors?.email && <span className="error-message">{errors?.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
                  <div className="input-wrapper">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={handleChange}
                      className={errors?.phone ? 'error' : ''}
                    />
                  </div>
                  {errors?.phone && <span className="error-message">{errors?.phone}</span>}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-[2.4rem] items-center w-full">
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
                      className={errors?.password ? 'error' : ''}
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
                  {errors?.password && <span className="error-message">{errors?.password}</span>}
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
                      className={errors?.confirm ? 'error' : ''}
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
                  {errors?.confirm && <span className="error-message">{errors?.confirm}</span>}
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
              {errors?.submit && (
                <div
                  className="error-message"
                  style={{ marginBottom: '1rem', textAlign: 'center' }}
                >
                  {errors?.submit}
                </div>
              )}
              <button
                type="submit"
                className={`login-button ${loading ? 'loading' : ''} max-h-16 mt-[2rem]!`}
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
              Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
