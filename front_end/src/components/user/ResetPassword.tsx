import React, { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './ResetPassword.css'
import { resetPassword } from '~/api/user/instances/Au'

interface ResetPasswordProps {
  isAdmin?: boolean
}

const ResetPassword = ({ isAdmin = false }: ResetPasswordProps) => {
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') || ''
  const otpFromQuery = searchParams.get('otp') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const loginPath = isAdmin ? '/admin/login' : '/login'

  const email = useMemo(() => emailFromQuery, [emailFromQuery])
  const otp = useMemo(() => otpFromQuery, [otpFromQuery])

  // Password strength checks
  const passwordChecks = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
    hasMinLength: password.length >= 8
  }

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !otp) {
      setError('Thiếu thông tin xác thực. Vui lòng thử lại.')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (!isPasswordStrong) {
      setError('Mật khẩu chưa đủ mạnh')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, otp, password)
      navigate(loginPath)
    } catch (err: any) {
      if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', err)
        navigate(loginPath)
        return
      }
      setError('Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background login-container flex justify-center items-center">
      <div className="login-card max-w-[40rem]">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>
        <h3 className="title">Đặt lại mật khẩu</h3>
        <p className="subtitle">Nhập mật khẩu mới cho tài khoản {email}</p>

        <form onSubmit={handleSubmit} className="fp-form">
          <label htmlFor="password">Mật khẩu mới</label>
          <div className="input-wrapper with-toggle">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'error' : ''}
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

          {password && (
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

          <label htmlFor="confirm" style={{ marginTop: 12 }}>
            Xác nhận mật khẩu
          </label>
          <div className="input-wrapper with-toggle">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={error ? 'error' : ''}
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

          {error && <span className="error-message">{error}</span>}

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>Đang lưu...
              </>
            ) : (
              'Lưu mật khẩu mới'
            )}
          </button>
        </form>

        <a href={loginPath} className="fp-back">
          ← Về đăng nhập
        </a>
      </div>
    </div>
  )
}

export default ResetPassword



