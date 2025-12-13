import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export interface NewsDto {
  newsId: number
  content: string
  images: string[]
  socialMediaLink?: string
  createdDate?: string
  authorId: number
  authorName: string
  authorAvatar?: string
  authorRole: string
  likesCount: number
  isLiked: boolean
}

export interface CreateNewsDto {
  content: string
  socialMediaLink?: string
  images?: string[]
}

export interface UpdateNewsDto {
  content?: string
  socialMediaLink?: string
  images?: string[]
}

// Kết nối backend thật
const USE_MOCK_NEWS = false

const MOCK_NEWS: NewsDto[] = [
  {
    newsId: 1,
    content:
      'ESCE ra mắt tính năng chat realtime và gửi ảnh giúp khách hàng trao đổi nhanh chóng với nhà cung cấp.',
    images: [],
    socialMediaLink: 'https://facebook.com',
    createdDate: new Date().toISOString(),
    authorId: 1,
    authorName: 'Admin',
    authorAvatar: undefined,
    authorRole: 'Admin',
    likesCount: 10,
    isLiked: false
  },
  {
    newsId: 2,
    content: 'Khuyến mãi mùa hè: Giảm 20% cho các tour biển trong tháng này.',
    images: [],
    socialMediaLink: undefined,
    createdDate: new Date(Date.now() - 86400000).toISOString(),
    authorId: 2,
    authorName: 'Nguyễn Văn B',
    authorAvatar: undefined,
    authorRole: 'Agency',
    likesCount: 5,
    isLiked: false
  }
]

const normalizeNews = (payload: any): NewsDto => {
  // Backend returns NewsDto with PascalCase: NewsId, Content, AuthorName, etc.
  const newsId = parseInt(String(payload?.newsId ?? payload?.NewsId ?? 0), 10) || 0
  const content = String(payload?.content ?? payload?.Content ?? '').trim()

  // Handle images - can be array or string
  let images: string[] = []
  const imagesRaw = payload?.images ?? payload?.Images ?? []

  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.filter(
      (img: any) => img && typeof img === 'string' && img.trim().length > 10
    )
  } else if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
    let parts: string[] = []

    // Backend uses "|||IMAGE_SEPARATOR|||" as delimiter
    if (imagesRaw.includes('|||IMAGE_SEPARATOR|||')) {
      parts = imagesRaw
        .split('|||IMAGE_SEPARATOR|||')
        .map((p) => p.trim())
        .filter((p) => p)
    } else if (imagesRaw.includes(';')) {
      // Fallback to semicolon separator (old format)
      const semicolonParts = imagesRaw
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p)
      const reconstructed: string[] = []

      for (let i = 0; i < semicolonParts.length; i++) {
        const part = semicolonParts[i]

        // If this part starts with 'base64,', it's likely a continuation
        if (part.startsWith('base64,') && reconstructed.length > 0) {
          const lastIndex = reconstructed.length - 1
          const lastPart = reconstructed[lastIndex]
          if (lastPart.startsWith('data:image/') && !lastPart.includes('base64,')) {
            reconstructed[lastIndex] = lastPart + ';' + part
            continue
          }
        }

        // If this part starts with 'data:image/', it's a data URL
        if (part.startsWith('data:image/')) {
          reconstructed.push(part)
        } else if (part.startsWith('base64,')) {
          reconstructed.push(`data:image/jpeg;${part}`)
        } else {
          // Regular base64 string (without prefix)
          if (part.length > 50 && /^[A-Za-z0-9+/=]+$/.test(part)) {
            reconstructed.push(`data:image/jpeg;base64,${part}`)
          } else if (reconstructed.length > 0) {
            // Might be continuation
            const lastPart = reconstructed[reconstructed.length - 1]
            if (lastPart.startsWith('data:image/') && !lastPart.includes('base64,')) {
              reconstructed[reconstructed.length - 1] = lastPart + ';base64,' + part
            } else {
              reconstructed.push(part)
            }
          } else {
            reconstructed.push(part)
          }
        }
      }

      parts = reconstructed
    } else {
      // Single image
      parts = [imagesRaw.trim()]
    }

    images = parts.filter((img) => {
      const trimmed = img.trim()
      return trimmed !== '' && trimmed.length > 10
    })
  }

  // Remove duplicates and validate format
  const validImages: string[] = []
  const seen = new Set<string>()

  for (const img of images) {
    if (!img || typeof img !== 'string') continue

    const trimmed = img.trim()
    if (trimmed === '' || trimmed.length < 10) continue

    // Skip if already seen (duplicate)
    if (seen.has(trimmed)) continue

    // Validate: must be base64-like or data URL or HTTP(S) URL
    const isValid =
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      /^[A-Za-z0-9+/=]+$/.test(trimmed) // Base64 pattern (without prefix)

    if (isValid) {
      validImages.push(trimmed)
      seen.add(trimmed)
    } else {
      console.warn('[NewsApi] Invalid image format detected:', trimmed.substring(0, 50))
    }
  }

  // Handle date - can be string or Date object
  let createdDate: string | undefined = undefined
  const dateRaw = payload?.createdDate ?? payload?.CreatedDate
  if (dateRaw) {
    if (typeof dateRaw === 'string') {
      createdDate = dateRaw
    } else if (dateRaw instanceof Date) {
      createdDate = dateRaw.toISOString()
    } else {
      // Try to parse if it's a date string
      try {
        createdDate = new Date(dateRaw).toISOString()
      } catch {
        createdDate = undefined
      }
    }
  }

  // Handle author information - ensure all fields are properly extracted
  const authorId = parseInt(String(payload?.authorId ?? payload?.AuthorId ?? 0), 10) || 0
  const authorName = String(payload?.authorName ?? payload?.AuthorName ?? '').trim() || 'Người dùng'
  const authorAvatar = payload?.authorAvatar ?? payload?.AuthorAvatar ?? undefined
  const authorRole = String(payload?.authorRole ?? payload?.AuthorRole ?? '').trim() || ''

  // Handle likes
  const likesCount = parseInt(String(payload?.likesCount ?? payload?.LikesCount ?? 0), 10) || 0
  const isLiked = Boolean(payload?.isLiked ?? payload?.IsLiked ?? false)

  return {
    newsId,
    content,
    images: validImages,
    socialMediaLink: payload?.socialMediaLink ?? payload?.SocialMediaLink ?? undefined,
    createdDate,
    authorId,
    authorName,
    authorAvatar,
    authorRole,
    likesCount,
    isLiked
  }
}

/**
 * Lấy tất cả tin tức (AllowAnonymous - không cần đăng nhập, nhưng nếu có token sẽ biết isLiked)
 * Endpoint: GET /api/news
 * Requires: Optional authentication (có token sẽ biết tin tức nào đã like)
 */
export const fetchAllNews = async (): Promise<NewsDto[]> => {
  if (USE_MOCK_NEWS) {
    console.warn('[NewsApi] Using MOCK_NEWS data (backend disabled)')
    return MOCK_NEWS
  }

  try {
    const token = getAuthToken()
    const endpoint = '/api/news'
    console.log('[NewsApi] Fetching all news', { hasToken: !!token })

    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] fetchAllNews failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.warn('[NewsApi] fetchAllNews: Response is not an array:', data)
      return []
    }

    const normalizedNews = data
      .map((news: any) => {
        try {
          return normalizeNews(news)
        } catch (err) {
          console.warn('[NewsApi] Failed to normalize news item:', news, err)
          return null
        }
      })
      .filter((news: NewsDto | null): news is NewsDto => news !== null)

    console.log(`[NewsApi] Fetched and normalized ${normalizedNews.length} news items`)
    return normalizedNews
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể lấy danh sách tin tức'
    console.error('[NewsApi] Error fetching all news:', error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Lấy tin tức theo ID (AllowAnonymous - không cần đăng nhập, nhưng nếu có token sẽ biết isLiked)
 * Endpoint: GET /api/news/{newsId}
 * Requires: Optional authentication (có token sẽ biết tin tức đã like chưa)
 * @param newsId - ID của tin tức cần lấy
 */
export const fetchNewsById = async (newsId: number): Promise<NewsDto> => {
  if (USE_MOCK_NEWS) {
    const id = Number(newsId)
    const found = MOCK_NEWS.find((n) => n.newsId === id)
    if (!found) {
      throw new Error('Không tìm thấy tin tức (mock)')
    }
    return found
  }
  // Validate newsId
  const validNewsId = parseInt(String(newsId), 10)
  if (!validNewsId || isNaN(validNewsId) || validNewsId <= 0) {
    throw new Error('ID tin tức không hợp lệ')
  }

  try {
    const token = getAuthToken()
    const endpoint = `/api/news/${validNewsId}`
    console.log('[NewsApi] Fetching news by ID:', { newsId: validNewsId, hasToken: !!token })

    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] fetchNewsById failed:', {
        newsId: validNewsId,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[NewsApi] Raw news by ID from backend:', data)

    const normalized = normalizeNews(data)
    console.log('[NewsApi] Normalized news:', normalized)
    return normalized
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể lấy tin tức'
    console.error(`[NewsApi] Error fetching news ${validNewsId}:`, error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Tạo tin tức mới (Chỉ Admin)
 * Endpoint: POST /api/news
 * Requires: Authentication + Admin role
 * @param dto - Dữ liệu tin tức cần tạo
 */
export const createNews = async (dto: CreateNewsDto): Promise<NewsDto> => {
  if (USE_MOCK_NEWS) {
    const newItem: NewsDto = {
      newsId: MOCK_NEWS.length + 1,
      content: dto.content,
      images: dto.images || [],
      socialMediaLink: dto.socialMediaLink,
      createdDate: new Date().toISOString(),
      authorId: 1,
      authorName: 'Admin (mock)',
      authorAvatar: undefined,
      authorRole: 'Admin',
      likesCount: 0,
      isLiked: false
    }
    MOCK_NEWS.unshift(newItem)
    console.warn('[NewsApi] createNews using MOCK_NEWS, new length =', MOCK_NEWS.length)
    return newItem
  }
  // Validate input
  if (!dto.content || !dto.content.trim()) {
    throw new Error('Nội dung tin tức không được để trống')
  }

  if (dto.content.trim().length > 4000) {
    throw new Error('Nội dung tin tức tối đa 4000 ký tự')
  }

  if (dto.socialMediaLink && dto.socialMediaLink.trim().length > 500) {
    throw new Error('Link mạng xã hội tối đa 500 ký tự')
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục.')
    }

    const endpoint = '/api/news'
    console.log('[NewsApi] Creating news:', {
      contentLength: dto.content.trim().length,
      imagesCount: dto.images?.length || 0
    })

    const response = await fetchWithFallback(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        Content: dto.content.trim(),
        SocialMediaLink: dto.socialMediaLink?.trim() || null,
        Images: dto.images || []
      })
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] createNews failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[NewsApi] Created news response:', data)
    return normalizeNews(data)
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể tạo tin tức'
    console.error('[NewsApi] Error creating news:', error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Cập nhật tin tức (Chỉ Admin)
 * Endpoint: PUT /api/news/{newsId}
 * Requires: Authentication + Admin role
 * @param newsId - ID của tin tức cần cập nhật
 * @param dto - Dữ liệu tin tức cần cập nhật
 */
export const updateNews = async (newsId: number, dto: UpdateNewsDto): Promise<NewsDto> => {
  if (USE_MOCK_NEWS) {
    const id = Number(newsId)
    const index = MOCK_NEWS.findIndex((n) => n.newsId === id)
    if (index !== -1) {
      MOCK_NEWS[index] = {
        ...MOCK_NEWS[index],
        content: dto.content ?? MOCK_NEWS[index].content,
        socialMediaLink: dto.socialMediaLink ?? MOCK_NEWS[index].socialMediaLink,
        images: dto.images ?? MOCK_NEWS[index].images
      }
      console.warn('[NewsApi] updateNews applied on MOCK_NEWS')
      return MOCK_NEWS[index]
    }
    throw new Error('Không tìm thấy tin tức để cập nhật (mock)')
  }
  // Validate newsId
  const validNewsId = parseInt(String(newsId), 10)
  if (!validNewsId || isNaN(validNewsId) || validNewsId <= 0) {
    throw new Error('ID tin tức không hợp lệ')
  }

  // Validate input if provided
  if (dto.content && dto.content.trim().length > 4000) {
    throw new Error('Nội dung tin tức tối đa 4000 ký tự')
  }

  if (dto.socialMediaLink && dto.socialMediaLink.trim().length > 500) {
    throw new Error('Link mạng xã hội tối đa 500 ký tự')
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục.')
    }

    const endpoint = `/api/news/${validNewsId}`
    console.log('[NewsApi] Updating news:', {
      newsId: validNewsId,
      hasContent: !!dto.content,
      hasImages: !!dto.images
    })

    // Build body object, only include fields that have values
    const bodyObj: any = {
      Images: dto.images || []
    }
    if (dto.content?.trim()) {
      bodyObj.Content = dto.content.trim()
    }
    if (dto.socialMediaLink?.trim()) {
      bodyObj.SocialMediaLink = dto.socialMediaLink.trim()
    }

    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(bodyObj)
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] updateNews failed:', {
        newsId: validNewsId,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[NewsApi] Updated news response:', data)
    return normalizeNews(data)
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể cập nhật tin tức'
    console.error(`[NewsApi] Error updating news ${validNewsId}:`, error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Xóa tin tức (Chỉ Admin)
 * Endpoint: DELETE /api/news/{newsId}
 * Requires: Authentication + Admin role
 * @param newsId - ID của tin tức cần xóa
 */
export const deleteNews = async (newsId: number): Promise<void> => {
  if (USE_MOCK_NEWS) {
    const before = MOCK_NEWS.length
    const id = Number(newsId)
    const idx = MOCK_NEWS.findIndex((n) => n.newsId === id)
    if (idx !== -1) {
      MOCK_NEWS.splice(idx, 1)
    }
    console.warn('[NewsApi] deleteNews on MOCK_NEWS, before:', before, 'after:', MOCK_NEWS.length)
    return
  }

  // Validate newsId
  const validNewsId = parseInt(String(newsId), 10)
  if (!validNewsId || isNaN(validNewsId) || validNewsId <= 0) {
    throw new Error('ID tin tức không hợp lệ')
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục.')
    }

    const endpoint = `/api/news/${validNewsId}`
    console.log('[NewsApi] Deleting news:', { newsId: validNewsId })

    const response = await fetchWithFallback(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] deleteNews failed:', {
        newsId: validNewsId,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    // DELETE endpoint trả về NoContent (204), không có body
    console.log('[NewsApi] News deleted successfully:', { newsId: validNewsId })
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể xóa tin tức'
    console.error(`[NewsApi] Error deleting news ${validNewsId}:`, error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Toggle like/unlike tin tức
 * Endpoint: POST /api/news/{newsId}/like
 * Requires: Authentication
 * @param newsId - ID của tin tức cần like/unlike
 * @returns Object với liked (boolean) và likesCount (number)
 */
export const toggleLikeNews = async (
  newsId: number
): Promise<{ liked: boolean; likesCount: number }> => {
  // Validate newsId
  const validNewsId = parseInt(String(newsId), 10)
  if (!validNewsId || isNaN(validNewsId) || validNewsId <= 0) {
    throw new Error('ID tin tức không hợp lệ')
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục.')
    }

    const endpoint = `/api/news/${validNewsId}/like`
    console.log('[NewsApi] Toggling like for news:', { newsId: validNewsId })

    const response = await fetchWithFallback(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[NewsApi] toggleLikeNews failed:', {
        newsId: validNewsId,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const liked = Boolean(data?.liked ?? data?.Liked ?? false)
    const likesCount = parseInt(String(data?.likesCount ?? data?.LikesCount ?? 0), 10) || 0

    console.log('[NewsApi] Toggle like result:', { newsId: validNewsId, liked, likesCount })

    return {
      liked,
      likesCount
    }
  } catch (error: any) {
    // Handle specific error cases
    const msg = typeof error?.message === 'string' ? error.message : ''

    // If already liked, treat as success
    if (msg.includes('đã thích') || msg.includes('already liked') || msg.includes('đã tồn tại')) {
      console.warn('[NewsApi] News already liked, treating as success')
      return { liked: true, likesCount: 0 } // Count will be updated by reload
    }

    // Handle Entity Framework errors
    if (
      msg.includes('saving the entity changes') ||
      msg.includes('inner exception') ||
      msg.includes('database')
    ) {
      throw new Error('Không thể lưu thay đổi. Vui lòng thử lại sau.')
    }

    // Handle network errors
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Network request failed')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?'
      )
    }

    console.error('[NewsApi] Error toggling like:', { newsId: validNewsId, error })
    throw error
  }
}
