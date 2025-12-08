import React, { useState } from 'react';
import './ForgotPassword.css';
import { forgotPassword } from '../API/Au';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    console.log("🚀 [DEBUG] handleSubmit được gọi!", { email, event: e });
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError("");
    
    console.log("📧 [DEBUG] Email value:", email);
    
    if (!email || email.trim() === "") {
      console.log("❌ [DEBUG] Email trống");
      setError("Email là bắt buộc");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      console.log("❌ [DEBUG] Email không hợp lệ:", email);
      setError("Email không hợp lệ");
      return;
    }
    
    console.log("⏳ [DEBUG] Bắt đầu gửi request...");
    setLoading(true);

    try {
      console.log("📤 [DEBUG] Gọi forgotPassword API với:", { email, phoneNumber: "" });
      const result = await forgotPassword(email, "");
      console.log("✅ [DEBUG] Forgot password request thành công:", result);
      setSent(true);
      navigate(`/otp-verification?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("❌ [DEBUG] Error trong handleSubmit:", error);
      console.error("❌ [DEBUG] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      const errorMessage = error?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("🏁 [DEBUG] handleSubmit kết thúc");
    }
  };

  const handleButtonClick = (e) => {
    console.log("🖱️ [DEBUG] Button được click!");
    e.preventDefault();
    e.stopPropagation();
    
    // Manually trigger form submit
    const form = e.target.closest('form');
    if (form) {
      console.log("📋 [DEBUG] Tìm thấy form, trigger submit");
      handleSubmit(null);
    } else {
      console.log("⚠️ [DEBUG] Không tìm thấy form, gọi handleSubmit trực tiếp");
      handleSubmit(null);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <h2 className="brand-name">ESCE</h2>
          <p className="brand-sub">Du lịch sinh thái</p>
        </div>

        <div className="fp-icon">✉️</div>
        <h3 className="title">Quên mật khẩu</h3>
        <p className="subtitle">Nhập email của bạn và chúng tôi sẽ gửi mã OTP</p>

        {sent ? (
          <div className="fp-success">Đã gửi mã OTP tới {email}</div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="fp-form"
            noValidate
          >
            <label htmlFor="fp-email">Email</label>
            <div className="input-wrapper">
              <input
                id="fp-email"
                type="email"
                placeholder="nhập email của bạn"
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
              {loading ? <><div className="spinner"></div>Đang gửi...</> : ' OTP'}
            </button>
          </form>
        )}

        <a href="/login" className="fp-back">← Quay lại đăng nhập</a>
      </div>
    </div>
  );
};

export default ForgotPassword;


