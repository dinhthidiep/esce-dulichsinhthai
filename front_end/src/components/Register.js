import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { requestOtpForRegister } from '../API/Au';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', agree: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const err = {};
    if (!form.name) err.name = 'Họ và tên là bắt buộc';
    if (!form.email) err.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Email không hợp lệ';
    if (!form.password) err.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) err.password = 'Ít nhất 6 ký tự';
    if (!form.confirm) err.confirm = 'Vui lòng xác nhận mật khẩu';
    else if (form.confirm !== form.password) err.confirm = 'Mật khẩu không khớp';
    if (!form.agree) err.agree = 'Bạn cần đồng ý điều khoản';
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Request OTP for registration
      await requestOtpForRegister(form.email, form.phone || '');
      
      // Store registration data temporarily to complete registration after OTP verification
      localStorage.setItem('pendingRegistration', JSON.stringify({
        userEmail: form.email,
        password: form.password,
        fullName: form.name,
        phone: form.phone || ''
      }));
      
      // Navigate to OTP verification page
      navigate(`/otp-verification?email=${encodeURIComponent(form.email)}&type=register`);
    } catch (error) {
      setErrors({ submit: error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.' });
      setLoading(false);
    }
  };

  return (
    <div className="reg-container">
      <div className="reg-card">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>

        <h3 className="title">Đăng ký tài khoản</h3>
        <p className="subtitle">Tạo tài khoản mới để bắt đầu</p>

        <form onSubmit={handleSubmit} className="reg-form">
          <div className="form-group">
            <label htmlFor="name">Họ và tên</label>
            <div className="input-wrapper">
              <input id="name" name="name" placeholder="nhập họ và tên" value={form.name} onChange={handleChange} className={errors.name ? 'error' : ''} />
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input id="email" name="email" type="email" placeholder="nhập email của bạn" value={form.email} onChange={handleChange} className={errors.email ? 'error' : ''} />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
            <div className="input-wrapper">
              <input id="phone" name="phone" type="tel" placeholder="nhập số điện thoại" value={form.phone} onChange={handleChange} className={errors.phone ? 'error' : ''} />
            </div>
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper with-toggle">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="tạo mật khẩu mạnh" value={form.password} onChange={handleChange} className={errors.password ? 'error' : ''} />
              <span className="toggle-icon" role="button" tabIndex={0} onClick={() => setShowPassword(p => !p)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(p => !p); }} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Xác nhận mật khẩu</label>
            <div className="input-wrapper with-toggle">
              <input id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'} placeholder="nhập lại mật khẩu" value={form.confirm} onChange={handleChange} className={errors.confirm ? 'error' : ''} />
              <span className="toggle-icon" role="button" tabIndex={0} onClick={() => setShowConfirm(p => !p)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirm(p => !p); }} aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {showConfirm ? '🙈' : '👁️'}
              </span>
            </div>
            {errors.confirm && <span className="error-message">{errors.confirm}</span>}
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
                                Tôi đồng ý với các điều khoản:{" "}
                                <a href="#">Điều khoản sử dụng</a> và{" "}
                                <a href="#">Chính sách bảo mật</a>
                            </span>
                        </label>
          </div>

          {errors.submit && (
            <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {errors.submit}
            </div>
          )}

          <button type="submit" className={`login-button ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? <><div className="spinner"></div>Đang gửi mã OTP...</> : 'Đăng ký'}
          </button>
        </form>

        <div className="divider"><span>HOẶC</span></div>
        <button className="google-button"><span className="g-icon">G</span> Đăng ký bằng Google</button>

        <div className="signup-link">Đã có tài khoản? <a href="/login">Đăng nhập ngay</a></div>
      </div>
    </div>
  );
};

export default Register;


