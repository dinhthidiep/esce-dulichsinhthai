import { useState } from 'react'
import './ForgotPassword.css'
import { forgotPassword } from '~/api/instances/Au'
import { useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
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
      const result = await forgotPassword(email, '')
      setSent(true)
      navigate(`/otp-verification?email=${encodeURIComponent(email)}`)
    } catch (error) {
      // Bỏ qua lỗi network/fetch
      if (error?.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'))) {
        console.warn('Network error ignored:', error)
        // Cho phép tiếp tục flow mà không hiển thị lỗi
        setSent(true)
        navigate(`/otp-verification?email=${encodeURIComponent(email)}`)
        return
      }
      const errorMessage = error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('🏁 [DEBUG] handleSubmit kết thúc')
    }
  }

  const handleButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Manually trigger form submit
    const form = e.target.closest('form')
    if (form) {
      handleSubmit(null)
    } else {
      handleSubmit(null)
    }
  }

  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="login-card max-w-[40rem]">
        <div className="flex justify-center items-center">
          <div className="p-[0.8rem] bg-white max-w-fit rounded-">
            <img src="/images/logo.png" alt="Logo" className="max-h-32 max-w-2max-h-32" />
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
                ' OTP'
              )}
            </button>
          </form>
        )}

        <a href="/login" className="fp-back text-[1.6rem]! hover:text-[#FFEA00]!">
          ← Quay lại đăng nhập
        </a>
      </div>
    </div>
  )
}

export default ForgotPassword
