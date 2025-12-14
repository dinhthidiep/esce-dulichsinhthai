import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

// ==================== INTERFACES ====================

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

// ==================== HELPER FUNCTIONS ====================

const authorizedRequest = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {})
  }

  if (token) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
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


// ==================== NORMALIZE FUNCTIONS ====================

const normalizePost = (payload: any): PostDto => {
  const postId = parseInt(String(payload?.postId ?? payload?.PostId ?? payload?.id ?? 0), 10) || 0
  const title = payload?.title ?? payload?.Title ?? payload?.articleTitle ?? payload?.ArticleTitle ?? ''
  const content = payload?.content ?? payload?.Content ?? payload?.postContent ?? payload?.PostContent ?? ''
  
  // Image processing
  let images: string[] = []
  const imagesRaw = payload?.images ?? payload?.Images
  
  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.filter((img: any) => img && typeof img === 'string' && img.trim().length > 10)
  } else if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
    let parts: string[] = []
    if (imagesRaw.includes('|||IMAGE_SEPARATOR|||')) {
      parts = imagesRaw.split('|||IMAGE_SEPARATOR|||').map(p => p.trim()).filter(p => p)
    } else if (imagesRaw.includes(',')) {
      parts = imagesRaw.split(',').map(p => p.trim()).filter(p => p)
    } else {
      parts = [imagesRaw.trim()]
    }
    images = parts.filter(img => img.trim().length > 10)
  }
  
  const authorId = parseInt(String(payload?.authorId ?? payload?.AuthorId ?? payload?.posterId ?? payload?.PosterId ?? 0), 10) || 0
  
  const likesArray = payload?.likes ?? payload?.Likes
  const commentsArray = payload?.comments ?? payload?.Comments
  const likesCount = Array.isArray(likesArray) ? likesArray.length : (payload?.likesCount ?? payload?.LikesCount ?? 0)
  const commentsCount = Array.isArray(commentsArray) ? commentsArray.length : (payload?.commentsCount ?? payload?.CommentsCount ?? 0)
  
  // Parse likes array
  const likes: PostLikeDto[] = Array.isArray(likesArray)
    ? likesArray.map((like: any) => {
        const reactionTypeId = like?.reactionTypeId ?? like?.ReactionTypeId ?? null
        let reactionType = 'like'
        if (reactionTypeId !== null) {
          const id = Number(reactionTypeId)
          switch (id) {
            case 1: reactionType = 'like'; break
            case 2: reactionType = 'love'; break
            case 3: reactionType = 'haha'; break
            case 4: reactionType = 'wow'; break
            case 5: reactionType = 'sad'; break
            case 6: reactionType = 'angry'; break
          }
        }
        return {
          postLikeId: String(like?.postLikeId ?? like?.PostLikeId ?? ''),
          accountId: String(like?.accountId ?? like?.AccountId ?? ''),
          fullName: like?.fullName ?? like?.FullName ?? 'Người dùng',
          createdDate: like?.createdDate ?? like?.CreatedDate ?? new Date().toISOString(),
          reactionType
        }
      })
    : []
  
  // Check isLiked
  let isLiked = payload?.isLiked ?? payload?.IsLiked ?? false
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo && likes.length > 0) {
      const parsed = JSON.parse(userInfo)
      const currentUserId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId
      if (currentUserId) {
        isLiked = likes.some(like => String(like.accountId) === String(currentUserId))
      }
    }
  } catch {
    // ignore
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
    createdAt: payload?.createdAt ?? payload?.CreatedAt ?? payload?.createdDate ?? payload?.CreatedDate ?? undefined,
    publicDate: payload?.publicDate ?? payload?.PublicDate ?? undefined,
    likesCount,
    commentsCount,
    isLiked,
    hashtags: Array.isArray(payload?.hashtags ?? payload?.Hashtags) ? (payload.hashtags ?? payload.Hashtags) : [],
    likes: likes.length > 0 ? likes : undefined
  }
}

const normalizeComment = (payload: any): PostComment | null => {
  const commentId = payload?.Id ?? payload?.id ?? payload?.PostCommentId ?? payload?.postCommentId ?? ''
  const content = payload?.Content ?? payload?.content ?? ''
  
  if (!content || !commentId) return null
  
  const author = payload?.Author ?? payload?.author
  const fullName = author?.Name ?? author?.name ?? payload?.FullName ?? payload?.fullName ?? 'Người dùng'
  const authorAvatar = author?.Avatar ?? author?.avatar ?? payload?.AuthorAvatar ?? payload?.authorAvatar ?? undefined
  
  let images: string[] = []
  const image = payload?.Image ?? payload?.image
  if (image) {
    images = Array.isArray(image) ? image.filter((img: any) => typeof img === 'string') : [image]
  }
  
  const likes = payload?.Commentreactions ?? payload?.commentreactions ?? payload?.Likes ?? payload?.likes ?? []
  const normalizedLikes: PostCommentLike[] = Array.isArray(likes)
    ? likes.map((like: any) => ({
        postCommentLikeId: String(like?.Id ?? like?.id ?? ''),
        accountId: String(like?.UserId ?? like?.userId ?? like?.AccountId ?? ''),
        fullName: like?.User?.Name ?? like?.FullName ?? 'Người dùng',
        createdDate: like?.CreatedAt ?? like?.createdAt ?? new Date().toISOString()
      }))
    : []
  
  return {
    postCommentId: String(commentId),
    id: typeof commentId === 'number' ? commentId : parseInt(String(commentId), 10) || undefined,
    fullName,
    authorName: fullName,
    authorAvatar,
    content: String(content),
    images: images.length > 0 ? images : undefined,
    createdDate: payload?.CreatedAt ?? payload?.createdAt ?? new Date().toISOString(),
    createdAt: payload?.CreatedAt ?? payload?.createdAt ?? new Date().toISOString(),
    likes: normalizedLikes.length > 0 ? normalizedLikes : undefined,
    authorId: payload?.AuthorId ?? payload?.authorId
  }
}


// ==================== POST API FUNCTIONS ====================

/**
 * Lấy tất cả bài viết (diễn đàn)
 * Endpoint: GET /api/Post/GetAllPost
 */
export const fetchAllPosts = async (): Promise<PostDto[]> => {
  try {
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
    return Array.isArray(data) ? data.map(normalizePost) : []
  } catch (error) {
    console.error('[PostsApi] fetchAllPosts failed:', error)
    throw error
  }
}

/**
 * Lấy bài viết theo ID
 * Endpoint: GET /api/Post/GetPostById?id={postId}
 */
export const fetchPostById = async (postId: number): Promise<PostDto> => {
  const data = await authorizedRequest(`/api/Post/GetPostById?id=${postId}`, {
    method: 'GET'
  })
  return normalizePost(data)
}

/**
 * Lấy bài viết đã duyệt (cho user xem)
 * Endpoint: GET /api/Post/GetAllPost (filter status = Approved)
 */
export const fetchApprovedPosts = async (): Promise<PostDto[]> => {
  const allPosts = await fetchAllPosts()
  return allPosts.filter(post => post.status === 'Approved')
}

/**
 * Lấy bài viết của user hiện tại
 * Endpoint: GET /api/Post/GetAllPost (filter by authorId)
 */
export const fetchMyPosts = async (): Promise<PostDto[]> => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) return []
    
    const parsed = JSON.parse(userInfo)
    const currentUserId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId
    if (!currentUserId) return []
    
    const allPosts = await fetchAllPosts()
    return allPosts.filter(post => post.authorId === Number(currentUserId))
  } catch {
    return []
  }
}

/**
 * Tạo bài viết mới
 * Endpoint: POST /api/Post/CreatePost
 */
export const createPost = async (dto: CreatePostDto): Promise<PostDto> => {
  const data = await authorizedRequest('/api/Post/CreatePost', {
    method: 'POST',
    body: JSON.stringify({
      PostContent: dto.content,
      ArticleTitle: dto.title,
      Images: dto.images || [],
      PosterName: ''
    })
  })
  
  const postData = data?.post ?? data
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

/**
 * Cập nhật bài viết
 * Endpoint: PUT /api/Post/UpdatePost?id={postId}
 */
export const updatePost = async (postId: number, dto: UpdatePostDto): Promise<void> => {
  await authorizedRequest(`/api/Post/UpdatePost?id=${postId}`, {
    method: 'PUT',
    body: JSON.stringify({
      PostContent: dto.content,
      ArticleTitle: dto.title,
      Images: dto.images,
      PosterName: dto.posterName ?? ''
    })
  })
}

/**
 * Xóa bài viết
 * Endpoint: DELETE /api/Post/DeletePost?id={postId}
 */
export const deletePost = async (postId: number): Promise<void> => {
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
    throw new Error(await extractErrorMessage(response, `HTTP ${response.status}`))
  }
}


// ==================== REACTION API FUNCTIONS ====================

/**
 * React to Post (like, love, haha, wow, sad, angry)
 * Endpoint: POST /api/PostReaction/{postId}/{reactionTypeId}
 * reactionTypeId: 1=Like, 2=Love, 3=Haha, 4=Wow, 5=Sad, 6=Angry
 */
export const reactToPost = async (postId: number, reactionTypeId: number = 1): Promise<{ message: string }> => {
  const validPostId = parseInt(String(postId), 10)
  if (!validPostId || isNaN(validPostId) || validPostId <= 0) {
    throw new Error('ID bài viết không hợp lệ')
  }

  if (reactionTypeId < 1 || reactionTypeId > 6) {
    throw new Error('Loại cảm xúc không hợp lệ')
  }

  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  return await authorizedRequest(`/api/PostReaction/${validPostId}/${reactionTypeId}`, {
    method: 'POST'
  })
}

/**
 * Toggle like post (backward compatibility)
 */
export const toggleLikePost = async (postId: number, reactionTypeId: number = 1): Promise<PostDto> => {
  await reactToPost(postId, reactionTypeId)
  return await fetchPostById(postId)
}

// ==================== COMMENT API FUNCTIONS ====================

/**
 * Lấy comments của bài viết
 * Endpoint: GET /api/Comment/post/{postId}
 */
export const fetchCommentsByPost = async (postId: number): Promise<PostComment[]> => {
  try {
    const response = await fetchWithFallback(`/api/Comment/post/${postId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!Array.isArray(data)) return []
    
    return data
      .map(normalizeComment)
      .filter((comment): comment is PostComment => comment !== null)
  } catch (error) {
    console.error('[PostsApi] fetchCommentsByPost failed:', error)
    throw error
  }
}

/**
 * Tạo comment mới
 * Endpoint: POST /api/Comment
 * Backend expect PostCommentDto: { PostId: string, Content: string, Images?: string[], PostCommentId?: string (for reply) }
 */
export const createComment = async (dto: CreateCommentDto & { parentCommentId?: string }): Promise<void> => {
  await authorizedRequest('/api/Comment', {
    method: 'POST',
    body: JSON.stringify({
      PostId: String(dto.postId),
      Content: dto.content,
      Images: dto.images || [],
      PostCommentId: dto.parentCommentId || null // For reply - backend uses PostCommentId as parent
    })
  })
}

/**
 * Xóa comment
 * Endpoint: DELETE /api/Comment/{commentId}
 */
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
    throw new Error(await extractErrorMessage(response, `HTTP ${response.status}`))
  }
}

/**
 * Toggle like comment
 * Endpoint: POST /api/CommentReaction/like hoặc DELETE /api/CommentReaction/unlike/{reactionId}
 */
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

  // Check if user already liked
  let currentUserId: string | number | null = null
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      currentUserId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId
    }
  } catch {
    // ignore
  }

  const likes = Array.isArray(comment.likes) ? comment.likes : []
  let existingReactionId: string | null = null

  if (currentUserId && likes.length > 0) {
    const userLike = likes.find(like => String(like.accountId) === String(currentUserId))
    if (userLike?.postCommentLikeId) {
      existingReactionId = String(userLike.postCommentLikeId)
    }
  }

  if (existingReactionId) {
    // Unlike
    const response = await fetchWithFallback(`/api/CommentReaction/unlike/${existingReactionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, `HTTP ${response.status}`))
    }

    return { isLiked: false }
  } else {
    // Like - Backend expect PostCommentLikeDto: { PostCommentId: string, ReplyPostCommentId?: string }
    const response = await fetchWithFallback('/api/CommentReaction/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        PostCommentId: String(commentId), // Backend expect string
        ReplyPostCommentId: null
      })
    })

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, `HTTP ${response.status}`))
    }

    return { isLiked: true }
  }
}

export default {
  fetchAllPosts,
  fetchPostById,
  fetchApprovedPosts,
  fetchMyPosts,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  toggleLikePost,
  fetchCommentsByPost,
  createComment,
  deleteComment,
  toggleCommentLike
}


