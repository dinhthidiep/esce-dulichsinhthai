import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import Badge from './ui/Badge'
import { CheckCircleIcon, ArrowRightIcon, TrendingUpIcon } from './icons/index'
import { useUserLevel } from '~/hooks/useUserLevel'
import { formatPrice } from '~/lib/utils'
import LevelProgressBar from './LevelProgressBar'
import './SubscriptionPackages.css'

interface LevelInfo {
  level: number
  name: string
  minAmount: number
  maxAmount: number | null
  icon: string
  color: string
  gradient: string
  benefits: string[]
}

const SubscriptionPackages = () => {
  const navigate = useNavigate()
  
  // Lấy userId từ localStorage
  const getUserId = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const userId = userInfo.Id || userInfo.id
        if (userId) {
          const parsedId = parseInt(userId)
          if (!isNaN(parsedId) && parsedId > 0) {
            return parsedId
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  const userId = getUserId()
  const { totalSpent, level: currentUserLevel, progress, nextLevelAmount, loading: levelLoading } = useUserLevel(userId)

  const levels: LevelInfo[] = [
    {
      level: 0,
      name: 'Mới bắt đầu',
      minAmount: 0,
      maxAmount: 0,
      icon: '⭐',
      color: '#94a3b8',
      gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
      benefits: [
        'Truy cập đầy đủ các dịch vụ du lịch',
        'Đặt tour và dịch vụ không giới hạn',
        'Hỗ trợ khách hàng cơ bản',
        'Nhận thông báo về ưu đãi mới'
      ]
    },
    {
      level: 1,
      name: 'Đồng',
      minAmount: 0,
      maxAmount: 1000000,
      icon: '🥉',
      color: '#cd7f32',
      gradient: 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)',
      benefits: [
        'Tất cả quyền lợi của Level 0',
        'Giảm giá 3% cho tất cả dịch vụ',
        'Ưu tiên xử lý đơn đặt hàng',
        'Tích lũy điểm thưởng khi đặt dịch vụ',
        'Nhận ưu đãi đặc biệt trong các dịp lễ'
      ]
    },
    {
      level: 2,
      name: 'Bạc',
      minAmount: 1000000,
      maxAmount: 3000000,
      icon: '🥈',
      color: '#c0c0c0',
      gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)',
      benefits: [
        'Tất cả quyền lợi của Level 1',
        'Giảm giá 5% cho tất cả dịch vụ',
        'Hỗ trợ khách hàng ưu tiên',
        'Nhận ưu đãi độc quyền hàng tháng',
        'Tích lũy điểm thưởng gấp đôi',
        'Quyền truy cập sớm các tour mới'
      ]
    },
    {
      level: 3,
      name: 'Vàng',
      minAmount: 3000000,
      maxAmount: null,
      icon: '🥇',
      color: '#ffd700',
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
      benefits: [
        'Tất cả quyền lợi của Level 2',
        'Giảm giá 10% cho tất cả dịch vụ',
        'Hỗ trợ khách hàng VIP 24/7',
        'Nhận ưu đãi đặc biệt và quà tặng độc quyền',
        'Tích lũy điểm thưởng gấp ba',
        'Quyền truy cập sớm và ưu tiên đặt chỗ',
        'Tư vấn du lịch miễn phí từ chuyên gia',
        'Miễn phí hủy và đổi lịch linh hoạt'
      ]
    }
  ]


  const getLevelRange = (level: LevelInfo) => {
    if (level.level === 0) {
      return '0 VNĐ'
    }
    if (level.maxAmount === null) {
      return `Từ ${formatPrice(level.minAmount)} VNĐ trở lên`
    }
    return `${formatPrice(level.minAmount)} - ${formatPrice(level.maxAmount)} VNĐ`
  }

  // Tính level number từ totalSpent
  const calculateLevelNumber = (spent: number): number => {
    if (spent >= 3000000) return 3
    if (spent >= 1000000) return 2
    if (spent > 0) return 1
    return 0
  }

  const currentLevelNumber = calculateLevelNumber(totalSpent)

  const getNextLevelAmount = (levelNum: number): number | null => {
    if (levelNum >= 3) return null
    const nextLevel = levels.find(l => l.level === levelNum + 1)
    return nextLevel ? nextLevel.minAmount : null
  }

  const remainingToNextLevel = getNextLevelAmount(currentLevelNumber)
    ? getNextLevelAmount(currentLevelNumber)! - totalSpent
    : null

  return (
    <div className="sub-subscription-packages-page">
      <Header />
      <main className="sub-subscription-packages-main">
        <div className="sub-subscription-packages-container">
          {/* Hero Section */}
          <section className="sub-packages-hero">
            <div className="sub-packages-hero-content">
              <h1 className="sub-packages-hero-title">Hệ thống cấp độ thành viên</h1>
              <p className="sub-packages-hero-subtitle">
                Chi tiêu càng nhiều, bạn càng nhận được nhiều ưu đãi và quyền lợi đặc biệt
              </p>
            </div>
          </section>

          {/* Current Level Status */}
          {userId && !levelLoading && (
            <section className="sub-current-level-section">
              <Card className="sub-current-level-card">
                <CardContent className="sub-level-progress-card-content">
                  <LevelProgressBar
                    totalSpent={totalSpent}
                    level={currentUserLevel}
                    progress={progress}
                    nextLevelAmount={nextLevelAmount}
                    showDetails={true}
                    size="large"
                  />
                </CardContent>
              </Card>
            </section>
          )}

          {/* Levels Grid */}
          <section className="sub-packages-section">
            <h2 className="sub-section-title">Các cấp độ thành viên</h2>
            <div className="sub-packages-grid">
              {levels.map((levelInfo) => {
                const isCurrentLevel = userId && currentLevelNumber === levelInfo.level
                const isUnlocked = userId && currentLevelNumber >= levelInfo.level
                const isLocked = userId && currentLevelNumber < levelInfo.level

                return (
                  <Card 
                    key={levelInfo.level} 
                    className={`sub-package-card level-card ${isCurrentLevel ? 'sub-current' : ''} ${isLocked ? 'sub-locked' : ''}`}
                  >
                    {isCurrentLevel && (
                      <div className="sub-popular-badge-wrapper">
                        <Badge variant="primary">Cấp độ hiện tại</Badge>
                      </div>
                    )}
                    
                    <div 
                      className="sub-package-header"
                      style={{ background: levelInfo.gradient }}
                    >
                      <div className="sub-level-icon-large">{levelInfo.icon}</div>
                      <h2 className="sub-package-name">{levelInfo.name}</h2>
                      <p className="sub-level-number">Level {levelInfo.level}</p>
                    </div>

                    <CardContent className="sub-package-body">
                      <div className="sub-package-price">
                        <span className="sub-price-label">Mốc chi tiêu</span>
                        <span className="sub-price-amount">{getLevelRange(levelInfo)}</span>
                      </div>

                      <ul className="sub-package-features">
                        {levelInfo.benefits.map((benefit, index) => (
                          <li key={index} className="sub-feature-item">
                            <CheckCircleIcon className="sub-feature-icon" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      {isLocked && (
                        <div className="sub-locked-overlay">
                          <p className="sub-locked-text">
                            Cần chi tiêu thêm {formatPrice(levelInfo.minAmount - totalSpent)} VNĐ để mở khóa
                          </p>
                        </div>
                      )}

                      {!userId && (
                        <Button
                          onClick={() => navigate('/login')}
                          variant="outline"
                          size="lg"
                          className="sub-subscribe-button"
                        >
                          Đăng nhập để xem
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="sub-how-it-works-section">
            <h2 className="sub-section-title">Cách hoạt động</h2>
            <div className="sub-how-it-works-grid">
              <Card className="sub-how-it-works-card">
                <CardContent>
                  <div className="sub-step-number">1</div>
                  <h3 className="sub-step-title">Đặt dịch vụ</h3>
                  <p className="sub-step-description">
                    Bắt đầu hành trình của bạn bằng cách đặt các dịch vụ du lịch trên nền tảng
                  </p>
                </CardContent>
              </Card>
              <Card className="sub-how-it-works-card">
                <CardContent>
                  <div className="sub-step-number">2</div>
                  <h3 className="sub-step-title">Tích lũy chi tiêu</h3>
                  <p className="sub-step-description">
                    Mỗi lần thanh toán dịch vụ, số tiền sẽ được cộng vào tổng chi tiêu của bạn
                  </p>
                </CardContent>
              </Card>
              <Card className="sub-how-it-works-card">
                <CardContent>
                  <div className="sub-step-number">3</div>
                  <h3 className="sub-step-title">Tự động nâng cấp</h3>
                  <p className="sub-step-description">
                    Khi đạt mốc chi tiêu, bạn sẽ tự động được nâng cấp lên level cao hơn
                  </p>
                </CardContent>
              </Card>
              <Card className="sub-how-it-works-card">
                <CardContent>
                  <div className="sub-step-number">4</div>
                  <h3 className="sub-step-title">Nhận ưu đãi</h3>
                  <p className="sub-step-description">
                    Tận hưởng các ưu đãi và quyền lợi đặc biệt dành riêng cho cấp độ của bạn
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="sub-packages-faq-section">
            <h2 className="sub-faq-section-title">Câu hỏi thường gặp</h2>
            <div className="sub-faq-grid">
              <Card className="sub-faq-card">
                <CardContent>
                  <h3 className="sub-faq-question">Làm thế nào để nâng cấp level?</h3>
                  <p className="sub-faq-answer">
                    Bạn chỉ cần đặt và thanh toán các dịch vụ du lịch. Khi tổng chi tiêu đạt mốc của level tiếp theo, bạn sẽ tự động được nâng cấp.
                  </p>
                </CardContent>
              </Card>
              <Card className="sub-faq-card">
                <CardContent>
                  <h3 className="sub-faq-question">Level có bị giảm không?</h3>
                  <p className="sub-faq-answer">
                    Không, level của bạn sẽ không bao giờ bị giảm. Một khi đã đạt được level, bạn sẽ giữ nguyên level đó vĩnh viễn.
                  </p>
                </CardContent>
              </Card>
              <Card className="sub-faq-card">
                <CardContent>
                  <h3 className="sub-faq-question">Tổng chi tiêu được tính như thế nào?</h3>
                  <p className="sub-faq-answer">
                    Tổng chi tiêu được tính từ tất cả các đơn đặt dịch vụ đã thanh toán thành công của bạn trên nền tảng.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SubscriptionPackages




