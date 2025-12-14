import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import Badge from './ui/Badge'
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  RefreshCwIcon
} from './icons/index'
import './UpgradeAccount.css'

interface UpgradeOption {
  id: 'host' | 'agency'
  title: string
  description: string
  price: string
  priceNote: string
  features: string[]
  color: string
  gradient: string
  badge?: string
}

const UpgradeAccount = () => {
  const navigate = useNavigate()

  const upgradeOptions: UpgradeOption[] = [
    {
      id: 'host',
      title: 'Nâng cấp lên Host',
      description: 'Trở thành chủ farm hoặc người tổ chức tour. Tạo và quản lý các dịch vụ du lịch của riêng bạn.',
      price: 'Miễn phí',
      priceNote: '(phí 10% khi bán dịch vụ)',
      features: [
        'Tạo và quản lý dịch vụ du lịch',
        'Quản lý booking từ khách hàng',
        'Nhận đánh giá và phản hồi',
        'Hỗ trợ 24/7 từ đội ngũ chuyên nghiệp',
        'Bảng điều khiển quản lý chuyên nghiệp',
        'Nâng cấp miễn phí - Chỉ trả phí 10% khi bán dịch vụ'
      ],
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      badge: 'Phổ biến'
    },
    {
      id: 'agency',
      title: 'Nâng cấp lên Agency',
      description: 'Dành cho công ty du lịch hoặc người đặt tour cho nhiều người. Quản lý nhóm và nhận ưu đãi đặc biệt.',
      price: '1,000,000',
      priceNote: '(phí một lần)',
      features: [
        'Đặt tour cho nhiều người cùng lúc',
        'Quản lý nhóm và booking tập thể',
        'Nhận ưu đãi và giảm giá đặc biệt',
        'Hỗ trợ tư vấn chuyên nghiệp',
        'Báo cáo và thống kê chi tiết'
      ],
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }
  ]

  const infoItems = [
    {
      icon: ShieldCheckIcon,
      title: 'Yêu cầu xét duyệt',
      description: 'Sau khi đăng ký, yêu cầu của bạn sẽ được Admin xét duyệt trong vòng 1-3 ngày làm việc.'
    },
    {
      icon: CreditCardIcon,
      title: 'Thanh toán an toàn',
      description: 'Thanh toán được xử lý an toàn qua các cổng thanh toán uy tín. Bạn chỉ thanh toán khi được duyệt.'
    },
    {
      icon: RefreshCwIcon,
      title: 'Hoàn tiền',
      description: 'Nếu yêu cầu bị từ chối, bạn sẽ được hoàn lại 100% phí đã thanh toán.'
    }
  ]

  return (
    <div className="upg-upgrade-account-page">
      <Header />
      <main className="upg-upgrade-account-main">
        {/* Hero Section */}
        <section className="upg-upgrade-page-header">
          <div className="upg-upgrade-header-container">
            <h1 className="upg-upgrade-page-title">Nâng cấp tài khoản</h1>
            <p className="upg-upgrade-page-subtitle">
              Mở rộng khả năng của bạn - Chọn gói nâng cấp phù hợp để phát triển doanh nghiệp du lịch
            </p>
          </div>
        </section>

        <div className="upg-upgrade-account-container">
          {/* Upgrade Options */}
          <section className="upg-upgrade-options-section">
            <div className="upg-upgrade-cards-grid">
              {upgradeOptions.map((option) => (
                <Card key={option.id} className="upg-upgrade-card">
                  {option.badge && (
                    <div className="upg-upgrade-card-badge">
                      <Badge variant="warning" className="upg-popular-badge">{option.badge}</Badge>
                    </div>
                  )}
                  <div 
                    className="upg-upgrade-card-header"
                    style={{ background: option.gradient }}
                  >
                    <h2 className="upg-upgrade-card-title">{option.title}</h2>
                  </div>
                  
                  <CardContent className="upg-upgrade-card-body">
                    <p className="upg-upgrade-card-description">{option.description}</p>
                    
                    <div className="upg-upgrade-price">
                      <span className="upg-price-amount">
                        {option.price} {option.price !== 'Miễn phí' && <span className="upg-price-currency">VNĐ</span>}
                      </span>
                      <span className="upg-price-note">{option.priceNote}</span>
                    </div>

                    <ul className="upg-upgrade-features">
                      {option.features.map((feature, index) => (
                        <li key={index} className="upg-feature-item">
                          <CheckCircleIcon className="upg-feature-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => option.id === 'host' ? navigate('/register/host') : navigate('/register/agency')}
                      variant="default"
                      size="lg"
                      className="upg-upgrade-button"
                      style={{ background: option.gradient, border: 'none' }}
                    >
                      Chọn gói này
                      <ArrowRightIcon className="upg-button-icon" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Info Section */}
          <section className="upg-upgrade-info-section">
            <h2 className="upg-info-section-title">Lưu ý quan trọng</h2>
            <div className="upg-info-cards-grid">
              {infoItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <Card key={index} className="upg-info-card">
                    <CardContent>
                      <div className="upg-info-card-icon">
                        <IconComponent />
                      </div>
                      <h3 className="upg-info-card-title">{item.title}</h3>
                      <p className="upg-info-card-description">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default UpgradeAccount





