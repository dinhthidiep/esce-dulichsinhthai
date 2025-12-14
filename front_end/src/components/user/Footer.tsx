import React from 'react'
import { Link } from 'react-router-dom'
import { LeafIcon } from '~/components/user/icons'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-footer">
      <div className="footer-footer-container">
        <div className="footer-footer-content">
          <div className="footer-footer-main-content">
            {/* Logo & Description */}
            <div className="footer-footer-section footer-footer-about">
            <div className="footer-footer-logo">
              <img src="/img/logo_esce.png" alt="ESCE Logo" className="footer-footer-logo-img" />
              <div className="footer-footer-logo-text">
                <div className="footer-footer-logo-main">Du Lịch Sinh thái</div>
                <div className="footer-footer-logo-sub">Đà Nẵng</div>
              </div>
            </div>
            <p className="footer-footer-description">
              Kết nối dịch vụ du lịch tiện ích, tiết kiệm, mang đến trải nghiệm hoàn hảo tại các khu du lịch sinh thái.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-footer-section">
            <h3 className="footer-footer-title">Liên kết nhanh</h3>
            <ul className="footer-footer-links">
              <li>
                <Link to="/">Trang chủ</Link>
              </li>
              <li>
                <Link to="/services">Dịch vụ</Link>
              </li>
              <li>
                <Link to="/forum">Diễn đàn</Link>
              </li>
              <li>
                <Link to="/news">Tin tức</Link>
              </li>
              <li>
                <Link to="/policy">Chính sách</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-footer-section">
            <h3 className="footer-footer-title">Liên hệ</h3>
            <ul className="footer-footer-contact">
              <li>
                <span className="footer-footer-contact-label">Email:</span>
                <a href="mailto:Esce@gmail.com">Esce@gmail.com</a>
              </li>
              <li>
                <span className="footer-footer-contact-label">Hotline:</span>
                <a href="tel:1900123456">0948111235</a>
              </li>
              <li>
                <span className="footer-footer-contact-label">Địa chỉ:</span>
                <span>Đà Nẵng, Việt Nam</span>
              </li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div className="footer-footer-section">
            <h3 className="footer-footer-title">Theo dõi chúng tôi</h3>
            <div className="footer-footer-social">
              <a href="#" className="footer-footer-social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="footer-footer-social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="footer-footer-social-link" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-footer-bottom">
            <div className="footer-footer-bottom-content">
              <p className="footer-footer-copyright">
                © {currentYear} ESCE Du Lịch Sinh Thái. Tất cả quyền được bảo lưu.
              </p>
              <div className="footer-footer-bottom-links">
                <Link to="/policy">Chính sách</Link>
                <span className="footer-footer-separator">|</span>
                <Link to="/terms">Điều khoản</Link>
                <span className="footer-footer-separator">|</span>
                <Link to="/privacy">Bảo mật</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer






