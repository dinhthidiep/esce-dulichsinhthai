import React, { useState } from 'react';
import './LoginForm.css';
import { login } from '../API/Au';
import { useNavigate } from 'react-router-dom';
import { signInToFirebase } from '../services/firebaseAuth';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setGeneralError('');
    
    try {
      // Step 1: Login to backend
      const response = await login(formData.email, formData.password);
      
      // Lưu token vào localStorage
      if (response.Token || response.token) {
        localStorage.setItem('token', response.Token || response.token);
      }
      
      // Lưu thông tin user nếu có (backend có thể trả về UserInfo hoặc userInfo)
      const userInfo = response.UserInfo || response.userInfo;
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
      
      // Step 2: Sign in to Firebase Auth (required for Firebase Storage)
      try {
        await signInToFirebase(formData.email, formData.password);
        console.log('Firebase Auth sign-in successful');
      } catch (firebaseError) {
        // If Firebase Auth fails, log but don't block login
        // User can still use the app, but image uploads might fail
        console.warn('Firebase Auth sign-in failed (image uploads may not work):', firebaseError);
        // Don't throw - allow user to continue with backend login
      }
      
      // Đăng nhập thành công - chuyển hướng hoặc hiển thị thông báo
      alert('Đăng nhập thành công! Chào mừng đến với ESCE!');
      
      // Chuyển hướng đến trang chủ hoặc dashboard
      navigate('/'); // Hoặc navigate('/dashboard') tùy theo route của bạn
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>

        <h3 className="title">Đăng nhập</h3>
        <p className="subtitle">Nhập thông tin tài khoản để đăng nhập</p>

        

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
                placeholder="nhập email của bạn"
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
                placeholder="nhập mật khẩu"
                className={errors.password ? 'error' : ''}
              />
              <span className="toggle-icon" aria-hidden>👁️</span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {generalError && (
          <div className="error-message general-error" style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {generalError}
          </div>
        )}
        
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Ghi nhớ đăng nhập
            </label>
            <a href="/forgot-password" className="forgot-password">Quên mật khẩu?</a>
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

        <div className="divider"><span>HOẶC</span></div>

        <button className="google-button">
          <span className="g-icon">G</span>
          Đăng nhập bằng Google
        </button>

        <div className="signup-link">
          <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
