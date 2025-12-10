import React, { useState, useRef, useEffect } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './OTPVerification.css'
import { verifyOtpForRegister, verifyOtp, register, requestOtpForRegister, forgotPassword } from '~/API/instances/Au'
import { getRedirectUrlByRole } from '~/lib/utils'

const OTPVerification = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'register' // 'register' or 'forgot-password'

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Đếm ngược thời gian gửi lại mã
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(resendTimer - 1)
      }, 1000)
    } else {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [resendTimer])

  const handleInputChange = (index: number, value: string) => {
    // Chỉ cho phép nhập số
    if (!/^\d*$/.test(value)) return

    // Xóa thông báo lỗi khi người dùng nhập lại
    if (error) {
      setError('')
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Tự động chuyển sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Xử lý phím Backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const otpString = otp.join('').trim()
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP')
      return
    }

    if (!email) {
      setError('Không tìm thấy email. Vui lòng thử lại từ đầu.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verify OTP
      if (type === 'register') {
        await verifyOtpForRegister(email, otpString)

        // OTP verified successfully, now complete registration
        const pendingRegistrationStr = localStorage.getItem('pendingRegistration') || '{}'
        const pendingRegistration = JSON.parse(pendingRegistrationStr) as {
          userEmail?: string
          password?: string
          fullName?: string
          phone?: string
        }

        if (pendingRegistration.userEmail && pendingRegistration.password && pendingRegistration.fullName) {
          // Complete registration
          const response = await register(
            pendingRegistration.userEmail,
            pendingRegistration.password,
            pendingRegistration.fullName,
            pendingRegistration.phone || ''
          )

          // Clear pending registration
          localStorage.removeItem('pendingRegistration')

          // Store token and user info vào sessionStorage (mặc định cho đăng ký mới)
          // Người dùng có thể đăng nhập lại sau và chọn "Ghi nhớ đăng nhập" nếu muốn
          if ((response as { Token?: string; token?: string }).Token || (response as { token?: string }).token) {
            sessionStorage.setItem(
              'token',
              ((response as { Token?: string }).Token || (response as { token: string }).token) as string
            )
            // Xóa token cũ từ localStorage nếu có
            localStorage.removeItem('token')
          }

          const userInfo = (response as { UserInfo?: unknown; userInfo?: unknown }).UserInfo || (response as { userInfo?: unknown }).userInfo
          if (userInfo) {
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo))
            // Xóa userInfo cũ từ localStorage nếu có
            localStorage.removeItem('userInfo')
            
            // Trigger custom event để Header tự động cập nhật
            window.dispatchEvent(new CustomEvent('userStorageChange'))
          }

          // Set flag để hiển thị welcome message trên landing page
          sessionStorage.setItem('justLoggedIn', 'true')

          // Navigate dựa trên role của user (mặc định là tourist với cấp độ bắt đầu)
          const redirectUrl = getRedirectUrlByRole(userInfo)
          navigate(redirectUrl)
        } else {
          setError('Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.')
        }
      } else {
        // Forgot password flow
        await verifyOtp(email, otpString)
        // Navigate to reset password page với OTP
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpString}`)
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      const errorMessage = (error as Error).message || 'Mã OTP không chính xác. Vui lòng thử lại.'
      setError(errorMessage)
      // Reset OTP inputs
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || !email) return

    setCanResend(false)
    setResendTimer(60)
    setError('')
    setOtp(['', '', '', '', '', ''])

    try {
      if (type === 'register') {
        await requestOtpForRegister(email, '')
        alert('Mã OTP đã được gửi lại đến email của bạn.')
      } else {
        await forgotPassword(email, '')
        alert('Mã OTP đã được gửi lại đến email của bạn.')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError((error as Error).message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.')
    }

    // Focus vào ô đầu tiên
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>

        <div className="otp-icon"></div>
        <h3 className="title">Xác thực OTP</h3>
        <p className="subtitle">
          Nhập mã OTP 6 số đã được gửi đến <strong>{email || 'email của bạn'}</strong>
        </p>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`otp-input ${error ? 'error' : ''}`}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang xác thực...
              </>
            ) : (
              'Xác thực OTP'
            )}
          </button>
        </form>

        <div className="resend-section">
          {canResend ? (
            <button type="button" className="resend-button" onClick={handleResend}>
              Gửi lại mã OTP
            </button>
          ) : (
            <p className="resend-timer">Gửi lại mã sau {resendTimer}s</p>
          )}
        </div>

        <a href="/forgot-password" className="fp-back">
          ← Quay lại
        </a>
      </div>
    </div>
  )
}

export default OTPVerification

