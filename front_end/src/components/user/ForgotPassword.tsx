import { useState } from 'react'
import type { FormEvent } from 'react'
import './ForgotPassword.css'
import { forgotPassword } from '~/api/user/instances/Au'
import { useNavigate } from 'react-router-dom'

interface ForgotPasswordProps {
  isAdmin?: boolean
}

const ForgotPassword = ({ isAdmin = false }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const otpPath = isAdmin ? '/admin/otp-verification' : '/otp-verification'
  const loginPath = isAdmin ? '/admin/login' : '/login'

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setError('')

    if (!email || email.trim() === '') {
      setError('Email là bắt buộc')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)

    try {
      await forgotPassword(email, '')
      setSent(true)
      navigate(`${otpPath}?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      if (err?.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', err)
        setSent(true)
        navigate(`${otpPath}?email=${encodeURIComponent(email)}`)
        return
      }
      const errorMessage = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background flex min-h-screen justify-center items-center">
      <div className="login-card max-w-[40rem]">
        <div className="flex justify-center items-center">
          <div className="p-[0.8rem] bg-white max-w-fit rounded-">
            <img src="/img/logo_esce.png" alt="Logo ESCE" className="max-h-32" />
          </div>
        </div>
        <h3 className="title">Quên mật khẩu</h3>
        <p className="subtitle">Nhập email của bạn và chúng tôi sẽ gửi mã OTP</p>

        {sent ? (
          <div className="fp-success">Đã gửi mã OTP tới {email}</div>
        ) : (
          <form onSubmit={handleSubmit} className="fp-form" noValidate>
            <label htmlFor="fp-email" className="text-[1.6rem]!">
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="fp-email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'error' : ''}
              />
            </div>
            {error && <span className="error-message">{error}</span>}

            <button
              type="submit"
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>Đang gửi...
                </>
              ) : (
                'Gửi OTP'
              )}
            </button>
          </form>
        )}

        <a href={loginPath} className="fp-back text-[1.6rem]! hover:text-[#FFEA00]!">
          ← Quay lại đăng nhập
        </a>
      </div>
    </div>
  )
}

export default ForgotPassword





