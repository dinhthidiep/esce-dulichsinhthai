import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '~/components/Header'
import Footer from '~/components/Footer'
import Button from '~/components/ui/Button'
import LoadingSpinner from '~/components/LoadingSpinner'
import LazyImage from '~/components/LazyImage'
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ChevronRightIcon,
} from '~/components/icons'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import './NewsDetailPage.css'

// Sử dụng đường dẫn public URL thay vì import
const defaultNewsImage = '/img/banahills.jpg'

interface NewsItem {
  id: number
  title: string
  content: string
  summary?: string
  image?: string
  author?: string
  authorId?: number
  createdAt: string
  updatedAt?: string
  status?: string
  views?: number
}

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = 'smooth'

    if (id) {
      fetchNewsDetail()
      fetchRelatedNews()
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [id])

  const fetchNewsDetail = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get<any>(`${API_ENDPOINTS.NEWS}/${id}`)
      
      // Transform backend NewsDto to frontend NewsItem
      const newsData = response.data
      const content = newsData.Content || newsData.content || ''
      const images = newsData.Images || newsData.images || []
      const firstImage = images.length > 0 ? images[0] : defaultNewsImage
      const summary = content.length > 200 ? content.substring(0, 200) + '...' : content
      
      const transformedNews: NewsItem = {
        id: newsData.NewsId || newsData.newsId || newsData.id,
        title: content, // Backend Content is actually the title/content
        content: content,
        summary: summary,
        image: firstImage,
        author: newsData.AuthorName || newsData.authorName || newsData.author || '',
        authorId: newsData.AuthorId || newsData.authorId,
        createdAt: newsData.CreatedDate || newsData.createdDate || newsData.createdAt || '',
        updatedAt: newsData.CreatedDate || newsData.createdDate || newsData.updatedAt || '',
        status: 'published',
        views: 0
      }
      
      setNews(transformedNews)
    } catch (err: any) {
      console.error('Error fetching news detail:', err)
      setError(err.response?.data?.message || 'Không thể tải tin tức. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedNews = async () => {
    if (!id) return

    try {
      const response = await axiosInstance.get<any[]>(API_ENDPOINTS.NEWS)
      
      // Transform backend NewsDto to frontend NewsItem
      const transformedNews: NewsItem[] = (response.data || []).map((news: any) => {
        const content = news.Content || news.content || ''
        const images = news.Images || news.images || []
        const firstImage = images.length > 0 ? images[0] : defaultNewsImage
        const summary = content.length > 200 ? content.substring(0, 200) + '...' : content
        
        return {
          id: news.NewsId || news.newsId || news.id,
          title: content,
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
      
      // Lấy 3 tin tức khác (không phải tin hiện tại)
      const filtered = transformedNews
        .filter((item) => item.id !== parseInt(id, 10))
        .slice(0, 3)
      setRelatedNews(filtered)
    } catch (err) {
      console.error('Error fetching related news:', err)
      // Không set error vì đây là phần phụ
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatContent = (content: string) => {
    // Chuyển đổi các đoạn văn được phân cách bởi \n\n thành các thẻ <p>
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null
      
      // Kiểm tra nếu là heading (bắt đầu bằng **)
      if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
        const headingText = paragraph.trim().replace(/\*\*/g, '')
        return (
          <h3 key={index} className="news-detail-news-content-heading">
            {headingText}
          </h3>
        )
      }
      
      // Kiểm tra nếu có heading trong đoạn
      const headingMatch = paragraph.match(/\*\*(.+?)\*\*/)
      if (headingMatch) {
        const parts = paragraph.split(/\*\*(.+?)\*\*/)
        return (
          <p key={index} className="news-detail-news-content-paragraph">
            {parts.map((part, i) => {
              if (headingMatch[1] === part) {
                return <strong key={i} className="news-detail-news-content-bold">{part}</strong>
              }
              return <span key={i}>{part}</span>
            })}
          </p>
        )
      }
      
      return (
        <p key={index} className="news-detail-news-content-paragraph">
          {paragraph.trim()}
        </p>
      )
    }).filter(Boolean)
  }

  if (loading) {
    return (
      <div className="news-detail-news-detail-page">
        <Header />
        <div className="news-detail-news-detail-main">
          <LoadingSpinner message="Đang tải tin tức..." />
        </div>
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="news-detail-news-detail-page">
        <Header />
        <div className="news-detail-news-detail-main">
          <div className="news-detail-news-detail-error">
            <h2>❌ Không tìm thấy tin tức</h2>
            <p>{error || 'Tin tức không tồn tại hoặc đã bị xóa.'}</p>
            <div className="news-detail-news-detail-error-actions">
              <Button variant="outline" onClick={() => navigate('/news')}>
                <ArrowLeftIcon className="news-detail-btn-icon" />
                Quay lại danh sách
              </Button>
              <Button variant="primary" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const newsImage = news.image || defaultNewsImage

  return (
    <div className="news-detail-news-detail-page">
      <Header />

      <main className="news-detail-news-detail-main">
        {/* Back Button */}
        <div className="news-detail-news-detail-back">
          <Button variant="outline" onClick={() => navigate('/news')} className="news-detail-news-back-btn">
            <ArrowLeftIcon className="news-detail-btn-icon" />
            Quay lại danh sách
          </Button>
        </div>

        {/* Main Content Layout - 2 Columns */}
        <div className="news-detail-news-detail-layout">
          {/* Left Column - Main Content (70%) */}
          <article className="news-detail-news-detail-article">
            {/* News Header */}
            <header className="news-detail-news-detail-header">
              <div className="news-detail-news-detail-meta">
                <div className="news-detail-news-detail-meta-item">
                  <CalendarIcon className="news-detail-news-detail-meta-icon" />
                  <span>{formatDate(news.createdAt || news.updatedAt || '')}</span>
                </div>
                {news.author && (
                  <div className="news-detail-news-detail-meta-item">
                    <UserIcon className="news-detail-news-detail-meta-icon" />
                    <span>{news.author}</span>
                  </div>
                )}
              </div>

              <h1 className="news-detail-news-detail-title">{news.title}</h1>
            </header>

            {/* News Image */}
            <div className="news-detail-news-detail-image-wrapper">
              <LazyImage
                src={newsImage}
                alt={news.title}
                className="news-detail-news-detail-image"
                fallbackSrc={defaultNewsImage}
              />
            </div>

            {/* News Content */}
            <div className="news-detail-news-detail-content">
              <div className="news-detail-news-content-body">
                {formatContent(news.content)}
              </div>
            </div>
          </article>

          {/* Right Column - Related News (30%) */}
          {relatedNews.length > 0 && (
            <aside className="news-detail-news-related-sidebar">
              <h2 className="news-detail-news-related-title">Tin tức liên quan</h2>
              <div className="news-detail-news-related-list">
                {relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="news-detail-news-related-card"
                  >
                    <div className="news-detail-news-related-image-wrapper">
                      <LazyImage
                        src={item.image || defaultNewsImage}
                        alt={item.title}
                        className="news-detail-news-related-image"
                        fallbackSrc={defaultNewsImage}
                      />
                    </div>
                    <div className="news-detail-news-related-content">
                      <h3 className="news-detail-news-related-card-title">{item.title}</h3>
                      <div className="news-detail-news-related-meta">
                        <CalendarIcon className="news-detail-news-related-meta-icon" />
                        <span>
                          {new Date(item.createdAt || item.updatedAt || '').toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default NewsDetailPage

