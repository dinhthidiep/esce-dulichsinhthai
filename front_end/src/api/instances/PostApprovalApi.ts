/**
 * PostApprovalApi.ts
 * API cho chức năng phê duyệt bài viết (Admin)
 */

import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export type PostStatus = 'Pending' | 'Approved' | 'Rejected' | 'Review' | string | null | undefined

export interface PendingPost {
  id: number
  postContent: string
  images?: string[] | null
  posterName: string
  posterId: number
  posterAvatar?: string | null
  hashtags?: string[] | null
  articleTitle?: string | null
  status?: PostStatus
  rejectComment?: string | null
  reviewComments?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

const ensureAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  if (response.status === 204) {
    return null as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  const text = await response.text()
  return text as T
}

const normalizePost = (payload: any): PendingPost => {
  // Backend trả về Post entity với các field: Id, Title, Content, AuthorId, Image, Status, etc.
  // Cần map sang format frontend
  const images = payload?.image ?? payload?.Image
  return {
    id: Number(payload?.id ?? payload?.Id ?? 0),
    postContent: payload?.content ?? payload?.Content ?? payload?.postContent ?? payload?.PostContent ?? '',
    images: images ? (typeof images === 'string' ? images.split(',') : images) : null,
    posterName: payload?.author?.name ?? payload?.Author?.Name ?? payload?.posterName ?? payload?.PosterName ?? '',
    posterId: Number(payload?.authorId ?? payload?.AuthorId ?? payload?.posterId ?? payload?.PosterId ?? 0),
    posterAvatar: payload?.author?.avatar ?? payload?.Author?.Avatar ?? null,
    hashtags: payload?.hashtags ?? payload?.Hashtags ?? null,
    articleTitle: payload?.title ?? payload?.Title ?? payload?.articleTitle ?? payload?.ArticleTitle ?? null,
    status: payload?.status ?? payload?.Status ?? 'Pending',
    rejectComment: payload?.rejectComment ?? payload?.RejectComment ?? null,
    reviewComments: payload?.reviewComments ?? payload?.ReviewComments ?? null,
    createdAt: payload?.createdAt ?? payload?.CreatedAt ?? null,
    updatedAt: payload?.updatedAt ?? payload?.UpdatedAt ?? null
  }
}

/**
 * Lấy danh sách bài viết chờ duyệt (Admin)
 * Endpoint: GET /api/Post/pending
 */
export const getPendingPosts = async (): Promise<PendingPost[]> => {
  try {
    const endpoint = '/api/Post/pending'
    console.log('[PostApprovalApi] Fetching pending posts')
    
    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: ensureAuthHeaders()
    })
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        console.warn('[PostApprovalApi] No pending posts found, returning empty array')
        return []
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await handleResponse<any[]>(response)
    
    if (result == null || !Array.isArray(result)) {
      return []
    }
    
    const normalized = result.map(normalizePost)
    console.log(`[PostApprovalApi] Fetched ${normalized.length} pending posts`)
    return normalized
  } catch (error: any) {
    console.error('[PostApprovalApi] Error fetching pending posts:', error)
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến server.')
    }
    return []
  }
}

/**
 * Phê duyệt bài viết (Admin)
 * Endpoint: PUT /api/Post/approve
 */
export const approvePost = async (postId: number): Promise<string> => {
  try {
    const endpoint = '/api/Post/approve'
    console.log('[PostApprovalApi] Approving post:', postId)
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        PostId: String(postId)
      })
    })
    
    const result = await handleResponse<any>(response)
    console.log('[PostApprovalApi] Post approved successfully')
    return result?.message || 'Đã phê duyệt bài viết thành công.'
  } catch (error: any) {
    console.error('[PostApprovalApi] Error approving post:', error)
    throw error
  }
}

/**
 * Từ chối bài viết (Admin)
 * Endpoint: PUT /api/Post/reject
 */
export const rejectPost = async (postId: number, comment: string): Promise<string> => {
  try {
    if (!comment?.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối')
    }
    
    const endpoint = '/api/Post/reject'
    console.log('[PostApprovalApi] Rejecting post:', postId)
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        PostId: String(postId),
        Comment: comment.trim()
      })
    })
    
    const result = await handleResponse<any>(response)
    console.log('[PostApprovalApi] Post rejected successfully')
    return result?.message || 'Đã từ chối bài viết.'
  } catch (error: any) {
    console.error('[PostApprovalApi] Error rejecting post:', error)
    throw error
  }
}

/**
 * Yêu cầu chỉnh sửa bài viết (Admin)
 * Endpoint: POST /api/Post/review
 */
export const reviewPost = async (postId: number, comment: string): Promise<string> => {
  try {
    if (!comment?.trim()) {
      throw new Error('Vui lòng nhập nội dung yêu cầu chỉnh sửa')
    }
    
    const endpoint = '/api/Post/review'
    console.log('[PostApprovalApi] Reviewing post:', postId)
    
    const response = await fetchWithFallback(endpoint, {
      method: 'POST',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        PostId: String(postId),
        Comment: comment.trim()
      })
    })
    
    const result = await handleResponse<any>(response)
    console.log('[PostApprovalApi] Post review sent successfully')
    return result?.message || 'Đã gửi yêu cầu chỉnh sửa.'
  } catch (error: any) {
    console.error('[PostApprovalApi] Error reviewing post:', error)
    throw error
  }
}
