import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './OTPVerification.css';
import { verifyOtp, verifyOtpForRegister, forgotPassword, requestOtpForRegister, register } from '../API/Au';

const OTPVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'forgot-password'; // 'register' or 'forgot-password'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (error) setError('');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (!email) {
      setError('Thiếu email. Vui lòng quay lại bước trước.');
      return;
    }
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (type === 'register') {
        // Verify OTP for registration
        await verifyOtpForRegister(email, otpString);
        
        // Get registration data from localStorage
        const pendingData = localStorage.getItem('pendingRegistration');
        if (!pendingData) {
          setError('Không tìm thấy thông tin đăng ký. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
        
        const regData = JSON.parse(pendingData);
        
        // Complete registration
        const result = await register(regData.userEmail, regData.password, regData.fullName, regData.phone);
        
        // Clear pending registration data
        localStorage.removeItem('pendingRegistration');
        
        // Store token if provided
        if (result.token) {
          localStorage.setItem('token', result.token);
        }
        
        // Navigate to login or home page
        alert('Đăng ký thành công!');
        navigate('/login');
      } else {
        // Forgot password flow
        await verifyOtp(email, otpString);
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpString)}`);
      }
    } catch (err) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setCanResend(false);
    setResendTimer(60);
    setError('');
    setOtp(['', '', '', '', '', '']);
    try {
      if (type === 'register') {
        const pendingData = localStorage.getItem('pendingRegistration');
        const phone = pendingData ? JSON.parse(pendingData).phone : '';
        await requestOtpForRegister(email, phone || '');
      } else {
        await forgotPassword(email, '');
      }
    } catch (_err) {
      // giữ im lặng, người dùng có thể thử lại sau
    }
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>

        <div className="otp-icon">🔐</div>
        <h3 className="title">Xác thực OTP</h3>
        <p className="subtitle">
          {type === 'register' 
            ? 'Nhập mã OTP 6 số để hoàn tất đăng ký' 
            : 'Nhập mã OTP 6 số để tiếp tục'}
        </p>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`otp-input ${error ? 'error' : ''}`}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`} 
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? <><div className="spinner"></div>Đang xác thực...</> : 'Xác thực OTP'}
          </button>
        </form>

        <div className="resend-section">
          {canResend ? (
            <button 
              type="button" 
              className="resend-button"
              onClick={handleResend}
            >
              Gửi lại mã OTP
            </button>
          ) : (
            <p className="resend-timer">
              Gửi lại mã sau {resendTimer}s
            </p>
          )}
        </div>

        <a href={type === 'register' ? '/register' : '/forgot-password'} className="fp-back">← Quay lại</a>
      </div>
    </div>
  );
};

export default OTPVerification;


