import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export interface PostLikeDto {
  postLikeId: string
  accountId: string
  fullName: string
  createdDate: string
  reactionType?: string
}

export interface PostDto {
  postId: number
  title: string
  content: string
  images: string[]
  authorId: number
  authorName: string
  authorAvatar?: string
  authorRole: string
  status: string
  rejectComment?: string
  createdAt?: string
  publicDate?: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
  hashtags: string[]
  likes?: PostLikeDto[]
}

export interface CreatePostDto {
  title: string
  content: string
  images?: string[]
}

export interface UpdatePostDto {
  title?: string
  content?: string
  images?: string[]
  posterName?: string
}

// Kết nối backend thật
const USE_MOCK_POSTS = false

const MOCK_POSTS: PostDto[] = [
  {
    postId: 1,
    title: 'Trải nghiệm du lịch Đà Nẵng 3 ngày 2 đêm',
    content:
      'Chia sẻ lịch trình chi tiết, chi phí và những lưu ý khi du lịch Đà Nẵng tự túc. Đây là bài viết mock để bạn chỉnh giao diện.',
    images: [],
    authorId: 1,
    authorName: 'Admin',
    authorAvatar: undefined,
    authorRole: 'Admin',
    status: 'Approved',
    rejectComment: undefined,
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    publicDate: new Date().toISOString(),
    likesCount: 12,
    commentsCount: 3,
    isLiked: false,
    hashtags: ['Đà Nẵng', 'Kinh nghiệm', 'Tự túc'],
    likes: []
  },
  {
    postId: 2,
    title: 'Top 5 bãi biển đẹp nhất miền Trung',
    content:
      'Danh sách các bãi biển đẹp, nước trong, cát trắng để bạn tham khảo cho chuyến đi sắp tới.',
    images: [],
    authorId: 2,
    authorName: 'Nguyễn Văn B',
    authorAvatar: undefined,
    authorRole: 'Customer',
    status: 'Pending',
    rejectComment: undefined,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    publicDate: undefined,
    likesCount: 5,
    commentsCount: 1,
    isLiked: false,
    hashtags: ['Biển', 'Miền Trung'],
    likes: []
  }
]

const authorizedRequest = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {})
  }

  if (token) {
    ;(headers as any).Authorization = `Bearer ${token}`
  } else {
    // Cho phép không có token khi đang làm UI với mock / backend tắt
    console.warn('[PostsApi] authorizedRequest without token (dev/mock mode)')
  }

  const response = await fetchWithFallback(input as string, {
    ...init,
    headers
  })

  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  return response.json()
}

const normalizePost = (payload: any): PostDto => {
  // Fast normalization - optimized like News
  const postId = parseInt(String(payload?.postId ?? payload?.PostId ?? payload?.id ?? 0), 10) || 0
  const title = payload?.title ?? payload?.Title ?? payload?.articleTitle ?? payload?.ArticleTitle ?? ''
  const content = payload?.content ?? payload?.Content ?? payload?.postContent ?? payload?.PostContent ?? ''
  
  // Image processing - same as News (supports |||IMAGE_SEPARATOR||| and comma)
  let images: string[] = []
  const imagesRaw = payload?.images ?? payload?.Images
  
  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.filter((img: any) => img && typeof img === 'string' && img.trim().length > 10)
  } else if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
    let parts: string[] = []
    
    // Backend uses "|||IMAGE_SEPARATOR|||" as delimiter (like News)
    if (imagesRaw.includes('|||IMAGE_SEPARATOR|||')) {
      parts = imagesRaw.split('|||IMAGE_SEPARATOR|||').map(p => p.trim()).filter(p => p)
    } else if (imagesRaw.includes(',')) {
      // Fallback to comma separator
      parts = imagesRaw.split(',').map(p => p.trim()).filter(p => p)
    } else {
      // Single image
      parts = [imagesRaw.trim()]
    }
    
    images = parts.filter(img => {
      const trimmed = img.trim()
      return trimmed !== '' && trimmed.length > 10 && (
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        /^[A-Za-z0-9+/=]+$/.test(trimmed.replace(/\s/g, ''))
      )
    })
  }
  
  // Remove duplicates
  const validImages: string[] = []
  const seen = new Set<string>()
  for (const img of images) {
    const trimmed = img.trim()
    if (!seen.has(trimmed)) {
      validImages.push(trimmed)
      seen.add(trimmed)
    }
  }
  images = validImages
  
  // Fast author ID extraction
  const authorId = parseInt(String(
    payload?.authorId ?? 
    payload?.AuthorId ?? 
    payload?.posterId ?? 
    payload?.PosterId ?? 
    0
  ), 10) || 0
  
  // Count likes and comments from arrays (if provided)
  const likesArray = payload?.likes ?? payload?.Likes
  const commentsArray = payload?.comments ?? payload?.Comments
  const likesCount = Array.isArray(likesArray) ? likesArray.length : (payload?.likesCount ?? payload?.LikesCount ?? 0)
  const commentsCount = Array.isArray(commentsArray) ? commentsArray.length : (payload?.commentsCount ?? payload?.CommentsCount ?? 0)
  
  // Parse likes array - map reactionType từ ReactionTypeId hoặc ReactionTypeName
  const likes: PostLikeDto[] = Array.isArray(likesArray)
    ? likesArray.map((like: any) => {
        // Lấy ReactionTypeId từ backend (1-6)
        const reactionTypeId = like?.reactionTypeId ?? like?.ReactionTypeId ?? like?.reactionTypeID ?? like?.ReactionTypeID ?? null
        
        // Lấy ReactionTypeName từ backend (nếu có)
        const reactionTypeName = like?.reactionTypeName ?? like?.ReactionTypeName ?? like?.reactionType ?? like?.ReactionType ?? null
        
        // Map ReactionTypeId -> reaction type name
        let reactionType = 'like' // default
        if (reactionTypeId !== null && reactionTypeId !== undefined) {
          const id = typeof reactionTypeId === 'string' ? parseInt(reactionTypeId, 10) : Number(reactionTypeId)
          switch (id) {
            case 1: reactionType = 'like'; break
            case 2: reactionType = 'love'; break
            case 3: reactionType = 'haha'; break
            case 4: reactionType = 'wow'; break
            case 5: reactionType = 'sad'; break
            case 6: reactionType = 'angry'; break
            default: reactionType = 'like'
          }
        } else if (reactionTypeName) {
          // Nếu có ReactionTypeName, map từ tên
          const name = String(reactionTypeName).toLowerCase().trim()
          if (name === 'like' || name === '1') reactionType = 'like'
          else if (name === 'love' || name === '2') reactionType = 'love'
          else if (name === 'haha' || name === '3') reactionType = 'haha'
          else if (name === 'wow' || name === '4') reactionType = 'wow'
          else if (name === 'sad' || name === '5') reactionType = 'sad'
          else if (name === 'angry' || name === '6') reactionType = 'angry'
        }
        
        return {
          postLikeId: String(like?.postLikeId ?? like?.PostLikeId ?? like?.id ?? like?.Id ?? ''),
          accountId: String(like?.accountId ?? like?.AccountId ?? like?.userId ?? like?.UserId ?? ''),
          fullName: like?.fullName ?? like?.FullName ?? like?.name ?? like?.Name ?? 'Người dùng',
          createdDate: like?.createdDate ?? like?.CreatedDate ?? like?.createdAt ?? like?.CreatedAt ?? new Date().toISOString(),
          reactionType: reactionType
        }
      })
    : []
  
  // Tính isLiked: kiểm tra xem current user có trong likes array không
  let isLiked = payload?.isLiked ?? payload?.IsLiked ?? false
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo && Array.isArray(likes) && likes.length > 0) {
      const parsed = JSON.parse(userInfo)
      const currentUserId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId
      if (currentUserId) {
        const currentUserIdStr = String(currentUserId)
        const userLike = likes.find((like: PostLikeDto) => {
          const likeAccountId = String(like.accountId ?? '')
          return likeAccountId === currentUserIdStr
        })
        isLiked = !!userLike
      }
    }
  } catch (err) {
    // Nếu không parse được userInfo, dùng giá trị từ payload
    console.warn('[PostsApi] Could not calculate isLiked from userInfo:', err)
  }
  
  return {
    postId,
    title,
    content,
    images,
    authorId,
    authorName: payload?.authorName ?? payload?.AuthorName ?? payload?.posterName ?? payload?.PosterName ?? '',
    authorAvatar: payload?.authorAvatar ?? payload?.AuthorAvatar ?? undefined,
    authorRole: payload?.authorRole ?? payload?.AuthorRole ?? payload?.posterRole ?? payload?.PosterRole ?? '',
    status: payload?.status ?? payload?.Status ?? 'Pending',
    rejectComment: payload?.rejectComment ?? payload?.RejectComment ?? undefined,
    createdAt: payload?.createdAt ?? payload?.CreatedAt ?? payload?.createdDate ?? payload?.CreatedDate ?? payload?.publicDate ?? payload?.PublicDate ?? undefined,
    publicDate: payload?.publicDate ?? payload?.PublicDate ?? undefined,
    likesCount,
    commentsCount,
    isLiked,
    hashtags: Array.isArray(payload?.hashtags ?? payload?.Hashtags) 
      ? (payload.hashtags ?? payload.Hashtags) 
      : [],
    likes: likes.length > 0 ? likes : undefined
  }
}

export const fetchAllPosts = async (): Promise<PostDto[]> => {
  if (USE_MOCK_POSTS) {
    console.warn('[PostsApi] Using MOCK_POSTS data (backend disabled)')
    return MOCK_POSTS
  }

  try {
    // Use fetchWithFallback for anonymous access (to get isLiked correctly)
    const token = getAuthToken()
    const response = await fetchWithFallback('/api/Post/GetAllPost', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const normalized = Array.isArray(data) ? data.map(normalizePost) : []
    
    // Debug log
    console.log('Fetched posts with isLiked:', normalized.map(p => ({ 
      postId: p.postId, 
      isLiked: p.isLiked,
      likesCount: p.likesCount 
    })))
    
    return normalized
  } catch (error) {
    console.error('[PostsApi] fetchAllPosts failed:', error)
    throw error
  }
}

export const fetchPostById = async (postId: number): Promise<PostDto> => {
  if (USE_MOCK_POSTS) {
    const found = MOCK_POSTS.find(p => p.postId === postId)
    if (!found) {
      throw new Error('Không tìm thấy bài viết (mock)')
    }
    return found
  }

  const data = await authorizedRequest(`/api/Post/GetPostById?id=${postId}`, {
    method: 'GET'
  })
  return normalizePost(data)
}

export const createPost = async (dto: CreatePostDto): Promise<PostDto> => {
  if (USE_MOCK_POSTS) {
    const newPost: PostDto = {
      postId: MOCK_POSTS.length + 1,
      title: dto.title,
      content: dto.content,
      images: dto.images || [],
      authorId: 1,
      authorName: 'Admin (mock)',
      authorAvatar: undefined,
      authorRole: 'Admin',
      status: 'Pending',
      rejectComment: undefined,
      createdAt: new Date().toISOString(),
      publicDate: undefined,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      hashtags: [],
      likes: []
    }
    MOCK_POSTS.unshift(newPost)
    console.warn('[PostsApi] createPost using MOCK_POSTS, new length =', MOCK_POSTS.length)
    return newPost
  }

  const data = await authorizedRequest('/api/Post/CreatePost', {
    method: 'POST',
    body: JSON.stringify({
      PostContent: dto.content,
      ArticleTitle: dto.title,
      Images: dto.images || [],
      PosterName: '' // Will be set by backend from current user
    })
  })
  // Backend returns { message, post }
  const postData = data?.post ?? data
  // Reload to get full post data
  if (postData?.PostId || postData?.postId || postData?.id) {
    const postId = parseInt(String(postData.PostId ?? postData.postId ?? postData.id), 10)
    if (postId) {
      try {
        return await fetchPostById(postId)
      } catch {
        return normalizePost(postData)
      }
    }
  }
  return normalizePost(postData)
}

export const updatePost = async (postId: number, dto: UpdatePostDto): Promise<void> => {
  if (USE_MOCK_POSTS) {
    const index = MOCK_POSTS.findIndex(p => p.postId === postId)
    if (index !== -1) {
      MOCK_POSTS[index] = {
        ...MOCK_POSTS[index],
        title: dto.title ?? MOCK_POSTS[index].title,
        content: dto.content ?? MOCK_POSTS[index].content,
        images: dto.images ?? MOCK_POSTS[index].images
      }
    }
    console.warn('[PostsApi] updatePost applied on MOCK_POSTS')
    return
  }

  await authorizedRequest(`/api/Post/UpdatePost?id=${postId}`, {
    method: 'PUT',
    body: JSON.stringify({
      PostContent: dto.content,
      ArticleTitle: dto.title,
      Images: dto.images,
      // Backend PostDto yêu cầu PosterName không null
      PosterName: dto.posterName ?? ''
    })
  })
}

export const deletePost = async (postId: number): Promise<void> => {
  if (USE_MOCK_POSTS) {
    const before = MOCK_POSTS.length
    const idx = MOCK_POSTS.findIndex(p => p.postId === postId)
    if (idx !== -1) {
      MOCK_POSTS.splice(idx, 1)
    }
    console.warn('[PostsApi] deletePost on MOCK_POSTS, before:', before, 'after:', MOCK_POSTS.length)
    return
  }

  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  const response = await fetchWithFallback(`/api/Post/DeletePost?id=${postId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  // Handle 204 No Content or 200 OK
  if (response.status === 204 || response.status === 200) {
    return
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text()
    if (text) {
      try {
        return JSON.parse(text)
      } catch {
        return
      }
    }
  }
}

export const approvePost = async (postId: number): Promise<void> => {
  await authorizedRequest('/api/Post/approve', {
    method: 'PUT',
    body: JSON.stringify({
      PostId: String(postId)
    })
  })
}

export const rejectPost = async (postId: number, comment: string): Promise<void> => {
  await authorizedRequest('/api/Post/reject', {
    method: 'PUT',
    body: JSON.stringify({
      PostId: String(postId),
      Comment: comment
    })
  })
}

// React to Post (với nhiều loại reaction)
// Backend mới: POST /api/PostReaction/{postId}/{reactionTypeId} và DELETE /api/PostReaction/unlike/{postReactionId}
// reactionTypeId: 1 = Like, 2 = Love, 3 = Haha, 4 = Wow, 5 = Sad, 6 = Angry
export const reactToPost = async (
  postId: number,
  reactionTypeId: number = 1
): Promise<{ message: string }> => {
  // Đảm bảo postId là số nguyên hợp lệ
  const validPostId = parseInt(String(postId), 10)
  if (!validPostId || isNaN(validPostId) || validPostId <= 0) {
    throw new Error('ID bài viết không hợp lệ')
  }

  // Validate reactionTypeId
  if (reactionTypeId < 1 || reactionTypeId > 6) {
    throw new Error('Loại cảm xúc không hợp lệ. Vui lòng chọn từ 1-6.')
  }

  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  try {
    console.log('[PostsApi] Reacting to post:', {
      postId: validPostId,
      reactionTypeId
    })

    const response = await authorizedRequest(`/api/PostReaction/${validPostId}/${reactionTypeId}`, {
      method: 'POST'
    })
    
    console.log('[PostsApi] Reacted to post successfully:', {
      postId: validPostId,
      reactionTypeId,
      response
    })

    return response
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : ''
    
    console.error('[PostsApi] Error reacting to post:', {
      postId: validPostId,
      reactionTypeId,
      error: error,
      message: msg
    })
    
    // Xử lý lỗi Entity Framework hoặc database
    if (msg.includes('saving the entity changes') || 
        msg.includes('inner exception') ||
        msg.includes('database') ||
        msg.includes('constraint') ||
        msg.includes('foreign key') ||
        msg.includes('duplicate') ||
        msg.includes('unique')) {
      console.error('[PostsApi] Database error when reacting to post:', msg)
      throw new Error('Không thể lưu thay đổi. Vui lòng thử lại sau.')
    }
    
    // Nếu là lỗi 400 BadRequest từ backend, hiển thị message gốc
    if (msg && msg.length > 0 && !msg.includes('HTTP')) {
      throw new Error(msg)
    }
    
    throw error
  }
}

// Backward compatibility: giữ lại toggleLikePost nhưng gọi reactToPost
export const toggleLikePost = async (
  postId: number,
  post?: PostDto,
  reactionTypeId: number = 1
): Promise<PostDto> => {
  await reactToPost(postId, reactionTypeId)
  // Lấy lại bài viết đã cập nhật từ backend
  return await fetchPostById(postId)
}

// Comment interfaces
export interface PostComment {
  postCommentId?: string
  id?: number
  fullName?: string
  authorName?: string
  authorAvatar?: string
  content: string
  images?: string[]
  image?: string
  createdDate?: string
  createdAt?: string
  likes?: PostCommentLike[]
  replies?: PostCommentReply[]
  authorId?: number
  authorID?: number
}

export interface PostCommentLike {
  postCommentLikeId: string
  accountId: string
  fullName: string
  createdDate: string
}

export interface PostCommentReply {
  replyPostCommentId: string
  fullName: string
  content: string
  createdDate: string
}


export interface CreateCommentDto {
  postId: string
  content: string
  images?: string[]
}

export interface UpdateCommentDto {
  content: string
  images?: string[]
}

// Normalize comment from backend format to frontend format
const normalizeComment = (payload: any): PostComment | null => {
  // Backend returns Comment entity with: Id, PostId, AuthorId, Content, CreatedAt, Image, Author (object)
  const commentId = payload?.Id ?? payload?.id ?? payload?.PostCommentId ?? payload?.postCommentId ?? ''
  const content = payload?.Content ?? payload?.content ?? ''
  
  // Skip comments without content or id
  if (!content || !commentId) {
    console.warn('[PostsApi] Skipping comment without content or id:', payload)
    return null
  }
  
  const createdAt = payload?.CreatedAt ?? payload?.createdAt
  const image = payload?.Image ?? payload?.image
  
  // Handle Author object (navigation property from backend)
  const author = payload?.Author ?? payload?.author
  const fullName = author?.Name ?? author?.name ?? author?.FullName ?? author?.fullName ?? 
                   payload?.FullName ?? payload?.fullName ?? payload?.authorName ?? 'Người dùng'
  const authorAvatar =
    author?.Avatar ??
    author?.avatar ??
    author?.Image ??
    author?.image ??
    payload?.AuthorAvatar ??
    payload?.authorAvatar ??
    undefined
  
  // Handle images - can be string or array
  let images: string[] = []
  if (image) {
    if (Array.isArray(image)) {
      images = image.filter((img: any) => img && typeof img === 'string')
    } else if (typeof image === 'string' && image.trim()) {
      images = [image]
    }
  }
  
  // Handle likes/reactions
  const likes = payload?.Commentreactions ?? payload?.commentreactions ?? payload?.Likes ?? payload?.likes ?? []
  const normalizedLikes: PostCommentLike[] = Array.isArray(likes) 
    ? likes.map((like: any) => ({
        postCommentLikeId: String(like?.Id ?? like?.id ?? like?.PostCommentLikeId ?? ''),
        accountId: String(like?.UserId ?? like?.userId ?? like?.AccountId ?? like?.accountId ?? ''),
        fullName: like?.User?.Name ?? like?.user?.name ?? like?.FullName ?? like?.fullName ?? 'Người dùng',
        createdDate: like?.CreatedAt ?? like?.createdAt ?? new Date().toISOString()
      }))
    : []
  
  // Handle replies (comments with ParentCommentId)
  const replies = payload?.Replies ?? payload?.replies ?? []
  const normalizedReplies: PostCommentReply[] = Array.isArray(replies)
    ? replies.map((reply: any) => ({
        replyPostCommentId: String(reply?.Id ?? reply?.id ?? reply?.ReplyPostCommentId ?? ''),
        fullName: reply?.Author?.Name ?? reply?.author?.name ?? reply?.FullName ?? reply?.fullName ?? 'Người dùng',
        content: reply?.Content ?? reply?.content ?? '',
        createdDate: reply?.CreatedAt ?? reply?.createdAt ?? new Date().toISOString()
      }))
    : []
  
  // Format date
  let createdDate = ''
  if (createdAt) {
    if (typeof createdAt === 'string') {
      createdDate = createdAt
    } else if (createdAt instanceof Date) {
      createdDate = createdAt.toISOString()
    } else {
      // Try to parse if it's a date string
      try {
        createdDate = new Date(createdAt).toISOString()
      } catch {
        createdDate = new Date().toISOString()
      }
    }
  } else {
    createdDate = new Date().toISOString()
  }
  
  return {
    postCommentId: String(commentId),
    id: typeof commentId === 'number' ? commentId : parseInt(String(commentId), 10) || undefined,
    fullName,
    authorName: fullName,
    authorAvatar,
    content: String(content), // Ensure content is always a string
    images: images.length > 0 ? images : undefined,
    image: images.length > 0 ? images[0] : undefined,
    createdDate,
    createdAt: createdDate,
    likes: normalizedLikes.length > 0 ? normalizedLikes : undefined,
    replies: normalizedReplies.length > 0 ? normalizedReplies : undefined,
    authorId: payload?.AuthorId ?? payload?.authorId ?? payload?.Author?.Id ?? payload?.author?.id,
    authorID: payload?.AuthorId ?? payload?.authorId
  }
}

// Get comments for a post (anonymous access)
export const fetchCommentsByPost = async (postId: number): Promise<PostComment[]> => {
  try {
    console.log('[PostsApi] Fetching comments for post:', postId)
    
    let response
    try {
      response = await fetchWithFallback(`/api/Comment/post/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (networkError: any) {
      console.error('[PostsApi] Network error fetching comments:', networkError)
      throw new Error(`Không thể kết nối đến server: ${networkError?.message || 'Unknown network error'}`)
    }
    
    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      console.error('[PostsApi] Comments fetch failed:', {
        postId,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    console.log('[PostsApi] Comments raw response:', { postId, data, isArray: Array.isArray(data) })
    
    if (!Array.isArray(data)) {
      console.warn('[PostsApi] Comments response is not an array:', data)
      return []
    }
    
    // Normalize each comment and filter out nulls
    const normalizedComments = data
      .map((comment: any) => {
        try {
          return normalizeComment(comment)
        } catch (err) {
          console.warn('[PostsApi] Failed to normalize comment:', comment, err)
          return null
        }
      })
      .filter((comment: PostComment | null): comment is PostComment => comment !== null)
    
    console.log(`[PostsApi] Fetched ${data.length} raw comments, normalized ${normalizedComments.length} valid comments for post ${postId}`)
    return normalizedComments
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    console.error('[PostsApi] Error fetching comments:', {
      postId,
      error: error,
      message: errorMessage,
      stack: error?.stack
    })
    
    // Re-throw với message rõ ràng hơn nếu là lỗi network
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Không thể kết nối đến server')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

// Create comment
export const createComment = async (dto: CreateCommentDto): Promise<void> => {
  try {
    console.log('[PostsApi] Creating comment:', dto)
    
    const response = await authorizedRequest('/api/Comment', {
      method: 'POST',
      body: JSON.stringify({
        PostId: String(dto.postId),
        Content: dto.content,
        Images: dto.images || []
      })
    })
    
    console.log('[PostsApi] Comment created successfully:', response)
    return response
  } catch (error) {
    console.error('[PostsApi] Error creating comment:', error)
    throw error
  }
}

// Update comment
export const updateComment = async (commentId: number, dto: UpdateCommentDto): Promise<void> => {
  await authorizedRequest(`/api/Comment/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      Content: dto.content,
      Images: dto.images || []
    })
  })
}

// Delete comment
export const deleteComment = async (commentId: number): Promise<void> => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  const response = await fetchWithFallback(`/api/Comment/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }
}

// Toggle like (tim) cho comment - chỉ 1 loại reaction "like"
// Trả về thông tin để optimistic update
export const toggleCommentLike = async (comment: PostComment): Promise<{ isLiked: boolean; reactionId?: string }> => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  const rawId = comment.id ?? comment.postCommentId
  const commentId = typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId)
  if (!commentId || Number.isNaN(commentId) || commentId <= 0) {
    throw new Error('ID bình luận không hợp lệ.')
  }

  // Lấy userId hiện tại
  let currentUserId: string | number | null = null
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      currentUserId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId
    }
  } catch (err) {
    console.warn('[PostsApi] toggleCommentLike: Could not parse userInfo from localStorage:', err)
  }

  const likes = Array.isArray(comment.likes) ? comment.likes : []
  let existingReactionId: string | null = null

  if (currentUserId && likes.length > 0) {
    const currentUserIdStr = String(currentUserId)
    const userLike = likes.find((like: PostCommentLike) => {
      const likeAccountId = String(like.accountId ?? '')
      return likeAccountId === currentUserIdStr
    })
    if (userLike && userLike.postCommentLikeId) {
      existingReactionId = String(userLike.postCommentLikeId)
    }
  }

  // Nếu đã like -> gọi unlike, ngược lại -> gọi like
  if (existingReactionId) {
    const response = await fetchWithFallback(`/api/CommentReaction/unlike/${existingReactionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      throw new Error(errorMessage)
    }

    return { isLiked: false }
  } else {
    const response = await fetchWithFallback('/api/CommentReaction/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        PostCommentId: String(commentId),
        ReplyPostCommentId: null
      })
    })

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
      const errorMessage = await extractErrorMessage(response, fallbackMessage)
      throw new Error(errorMessage)
    }

    // Backend không trả về reactionId trong response, sẽ cần reload để lấy
    return { isLiked: true }
  }
}

