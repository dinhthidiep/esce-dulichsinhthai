import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axiosInstance from '~/utils/axiosInstance'
import ConditionalHeader from '~/components/user/ConditionalHeader'
import Footer from '~/components/user/Footer'
import Button from '~/components/user/ui/Button'
import { Card, CardContent } from '~/components/user/ui/Card'
import Badge from '~/components/user/ui/Badge'
import LazyImage from '~/components/user/LazyImage'
import { ArrowRightIcon, UsersIcon, LeafIcon, ShieldIcon, GiftIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '~/components/user/icons'
import { stats } from '~/data/stats'
import { features } from '~/data/features'
import { reviews } from '~/data/reviews'
import { popularServices } from '~/data/services'
import { formatPrice, createSlug, getImageUrl } from '~/lib/utils'
import { useTours } from '~/hooks/useTours'
import type { ServiceComboResponse } from '~/types/serviceCombo'
import { API_ENDPOINTS } from '~/config/api'
import './LandingPage.css'

// Sử dụng đường dẫn public URL thay vì import
const baNaHillImage = '/img/banahills.jpg'

interface UserInfo {
  Name?: string
  name?: string
  Email?: string
  email?: string
  [key: string]: unknown
}

interface ServiceItem {
  id: number | null
  name: string
  slug: string
  image: string
  address: string
  rating: number
  priceFrom: number
  originalPrice: number | null
  discountPercent: number | null
  availableSlots: number
  status: string
}

interface ServiceCardProps {
  service: ServiceItem
  index: number
  isVisible: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: UsersIcon,
  Leaf: LeafIcon,
  Shield: ShieldIcon,
  Gift: GiftIcon,
}

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [ratings, setRatings] = useState<Record<number, number>>({}) // Map serviceId -> rating
  const [ratingsLoaded, setRatingsLoaded] = useState(false) // Flag để biết ratings đã load xong
  const [reviews, setReviews] = useState<any[]>([]) // Reviews từ API
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0) // Index cho carousel
  const [autoPlayPaused, setAutoPlayPaused] = useState(false) // Tạm dừng auto play khi user click
  const { tours, loading, error } = useTours()
  const location = useLocation()
  
  // States for scroll animations
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [animatedStats, setAnimatedStats] = useState<Record<number, number>>({})

  useEffect(() => {
    setIsVisible(true)
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth'
    // Scroll to top khi vào trang
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [location.pathname])

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id')
          if (sectionId) {
            setVisibleSections((prev) => new Set([...prev, sectionId]))
          }
        }
      })
    }, observerOptions)

    // Observe all sections
    const sections = document.querySelectorAll('[data-section-id]')
    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])

  // Animate stats counting
  useEffect(() => {
    if (!visibleSections.has('stats')) return

    const animateStat = (statId: number, targetValue: number, suffix: string, duration: number = 2000) => {
      const startTime = Date.now()
      const startValue = 0

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut)
        
        setAnimatedStats((prev) => ({ ...prev, [statId]: currentValue }))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setAnimatedStats((prev) => ({ ...prev, [statId]: targetValue }))
        }
      }

      requestAnimationFrame(animate)
    }

    // Animate each stat
    stats.forEach((stat, index) => {
      // Handle different formats: '500+', '10,000+', '4.8/5'
      let numericValue: number | null = null
      let suffix = ''
      
      if (stat.value.includes('/')) {
        // Handle rating format like '4.8/5'
        const parts = stat.value.split('/')
        const rating = parseFloat(parts[0])
        if (!isNaN(rating)) {
          numericValue = rating * 10 // Animate to 48, then display as 4.8
          suffix = '/5'
        }
      } else {
        // Handle formats like '500+', '10,000+'
        const cleanValue = stat.value.replace(/,/g, '')
        const match = cleanValue.match(/(\d+)(.*)/)
        if (match) {
          numericValue = parseInt(match[1])
          suffix = match[2] || ''
        }
      }
      
      if (numericValue !== null && !isNaN(numericValue)) {
        setTimeout(() => {
          animateStat(index, numericValue!, suffix, 2000)
        }, index * 200) // Stagger animation
      }
    })
  }, [visibleSections])

  // Kiểm tra nếu user vừa đăng nhập/đăng ký
  useEffect(() => {
    // Kiểm tra cả localStorage và sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')

    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr) as UserInfo
        setUserInfo(user)

        // Kiểm tra nếu có flag "justLoggedIn" trong sessionStorage
        const justLoggedIn = sessionStorage.getItem('justLoggedIn')
        if (justLoggedIn === 'true') {
          setShowWelcomeMessage(true)
          sessionStorage.removeItem('justLoggedIn')

          // Tự động ẩn message sau 5 giây
          setTimeout(() => {
            setShowWelcomeMessage(false)
          }, 5000)
        }
      } catch (error) {
        console.error('Error parsing userInfo:', error)
      }
    }
  }, [])

  // Fetch ratings for all services
  useEffect(() => {
    const fetchRatings = async () => {
      if (!tours || tours.length === 0) return

      const ratingPromises = tours.map(async (tour) => {
        const id = tour.Id !== undefined ? tour.Id : null
        if (!id) return null

        try {
          const response = await axiosInstance.get<{ AverageRating?: number }>(
            `${API_ENDPOINTS.REVIEW}/ServiceCombo/${id}/average-rating`
          )
          const rating = response.data.AverageRating || 0
          return { id, rating: parseFloat(String(rating)) || 0 }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(`Không thể lấy rating cho service ${id}:`, error)
          }
          return { id, rating: 0 }
        }
      })

      const ratingResults = await Promise.all(ratingPromises)
      const ratingsMap: Record<number, number> = {}
      ratingResults.forEach((result) => {
        if (result) {
          ratingsMap[result.id] = result.rating
        }
      })
      setRatings(ratingsMap)
      setRatingsLoaded(true)
    }

    fetchRatings()
  }, [tours])

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true)
        const response = await axiosInstance.get(`${API_ENDPOINTS.REVIEW}`)
        const allReviews = response.data || []

        // Lấy unique UserIds để fetch batch
        const userIds = new Set<number>()
        allReviews.forEach((review: any) => {
          const userId = review.UserId || review.userId
          if (userId && !review.User && !review.user) {
            userIds.add(userId)
          }
        })

        // Fetch User data batch nếu cần
        const userMap = new Map<number, any>()
        if (userIds.size > 0) {
          try {
            const userPromises = Array.from(userIds).map(async (userId) => {
              try {
                const userResponse = await axiosInstance.get(`${API_ENDPOINTS.USER}/${userId}`)
                return { userId, user: userResponse.data }
              } catch (error) {
                console.warn(`Không thể lấy user data cho userId ${userId}:`, error)
                return { userId, user: null }
              }
            })
            const userResults = await Promise.all(userPromises)
            userResults.forEach(({ userId, user }) => {
              if (user) userMap.set(userId, user)
            })
          } catch (error) {
            console.warn('Lỗi khi fetch batch user data:', error)
          }
        }

        // Enrich reviews với User data
        const enrichedReviews = allReviews.map((review: any) => {
          // Nếu review đã có User data từ API, dùng luôn
          if (review.User || review.user) {
            return review
          }

          // Nếu chưa có, lấy từ userMap
          const userId = review.UserId || review.userId
          if (userId && userMap.has(userId)) {
            return {
              ...review,
              User: userMap.get(userId),
            }
          }
          return review
        })

        // Sắp xếp: rating cao nhất và mới nhất
        const sortedReviews = enrichedReviews
          .filter((review) => {
            const rating = review.Rating || review.rating || 0
            return rating >= 4 // Chỉ lấy reviews có rating >= 4
          })
          .sort((a, b) => {
            const ratingA = a.Rating || a.rating || 0
            const ratingB = b.Rating || b.rating || 0
            const dateA = new Date(a.CreatedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.CreatedAt || b.createdAt || 0).getTime()

            // Ưu tiên rating cao hơn, nếu rating bằng nhau thì ưu tiên mới hơn
            if (ratingB !== ratingA) {
              return ratingB - ratingA
            }
            return dateB - dateA
          })
          .slice(0, 6) // Lấy 6 reviews tốt nhất

        setReviews(sortedReviews)
      } catch (error) {
        console.error('Lỗi khi lấy reviews:', error)
        setReviews([])
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [])

  // Auto carousel cho reviews
  useEffect(() => {
    if (reviews.length <= 1 || autoPlayPaused) return

    const interval = setInterval(() => {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 1) % reviews.length)
    }, 5000) // Chuyển đổi mỗi 5 giây

    return () => clearInterval(interval)
  }, [reviews.length, autoPlayPaused])

  // Handlers cho nút điều hướng
  const handlePrevReview = () => {
    setAutoPlayPaused(true)
    setCurrentReviewIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length)
    // Resume auto play sau 10 giây
    setTimeout(() => setAutoPlayPaused(false), 10000)
  }

  const handleNextReview = () => {
    setAutoPlayPaused(true)
    setCurrentReviewIndex((prevIndex) => (prevIndex + 1) % reviews.length)
    // Resume auto play sau 10 giây
    setTimeout(() => setAutoPlayPaused(false), 10000)
  }

  // Map dữ liệu từ API sang format mà ServiceCard cần
  // API trả về PascalCase (Id, Name, Price, etc.)
  const mapServiceComboToService = useMemo(() => {
    return (serviceCombo: ServiceComboResponse): ServiceItem => {
      // API trả về PascalCase (Id, Name, Price, etc.)
      const id = serviceCombo.Id
      const name = serviceCombo.Name || ''
      const imagePath = serviceCombo.Image || ''

      // Xử lý trường hợp có nhiều ảnh phân cách bởi dấu phẩy - lấy ảnh đầu tiên cho card
      let firstImage = imagePath
      if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
        firstImage = imagePath.split(',')[0].trim()
      }

      // Sử dụng getImageUrl để xử lý đường dẫn ảnh từ database
      const image = getImageUrl(firstImage, baNaHillImage)

      // Debug: Log để kiểm tra
      if (!imagePath || imagePath.trim() === '') {
        console.warn(`  [LandingPage] Service ${id} (${name}) không có imagePath, dùng fallback: ${image}`)
      } else {
        console.log(`[LandingPage] Service ${id} (${name}): imagePath="${imagePath}" → image="${image}"`)
      }

      const address = serviceCombo.Address || ''
      const price = serviceCombo.Price || 0
      const availableSlots = serviceCombo.AvailableSlots || 0
      const status = serviceCombo.Status || 'open'

      // Lấy rating từ state, mặc định là 0 nếu chưa có
      const serviceRating = id !== null && ratings[id] !== undefined ? ratings[id] : 0

      const mappedService: ServiceItem = {
        id: id,
        name: name,
        slug: createSlug(name) || `service-${id}`,
        image: image,
        address: address,
        rating: serviceRating, // Rating từ API
        priceFrom: price,
        originalPrice: null, // Có thể tính từ discount nếu có
        discountPercent: null, // Có thể tính từ price và originalPrice
        availableSlots: availableSlots as number,
        status: status,
      }

      console.log(`   → [LandingPage] Mapped service object:`, mappedService)
      return mappedService
    }
  }, [ratings])

  // Sử dụng dữ liệu từ API, fallback về dữ liệu tĩnh nếu có lỗi hoặc không có dữ liệu
  const displayServices = useMemo(() => {
    if (loading) {
      return [] // Hoặc có thể return skeleton data
    }

    if (error || !tours || tours.length === 0) {
      // Fallback về dữ liệu tĩnh nếu API lỗi hoặc không có dữ liệu
      console.warn(' Không thể lấy dữ liệu từ API, sử dụng dữ liệu tĩnh')
      return popularServices.slice(0, 6)
    }

    console.log('[LandingPage] Dữ liệu tours từ API:', tours)
    console.log('[LandingPage] Số lượng tours:', tours.length)

    // Kiểm tra dữ liệu từ API
    if (tours.length > 0) {
      console.log('[LandingPage] Sample tour từ API:', tours[0])
      console.log('[LandingPage] Sample tour Image:', tours[0].Image)
    }

    // Lọc các service có status 'open' và map sang format cần thiết
    // API trả về PascalCase (Status)
    const activeServices = tours
      .filter((service) => {
        const status = (service.Status || 'open') as string
        const isOpen = status.toLowerCase() === 'open'
        if (!isOpen) {
          console.log(`  [LandingPage] Bỏ qua service có status: ${status}`)
        }
        return isOpen
      })
      .map(mapServiceComboToService)
      // Sắp xếp theo rating từ cao xuống thấp
      .sort((a, b) => {
        const ratingA = a.rating || 0
        const ratingB = b.rating || 0
        return ratingB - ratingA // Giảm dần
      })
      .slice(0, 6) // Chỉ lấy 6 service có rating cao nhất

    console.log('[LandingPage] Services sau khi map và sắp xếp theo rating:', activeServices)
    console.log('[LandingPage] Số lượng services sau khi map:', activeServices.length)

    // Log từng service để debug
    activeServices.forEach((service, index) => {
      console.log(`   → [LandingPage] Service ${index + 1}:`, {
        id: service.id,
        name: service.name,
        rating: service.rating,
        image: service.image,
        imageType: typeof service.image,
      })
    })

    // Đảm bảo chỉ trả về tối đa 6 services
    return activeServices.slice(0, 6)
  }, [tours, loading, error, mapServiceComboToService, ratings])

  // Hiển thị reviews theo carousel (6 reviews, hiển thị 3 mỗi lần)
  const displayReviews = useMemo(() => {
    if (reviews.length === 0) return []
    
    // Hiển thị 3 reviews mỗi lần, bắt đầu từ currentReviewIndex
    const visibleReviews = []
    for (let i = 0; i < 3; i++) {
      const index = (currentReviewIndex + i) % reviews.length
      visibleReviews.push(reviews[index])
    }
    return visibleReviews
  }, [reviews, currentReviewIndex])

  return (
    <div className="landing-page">
      <ConditionalHeader />

      {/* Welcome Message */}
      {showWelcomeMessage && userInfo && (
        <div className="welcome-message">
          <div className="welcome-content">
            <span className="welcome-icon"></span>
            <span className="welcome-text">
              Chào mừng{' '}
              <strong>
                {(userInfo.Name || userInfo.name || userInfo.Email || userInfo.email) as string}
              </strong>{' '}
              đến với ESCE! Bạn đã đăng nhập thành công.
            </span>
            <button
              className="welcome-close"
              onClick={() => setShowWelcomeMessage(false)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="hero">
          <div className="hero-container">
            <div className="hero-grid">
              {/* Left Column - Text Content */}
              <div className={`hero-content ${isVisible ? 'fade-in-left' : ''}`}>
                {/* Badge */}
                <div className="hero-badge" role="banner">
                  <UsersIcon className="badge-icon" aria-hidden="true" />
                  <span>Trải nghiệm thiên nhiên hoang sơ</span>
                </div>

                {/* Main Heading */}
                <div className="hero-text">
                  <h1 className="hero-title">
                    Khám phá thiên nhiên tại
                    <span className="hero-title-highlight"> Đà Nẵng</span>
                  </h1>
                  <p className="hero-description">
                    Đặt dịch vụ theo nhóm thông minh, tiết kiệm chi phí và tạo những kỷ niệm đáng nhớ với công nghệ và dịch vụ hoàn hảo.
                  </p>
                </div>

                {/* CTA Button */}
                <Button size="lg" className="hero-cta" asChild>
                  <Link to="/services" aria-label="Khám phá các dịch vụ du lịch">
                    Khám phá ngay
                    <ArrowRightIcon className="btn-icon" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {/* Right Column - Image */}
              <div className={`hero-image ${isVisible ? 'fade-in-right' : ''}`}>
                <div className="hero-image-wrapper">
                  <LazyImage
                    src={baNaHillImage}
                    alt="Du lịch sinh thái Đà Nẵng - Bà Nà Hills"
                    className="hero-img"
                    fallbackSrc={baNaHillImage}
                  />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div 
              className={`hero-stats ${isVisible ? 'fade-in-up' : ''}`} 
              role="region" 
              aria-label="Thống kê"
              data-section-id="stats"
            >
              {stats.map((stat, index) => {
                let displayValue = stat.value
                
                if (animatedStats[index] !== undefined) {
                  if (stat.value.includes('/')) {
                    // Handle rating format: display as decimal
                    const animated = animatedStats[index] / 10
                    displayValue = `${animated.toFixed(1)}/5`
                  } else {
                    // Handle formats like '500+', '10,000+'
                    const cleanValue = stat.value.replace(/,/g, '')
                    const match = cleanValue.match(/(\d+)(.*)/)
                    if (match) {
                      const suffix = match[2] || ''
                      const animated = animatedStats[index]
                      // Format number with commas if needed
                      const formatted = animated.toLocaleString('en-US')
                      displayValue = `${formatted}${suffix}`
                    }
                  }
                }
                
                return (
                  <div key={stat.id} className="stat-item">
                    <div className={`stat-value ${stat.color}`} aria-label={stat.value}>
                      {displayValue}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          className="features-section" 
          id="features" 
          aria-labelledby="features-title"
          data-section-id="features"
        >
          <div className="section-container">
            <div className={`section-header ${visibleSections.has('features') ? 'fade-in-up' : ''}`}>
              <h2 id="features-title" className="section-title">
                Tại sao chọn ESCE Du lịch?
              </h2>
              <p className="section-subtitle">
                Chúng tôi mang đến trải nghiệm du lịch sinh thái độc đáo với công nghệ đặt dịch vụ nhóm tiên tiến
              </p>
            </div>

            <div className="features-grid">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon]
                const isFeatureVisible = visibleSections.has('features')

                return (
                  <article
                    key={feature.id}
                    className={`feature-card ${isFeatureVisible ? 'fade-in-up' : ''}`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <Card className="feature-card-inner">
                      <CardContent className="feature-content">
                        <div className="feature-icon-wrapper" aria-hidden="true">
                          <div className="feature-icon-bg">
                            {IconComponent && <IconComponent className="feature-icon" />}
                          </div>
                        </div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Popular Services Section */}
        <section 
          className="services-section" 
          id="services" 
          aria-labelledby="services-title"
          data-section-id="services"
        >
          <div className="section-container">
            <div className={`services-header ${visibleSections.has('services') ? 'fade-in-up' : ''}`}>
              <div className="services-header-text">
                <h2 id="services-title" className="section-title">
                  Dịch vụ được yêu thích nhất
                </h2>
                <p className="section-subtitle services-subtitle">Khám phá những điểm đến tuyệt vời nhất Đà Nẵng</p>
              </div>

              <Button size="lg" className="services-view-all" asChild>
                <Link to="/services" aria-label="Xem tất cả dịch vụ">
                  Xem tất cả
                  <ArrowRightIcon className="btn-icon" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="services-grid">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="lp-service-card-skeleton">
                    <Card className="lp-service-card-inner">
                      <div className="lp-service-image-wrapper" style={{ backgroundColor: '#f1f5f9', height: '220px' }}></div>
                      <CardContent className="lp-service-content">
                        <div
                          style={{
                            height: '24px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            marginBottom: '12px',
                          }}
                        ></div>
                        <div
                          style={{
                            height: '16px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            width: '60%',
                          }}
                        ></div>
                        <div
                          style={{
                            height: '20px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            width: '40%',
                          }}
                        ></div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : displayServices.length > 0 ? (
              <div className="services-grid">
                {displayServices.map((service, index) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service as ServiceItem} 
                    index={index} 
                    isVisible={visibleSections.has('services')} 
                  />
                ))}
              </div>
            ) : (
              <div className="services-empty">
                <p>Hiện tại không có dịch vụ nào. Vui lòng quay lại sau.</p>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section 
          className="testimonials-section" 
          id="testimonials" 
          aria-labelledby="testimonials-title"
          data-section-id="testimonials"
        >
          <div className="section-container">
            <div className={`section-header ${visibleSections.has('testimonials') ? 'fade-in-up' : ''}`}>
              <h2 id="testimonials-title" className="section-title">
                Trải nghiệm từ khách hàng
              </h2>
              <p className="section-subtitle">
                Hơn 1,000+ khách hàng đã tin tưởng và có những trải nghiệm tuyệt vời cùng ESCE Du lịch
              </p>
            </div>

            {loadingReviews ? (
              <div className="reviews-grid">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="review-card-skeleton">
                    <Card className="review-card-inner">
                      <CardContent className="review-content">
                        <div style={{ height: '20px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '1rem' }}></div>
                        <div style={{ height: '100px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '1rem' }}></div>
                        <div style={{ height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : displayReviews.length > 0 ? (
              <div className="reviews-carousel-wrapper">
                {reviews.length > 3 && (
                  <>
                    <button
                      className="reviews-carousel-btn reviews-carousel-btn-prev"
                      onClick={handlePrevReview}
                      aria-label="Xem đánh giá trước"
                    >
                      <ChevronLeftIcon className="reviews-carousel-icon" />
                    </button>
                    <button
                      className="reviews-carousel-btn reviews-carousel-btn-next"
                      onClick={handleNextReview}
                      aria-label="Xem đánh giá tiếp theo"
                    >
                      <ChevronRightIcon className="reviews-carousel-icon" />
                    </button>
                  </>
                )}
                <div className="reviews-grid">
                  {displayReviews.map((review, index) => {
                  const rating = review.Rating || review.rating || 0
                  const comment = review.Comment || review.comment || ''
                  const user = review.User || review.user || {}
                  const userName = user.Name || user.name || 'Khách hàng'
                  const userAvatar = user.Avatar || user.avatar || ''
                  const createdAt = review.CreatedAt || review.createdAt || ''
                  
                  // Tạo initials từ tên
                  const getInitials = (name: string) => {
                    const parts = name.trim().split(' ')
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    }
                    return name.substring(0, 2).toUpperCase()
                  }

                  // Format thời gian
                  const getTimeAgo = (dateString: string) => {
                    if (!dateString) return 'Gần đây'
                    const date = new Date(dateString)
                    const now = new Date()
                    const diffMs = now.getTime() - date.getTime()
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                    
                    if (diffDays === 0) return 'Hôm nay'
                    if (diffDays === 1) return 'Hôm qua'
                    if (diffDays < 7) return `${diffDays} ngày trước`
                    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
                    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
                    return `${Math.floor(diffDays / 365)} năm trước`
                  }

                  const isReviewVisible = visibleSections.has('testimonials')
                  
                  return (
                    <article
                      key={review.Id || review.id || index}
                      className={`review-card ${isReviewVisible ? 'fade-in-up' : ''}`}
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <Card className="review-card-inner">
                        <CardContent className="review-content">
                          <div className="review-stars" aria-label={`Đánh giá ${rating} sao`}>
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className="review-star"
                                filled={i < rating}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <blockquote className="review-text">{comment}</blockquote>
                          <div className="review-divider"></div>
                          <div className="review-author">
                            <div className="review-avatar" aria-hidden="true">
                              {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="review-avatar-img" />
                              ) : (
                                <span className="review-initials">{getInitials(userName)}</span>
                              )}
                            </div>
                            <div className="review-author-info">
                              <p className="review-author-name">{userName}</p>
                              <p className="review-author-meta">{getTimeAgo(createdAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </article>
                  )
                })}
                </div>
              </div>
            ) : (
              <div className="services-empty">
                <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="cta-section" 
          id="cta" 
          aria-labelledby="cta-title"
          data-section-id="cta"
        >
          <div className="section-container">
            <div className={`cta-content ${visibleSections.has('cta') ? 'fade-in-up' : ''}`}>
              <h2 id="cta-title" className="cta-title">
                Sẵn sàng khám phá cùng chúng tôi?
              </h2>
              <p className="cta-subtitle">
                Hãy để chúng tôi mang đến cho bạn những trải nghiệm du lịch sinh thái tuyệt vời nhất.
              </p>
              <div className="cta-buttons">
                <Link
                  to="/services"
                  className="ui-button ui-button-default ui-button-lg cta-button-primary"
                  aria-label="Khám phá các dịch vụ du lịch ngay"
                >
                  Khám phá dịch vụ ngay
                  <ArrowRightIcon className="btn-icon" aria-hidden="true" />
                </Link>
                <Link
                  to="/about"
                  className="ui-button ui-button-outline ui-button-lg cta-button-secondary"
                  aria-label="Tìm hiểu thêm về ESCE"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

// Service Card Component - Extracted for better organization
const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, isVisible }) => {
  // Log để debug
  useEffect(() => {
    console.log(`[LandingPage ServiceCard ${index}]:`, {
      id: service?.id,
      name: service?.name,
      image: service?.image,
      imageType: typeof service?.image,
      hasImage: !!service?.image,
      serviceKeys: service ? Object.keys(service) : [],
    })
  }, [service, index])

  // Đảm bảo service.image luôn có giá trị
  const imageSrc = service?.image || baNaHillImage

  return (
    <article
      className={`lp-service-card ${isVisible ? 'fade-in-up' : ''}`}
      style={{ 
        animationDelay: `${0.3 + index * 0.1}s`,
        opacity: isVisible ? 1 : 0
      }}
    >
      <Card className="lp-service-card-inner">
        <div className="lp-service-image-wrapper">
          <LazyImage
            src={imageSrc}
            alt={service?.name || 'Service'}
            className="lp-service-image"
            fallbackSrc={baNaHillImage}
          />

          {service.discountPercent && (
            <Badge variant="danger" className="lp-service-badge">
              Giảm {service.discountPercent}%
            </Badge>
          )}
          {service.availableSlots !== undefined && service.availableSlots > 0 && (
            <Badge variant="success" className="lp-service-badge lp-service-badge-slots">
              Còn {service.availableSlots} chỗ
            </Badge>
          )}
        </div>
        <CardContent className="lp-service-content">
          <h3 className="lp-service-name">{service.name}</h3>
          {service.address && <p className="lp-service-address">{service.address}</p>}
          <div className="lp-service-rating">
            <div className="stars" aria-label={`Đánh giá ${service.rating || 0} sao`}>
              {(() => {
                const rating = service.rating !== undefined && service.rating !== null ? service.rating : 0
                const fullStars = Math.floor(rating)
                const hasHalfStar = rating % 1 >= 0.5
                const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

                return [
                  ...Array(fullStars).fill('full'),
                  ...(hasHalfStar ? ['half'] : []),
                  ...Array(emptyStars).fill('empty'),
                ].map((type, i) => (
                  <StarIcon
                    key={i}
                    className="star-icon"
                    filled={type === 'full'}
                    half={type === 'half'}
                    aria-hidden="true"
                  />
                ))
              })()}
            </div>
            <span className="rating-text">({(service.rating !== undefined && service.rating !== null ? service.rating : 0).toFixed(1)})</span>
          </div>
          <div className="lp-service-price-wrapper">
            <div>
              <span className="lp-service-price">{formatPrice(service.priceFrom)}</span>
              {service.originalPrice && (
                <span className="lp-service-price-old">{formatPrice(service.originalPrice)}</span>
              )}
            </div>
          </div>
          <Button className="lp-service-button" asChild>
            <Link to={`/services/${service.id}`} aria-label={`Xem chi tiết ${service.name}`}>
              Xem chi tiết
            </Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  )
}

export default LandingPage







