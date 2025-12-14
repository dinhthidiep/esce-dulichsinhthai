import React, { useState, useEffect } from 'react'
import ConditionalHeader from '~/components/user/ConditionalHeader'
import Footer from '~/components/user/Footer'
import { Card, CardContent } from '~/components/user/ui/Card'
import {
  ShieldIcon,
  LeafIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  FileTextIcon,
} from '~/components/user/icons'
import './PolicyPage.css'

interface PolicySection {
  id: number
  icon: string
  title: string
  items: string[]
}

const PolicyPage = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const policySections: PolicySection[] = [
    {
      id: 1,
      icon: 'Shield',
      title: 'Chính sách bảo mật thông tin',
      items: [
        'Chúng tôi cam kết bảo vệ dữ liệu cá nhân của khách hàng, bao gồm: họ tên, số điện thoại, email và thông tin đặt tour.',
        'Dữ liệu chỉ phục vụ cho việc tư vấn – chăm sóc khách hàng và không chia sẻ cho bên thứ ba nếu không có sự đồng ý.',
      ],
    },
    {
      id: 2,
      icon: 'CreditCard',
      title: 'Chính sách đặt tour & thanh toán',
      items: [
        'Xác nhận tour qua website, fanpage hoặc hotline.',
        'Thanh toán qua chuyển khoản hoặc tại văn phòng.',
        'Hủy tour trước 7 ngày được hoàn 100%; hủy trong vòng 1–3 ngày sẽ có phí tuỳ theo quy định từng tour.',
      ],
    },
    {
      id: 3,
      icon: 'Leaf',
      title: 'Chính sách du lịch sinh thái',
      items: [
        'Không xả rác và hạn chế đồ nhựa dùng một lần.',
        'Tuân thủ hướng dẫn của nhân viên tại các khu sinh thái.',
        'Tôn trọng môi trường, động vật và văn hóa địa phương.',
      ],
    },
    {
      id: 4,
      icon: 'ShieldCheck',
      title: 'Chính sách an toàn',
      items: [
        'Tất cả hành trình được kiểm tra an toàn trước khi khởi hành.',
        'Trang bị bảo hộ đầy đủ đối với tour trekking, suối, rừng.',
        'Hướng dẫn viên được đào tạo sơ cứu cơ bản.',
      ],
    },
    {
      id: 5,
      icon: 'FileText',
      title: 'Điều khoản sử dụng website',
      items: [
        'Không sao chép nội dung nếu chưa được phép.',
        'Không sử dụng website cho các mục đích trái pháp luật.',
        'Chúng tôi có quyền cập nhật chính sách khi cần thiết.',
      ],
    },
  ]

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Shield: ShieldIcon,
    Leaf: LeafIcon,
    ShieldCheck: ShieldCheckIcon,
    CreditCard: CreditCardIcon,
    FileText: FileTextIcon,
  }

  return (
    <div className="policy-policy-page">
      <ConditionalHeader />

      <main>
        {/* Hero Section */}
        <section className="policy-policy-hero-section" id="hero">
          <div className="policy-policy-hero-container">
            <div className="policy-policy-hero-content">
              <h1 className="policy-policy-hero-title">
                Chính sách – Du lịch Sinh Thái
                <span className="policy-policy-hero-title-highlight"> Đà Nẵng</span>
              </h1>
              <p className="policy-policy-hero-description">
                Chúng tôi cam kết mang đến dịch vụ du lịch sinh thái chất lượng cao với các chính sách rõ ràng,
                minh bạch và bảo vệ quyền lợi của khách hàng.
              </p>
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <section className="policy-policy-sections" id="policies" aria-labelledby="policies-title">
          <div className="policy-section-container">
            <div className="policy-policy-grid">
              {policySections.map((policy, index) => {
                const IconComponent = iconMap[policy.icon] || FileTextIcon

                return (
                  <article
                    key={policy.id}
                    className={`policy-policy-card ${isVisible ? 'policy-fade-in-up' : ''}`}
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  >
                    <Card className="policy-policy-card-inner">
                      <CardContent className="policy-policy-content">
                        <div className="policy-policy-icon-wrapper" aria-hidden="true">
                          <div className="policy-policy-icon-bg">
                            {IconComponent && <IconComponent className="policy-policy-icon" />}
                          </div>
                        </div>
                        <h3 className="policy-policy-title">{policy.title}</h3>
                        <ul className="policy-policy-list">
                          {policy.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="policy-policy-item">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="policy-policy-contact-section" id="contact" aria-labelledby="contact-title">
          <div className="policy-section-container">
            <div className={`policy-policy-contact-content ${isVisible ? 'policy-fade-in-up' : ''}`}>
              <h2 id="contact-title" className="policy-policy-contact-title">
                Có câu hỏi về chính sách?
              </h2>
              <p className="policy-policy-contact-subtitle">
                Nếu bạn có bất kỳ thắc mắc nào về các chính sách của chúng tôi, vui lòng liên hệ với chúng tôi
                qua email hoặc hotline.
              </p>
              <div className="policy-policy-contact-info">
                <div className="policy-policy-contact-item">
                  <span className="policy-policy-contact-label">Email:</span>
                  <a href="mailto:info@esce.vn" className="policy-policy-contact-link">
                    info@esce.vn
                  </a>
                </div>
                <div className="policy-policy-contact-item">
                  <span className="policy-policy-contact-label">Hotline:</span>
                  <a href="tel:1900123456" className="policy-policy-contact-link">
                    1900 123 456
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default PolicyPage






