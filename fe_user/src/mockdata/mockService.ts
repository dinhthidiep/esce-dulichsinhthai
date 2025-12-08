// Mock Service để thay thế tất cả API calls
// Sử dụng mockdata thay vì gọi backend thật

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import {
  mockUsers,
  mockServiceCombos,
  mockBookings,
  mockReviews,
  mockPosts,
  mockComments,
  mockNews,
  mockCoupons,
  mockPostReactions,
  mockPostSaves,
  mockServices,
  delay,
} from './index'
import { mockForumCommentsByPostId, type MockForumComment } from './mockForumComments'
import { getNotificationsByUserId, type MockNotification } from './mockNotifications'

// Simulate network delay (100-500ms)
const SIMULATE_DELAY = true
const MIN_DELAY = 100
const MAX_DELAY = 500

const randomDelay = () => {
  if (!SIMULATE_DELAY) return Promise.resolve()
  const delayMs = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY
  return delay(delayMs)
}

// Helper để parse URL và query params
const parseUrl = (url: string) => {
  const [path, queryString] = url.split('?')
  const params: Record<string, string> = {}
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })
  }
  return { path, params }
}

// Helper để lấy userId từ localStorage/sessionStorage
const getCurrentUserId = (): number | null => {
  try {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      return userInfo.Id || userInfo.id || null
    }
  } catch (error) {
    console.error('Error getting user ID:', error)
  }
  return null
}

// Helper để transform MockForumComment thành format PostCommentResponseDto
const transformForumComment = (comment: MockForumComment, currentUserId: number | null): any => {
  if (!comment) return null
  
  const likes = Array.isArray(comment.Likes) ? comment.Likes : []
  const replies = Array.isArray(comment.Replies) ? comment.Replies : []
  
  const userReaction = currentUserId && likes.length > 0
    ? likes.find(like => String(like.AccountId || like.UserId) === String(currentUserId))
    : null

  return {
    PostCommentId: comment.PostCommentId || String(comment.AuthorId || ''),
    Id: parseInt(comment.PostCommentId || '0'),
    FullName: comment.FullName || 'Người dùng',
    Content: comment.Content || '',
    Images: Array.isArray(comment.Images) ? comment.Images : [],
    CreatedDate: comment.CreatedDate || new Date().toISOString(),
    AuthorId: comment.AuthorId || 0,
    Author: {
      Id: comment.AuthorId || 0,
      Name: comment.FullName || 'Người dùng',
    },
    ReactionsCount: comment.ReactionsCount || 0,
    ParentCommentId: comment.ParentCommentId || null,
    Likes: likes.map(like => ({
      Id: like.Id,
      AccountId: like.AccountId || String(like.UserId || ''),
      UserId: like.UserId || parseInt(like.AccountId || '0'),
      FullName: like.FullName || 'Người dùng',
      CreatedDate: like.CreatedDate || new Date().toISOString(),
      ReactionType: like.ReactionType || 'Like',
    })),
    Replies: replies.map(reply => transformForumComment(reply, currentUserId)).filter(r => r !== null),
  }
}

// Mock handler function
const handleMockRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    await randomDelay()

    const url = config.url || ''
    const method = (config.method || 'get').toLowerCase()
    // Normalize path: remove leading/trailing slashes for comparison
    const { path: rawPath, params } = parseUrl(url)
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
    const data = config.data

    console.log(`🎭 [MOCK API] ${method.toUpperCase()} ${path}`, { params, data, rawUrl: url, configUrl: config.url, baseURL: config.baseURL })

    let responseData: any = null
    let status = 200

    try {
      // Normalize path: remove leading/trailing slashes for comparison
      const normalizedPath = path.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      
      // Debug log để kiểm tra path
      console.log(`🔍 [MOCK API] Debug path matching:`, {
        rawUrl: url,
        rawPath: rawPath,
        path: path,
        normalizedPath: normalizedPath,
        method: method
      })
      
      // Service endpoints (dịch vụ đơn lẻ) - PHẢI CHECK TRƯỚC ServiceCombo để tránh conflict
      // Xử lý cả /api/service và /service (vì baseURL có thể có hoặc không có /api)
      if (normalizedPath === 'service' || normalizedPath === 'service/' || 
          path === '/service' || path === '/service/' ||
          path === '/api/service' || path === '/api/service/' ||
          normalizedPath === 'api/service' || normalizedPath === 'api/service/' ||
          (url.includes('/service') && !url.includes('/ServiceCombo') && !url.includes('ServiceCombo'))) {
        if (method === 'get') {
          // Lọc theo status nếu có query param
          let filteredServices = [...mockServices]
          if (params.status) {
            filteredServices = filteredServices.filter((s) => 
              (s.Status || '').toLowerCase() === params.status.toLowerCase()
            )
          }
          console.log(`✅ [MOCK API] GET /service - Trả về ${filteredServices.length} services`)
          console.log(`  - Filtered by status: ${params.status || 'all'}`)
          console.log(`  - Services:`, filteredServices.map(s => ({ Id: s.Id, Name: s.Name, Status: s.Status })))
          responseData = filteredServices
          status = 200
        } else if (method === 'post') {
          // Tạo service mới
          const userId = getCurrentUserId() || 2 // Default to host user
          const newService = {
            Id: mockServices.length + 1,
            HostId: userId,
            Status: 'Pending',
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            HostName: mockUsers.find((u) => u.Id === userId)?.Name || 'Host',
            ...data,
          }
          mockServices.push(newService)
          responseData = { 
            message: 'Service created successfully and is awaiting admin approval.', 
            service: newService 
          }
          status = 201
        }
      }
      // ServiceCombo endpoints - check sau Service
      else if (normalizedPath === 'ServiceCombo' || path === '/ServiceCombo' || path === '/ServiceCombo/') {
        if (method === 'get') {
          const filteredServices = mockServiceCombos.filter((s) => s.Status === 'open')
          console.log(`✅ [MOCK API] GET /ServiceCombo - Trả về ${filteredServices.length} service combos`)
          console.log(`[MOCK API] Service combos:`, filteredServices.map(s => ({ Id: s.Id, Name: s.Name, Status: s.Status })))
          responseData = filteredServices
          status = 200
        } else {
          status = 405
          responseData = { message: 'Method not allowed' }
        }
      } else if (normalizedPath.startsWith('ServiceCombo/') || path.startsWith('/ServiceCombo/')) {
        const idStr = normalizedPath.split('/')[1]
        const id = parseInt(idStr)
        if (!isNaN(id)) {
          if (method === 'get') {
            const service = mockServiceCombos.find((s) => s.Id === id)
            if (service) {
              console.log(`[MOCK API] GET /ServiceCombo/${id} - Tìm thấy:`, service.Name)
              responseData = service
            } else {
              status = 404
              responseData = { message: 'Service combo not found' }
              console.log(`[MOCK API] GET /ServiceCombo/${id} - Không tìm thấy`)
            }
          }
        } else {
          status = 400
          responseData = { message: 'Invalid service combo ID' }
        }
      }

      // Review endpoints
      else if (path === '/Review' || path === '/Review/') {
        if (method === 'get') {
          responseData = mockReviews
        } else if (method === 'post') {
          const userId = getCurrentUserId() || 4 // Default to tourist user
          const newReview = {
            Id: mockReviews.length + 1,
            UserId: userId,
            ...data,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            User: mockUsers.find((u) => u.Id === userId),
          }
          mockReviews.push(newReview)
          responseData = newReview
        }
      } else if (path.startsWith('/Review/')) {
        const parts = path.split('/')
        const reviewId = parseInt(parts[2])
        if (method === 'put') {
          const index = mockReviews.findIndex((r) => r.Id === reviewId)
          if (index !== -1) {
            mockReviews[index] = { ...mockReviews[index], ...data, UpdatedAt: new Date().toISOString() }
            responseData = mockReviews[index]
          } else {
            status = 404
            responseData = { message: 'Review not found' }
          }
        } else if (method === 'delete') {
          const index = mockReviews.findIndex((r) => r.Id === reviewId)
          if (index !== -1) {
            mockReviews.splice(index, 1)
            responseData = { success: true }
          } else {
            status = 404
            responseData = { message: 'Review not found' }
          }
        }
      } else if (path.includes('/Review/servicecombo/') && path.includes('/average-rating')) {
        // Handle both /Review/servicecombo/{id}/average-rating and /Review/servicecombo/{id}/average-rating
        const parts = path.split('/')
        let serviceComboId: number | null = null
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'servicecombo' && i + 1 < parts.length) {
            serviceComboId = parseInt(parts[i + 1])
            break
          }
        }
        if (serviceComboId) {
          const serviceReviews = mockReviews.filter((r) => r.ServiceComboId === serviceComboId)
          const avgRating =
            serviceReviews.length > 0
              ? serviceReviews.reduce((sum, r) => sum + r.Rating, 0) / serviceReviews.length
              : 0
          responseData = { AverageRating: avgRating }
        } else {
          status = 400
          responseData = { message: 'Invalid service combo ID' }
        }
      } else if (path.includes('/Review/user/')) {
        const userId = parseInt(path.split('/')[3])
        responseData = mockReviews.filter((r) => r.UserId === userId)
      } else if (path.includes('/Review/booking/') && path.includes('/user/') && path.includes('/can-review')) {
        const parts = path.split('/')
        const bookingId = parseInt(parts[3])
        const userId = parseInt(parts[5])
        const booking = mockBookings.find((b) => b.Id === bookingId && b.UserId === userId)
        const hasReview = mockReviews.some((r) => r.BookingId === bookingId && r.UserId === userId)
        responseData = { CanReview: !!booking && !hasReview }
      }

      // User endpoints
      else if (path.startsWith('/user/')) {
        const userId = parseInt(path.split('/')[2])
        if (method === 'get') {
          const user = mockUsers.find((u) => u.Id === userId)
          if (user) {
            responseData = user
          } else {
            status = 404
            responseData = { message: 'User not found' }
          }
        } else if (method === 'put' && path.includes('/profile')) {
          const currentUserId = getCurrentUserId()
          if (currentUserId) {
            const index = mockUsers.findIndex((u) => u.Id === currentUserId)
            if (index !== -1) {
              mockUsers[index] = { ...mockUsers[index], ...data, UpdatedAt: new Date().toISOString() }
              responseData = mockUsers[index]
            } else {
              status = 404
              responseData = { message: 'User not found' }
            }
          } else {
            status = 401
            responseData = { message: 'Unauthorized' }
          }
        }
      }

      // Booking endpoints
      else if (path.startsWith('/Booking/')) {
        const parts = path.split('/')
        if (parts[2] === 'user') {
          const userId = parseInt(parts[3])
          responseData = mockBookings.filter((b) => b.UserId === userId)
        } else if (parts[2] === 'calculate') {
          if (method === 'post') {
            const serviceCombo = mockServiceCombos.find((s) => s.Id === data.ServiceComboId)
            if (serviceCombo) {
              const total = serviceCombo.Price * (data.Quantity || 1)
              responseData = { TotalAmount: total }
            } else {
              status = 404
              responseData = { message: 'Service combo not found' }
            }
          }
        } else {
          const bookingId = parseInt(parts[2])
          if (method === 'get') {
            const booking = mockBookings.find((b) => b.Id === bookingId)
            if (booking) {
              responseData = booking
            } else {
              status = 404
              responseData = { message: 'Booking not found' }
            }
          } else if (method === 'put' && path.includes('/status')) {
            const index = mockBookings.findIndex((b) => b.Id === bookingId)
            if (index !== -1) {
              mockBookings[index] = { ...mockBookings[index], Status: data.Status, UpdatedAt: new Date().toISOString() }
              responseData = mockBookings[index]
            } else {
              status = 404
              responseData = { message: 'Booking not found' }
            }
          }
        }
      } else if (path === '/Booking' || path === '/Booking/') {
        if (method === 'post') {
          const userId = getCurrentUserId() || 4 // Default to tourist user
          const newBooking = {
            Id: mockBookings.length + 1,
            UserId: userId,
            ...data,
            Status: 'pending',
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            ServiceCombo: mockServiceCombos.find((s) => s.Id === data.ServiceComboId),
          }
          mockBookings.push(newBooking)
          responseData = newBooking
        }
      }

      // Post endpoints - Xử lý cả normalizedPath và path gốc
      else if (normalizedPath === 'Post/GetAllPost' || normalizedPath === 'Post' || normalizedPath === 'Post/' || 
          path === '/Post/GetAllPost' || path === '/Post' || path === '/Post/' ||
          url.includes('/Post/GetAllPost') || (url.includes('/Post') && !url.includes('/Post/'))) {
        if (method === 'get') {
          const currentUserId = getCurrentUserId()
          console.log(`🎭 [MOCK API] GET /Post/GetAllPost - Trả về ${mockPosts.length} posts`)
          console.log(`🎭 [MOCK API] Posts:`, mockPosts.map(p => ({ PostId: p.PostId, Title: p.Title, Status: p.Status })))
          responseData = mockPosts.map((post) => {
            try {
              // Lấy comments từ mockForumCommentsByPostId
              const forumComments = mockForumCommentsByPostId[post.PostId] || []
              const transformedComments = forumComments
                .map(comment => {
                  try {
                    return transformForumComment(comment, currentUserId)
                  } catch (err) {
                    console.error(`🎭 [MOCK API] Lỗi transform comment:`, err, comment)
                    return null
                  }
                })
                .filter(c => c !== null)
              
              console.log(`🎭 [MOCK API] Post ${post.PostId} có ${transformedComments.length} comments`)
              
              return {
                ...post,
                IsLiked: mockPostReactions[post.PostId]?.includes(currentUserId || 0) || false,
                IsSaved: mockPostSaves[post.PostId]?.includes(currentUserId || 0) || false,
                Comments: transformedComments, // Populate comments
              }
            } catch (err) {
              console.error(`🎭 [MOCK API] Lỗi khi populate comments cho post ${post.PostId}:`, err)
              // Trả về post không có comments nếu có lỗi
              return {
                ...post,
                IsLiked: mockPostReactions[post.PostId]?.includes(currentUserId || 0) || false,
                IsSaved: mockPostSaves[post.PostId]?.includes(currentUserId || 0) || false,
                Comments: [],
              }
            }
          })
        } else if (method === 'post' && (path.includes('/CreatePost') || normalizedPath.includes('CreatePost'))) {
          const userId = getCurrentUserId() || 4 // Default to tourist user
          const newPost = {
            PostId: mockPosts.length + 1,
            UserId: userId,
            ...data,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            User: mockUsers.find((u) => u.Id === userId),
            LikeCount: 0,
            CommentCount: 0,
            IsLiked: false,
            IsSaved: false,
          }
          mockPosts.push(newPost)
          responseData = newPost
        }
      } else if (path.startsWith('/Post/')) {
        if (path.includes('/DeletePost')) {
          const postId = parseInt(params.id || '0')
          const index = mockPosts.findIndex((p) => p.PostId === postId)
          if (index !== -1) {
            mockPosts.splice(index, 1)
            delete mockPostReactions[postId]
            delete mockPostSaves[postId]
            responseData = { success: true }
          } else {
            status = 404
            responseData = { message: 'Post not found' }
          }
        } else if (path.includes('/UpdatePost') || normalizedPath.includes('UpdatePost')) {
          const postId = parseInt(params.id || '0')
          const index = mockPosts.findIndex((p) => p.PostId === postId)
          if (index !== -1) {
            mockPosts[index] = { ...mockPosts[index], ...data, UpdatedAt: new Date().toISOString() }
            responseData = mockPosts[index]
          } else {
            status = 404
            responseData = { message: 'Post not found' }
          }
        }
      }

      // PostReaction endpoints
      else if (path.startsWith('/PostReaction/')) {
        if (path.includes('/like/')) {
          const postId = parseInt(path.split('/like/')[1])
          const userId = getCurrentUserId() || 4 // Default to tourist user
          if (!mockPostReactions[postId]) {
            mockPostReactions[postId] = []
          }
          if (!mockPostReactions[postId].includes(userId)) {
            mockPostReactions[postId].push(userId)
            const post = mockPosts.find((p) => p.PostId === postId)
            if (post) {
              post.LikeCount = (post.LikeCount || 0) + 1
            }
          }
          responseData = { success: true }
        } else if (path.includes('/unlike/')) {
          const reactionId = parseInt(path.split('/unlike/')[1])
          // Tìm postId từ reactionId (giả lập)
          const postId = Object.keys(mockPostReactions).find((pid) =>
            mockPostReactions[parseInt(pid)].includes(reactionId)
          )
          if (postId) {
            const userId = getCurrentUserId() || 4 // Default to tourist user
            const index = mockPostReactions[parseInt(postId)].indexOf(userId)
            if (index !== -1) {
              mockPostReactions[parseInt(postId)].splice(index, 1)
              const post = mockPosts.find((p) => p.PostId === parseInt(postId))
              if (post) {
                post.LikeCount = Math.max(0, (post.LikeCount || 0) - 1)
              }
            }
          }
          responseData = { success: true }
        }
      }

      // PostSave endpoints
      else if (path.startsWith('/PostSave/')) {
        if (path.includes('/save/')) {
          const postId = parseInt(path.split('/save/')[1])
          const userId = getCurrentUserId() || 4 // Default to tourist user
          if (!mockPostSaves[postId]) {
            mockPostSaves[postId] = []
          }
          if (!mockPostSaves[postId].includes(userId)) {
            mockPostSaves[postId].push(userId)
          }
          responseData = { success: true }
        } else if (path.includes('/unsave/')) {
          const postId = parseInt(path.split('/unsave/')[1])
          const userId = getCurrentUserId() || 4 // Default to tourist user
          if (mockPostSaves[postId]) {
            const index = mockPostSaves[postId].indexOf(userId)
            if (index !== -1) {
              mockPostSaves[postId].splice(index, 1)
            }
          }
          responseData = { success: true }
        }
      }

      // Comment endpoints
      else if (path === '/Comment' || path === '/Comment/') {
        if (method === 'post') {
          const userId = getCurrentUserId() || 4 // Default to tourist user
          const newComment = {
            CommentId: mockComments.length + 1,
            UserId: userId,
            ...data,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            User: mockUsers.find((u) => u.Id === userId),
          }
          mockComments.push(newComment)
          // Cập nhật CommentCount cho post
          const post = mockPosts.find((p) => p.PostId === data.PostId)
          if (post) {
            const commentCount = mockComments.filter((c) => c.PostId === data.PostId).length
            post.CommentCount = commentCount
          }
          responseData = newComment
        }
      }
      // GET comments by post ID: /Comment/post/{postId}
      else if (path.startsWith('/Comment/post/') || normalizedPath.startsWith('Comment/post/')) {
        if (method === 'get') {
          const parts = path.split('/')
          const postIdStr = parts[parts.length - 1] || normalizedPath.split('/').pop() || '0'
          const postId = parseInt(postIdStr)
          
          if (!isNaN(postId)) {
            // Lấy tất cả comments của post này (bao gồm cả replies)
            const allPostComments = mockComments.filter((c: any) => c.PostId === postId)
            
            // Chỉ lấy top-level comments (ParentCommentId === null)
            const topLevelComments = allPostComments.filter((c: any) => !c.ParentCommentId || c.ParentCommentId === null)
            
            // Transform comments để có format giống backend (với Author object và Replies)
            const transformedComments = topLevelComments.map((comment: any) => {
              // Tìm replies (comments có ParentCommentId = comment.CommentId)
              const replies = mockComments
                .filter((c: any) => (c.ParentCommentId || null) === comment.CommentId)
                .map((reply: any) => ({
                  Id: reply.CommentId,
                  CommentId: reply.CommentId,
                  PostId: reply.PostId,
                  AuthorId: reply.UserId,
                  Author: {
                    Id: reply.User?.Id || reply.UserId,
                    Name: reply.User?.Name || 'Unknown',
                    Avatar: reply.User?.Avatar || null,
                  },
                  Content: reply.Content,
                  Image: (reply as any).Image || null,
                  ParentCommentId: (reply as any).ParentCommentId || null,
                  CreatedAt: reply.CreatedAt,
                  ReactionsCount: (reply as any).ReactionsCount || 0,
                  ReactionCounts: (reply as any).ReactionCounts || {},
                  CurrentUserReaction: (reply as any).CurrentUserReaction || null,
                  Replies: [], // Replies không có nested replies trong mock data đơn giản
                }))
              
              return {
                Id: comment.CommentId,
                CommentId: comment.CommentId,
                PostId: comment.PostId,
                AuthorId: comment.UserId,
                Author: {
                  Id: comment.User?.Id || comment.UserId,
                  Name: comment.User?.Name || 'Unknown',
                  Avatar: comment.User?.Avatar || null,
                },
                Content: comment.Content,
                Image: (comment as any).Image || null,
                ParentCommentId: (comment as any).ParentCommentId || null,
                CreatedAt: comment.CreatedAt,
                ReactionsCount: (comment as any).ReactionsCount || 0,
                ReactionCounts: (comment as any).ReactionCounts || {},
                CurrentUserReaction: (comment as any).CurrentUserReaction || null,
                Replies: replies,
              }
            })
            
            console.log(`[MOCK API] GET /Comment/post/${postId} - Trả về ${transformedComments.length} comments`)
            responseData = transformedComments
          } else {
            status = 400
            responseData = { message: 'Invalid post ID' }
          }
        }
      }

      // News endpoints - Xử lý cả normalizedPath và path gốc
      else if (normalizedPath === 'News' || normalizedPath === 'News/' || 
               path === '/News' || path === '/News/' ||
               (url.includes('/News') && !url.includes('/News/'))) {
        if (method === 'get') {
          console.log(`🎭 [MOCK API] GET /News - Trả về ${mockNews.length} news`)
          console.log(`🎭 [MOCK API] News:`, mockNews.map(n => ({ Id: n.Id, Title: n.Title || n.title })))
          responseData = mockNews
        } else if (method === 'post') {
          const newNews = {
            Id: mockNews.length + 1,
            ...data,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            Author: 'Admin',
          }
          mockNews.push(newNews)
          responseData = newNews
        }
      } else if (path.startsWith('/News/') || normalizedPath.startsWith('News/')) {
        const parts = normalizedPath.split('/')
        const newsId = parseInt(parts[parts.length - 1] || path.split('/')[2] || '0')
        if (method === 'get') {
          const news = mockNews.find((n) => n.Id === newsId)
          if (news) {
            responseData = news
          } else {
            status = 404
            responseData = { message: 'News not found' }
          }
        } else if (method === 'delete') {
          const index = mockNews.findIndex((n) => n.Id === newsId)
          if (index !== -1) {
            mockNews.splice(index, 1)
            responseData = { success: true }
          } else {
            status = 404
            responseData = { message: 'News not found' }
          }
        }
      }

      // Coupon endpoints
      else if (path.includes('/Coupon/')) {
        if (path.includes('/validate')) {
          if (method === 'post') {
            const coupon = mockCoupons.find(
              (c) => c.Code === data.Code && c.IsActive && new Date(c.ExpiryDate) > new Date()
            )
            if (coupon) {
              responseData = { valid: true, coupon }
            } else {
              status = 400
              responseData = { valid: false, message: 'Coupon không hợp lệ hoặc đã hết hạn' }
            }
          }
        } else if (path.includes('/calculate-discount')) {
          if (method === 'post') {
            const coupon = mockCoupons.find((c) => c.Code === data.Code && c.IsActive)
            if (coupon) {
              let discount = 0
              if (coupon.DiscountPercent) {
                discount = (data.OriginalAmount * coupon.DiscountPercent) / 100
                if (coupon.MaxDiscountAmount) {
                  discount = Math.min(discount, coupon.MaxDiscountAmount)
                }
              } else if (coupon.DiscountAmount) {
                discount = coupon.DiscountAmount
              }
              responseData = { DiscountAmount: discount, FinalAmount: data.OriginalAmount - discount }
            } else {
              status = 400
              responseData = { message: 'Coupon không hợp lệ' }
            }
          }
        } else if (path.includes('/apply')) {
          responseData = { success: true, message: 'Coupon đã được áp dụng' }
        } else if (path.includes('/remove')) {
          responseData = { success: true, message: 'Coupon đã được gỡ bỏ' }
        } else if (path.includes('/combo/')) {
          const serviceComboId = parseInt(path.split('/combo/')[1])
          responseData = mockCoupons.filter(
            (c) => (c.ServiceComboId === null || c.ServiceComboId === serviceComboId) && c.IsActive
          )
        } else if (path.includes('/code/')) {
          const code = path.split('/code/')[1]
          const coupon = mockCoupons.find((c) => c.Code === code)
          if (coupon) {
            responseData = coupon
          } else {
            status = 404
            responseData = { message: 'Coupon not found' }
          }
        } else if (path.includes('/active')) {
          responseData = mockCoupons.filter((c) => c.IsActive && new Date(c.ExpiryDate) > new Date())
        }
      }

      // ServiceComboDetail endpoints
      else if (path.includes('/ServiceComboDetail/combo/')) {
        const comboId = parseInt(path.split('/combo/')[1])
        // Trả về empty array vì không có mock data cho ServiceComboDetail
        responseData = []
      }
      // Service endpoints với ID hoặc action (approve, reject, review) - đã xử lý GET /service ở trên
      else if (normalizedPath.startsWith('service/') || path.startsWith('/service/') ||
               path.startsWith('/api/service/') || normalizedPath.startsWith('api/service/')) {
        const parts = normalizedPath.split('/')
        const serviceId = parseInt(parts[parts.length - 1] || path.split('/')[2] || '0')
        
        if (!isNaN(serviceId)) {
          if (method === 'get') {
            const service = mockServices.find((s) => s.Id === serviceId)
            if (service) {
              console.log(`[MOCK API] GET /service/${serviceId} - Tìm thấy:`, service.Name)
              responseData = service
              status = 200
            } else {
              status = 404
              responseData = { message: 'Service not found' }
            }
          } else if (method === 'put') {
            // Update service
            const index = mockServices.findIndex((s) => s.Id === serviceId)
            if (index !== -1) {
              mockServices[index] = { 
                ...mockServices[index], 
                ...data, 
                UpdatedAt: new Date().toISOString() 
              }
              responseData = { 
                message: 'Service updated successfully.', 
                service: mockServices[index] 
              }
              status = 200
            } else {
              status = 404
              responseData = { message: 'Service not found' }
            }
          } else if (method === 'delete') {
            const index = mockServices.findIndex((s) => s.Id === serviceId)
            if (index !== -1) {
              mockServices.splice(index, 1)
              responseData = 'Deleted successfully.'
              status = 200
            } else {
              status = 404
              responseData = { message: 'Service not found' }
            }
          }
        } else {
          // Xử lý các endpoint đặc biệt: approve, reject, review
          if (path.includes('/approve/')) {
            const id = parseInt(path.split('/approve/')[1])
            const service = mockServices.find((s) => s.Id === id)
            if (service) {
              service.Status = 'Approved'
              service.UpdatedAt = new Date().toISOString()
              responseData = 'Service has been approved successfully.'
              status = 200
            } else {
              status = 404
              responseData = { message: 'Service not found' }
            }
          } else if (path.includes('/reject/')) {
            const id = parseInt(path.split('/reject/')[1])
            const service = mockServices.find((s) => s.Id === id)
            if (service && data && data.Comment) {
              service.Status = 'Rejected'
              service.RejectComment = data.Comment
              service.UpdatedAt = new Date().toISOString()
              responseData = 'Service has been rejected.'
              status = 200
            } else {
              status = 400
              responseData = { message: 'Reject reason (Comment) is required.' }
            }
          } else if (path.includes('/review/')) {
            const id = parseInt(path.split('/review/')[1])
            const service = mockServices.find((s) => s.Id === id)
            if (service && data && data.Comment) {
              service.Status = 'Review'
              service.ReviewComments = data.Comment
              service.UpdatedAt = new Date().toISOString()
              responseData = 'Additional information request has been sent to Host.'
              status = 200
            } else {
              status = 400
              responseData = { message: 'Review comment is required.' }
            }
          } else {
            status = 400
            responseData = { message: 'Invalid service ID' }
          }
        }
      }

      // Payment endpoints
      else if (path.includes('/Payment/')) {
        if (path.includes('/status/')) {
          const bookingId = parseInt(path.split('/status/')[1])
          responseData = { Status: 'pending', BookingId: bookingId }
        } else if (path.includes('/create-intent')) {
          responseData = {
            ClientSecret: 'mock_client_secret_' + Date.now(),
            PaymentIntentId: 'pi_mock_' + Date.now(),
          }
        }
      }

      // Notification endpoints
      else if (path === '/notification/GetAll' || path === '/notification/GetAll/' || 
               normalizedPath === 'notification/GetAll' || normalizedPath === 'notification/GetAll/') {
        if (method === 'get') {
          const currentUserId = getCurrentUserId()
          // Lấy tất cả notifications của user hiện tại (cả đã đọc và chưa đọc)
          // Sắp xếp: chưa đọc trước, sau đó đến đã đọc
          const allNotifications = currentUserId 
            ? getNotificationsByUserId(currentUserId).sort((a, b) => {
                // Chưa đọc trước, sau đó sắp xếp theo thời gian mới nhất
                if (a.IsRead !== b.IsRead) {
                  return a.IsRead ? 1 : -1
                }
                return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
              })
            : []
          
          // Transform sang format NotificationDto
          responseData = allNotifications.map((notif: MockNotification) => ({
            Id: notif.Id,
            id: notif.Id,
            UserId: notif.UserId,
            userId: notif.UserId,
            Message: notif.Message,
            message: notif.Message,
            IsRead: notif.IsRead,
            isRead: notif.IsRead,
            CreatedAt: notif.CreatedAt,
            createdAt: notif.CreatedAt,
            Title: notif.Title,
            title: notif.Title,
          }))
          
          const unreadCount = allNotifications.filter(n => !n.IsRead).length
          console.log(`🎭 [MOCK API] GET /notification/GetAll - Trả về ${responseData.length} notifications (${unreadCount} chưa đọc) cho user ${currentUserId}`)
        }
      } else if (path.startsWith('/notification/Read/') || normalizedPath.startsWith('notification/Read/')) {
        if (method === 'put') {
          const notificationId = path.split('/Read/')[1] || normalizedPath.split('Read/')[1]
          // Trong mock, chỉ cần trả về success
          // Thực tế sẽ update IsRead = true trong database
          responseData = { success: true, message: 'Notification marked as read' }
          console.log(`🎭 [MOCK API] PUT /notification/Read/${notificationId} - Đánh dấu đã đọc`)
        }
      } else if (path.startsWith('/notification/Delete/') || normalizedPath.startsWith('notification/Delete/')) {
        if (method === 'put') {
          const notificationId = path.split('/Delete/')[1] || normalizedPath.split('Delete/')[1]
          // Trong mock, chỉ cần trả về success
          // Thực tế sẽ xóa notification trong database
          responseData = { success: true, message: 'Notification deleted' }
          console.log(`🎭 [MOCK API] PUT /notification/Delete/${notificationId} - Xóa thông báo`)
        }
      }

      // Default: 404 - chỉ set nếu chưa có responseData
      else {
        // Chỉ set 404 nếu chưa có responseData (chưa match endpoint nào)
        if (responseData === null) {
          status = 404
          responseData = { message: 'Endpoint not found in mock service' }
          console.log(`❌ [MOCK API] Không tìm thấy endpoint: ${path} (method: ${method})`)
        }
      }
    } catch (error: any) {
      status = 500
      responseData = { message: error.message || 'Internal server error' }
    }

    const response: AxiosResponse = {
      data: responseData,
      status,
      statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
      headers: {},
      config: config as any,
    }

    if (status >= 400) {
      return Promise.reject({ response, message: responseData.message || 'Error' })
    }

    return Promise.resolve(response)
  }

// Mock Axios Instance
const createMockAxiosInstance = () => {
  const instance = axios.create({
    baseURL: '', // Empty baseURL vì chúng ta sẽ xử lý path trực tiếp
  })

  // Override request method và tất cả HTTP methods
  instance.request = handleMockRequest as any
  
  // Override get, post, put, delete methods
  instance.get = function(url: string, config?: AxiosRequestConfig) {
    return handleMockRequest({ ...config, method: 'get', url }) as any
  }
  
  instance.post = function(url: string, data?: any, config?: AxiosRequestConfig) {
    return handleMockRequest({ ...config, method: 'post', url, data }) as any
  }
  
  instance.put = function(url: string, data?: any, config?: AxiosRequestConfig) {
    return handleMockRequest({ ...config, method: 'put', url, data }) as any
  }
  
  instance.delete = function(url: string, config?: AxiosRequestConfig) {
    return handleMockRequest({ ...config, method: 'delete', url }) as any
  }

  return instance
}

export const mockAxiosInstance = createMockAxiosInstance()

