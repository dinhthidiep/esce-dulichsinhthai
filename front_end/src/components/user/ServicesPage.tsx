import React, { useState, useEffect, useMemo, type ChangeEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import ConditionalHeader from '~/components/user/ConditionalHeader'
import Footer from '~/components/user/Footer'
import Button from '~/components/user/ui/Button'
import { Card, CardContent } from '~/components/user/ui/Card'
import Badge from '~/components/user/ui/Badge'
import LoadingSpinner from '~/components/user/LoadingSpinner'
import LazyImage from '~/components/user/LazyImage'
import {
  StarIcon,
  MapPinIcon,
  SearchIcon,
  HeartIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  ClockIcon,
  ChevronDownIcon,
} from '~/components/user/icons'
import { formatPrice, createSlug, getImageUrl } from '~/lib/utils'
import { useTours } from '~/hooks/useTours'
import { useServices, type ServiceResponse } from '~/hooks/useServices'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import type { ServiceItem } from '~/types/serviceCombo'
import type { ServiceComboResponse } from '~/types/serviceCombo'
import './ServicesPage.css'

// Sử dụng đường dẫn public URL thay vì import
const baNaHillImage = '/img/banahills.jpg'

interface TourCardProps {
  tour: ServiceItem
  index: number
  isFavorite: boolean
  onToggleFavorite: () => void
  isVisible: boolean
}

type SortBy = 'popular' | 'price-low' | 'price-high' | 'name'
type ViewMode = 'grid' | 'list'
type PriceRange = 'all' | 'under-500k' | '500k-1m' | '1m-2m' | '2m-3m' | 'over-3m'

const ServicesPage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>('all')
  const [sortBy, setSortBy] = useState<SortBy>('popular')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [ratings, setRatings] = useState<Record<number, number>>({}) // Map serviceId -> rating
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showServices] = useState(false) // Luôn hiển thị ServiceCombo, không hiển thị Service đơn lẻ
  const { tours, loading: toursLoading, error: toursError } = useTours()
  // Không cần load services nữa vì chỉ hiển thị ServiceCombo

  useEffect(() => {
    setIsVisible(true)
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = 'smooth'

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('esce_favorites')
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites) as number[]
        setFavorites(new Set(favoriteIds))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  // Fetch ratings cho ServiceCombo
  useEffect(() => {
    const fetchRatings = async () => {
      // Fetch ratings cho ServiceCombo (tours)
      if (tours && tours.length > 0) {
        const tourRatingPromises = tours.map(async (tour) => {
          const id = tour.Id
          if (!id) return null

          try {
            const response = await axiosInstance.get<{ AverageRating?: number }>(
              `${API_ENDPOINTS.REVIEW}/ServiceCombo/${id}/average-rating`
            )
            const rating = response.data.AverageRating || 0
            return { id, rating: parseFloat(String(rating)) || 0 }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn(`Không thể lấy rating cho ServiceCombo ${id}:`, error)
            }
            return { id, rating: 0 }
          }
        })

        const tourRatingResults = await Promise.all(tourRatingPromises)
        const ratingsMap: Record<number, number> = {}
        tourRatingResults.forEach((result) => {
          if (result) {
            ratingsMap[result.id] = result.rating
          }
        })
        setRatings((prev) => ({ ...prev, ...ratingsMap }))
      }
    }

    fetchRatings()
  }, [tours])


  // Transform API data to display format
  // Chỉ hiển thị ServiceCombo (dịch vụ đơn lẻ sẽ hiển thị trong trang đặt dịch vụ)
  const allServices = useMemo(() => {
    // Hiển thị ServiceCombo (tour combo)
    console.log('🔄 [ServicesPage] Processing ServiceCombo data:')
    console.log('  - tours:', tours)
    console.log('  - tours length:', tours?.length || 0)
    console.log('  - toursLoading:', toursLoading)
    console.log('  - toursError:', toursError)
    
    if (!tours || tours.length === 0) {
      console.warn('⚠️ [ServicesPage] Không có ServiceCombo từ API hoặc mảng rỗng')
      return []
    }

    console.log(`✅ [ServicesPage] Nhận được ${tours.length} ServiceCombo(s) từ API`)

      // Backend trả về PascalCase (Id, Name, Status, etc.) vì PropertyNamingPolicy = null
      // Chỉ hiển thị các ServiceCombo đã được admin duyệt (status = "approved")
      const mappedServices: ServiceItem[] = tours
        .filter((tour: ServiceComboResponse) => {
          const status = (tour.Status || '').toLowerCase().trim()
          // Chỉ hiển thị các combo đã được duyệt
          return status === 'approved'
        })
      .map((tour: ServiceComboResponse) => {
        // Map tất cả các trường từ API response (PascalCase từ backend)
        const id = tour.Id
        const name = tour.Name || 'Combo dịch vụ chưa có tên'
        
        // Xử lý Image - có thể là string, null, hoặc nhiều ảnh phân cách bởi dấu phẩy
        // Nếu Image = null hoặc rỗng, sẽ dùng fallback image
        let imagePath = tour.Image || ''
        if (imagePath && typeof imagePath === 'string' && imagePath.includes(',')) {
          // Lấy ảnh đầu tiên nếu có nhiều ảnh
          imagePath = imagePath.split(',')[0].trim()
        }
        // getImageUrl sẽ xử lý trường hợp imagePath rỗng/null và trả về fallback
        const image = getImageUrl(imagePath, baNaHillImage)
        
        // Map các trường khác từ API
        const address = tour.Address || 'Đà Nẵng'
        const price = Number(tour.Price) || 0
        const availableSlots = tour.AvailableSlots !== undefined ? tour.AvailableSlots : 0
        const status = tour.Status || 'open'
        const description = tour.Description || ''

        // Lấy rating từ state (đã fetch từ API Review), mặc định là 0 nếu chưa có
        const serviceRating = id !== null && ratings[id] !== undefined ? ratings[id] : 0

        // Log để debug (chỉ trong dev mode)
        if (import.meta.env.DEV) {
          console.log(`📦 [ServicesPage] Mapping ServiceCombo ${id}:`, {
            name,
            address,
            price,
            availableSlots,
            status,
            imagePath: tour.Image,
            hasImage: !!tour.Image,
            finalImage: image,
          })
        }

        const mappedService: ServiceItem = {
          id: id,
          name: name,
          slug: createSlug(name) || `service-${id}`,
          image: image,
          rating: serviceRating,
          price: price,
          address: address,
          availableSlots: availableSlots,
          status: status,
          description: description,
        }

        return mappedService
      })

    console.log(`✅ [ServicesPage] Đã map thành công ${mappedServices.length} ServiceCombo(s) từ ${tours.length} tour(s)`)
    return mappedServices
  }, [tours, ratings, toursLoading, toursError])

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = [...allServices]

    // Multi-field search: name, address, description
    if (searchName.trim()) {
      const query = searchName.toLowerCase()
      filtered = filtered.filter((service) => {
        const nameMatch = service.name?.toLowerCase().includes(query)
        const addressMatch = service.address?.toLowerCase().includes(query)
        const descriptionMatch = service.description?.toLowerCase().includes(query)
        return nameMatch || addressMatch || descriptionMatch
      })
    }

    // Filter by price range
    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter((service) => {
        const price = service.price
        switch (selectedPriceRange) {
          case 'under-500k':
            return price < 500000
          case '500k-1m':
            return price >= 500000 && price < 1000000
          case '1m-2m':
            return price >= 1000000 && price < 2000000
          case '2m-3m':
            return price >= 2000000 && price < 3000000
          case 'over-3m':
            return price >= 3000000
          default:
            return true
        }
      })
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'popular':
      default:
        // Keep original order or sort by rating
        filtered.sort((a, b) => b.rating - a.rating)
        break
    }

    return filtered
  }, [allServices, searchName, selectedPriceRange, sortBy])

  const toggleFavorite = (id: number | null) => {
    if (id === null) return
    setFavorites((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      // Persist favorites to localStorage
      try {
        localStorage.setItem('esce_favorites', JSON.stringify([...newSet]))
      } catch (error) {
        console.error('Error saving favorites:', error)
      }
      return newSet
    })
  }

  return (
    <div className="svc-services-page">
      <ConditionalHeader />

      <main className="svc-services-main">
        {/* Page Header */}
        <section className="svc-services-page-header">
          <div className="svc-services-header-container">
            <h1 className="svc-services-page-title">Khám phá các tour du lịch</h1>
            <p className="svc-services-page-subtitle">
              Tìm kiếm và đặt tour du lịch sinh thái phù hợp với bạn
            </p>
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <section className="svc-services-content-section">
          {/* Mobile Filter Button */}
          <button
            className="svc-mobile-filter-button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            aria-label="Mở bộ lọc"
            aria-expanded={showMobileFilters}
          >
            <FilterIcon className="svc-mobile-filter-icon" />
            <span>Bộ lọc</span>
            {filteredAndSortedServices.length !== allServices.length && (
              <span className="svc-filter-badge">{allServices.length - filteredAndSortedServices.length}</span>
            )}
          </button>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div
              className="svc-mobile-filter-overlay"
              onClick={() => setShowMobileFilters(false)}
              aria-hidden="true"
            />
          )}

          <div className="svc-services-content-container">
            {/* Left Sidebar - Filters */}
            <aside className={`svc-services-sidebar ${showMobileFilters ? 'svc-mobile-open' : ''}`}>
              <div className="svc-sidebar-header">
                <FilterIcon className="svc-filter-icon" />
                <h2 className="svc-sidebar-title">Bộ lọc</h2>
                {/* Mobile Close Button */}
                <button
                  className="svc-mobile-filter-close"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label="Đóng bộ lọc"
                >
                  ×
                </button>
              </div>

              {/* Price Range */}
              <div className="svc-filter-section">
                <h3 className="svc-filter-section-title">Chọn mức giá</h3>
                <div className="svc-filter-radio-group">
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="all"
                      checked={selectedPriceRange === 'all'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>Tất cả</span>
                  </label>
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="under-500k"
                      checked={selectedPriceRange === 'under-500k'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>Giá dưới 500.000đ</span>
                  </label>
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="500k-1m"
                      checked={selectedPriceRange === '500k-1m'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>500.000đ - 1 triệu</span>
                  </label>
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="1m-2m"
                      checked={selectedPriceRange === '1m-2m'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>1 - 2 triệu</span>
                  </label>
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="2m-3m"
                      checked={selectedPriceRange === '2m-3m'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>2 - 3 triệu</span>
                  </label>
                  <label className="svc-filter-radio-option">
                    <input
                      type="radio"
                      name="price-range"
                      value="over-3m"
                      checked={selectedPriceRange === 'over-3m'}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    />
                    <span>Giá trên 3 triệu</span>
                  </label>
                </div>
              </div>

            </aside>

            {/* Right Content - Tour Listings */}
            <div className="svc-services-main-content">
              {/* Results Header */}
              <div className="svc-results-header">
                <div className="svc-results-header-left">
                  <div className="svc-results-search-box">
                    <SearchIcon className="svc-results-search-icon" />
                    <input
                      type="text"
                      className="svc-results-search-input"
                      placeholder="Tìm tour, địa điểm, mô tả..."
                      value={searchName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
                      aria-label="Tìm kiếm tour du lịch"
                    />
                  </div>
                  <div className="svc-results-count">{filteredAndSortedServices.length} kết quả</div>
                </div>
                <div className="svc-results-controls">
                  <div className="svc-sort-dropdown">
                    <select
                      className="svc-sort-select"
                      value={sortBy}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortBy)}
                    >
                      <option value="popular">Phổ biến</option>
                      <option value="price-low">Giá: Thấp đến cao</option>
                      <option value="price-high">Giá: Cao đến thấp</option>
                      <option value="name">Tên: A-Z</option>
                    </select>
                    <ChevronDownIcon className="svc-sort-chevron" />
                  </div>
                  <div className="svc-view-toggle">
                    <button
                      className={`svc-view-btn ${viewMode === 'grid' ? 'svc-active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      aria-label="Xem dạng lưới"
                    >
                      <GridIcon />
                    </button>
                    <button
                      className={`svc-view-btn ${viewMode === 'list' ? 'svc-active' : ''}`}
                      onClick={() => setViewMode('list')}
                      aria-label="Xem dạng danh sách"
                    >
                      <ListIcon />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chỉ hiển thị ServiceCombo - không hiển thị Service đơn lẻ */}
              {/* Service đơn lẻ sẽ được hiển thị trong trang đặt dịch vụ (BookingPage) */}

              {/* Tour Cards */}
              {toursLoading ? (
                <LoadingSpinner message="Đang tải danh sách dịch vụ..." />
              ) : toursError ? (
                <div className="svc-error-container" role="alert" style={{ 
                  padding: '2rem', 
                  textAlign: 'center',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  margin: '2rem 0'
                }}>
                  <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>❌ Lỗi tải dữ liệu</h3>
                  <p className="svc-error-message" style={{ color: '#991b1b', whiteSpace: 'pre-line' }}>
                    {toursError}
                  </p>
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <p>🔍 Kiểm tra:</p>
                    <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '0.5rem' }}>
                      <li>Backend có đang chạy tại <code>https://localhost:7267</code> không?</li>
                      <li>Kiểm tra Console để xem chi tiết lỗi</li>
                      <li>Kiểm tra Network tab trong DevTools</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredAndSortedServices.length === 0 ? (
                <div className="svc-empty-state">
                  <p className="svc-empty-state-title">Không tìm thấy tour nào</p>
                  <p className="svc-empty-state-description">
                    {searchName || selectedPriceRange !== 'all'
                      ? 'Không có tour nào phù hợp với bộ lọc của bạn. Vui lòng thử lại.'
                      : allServices.length === 0
                        ? 'Hiện chưa có tour nào trong hệ thống hoặc tất cả đều đã đóng.'
                        : 'Không có tour nào phù hợp với bộ lọc của bạn.'}
                  </p>
                  {allServices.length > 0 && (searchName || selectedPriceRange !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchName('')
                        setSelectedPriceRange('all')
                      }}
                      style={{ marginTop: '1rem' }}
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              ) : (
                <div className={`svc-tours-grid ${viewMode === 'list' ? 'svc-list-view' : ''}`}>
                  {filteredAndSortedServices.map((tour, index) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      index={index}
                      isFavorite={tour.id !== null && favorites.has(tour.id)}
                      onToggleFavorite={() => toggleFavorite(tour.id)}
                      isVisible={isVisible}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

// Tour Card Component
const TourCard: React.FC<TourCardProps> = ({ tour, index, isFavorite, onToggleFavorite, isVisible }) => {
  const discountPercent = tour.originalPrice
    ? Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)
    : null

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite()
  }

  return (
    <article
      className={`svc-tour-card ${isVisible ? 'svc-fade-in-up' : ''}`}
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
    >
      <Link to={`/services/${tour.id}`} className="svc-tour-card-link">
        <Card className="svc-tour-card-inner">
          <div className="svc-tour-image-wrapper">
            <LazyImage
              src={tour.image}
              alt={tour.name}
              className="svc-tour-image"
              fallbackSrc={baNaHillImage}
            />

            {/* Favorite Button */}
            <button
              className={`svc-favorite-btn ${isFavorite ? 'svc-active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            >
              <HeartIcon filled={isFavorite} />
            </button>

            {/* Discount Badge */}
            {discountPercent && discountPercent > 0 && (
              <Badge variant="danger" className="svc-tour-discount-badge">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          <CardContent className="svc-tour-content">
            <h3 className="svc-tour-name">{tour.name}</h3>

            <div className="svc-tour-location-duration">
              <MapPinIcon className="svc-location-icon" />
              <span>{tour.address}</span>
              {tour.availableSlots > 0 && (
                <>
                  <ClockIcon className="svc-clock-icon" />
                  <span>Còn {tour.availableSlots} chỗ</span>
                </>
              )}
            </div>

            <div className="svc-tour-rating">
              <div className="svc-stars" aria-label={`Đánh giá ${tour.rating} sao`}>
                {(() => {
                  const rating = tour.rating || 0
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
                      className="svc-star-icon"
                      filled={type === 'full'}
                      half={type === 'half'}
                      aria-hidden="true"
                    />
                  ))
                })()}
              </div>
              <span className="svc-rating-value">({tour.rating > 0 ? tour.rating.toFixed(1) : '0.0'})</span>
            </div>

            <div className="svc-tour-price-section">
              <span className="svc-tour-price">{formatPrice(tour.price)}</span>
            </div>

            <div className="svc-tour-detail-btn">Chi tiết</div>
          </CardContent>
        </Card>
      </Link>
    </article>
  )
}

export default ServicesPage






