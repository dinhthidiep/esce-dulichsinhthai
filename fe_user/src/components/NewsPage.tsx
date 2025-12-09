import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '~/components/Header'
import Footer from '~/components/Footer'
import Button from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import LoadingSpinner from '~/components/LoadingSpinner'
import LazyImage from '~/components/LazyImage'
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  XIcon,
  CalendarIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '~/components/icons'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import './NewsPage.css'

// Sử dụng đường dẫn public URL thay vì import
const defaultNewsImage = '/img/banahills.news-jpg'

interface UserInfo {
  Id?: number
  id?: number
  Email?: string
  email?: string
  Name?: string
  name?: string
  RoleId?: number
  roleId?: number
  [key: string]: unknown
}

interface NewsItem {
  id: number
  title: string
  content: string
  summary: string
  image?: string
  author?: string
  authorId?: number
  createdAt: string
  updatedAt?: string
  status?: string
  views?: number
}

const NewsPage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const itemsPerPage = 12

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    image: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setIsVisible(true)
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = 'smooth'

    // Check user role
    checkUserRole()

    // Fetch news
    fetchNews()

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const checkUserRole = () => {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr) as UserInfo
        setUserInfo(user)
        const roleId = user.RoleId || user.roleId
        // RoleId: 1 = Admin
        setIsAdmin(roleId === 1)
      } catch (error) {
        console.error('Error parsing userInfo:', error)
      }
    }
  }

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get<any[]>(API_ENDPOINTS.NEWS)
      
      // Transform backend NewsDto to frontend NewsItem
      // Backend returns: NewsId, Content (which is NewsTitle), Images (array), CreatedDate, AuthorName, etc.
      // Frontend expects: id, title, content, summary, image (string), createdAt, author, etc.
      const transformedNews: NewsItem[] = (response.data || []).map((news: any) => {
        const content = news.Content || news.content || ''
        const images = news.Images || news.images || []
        const firstImage = images.length > 0 ? images[0] : defaultNewsImage
        
        // Create summary from content (first 200 chars)
        const summary = content.length > 200 ? content.substring(0, 200) + '...' : content
        
        return {
          id: news.NewsId || news.newsId || news.id,
          title: content, // Backend Content is actually the title/content
          content: content,
          summary: summary,
          image: firstImage,
          author: news.AuthorName || news.authorName || news.author || '',
          authorId: news.AuthorId || news.authorId,
          createdAt: news.CreatedDate || news.createdDate || news.createdAt || '',
          updatedAt: news.CreatedDate || news.createdDate || news.updatedAt || '',
          status: 'published',
          views: 0
        }
      })
      
      // Sort by createdAt descending (newest first)
      const sortedNews = transformedNews.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      
      setNewsList(sortedNews)
    } catch (err: any) {
      console.error('Error fetching news:', err)
      setError(err.response?.data?.message || 'Không thể tải tin tức. Vui lòng thử lại sau.')
      // Set empty array on error
      setNewsList([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      // Validate form
      if (!formData.title.trim() || !formData.content.trim()) {
        setFormError('Vui lòng điền đầy đủ tiêu đề và nội dung')
        setFormLoading(false)
        return
      }

      // Backend expects: Content (which becomes NewsTitle), Images (array), SocialMediaLink (optional)
      // Combine title and content for the Content field (backend stores this as NewsTitle)
      const fullContent = formData.title.trim() 
        ? `${formData.title.trim()}\n\n${formData.content.trim()}`
        : formData.content.trim()
      
      const images = formData.image.trim() 
        ? [formData.image.trim()]
        : [defaultNewsImage]
      
      const newsData = {
        Content: fullContent,
        Images: images,
        SocialMediaLink: null // Optional field
      }

      await axiosInstance.post(API_ENDPOINTS.NEWS, newsData)
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        summary: '',
        image: '',
      })
      setShowCreateModal(false)
      
      // Refresh news list
      await fetchNews()
    } catch (err: any) {
      console.error('Error creating news:', err)
      setFormError(err.response?.data?.message || 'Không thể đăng tin tức. Vui lòng thử lại sau.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteNews = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      return
    }

    try {
      await axiosInstance.delete(`${API_ENDPOINTS.NEWS}/${id}`)
      // Refresh news list
      await fetchNews()
    } catch (err: any) {
      console.error('Error deleting news:', err)
      alert(err.response?.data?.message || 'Không thể xóa tin tức. Vui lòng thử lại sau.')
    }
  }

  // Filter news by search query
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) {
      return newsList
    }

    const query = searchQuery.toLowerCase()
    return newsList.filter(
      (news) =>
        news.title?.toLowerCase().includes(query) ||
        news.content?.toLowerCase().includes(query) ||
        news.summary?.toLowerCase().includes(query)
    )
  }, [newsList, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage)
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNews.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNews, currentPage])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="news-news-page">
      <Header />

      <main className="news-news-main">
        {/* Page Header */}
        <section className="news-news-page-header">
          <div className="news-news-header-container">
            <h1 className="news-news-page-title">Thông báo hệ thống</h1>
            <p className="news-news-page-subtitle">
              Cập nhật về bảo trì, nâng cấp và các thông báo quan trọng của hệ thống
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="news-news-content-section">
          <div className="news-news-content-container">
            {/* Controls Bar */}
            <div className="news-news-controls">
              {/* Search */}
              <div className="news-news-search-box">
                <SearchIcon className="news-news-search-icon" />
                <input
                  type="text"
                  className="news-news-search-input"
                  placeholder="Tìm kiếm tin tức..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  aria-label="Tìm kiếm tin tức"
                />
              </div>

              {/* Create Button */}
              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowCreateModal(true)}
                  className="news-news-create-btn"
                >
                  <PlusIcon className="btn-icon" />
                  Đăng tin tức
                </Button>
              )}
            </div>

            {/* News List */}
            {loading ? (
              <LoadingSpinner message="Đang tải tin tức..." />
            ) : error ? (
              <div className="news-news-error-container" role="alert">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p className="news-error-message">{error}</p>
                <Button variant="outline" onClick={fetchNews} style={{ marginTop: '1rem' }}>
                  Thử lại
                </Button>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="news-news-empty-state">
                <p className="news-empty-state-title">
                  {searchQuery ? 'Không tìm thấy tin tức nào' : 'Chưa có tin tức nào'}
                </p>
                <p className="news-empty-state-description">
                  {searchQuery
                    ? 'Không có tin tức nào phù hợp với từ khóa tìm kiếm của bạn.'
                    : 'Hiện tại chưa có tin tức nào được đăng. Vui lòng quay lại sau.'}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    style={{ marginTop: '1rem' }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="news-news-grid">
                  {paginatedNews.map((news, index) => (
                    <NewsCard
                      key={news.id}
                      news={news}
                      index={index}
                      isVisible={isVisible}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteNews}
                      formatDate={formatDate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="news-news-pagination">
                    <button
                      className="news-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      aria-label="Trang trước"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <div className="news-pagination-info">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <button
                      className="news-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Trang sau"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Create News Modal */}
      {showCreateModal && (
        <div className="news-news-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="news-news-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="news-news-modal-header">
              <h2 className="news-news-modal-title">Đăng tin tức mới</h2>
              <button
                className="news-news-modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleCreateNews} className="news-news-form">
              {formError && (
                <div className="news-news-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="news-news-form-group">
                <label htmlFor="news-news-title" className="news-news-form-label">
                  Tiêu đề <span className="news-required">*</span>
                </label>
                <input
                  id="news-news-title"
                  type="text"
                  className="news-news-form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề tin tức"
                  news-required
                />
              </div>

              <div className="news-news-form-group">
                <label htmlFor="news-news-summary" className="news-news-form-label">
                  Tóm tắt
                </label>
                <textarea
                  id="news-news-summary"
                  className="news-news-form-textarea"
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Nhập tóm tắt tin tức (tùy chọn)"
                />
              </div>

              <div className="news-news-form-group">
                <label htmlFor="news-news-content" className="news-news-form-label">
                  Nội dung <span className="news-required">*</span>
                </label>
                <textarea
                  id="news-news-content"
                  className="news-news-form-textarea"
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung tin tức"
                  news-required
                />
              </div>

              <div className="news-news-form-group">
                <label htmlFor="news-news-image" className="news-news-form-label">
                  URL ảnh
                </label>
                <input
                  id="news-news-image"
                  type="text"
                  className="news-news-form-input"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Nhập URL ảnh (tùy chọn)"
                />
              </div>

              <div className="news-news-form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ title: '', content: '', summary: '', image: '' })
                    setFormError(null)
                  }}
                  disabled={formLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? 'Đang đăng...' : 'Đăng tin tức'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}

// News Card Component
interface NewsCardProps {
  news: NewsItem
  index: number
  isVisible: boolean
  isAdmin: boolean
  onDelete: (id: number) => void
  formatDate: (date: string) => string
}

const NewsCard: React.FC<NewsCardProps> = ({ news, index, isVisible, isAdmin, onDelete, formatDate }) => {
  const newsImage = news.image || defaultNewsImage

  return (
    <article
      className={`news-news-card ${isVisible ? 'news-fade-in-up' : ''}`}
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
    >
      <Card className="news-news-card-inner">
        <div className="news-news-image-wrapper">
          <LazyImage
            src={newsImage}
            alt={news.title}
            className="news-news-image"
            fallbackSrc={defaultNewsImage}
          />
          {isAdmin && (
            <button
              className="news-news-delete-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(news.id)
              }}
              aria-label="Xóa tin tức"
            >
              <XIcon />
            </button>
          )}
        </div>

        <CardContent className="news-news-content">
          <div className="news-news-meta">
            <div className="news-news-meta-item">
              <CalendarIcon className="news-news-meta-icon" />
              <span>{formatDate(news.createdAt || news.updatedAt || '')}</span>
            </div>
            {news.author && (
              <div className="news-news-meta-item">
                <UserIcon className="news-news-meta-icon" />
                <span>{news.author}</span>
              </div>
            )}
          </div>

          <h3 className="news-news-title">{news.title}</h3>

          <div className="news-news-footer">
            <Link to={`/news/${news.id}`} className="news-news-read-more">
              Đọc thêm
              <ArrowRightIcon className="news-news-read-more-icon" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}


export default NewsPage

