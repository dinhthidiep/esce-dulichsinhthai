import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ConditionalHeader from '~/components/user/ConditionalHeader'
import Footer from '~/components/user/Footer'
import LoadingSpinner from '~/components/user/LoadingSpinner'
import LazyImage from '~/components/user/LazyImage'
import {
  HeartIcon,
  CommentIcon,
  BookmarkIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  XIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  UploadIcon,
} from '~/components/user/icons'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import { getImageUrl } from '~/lib/utils'
import './ForumPage.css'

interface UserInfo {
  Id?: number
  id?: number
  Email?: string
  email?: string
  Name?: string
  name?: string
  Avatar?: string
  avatar?: string
  RoleId?: number
  roleId?: number
  [key: string]: unknown
}

interface PostImage {
  url: string
}

interface PostLike {
  PostLikeId: string
  AccountId: string
  FullName: string
  Avatar?: string // Avatar của người reaction
  CreatedDate: string
  ReactionType?: string // Like, Love, Haha, Wow, Sad, Angry
}

interface PostComment {
  PostCommentId: string
  FullName: string
  Avatar?: string
  Content: string
  Images?: string[]
  CreatedDate?: string
  Likes: any[]
  Replies: any[]
  AuthorId?: number
  ReactionsCount?: number
  UserReactionId?: number
  ParentCommentId?: number | null
}

interface Post {
  PostId?: string
  Id?: number
  PostContent?: string
  Content?: string
  Images?: string[]
  Image?: string
  PosterId?: string
  AuthorId?: number
  PosterRole?: string
  PosterName?: string
  PosterAvatar?: string
  Author?: {
    Name?: string
    Avatar?: string
    Role?: {
      Name?: string
    }
  }
  Status: string
  PublicDate?: string
  CreatedAt?: string
  ArticleTitle?: string
  Title?: string
  Likes?: PostLike[]
  Postreactions?: Array<{
    Id: number
    UserId: number
    User?: {
      Name?: string
    }
    CreatedAt?: string
  }>
  Comments?: PostComment[]
  Comment?: Array<{
    Id: number
    Author?: {
      Name?: string
    }
    Content: string
    Image?: string
    CreatedAt?: string
  }>
  Hashtags?: string[]
  isLiked?: boolean
  isSaved?: boolean
  userReactionId?: number
  Postsaves?: Array<{
    AccountId: number
  }>
}

const ForumPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'featured' | 'forum-saved'>('featured')
  const [posts, setPosts] = useState<Post[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [userReactions, setUserReactions] = useState<Record<string, number>>({}) // postId -> reactionTypeId
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [createPostData, setCreatePostData] = useState({
    ArticleTitle: '',
    PostContent: '',
    Images: [] as string[],
  })
  const [submittingPost, setSubmittingPost] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({})
  const [reactionPickerTimeout, setReactionPickerTimeout] = useState<Record<string, NodeJS.Timeout>>({})
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showPostMenu, setShowPostMenu] = useState<Record<string, boolean>>({})
  const [deletingPost, setDeletingPost] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentInputs, setEditCommentInputs] = useState<Record<string, string>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({}) // key: postId-commentId
  const [showPendingModal, setShowPendingModal] = useState(false) // Modal thông báo bài viết đang chờ duyệt
  const [submittingReply, setSubmittingReply] = useState<string | null>(null)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)
  const [showReplyInputs, setShowReplyInputs] = useState<Set<string>>(new Set()) // key: postId-commentId
  const [showCommentMenu, setShowCommentMenu] = useState<Record<string, boolean>>({}) // key: postId-commentId
  const [showLikersModal, setShowLikersModal] = useState<Post | null>(null) // Modal danh sách người thích bài viết
  const [showCommentLikersModal, setShowCommentLikersModal] = useState<PostComment | null>(null) // Modal danh sách người thích comment
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState<{postId: string, commentId: string} | null>(null) // Modal xác nhận xóa comment
  const [deletePostConfirm, setDeletePostConfirm] = useState<string | null>(null) // Modal xác nhận xóa bài viết (postId)

  // Cache key cho posts
  const POSTS_CACHE_KEY = 'forum_posts_cache'
  const POSTS_CACHE_TIME_KEY = 'forum_posts_cache_time'
  const CACHE_DURATION = 5 * 60 * 1000 // 5 phút

  // Load cached posts ngay lập tức
  const loadCachedPosts = () => {
    try {
      const cached = localStorage.getItem(POSTS_CACHE_KEY)
      const cacheTime = localStorage.getItem(POSTS_CACHE_TIME_KEY)
      if (cached && cacheTime) {
        const posts = JSON.parse(cached) as Post[]
        const time = parseInt(cacheTime, 10)
        // Chỉ dùng cache nếu còn hạn
        if (Date.now() - time < CACHE_DURATION && posts.length > 0) {
          return posts
        }
      }
    } catch (e) {
      console.error('Error loading cached posts:', e)
    }
    return null
  }

  // Save posts to cache
  const saveCachedPosts = (posts: Post[]) => {
    try {
      localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts))
      localStorage.setItem(POSTS_CACHE_TIME_KEY, String(Date.now()))
    } catch (e) {
      console.error('Error saving cached posts:', e)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    checkUserInfo()
    
    // Load cached posts ngay lập tức để hiển thị nhanh
    const cachedPosts = loadCachedPosts()
    if (cachedPosts && cachedPosts.length > 0) {
      setPosts(cachedPosts)
      setLoading(false)
      // Fetch fresh data ở background
      fetchPosts(false, true)
    } else {
      fetchPosts()
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'forum-saved' && userInfo) {
      // Khi chuyển sang tab forum-saved, fetch từ localStorage (không preserve state)
      // Vì đây là lần đầu load tab, cần lấy từ nguồn dữ liệu chính xác
      fetchSavedPosts(false)
    }
  }, [activeTab, userInfo])

  const checkUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr) as UserInfo
        setUserInfo(user)
      } catch (err) {
        console.error('Error parsing userInfo:', err)
      }
    }
  }

  // Reaction types: 1=Like, 2=Love, 3=Haha, 4=Wow, 5=Sad, 6=Angry
  const REACTION_TYPES = [
    { id: 1, name: 'Like', emoji: '👍' },
    { id: 2, name: 'Love', emoji: '❤️' },
    { id: 3, name: 'Haha', emoji: '😂' },
    { id: 4, name: 'Wow', emoji: '😮' },
    { id: 5, name: 'Sad', emoji: '😢' },
    { id: 6, name: 'Angry', emoji: '😠' },
  ]

  // Map reaction type name to ID (case-insensitive)
  const getReactionTypeId = (reactionTypeName: string): number => {
    const normalizedName = reactionTypeName?.toLowerCase() || 'like'
    const reaction = REACTION_TYPES.find(r => r.name.toLowerCase() === normalizedName)
    return reaction ? reaction.id : 1 // Default to Like
  }

  // Map reaction type ID to name
  const getReactionTypeName = (reactionTypeId: number): string => {
    const reaction = REACTION_TYPES.find(r => r.id === reactionTypeId)
    return reaction ? reaction.name : 'Like'
  }

  // Helper function để build comment tree từ flat list
  const buildCommentTree = (flatComments: PostComment[]): PostComment[] => {
    // Tạo map để truy cập nhanh
    const commentMap = new Map<string, PostComment>()
    const topLevelComments: PostComment[] = []

    // Bước 1: Tạo map và khởi tạo replies array cho mỗi comment
    flatComments.forEach((comment) => {
      commentMap.set(comment.PostCommentId, {
        ...comment,
        Replies: []
      })
    })

    // Bước 2: Phân loại comments thành top-level và replies
    flatComments.forEach((comment) => {
      const commentId = comment.PostCommentId
      const parentId = comment.ParentCommentId

      if (parentId) {
        // Đây là reply - thêm vào replies của parent
        const parentComment = commentMap.get(String(parentId))
        const replyComment = commentMap.get(commentId)
        
        if (parentComment && replyComment) {
          // Kiểm tra tránh duplicate
          if (!parentComment.Replies.some(r => r.PostCommentId === replyComment.PostCommentId)) {
            parentComment.Replies.push(replyComment)
          }
        }
      } else {
        // Đây là top-level comment
        const topComment = commentMap.get(commentId)
        if (topComment && !topLevelComments.some(c => c.PostCommentId === topComment.PostCommentId)) {
          topLevelComments.push(topComment)
        }
      }
    })

    return topLevelComments
  }

  const normalizePost = (post: Post): Post => {
    // PostResponseDto từ GetAllPost đã có format sẵn, chỉ cần normalize một số field
    const postId = post.PostId || String(post.Id || '')
    const content = post.PostContent || post.Content || ''
    
    // Xử lý ảnh: filter và trim các giá trị rỗng, sử dụng getImageUrl để xử lý URL
    let images: string[] = []
    const fallbackImage = '/img/banahills.forum-jpg'
    
    if (post.Images && Array.isArray(post.Images) && post.Images.length > 0) {
      images = post.Images
        .map(img => getImageUrl(img, fallbackImage))
        .filter((img): img is string => {
          // Chỉ giữ lại ảnh hợp lệ và không phải fallback
          return img !== null && 
                 img !== undefined && 
                 img.trim().length > 0 && 
                 img !== fallbackImage
        })
    } else if (post.Image && typeof post.Image === 'string' && post.Image.trim().length > 0) {
      images = post.Image.split(',')
        .map(img => getImageUrl(img.trim(), fallbackImage))
        .filter((img): img is string => {
          // Chỉ giữ lại ảnh hợp lệ và không phải fallback
          return img !== null && 
                 img !== undefined && 
                 img.trim().length > 0 && 
                 img !== fallbackImage
        })
    }
    
    const posterName = post.PosterName || post.Author?.Name || 'Người dùng'
    const posterId = post.PosterId || String(post.AuthorId || '')
    const title = post.ArticleTitle || post.Title || ''
    const publicDate = post.PublicDate || post.CreatedAt || ''
    
    // PostResponseDto đã có Likes và Comments format sẵn, chỉ cần convert nếu là Post model
    let likes: PostLike[] = []
    if (post.Likes && Array.isArray(post.Likes) && post.Likes.length > 0) {
      // Đã là PostLikeResponseDto format từ GetAllPost
      // Backend có thể trả về PascalCase hoặc camelCase tùy config
      likes = post.Likes.map((like: any) => ({
        PostLikeId: like.PostLikeId || like.postLikeId || String(like.Id || like.id || ''),
        AccountId: String(like.AccountId || like.accountId || like.UserId || like.userId || ''),
        FullName: like.FullName || like.fullName || 'Người dùng',
        Avatar: like.Avatar || like.avatar || '',
        CreatedDate: like.CreatedDate || like.createdDate
          ? (typeof (like.CreatedDate || like.createdDate) === 'string' 
              ? (like.CreatedDate || like.createdDate)
              : (like.CreatedDate || like.createdDate) instanceof Date
                ? (like.CreatedDate || like.createdDate).toISOString()
                : new Date(like.CreatedDate || like.createdDate).toISOString())
          : '',
        ReactionType: like.ReactionTypeName || like.reactionTypeName || like.ReactionType || like.reactionType || 'Like',
      }))
    } else if (post.Postreactions && Array.isArray(post.Postreactions)) {
      // Convert từ Post model (nếu dùng /approved endpoint)
      post.Postreactions.forEach((reaction) => {
        likes.push({
          PostLikeId: String(reaction.Id),
          AccountId: String(reaction.UserId),
          FullName: reaction.User?.Name || 'Người dùng',
          CreatedDate: reaction.CreatedAt || '',
        })
      })
    }
    
      // Convert Comments format
      let comments: PostComment[] = []
      if (post.Comments && Array.isArray(post.Comments) && post.Comments.length > 0) {
        // Đã là PostCommentResponseDto format từ GetAllPost
        // Lấy userInfo trực tiếp từ localStorage để đảm bảo có data (state có thể chưa update)
        const localUserInfo = (() => {
          try {
            const str = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
            return str ? JSON.parse(str) : null
          } catch { return null }
        })()
        const currentUserId = userInfo?.Id || userInfo?.id || localUserInfo?.Id || localUserInfo?.id
        const currentUserAvatar = userInfo?.Avatar || userInfo?.avatar || localUserInfo?.Avatar || localUserInfo?.avatar || ''
        
        const flatComments = post.Comments.map((comment: any) => {
          const userReaction = comment.Likes?.find((like: any) => 
            String(like.AccountId || like.UserId) === String(currentUserId)
          )
          
          // Lấy avatar từ server, nếu rỗng và là comment của user hiện tại thì dùng avatar từ localStorage
          const commentAuthorId = comment.AuthorId || comment.Author?.Id
          let commentAvatar = comment.Avatar || comment.avatar || ''
          if (!commentAvatar && String(commentAuthorId) === String(currentUserId)) {
            // Comment của user hiện tại nhưng server trả về avatar rỗng -> dùng avatar từ localStorage
            commentAvatar = currentUserAvatar
          }
          
          return {
            PostCommentId: comment.PostCommentId || String(comment.Id || ''),
            FullName: comment.FullName || 'Người dùng',
            Avatar: commentAvatar,
            Content: comment.Content || '',
            Images: comment.Images && Array.isArray(comment.Images) && comment.Images.length > 0
              ? comment.Images.map((img: string) => getImageUrl(img, '/img/banahills.forum-jpg')).filter((img): img is string => img !== null)
              : undefined,
            CreatedDate: comment.CreatedDate 
              ? (typeof comment.CreatedDate === 'string' 
                  ? comment.CreatedDate 
                  : comment.CreatedDate instanceof Date
                    ? comment.CreatedDate.toISOString()
                    : comment.CreatedDate ? new Date(comment.CreatedDate).toISOString() : undefined)
              : undefined,
            Likes: comment.Likes || [],
            Replies: [], // Sẽ được build từ tree
            AuthorId: comment.AuthorId || comment.Author?.Id,
            ReactionsCount: comment.ReactionsCount || 0,
            UserReactionId: userReaction ? (userReaction.Id || userReaction.CommentReactionId) : undefined,
            ParentCommentId: comment.ParentCommentId || null,
          }
        })

        // Kiểm tra xem API đã trả về nested hay chưa
        // Nếu có comment nào có Replies array không rỗng, nghĩa là API đã nested
        const hasNestedReplies = flatComments.some(c => 
          c.Replies && Array.isArray(c.Replies) && c.Replies.length > 0
        )
        
        if (hasNestedReplies) {
          // API đã trả về nested, giữ nguyên nhưng đảm bảo format đúng
          comments = flatComments
            .filter(c => !c.ParentCommentId) // Chỉ lấy top-level comments
            .map(c => ({
              ...c,
              Replies: c.Replies || []
            }))
        } else {
          // API trả về flat list, cần build tree
          comments = buildCommentTree(flatComments)
        }
      } else if (post.Comment && Array.isArray(post.Comment)) {
        // Convert từ Post model (nếu dùng /approved endpoint)
        // Lấy userInfo trực tiếp từ localStorage
        const localUserInfo2 = (() => {
          try {
            const str = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
            return str ? JSON.parse(str) : null
          } catch { return null }
        })()
        const currentUserId2 = userInfo?.Id || userInfo?.id || localUserInfo2?.Id || localUserInfo2?.id
        const currentUserAvatar2 = userInfo?.Avatar || userInfo?.avatar || localUserInfo2?.Avatar || localUserInfo2?.avatar || ''
        
        post.Comment.forEach((comment) => {
          // Lấy avatar, nếu rỗng và là comment của user hiện tại thì dùng avatar từ localStorage
          const author = comment.Author as any
          const commentAuthorId = author?.Id
          let commentAvatar = author?.Avatar || ''
          if (!commentAvatar && String(commentAuthorId) === String(currentUserId2)) {
            commentAvatar = currentUserAvatar2
          }
          
          comments.push({
            PostCommentId: String(comment.Id),
            FullName: comment.Author?.Name || 'Người dùng',
            Avatar: commentAvatar,
            Content: comment.Content,
            Images: comment.Image ? [getImageUrl(comment.Image, '/img/banahills.forum-jpg')].filter((img): img is string => img !== null) : undefined,
            CreatedDate: comment.CreatedAt,
            Likes: [],
            Replies: [],
          })
        })
      }
    
    return {
      ...post,
      PostId: postId,
      PostContent: content,
      Images: images,
      PosterName: posterName,
      PosterId: posterId,
      ArticleTitle: title,
      PublicDate: publicDate,
      Likes: likes,
      Comments: comments,
    }
  }

  const fetchPosts = async (preserveSavedState = false, isBackgroundFetch = false) => {
    try {
      // Chỉ show loading nếu không phải background fetch
      if (!isBackgroundFetch) {
        setLoading(true)
      }
      setError(null)
      // Dùng GetAllPost và filter theo Status = "Approved" để lấy PostResponseDto đã format sẵn
      const response = await axiosInstance.get<Post[]>(`${API_ENDPOINTS.POST}/GetAllPost`)
      
      // Filter chỉ lấy posts đã approved
      const approvedPosts = (response.data || []).filter(post => post.Status === 'Approved')
      
      // Normalize posts và kiểm tra user đã like/save chưa
      const savedPostIds = getSavedPostIds()
      const newUserReactions: Record<string, number> = {}
      
      // Nếu preserveSavedState = true, giữ lại isSaved từ state hiện tại
      const currentPostsMap = preserveSavedState 
        ? new Map(posts.map(p => [p.PostId || '', p.isSaved]))
        : new Map<string, boolean>()
      
      const postsWithUserStatus = approvedPosts.map((post) => {
        const normalized = normalizePost(post)
        const postId = normalized.PostId || ''
        
        if (userInfo) {
          const userId = userInfo.Id || userInfo.id
          // Tìm reaction của user hiện tại - so sánh cả string và number
          const userReaction = normalized.Likes?.find(
            (like) => {
              const likeAccountId = String(like.AccountId || '').trim()
              const currentUserId = String(userId || '').trim()
              return likeAccountId === currentUserId && likeAccountId !== ''
            }
          )
          
          // Nếu preserveSavedState và có state hiện tại, giữ lại state đó
          // Nếu không, lấy từ localStorage
          const isSaved = preserveSavedState && currentPostsMap.has(postId)
            ? currentPostsMap.get(postId)!
            : savedPostIds.includes(postId)
          
          const userReactionId = userReaction ? parseInt(userReaction.PostLikeId) : undefined
          
          // Lấy reaction type từ backend (ReactionType field)
          if (userReaction && userReaction.ReactionType) {
            const reactionTypeId = getReactionTypeId(userReaction.ReactionType)
            newUserReactions[postId] = reactionTypeId
          } else if (userReaction) {
            // Có reaction nhưng không có ReactionType -> mặc định là Like (1)
            newUserReactions[postId] = 1
          } else if (userReactionId) {
            // Fallback: giữ lại từ state hoặc mặc định là Like (1)
            newUserReactions[postId] = userReactions[postId] || 1
          }
          
          return {
            ...normalized,
            isLiked: !!userReaction, // Giữ lại để tương thích
            isSaved: isSaved,
            userReactionId: userReactionId,
          }
        }
        const isSaved = preserveSavedState && currentPostsMap.has(postId)
          ? currentPostsMap.get(postId)!
          : savedPostIds.includes(postId)
        return { ...normalized, isSaved }
      })
      
      setUserReactions((prev) => ({ ...prev, ...newUserReactions }))
      setPosts(postsWithUserStatus)
      
      // Save to cache
      saveCachedPosts(postsWithUserStatus)
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      // Chỉ show error nếu không phải background fetch và không có cached data
      if (!isBackgroundFetch) {
        setError(err.response?.data?.message || 'Không thể tải bài viết. Vui lòng thử lại sau.')
        setPosts([])
      }
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false)
      }
    }
  }

  const fetchSavedPosts = async (preserveState = false) => {
    if (!userInfo) {
      setSavedPosts([])
      return
    }
    
    try {
      // Lấy tất cả posts
      const response = await axiosInstance.get<Post[]>(`${API_ENDPOINTS.POST}/GetAllPost`)
      
      // Filter chỉ lấy posts đã approved
      const approvedPosts = (response.data || []).filter(post => post.Status === 'Approved')
      
      // Nếu preserveState = true, lấy từ state hiện tại thay vì localStorage
      // Điều này tránh race condition khi unsave
      const savedPostIds = preserveState 
        ? savedPosts.map(p => p.PostId || '').filter(id => id)
        : getSavedPostIds()
      
      // Normalize và filter những bài đã save
      const savedApprovedPosts = approvedPosts
        .map((post) => normalizePost(post))
        .filter((post) => savedPostIds.includes(post.PostId || ''))
      
      // Kiểm tra user đã like chưa
      const userId = userInfo.Id || userInfo.id
      const savedWithUserStatus = savedApprovedPosts.map((post) => {
        // Tìm reaction của user hiện tại - so sánh cả string và number
        const userReaction = post.Likes?.find(
          (like) => {
            const likeAccountId = String(like.AccountId || '').trim()
            const currentUserId = String(userId || '').trim()
            return likeAccountId === currentUserId && likeAccountId !== ''
          }
        )
        
        // Lấy reaction type từ backend
        let reactionTypeId: number | undefined
        if (userReaction && userReaction.ReactionType) {
          reactionTypeId = getReactionTypeId(userReaction.ReactionType)
        } else if (userReaction) {
          reactionTypeId = 1 // Mặc định là Like
        }
        
        return {
          ...post,
          isLiked: !!userReaction,
          isSaved: true,
          userReactionId: userReaction ? parseInt(userReaction.PostLikeId) : undefined,
        }
      })
      
      // Update user reactions for forum-saved posts
      savedWithUserStatus.forEach((post) => {
        const userReaction = post.Likes?.find(
          (like) => {
            const likeAccountId = String(like.AccountId || '').trim()
            const currentUserId = String(userId || '').trim()
            return likeAccountId === currentUserId && likeAccountId !== ''
          }
        )
        if (userReaction && post.PostId) {
          const reactionTypeId = userReaction.ReactionType 
            ? getReactionTypeId(userReaction.ReactionType) 
            : 1
          setUserReactions((prev) => ({
            ...prev,
            [post.PostId]: reactionTypeId,
          }))
        }
      })
      
      setSavedPosts(savedWithUserStatus)
    } catch (err: any) {
      console.error('Error fetching forum-saved posts:', err)
      setSavedPosts([])
    }
  }

  const getSavedPostIds = (): string[] => {
    try {
      const forumSaved = localStorage.getItem('savedPostIds')
      return forumSaved ? JSON.parse(forumSaved) : []
    } catch {
      return []
    }
  }

  const savePostId = (postId: string) => {
    const forumSaved = getSavedPostIds()
    if (!forumSaved.includes(postId)) {
      forumSaved.push(postId)
      localStorage.setItem('savedPostIds', JSON.stringify(forumSaved))
    }
  }

  const removePostId = (postId: string) => {
    const forumSaved = getSavedPostIds()
    const filtered = forumSaved.filter((id) => id !== postId)
    localStorage.setItem('savedPostIds', JSON.stringify(filtered))
  }

  const handleReaction = async (postId: string, reactionTypeId: number, currentReactionId?: number) => {
    if (!userInfo) {
      // Yêu cầu đăng nhập - redirect trực tiếp không hiển thị alert
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    const userId = userInfo.Id || userInfo.id
    const userName = userInfo.Name || userInfo.name || 'Bạn'
    
    // Lưu state trước khi thay đổi để revert nếu có lỗi
    const previousPosts = posts
    const previousSavedPosts = savedPosts
    const previousUserReactions = { ...userReactions }

    try {
      // Kiểm tra xem user đã có reaction chưa và đang chọn cùng reaction type hay khác
      const currentUserReactionType = userReactions[postId]
      const hasExistingReaction = currentUserReactionType !== undefined
      const isSameReactionType = hasExistingReaction && currentUserReactionType === reactionTypeId
      
      // Nếu đã có reaction VÀ chọn cùng loại → unlike (bỏ thích)
      if (hasExistingReaction && isSameReactionType) {
        // Tìm reactionId từ post data nếu không có currentReactionId
        let reactionIdToDelete = currentReactionId
        
        if (!reactionIdToDelete || String(reactionIdToDelete).length > 10) {
          // Không có reactionId hoặc là temporary ID -> tìm từ post data hoặc fetch
          const postData = posts.find(p => p.PostId === postId)
          const userLike = postData?.Likes?.find(like => String(like.AccountId) === String(userId))
          
          if (userLike && userLike.PostLikeId && String(userLike.PostLikeId).length <= 10) {
            reactionIdToDelete = parseInt(userLike.PostLikeId)
          } else {
            // Cần fetch để lấy reactionId thực sự
            try {
              const response = await axiosInstance.get<Post[]>(`${API_ENDPOINTS.POST}/GetAllPost`)
              const approvedPosts = (response.data || []).filter(post => post.Status === 'Approved')
              const fetchedPost = approvedPosts.find(p => String(p.PostId || p.Id) === postId)
              
              if (fetchedPost) {
                const normalized = normalizePost(fetchedPost)
                const userReaction = normalized.Likes?.find(
                  (like) => like.AccountId === String(userId)
                )
                
                if (userReaction && userReaction.PostLikeId) {
                  reactionIdToDelete = parseInt(userReaction.PostLikeId)
                }
              }
            } catch (fetchErr: any) {
              console.error('Error fetching reaction ID:', fetchErr)
            }
          }
        }
        
        if (reactionIdToDelete && String(reactionIdToDelete).length <= 10) {
          await axiosInstance.delete(`${API_ENDPOINTS.POST_REACTION}/unlike/${reactionIdToDelete}`)
        } else {
          // Fallback: gọi API với postId để backend tự tìm và xóa
          // Nếu backend không hỗ trợ, sẽ throw error
          throw new Error('Không tìm thấy reaction ID để xóa')
        }
        
        // Optimistic update - cập nhật state ngay lập tức
        setUserReactions((prev) => {
          const newReactions = { ...prev }
          delete newReactions[postId]
          return newReactions
        })
        
        // Filter bỏ like của user hiện tại (dùng AccountId thay vì PostLikeId vì PostLikeId có thể là temporary)
        const currentUserId = String(userId)
        
        setPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              const newLikes = post.Likes?.filter((like) => String(like.AccountId) !== currentUserId) || []
              return {
                ...post,
                isLiked: false,
                userReactionId: undefined,
                Likes: newLikes,
              }
            }
            return post
          })
        )
        
        setSavedPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              const newLikes = post.Likes?.filter((like) => String(like.AccountId) !== currentUserId) || []
              return {
                ...post,
                isLiked: false,
                userReactionId: undefined,
                Likes: newLikes,
              }
            }
            return post
          })
        )
        
        // Không refresh, chỉ dùng optimistic update
      } else {
        // Thêm hoặc thay đổi reaction
        // Backend đã xử lý việc đổi reaction: nếu đã có reaction khác, backend sẽ tự update
        // Không cần unlike trước, chỉ cần gọi ReactToPost với reactionTypeId mới
        
        // Gọi endpoint với reactionTypeId cụ thể
        // Backend sẽ tự động:
        // - Nếu chưa có reaction -> tạo mới
        // - Nếu đã có reaction khác -> update reaction type
        // - Nếu cùng reaction type -> unlike (nhưng case này đã xử lý ở trên)
        await axiosInstance.post(`${API_ENDPOINTS.POST_REACTION}/${postId}/${reactionTypeId}`)
        
        // Optimistic update - cập nhật state ngay lập tức
        setUserReactions((prev) => ({
          ...prev,
          [postId]: reactionTypeId,
        }))
        
        const reactionType = REACTION_TYPES.find(r => r.id === reactionTypeId)
        const reactionTypeName = reactionType?.name || 'Like'
        const userAvatar = userInfo?.Avatar || userInfo?.avatar || ''
        
        // Cập nhật posts
        setPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              const existingLike = post.Likes?.find((like) => like.AccountId === String(userId))
              
              // Nếu đã có reaction, thay thế; nếu chưa có, thêm mới
              const newLikes = existingLike
                ? post.Likes?.map((like) => 
                    like.AccountId === String(userId)
                      ? { ...like, ReactionType: reactionTypeName, Avatar: userAvatar }
                      : like
                  ) || []
                : [
                    ...(post.Likes || []),
                    {
                      PostLikeId: String(Date.now()), // Temporary ID, sẽ được cập nhật khi cần
                      AccountId: String(userId),
                      FullName: userName,
                      Avatar: userAvatar,
                      CreatedDate: new Date().toISOString(),
                      ReactionType: reactionTypeName,
                    },
                  ]
              
              return {
                ...post,
                isLiked: true,
                userReactionId: existingLike ? parseInt(existingLike.PostLikeId) : undefined,
                Likes: newLikes,
              }
            }
            return post
          })
        )
        
        // Cập nhật savedPosts
        setSavedPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              const existingLike = post.Likes?.find((like) => like.AccountId === String(userId))
              
              const newLikes = existingLike
                ? post.Likes?.map((like) => 
                    like.AccountId === String(userId)
                      ? { ...like, ReactionType: reactionTypeName, Avatar: userAvatar }
                      : like
                  ) || []
                : [
                    ...(post.Likes || []),
                    {
                      PostLikeId: String(Date.now()),
                      AccountId: String(userId),
                      FullName: userName,
                      Avatar: userAvatar,
                      CreatedDate: new Date().toISOString(),
                      ReactionType: reactionTypeName,
                    },
                  ]
              
              return {
                ...post,
                isLiked: true,
                userReactionId: existingLike ? parseInt(existingLike.PostLikeId) : undefined,
                Likes: newLikes,
              }
            }
            return post
          })
        )
      }
      
      // Đóng reaction picker
      setShowReactionPicker((prev) => ({
        ...prev,
        [postId]: false,
      }))
    } catch (err: any) {
      console.error('Error reacting to post:', err)
      
      // Revert optimistic update on error
      setPosts(previousPosts)
      setSavedPosts(previousSavedPosts)
      setUserReactions(previousUserReactions)
      
      // Chỉ refresh khi có lỗi để đảm bảo đồng bộ
      await fetchPosts(true)
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts(true)
      }
      
      console.error('Error reacting to post:', err.response?.data?.message || err.message)
    }
  }

  const handleReactionPickerToggle = (postId: string, show: boolean) => {
    // Clear existing timeout
    if (reactionPickerTimeout[postId]) {
      clearTimeout(reactionPickerTimeout[postId])
    }

    if (show) {
      setShowReactionPicker((prev) => ({
        ...prev,
        [postId]: true,
      }))
    } else {
      // Delay hiding để user có thể di chuyển chuột
      const timeout = setTimeout(() => {
        setShowReactionPicker((prev) => {
          const newState = { ...prev }
          delete newState[postId]
          return newState
        })
      }, 200)
      setReactionPickerTimeout((prev) => ({
        ...prev,
        [postId]: timeout,
      }))
    }
  }

  const validatePostForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!createPostData.PostContent.trim()) {
      errors.PostContent = 'Vui lòng nhập nội dung bài viết'
    } else if (createPostData.PostContent.trim().length < 10) {
      errors.PostContent = 'Nội dung bài viết phải có ít nhất 10 ký tự'
    }
    
    // Validate images
    const invalidImages: string[] = []
    createPostData.Images.forEach((img, idx) => {
      if (img.trim() && !img.trim().match(/\.(forum-jpg|jpeg|png|gif|webp)$/i) && !img.trim().startsWith('http')) {
        invalidImages.push(`Ảnh ${idx + 1}`)
      }
    })
    if (invalidImages.length > 0) {
      errors.Images = `URL ảnh không hợp lệ: ${invalidImages.join(', ')}`
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setCreatePostData({
      ArticleTitle: post.ArticleTitle || '',
      PostContent: post.PostContent || post.Content || '',
      Images: post.Images || [],
    })
    // For editing, images are URLs, not files
    setImageFiles([])
    setImagePreviewUrls(post.Images?.slice(0, 10) || [])
    setFormErrors({})
    setShowCreatePostModal(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!userInfo) return

    // Hiển thị modal xác nhận thay vì xóa trực tiếp
    setDeletePostConfirm(postId)
  }

  const confirmDeletePost = async () => {
    if (!deletePostConfirm) return

    const postId = deletePostConfirm

    try {
      setDeletingPost(postId)
      setDeletePostConfirm(null) // Đóng modal ngay

      await axiosInstance.delete(`${API_ENDPOINTS.POST}/DeletePost?id=${postId}`)
      
      // Remove from state
      setPosts((prev) => prev.filter((post) => post.PostId !== postId))
      setSavedPosts((prev) => prev.filter((post) => post.PostId !== postId))
      removePostId(postId)
    } catch (err: any) {
      console.error('Error deleting post:', err)
      // Revert deletion on error
      await fetchPosts()
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts()
      }
    } finally {
      setDeletingPost(null)
      setShowPostMenu((prev) => {
        const newState = { ...prev }
        delete newState[postId]
        return newState
      })
    }
  }

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInfo || !editingPost) {
      return
    }

    if (!validatePostForm()) {
      return
    }

    try {
      setSubmittingPost(true)
      setFormErrors({})
      const postData = {
        PostContent: createPostData.PostContent.trim(),
        ArticleTitle: createPostData.ArticleTitle.trim() || undefined,
        Images: createPostData.Images.filter(img => img.trim()),
        PosterName: userInfo.Name || userInfo.name || 'Người dùng',
        Hashtags: [],
      }

      await axiosInstance.put(`${API_ENDPOINTS.POST}/UpdatePost?id=${editingPost.PostId || editingPost.Id}`, postData)
      
      // Reset form
      setCreatePostData({
        ArticleTitle: '',
        PostContent: '',
        Images: [],
      })
      setImageFiles([])
      setImagePreviewUrls([])
      setFormErrors({})
      setEditingPost(null)
      setShowCreatePostModal(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh posts
      await fetchPosts()
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts()
      }
    } catch (err: any) {
      console.error('Error updating post:', err)
      setFormErrors({ submit: err.response?.data?.message || 'Không thể cập nhật bài viết. Vui lòng thử lại.' })
    } finally {
      setSubmittingPost(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInfo) {
      return
    }

    if (!validatePostForm()) {
      return
    }

    try {
      setSubmittingPost(true)
      setFormErrors({})
      const postData = {
        PostContent: createPostData.PostContent.trim(),
        ArticleTitle: createPostData.ArticleTitle.trim() || undefined,
        Images: createPostData.Images.filter(img => img.trim()),
        PosterName: userInfo.Name || userInfo.name || 'Người dùng',
        Hashtags: [],
      }

      await axiosInstance.post(`${API_ENDPOINTS.POST}/CreatePost`, postData)
      
      // Reset form
      setCreatePostData({
        ArticleTitle: '',
        PostContent: '',
        Images: [],
      })
      setImageFiles([])
      setImagePreviewUrls([])
      setFormErrors({})
      setEditingPost(null)
      setShowCreatePostModal(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Kiểm tra role - nếu không phải Admin thì hiển thị thông báo chờ duyệt
      const roleId = userInfo.RoleId || userInfo.roleId
      if (roleId !== 1) {
        // Không phải Admin - hiển thị modal thông báo chờ duyệt
        setShowPendingModal(true)
      }
      
      // Refresh posts
      await fetchPosts()
    } catch (err: any) {
      console.error('Error creating post:', err)
      setFormErrors({ submit: err.response?.data?.message || 'Không thể đăng bài viết. Vui lòng thử lại.' })
    } finally {
      setSubmittingPost(false)
    }
  }

  // Convert File to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
  }

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    const maxFiles = 10
    const maxSize = 5 * 1024 * 1024 // 5MB per file
    const allowedTypes = ['image/jpeg', 'image/forum-jpg', 'image/png', 'image/gif', 'image/webp']

    for (let i = 0; i < Math.min(files.length, maxFiles - imageFiles.length); i++) {
      const file = files[i]
      
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          Images: `File ${file.name} không phải là ảnh hợp lệ (chỉ chấp nhận JPG, PNG, GIF, WEBP)`
        }))
        continue
      }

      // Validate file size
      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          Images: `File ${file.name} quá lớn (tối đa 5MB)`
        }))
        continue
      }

      newFiles.push(file)
    }

    if (newFiles.length === 0) return

    // Add to imageFiles
    const updatedFiles = [...imageFiles, ...newFiles].slice(0, maxFiles)
    setImageFiles(updatedFiles)

    // Generate preview URLs
    const previewPromises = updatedFiles.map(file => fileToBase64(file))
    const previewUrls = await Promise.all(previewPromises)
    setImagePreviewUrls(previewUrls)

    // Convert to base64 data URLs for backend
    const base64Promises = updatedFiles.map(file => fileToBase64(file))
    const base64Urls = await Promise.all(base64Promises)
    setCreatePostData({ ...createPostData, Images: base64Urls })
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImageFiles(newFiles)

    if (newFiles.length === 0) {
      setImagePreviewUrls([])
      setCreatePostData({ ...createPostData, Images: [] })
    } else {
      // Regenerate previews
      const previewPromises = newFiles.map(file => fileToBase64(file))
      Promise.all(previewPromises).then(urls => {
        setImagePreviewUrls(urls)
        setCreatePostData({ ...createPostData, Images: urls })
      })
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleSave = async (postId: string, isCurrentlySaved: boolean) => {
    if (!userInfo || !postId) {
      return
    }

    const postIdNum = parseInt(postId)
    if (isNaN(postIdNum)) {
      console.error('Invalid postId:', postId)
      return
    }

    // Lưu state trước khi thay đổi để revert nếu có lỗi
    const previousSavedState = isCurrentlySaved
    const previousSavedPostIds = getSavedPostIds()
    
    // Optimistic update - update UI immediately
    if (isCurrentlySaved) {
      // Optimistically remove from forum-saved
      removePostId(postId)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.PostId === postId) {
            return { ...post, isSaved: false }
          }
          return post
        })
      )
      setSavedPosts((prev) => prev.filter((post) => post.PostId !== postId))
    } else {
      // Optimistically add to forum-saved
      savePostId(postId)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.PostId === postId) {
            return { ...post, isSaved: true }
          }
          return post
        })
      )
      // Nếu đang ở tab forum-saved, thêm vào savedPosts ngay lập tức
      if (activeTab === 'forum-saved') {
        // Tìm post trong posts để thêm vào savedPosts
        const postToAdd = posts.find(p => p.PostId === postId)
        if (postToAdd) {
          setSavedPosts((prev) => {
            // Kiểm tra xem đã có chưa để tránh duplicate
            if (prev.some(p => p.PostId === postId)) {
              return prev
            }
            return [...prev, { ...postToAdd, isSaved: true }]
          })
        }
      }
    }

    try {
      if (isCurrentlySaved) {
        // Unsave: xóa khỏi forum-saved
        await axiosInstance.delete(`${API_ENDPOINTS.POST_SAVE}/unsave/${postIdNum}`)
        // Không refresh gì cả, optimistic update đã xử lý rồi
        // State đã được cập nhật đúng: localStorage đã xóa, posts đã cập nhật isSaved=false, savedPosts đã filter ra
      } else {
        // Save: thêm vào forum-saved
        await axiosInstance.post(`${API_ENDPOINTS.POST_SAVE}/save/${postIdNum}`)
        // Nếu đang ở tab forum-saved và chưa có trong savedPosts, fetch lại
        if (activeTab === 'forum-saved') {
          const postExists = savedPosts.some(p => p.PostId === postId)
          if (!postExists) {
            // Fetch lại để đảm bảo có đầy đủ thông tin từ server
            await fetchSavedPosts(false)
          }
        }
      }
    } catch (err: any) {
      console.error('Error saving post:', err)
      
      // Kiểm tra error message từ backend
      const errorMessage = err.response?.data?.message || err.message || ''
      const isAlreadyUnsaved = errorMessage.includes('Bài viết chưa được lưu') || errorMessage.includes('chưa được lưu')
      const isAlreadySaved = errorMessage.includes('đã lưu bài viết này rồi') || errorMessage.includes('đã lưu')
      
      // Nếu unsave nhưng backend báo chưa được lưu, thì coi như thành công (đã unsave rồi)
      if (previousSavedState && isAlreadyUnsaved) {
        // Không cần revert, vì post đã không được lưu trong database
        // Chỉ cần đảm bảo UI đã được cập nhật đúng (đã làm ở optimistic update)
        console.log('Post was already unsaved in database, keeping UI state')
        return
      }
      
      // Nếu save nhưng backend báo đã lưu rồi, thì coi như thành công (đã save rồi)
      if (!previousSavedState && isAlreadySaved) {
        // Không cần revert, vì post đã được lưu trong database
        // Chỉ cần đảm bảo UI đã được cập nhật đúng (đã làm ở optimistic update)
        console.log('Post was already forum-saved in database, keeping UI state')
        return
      }
      
      // Revert optimistic update on forum-error (các lỗi khác)
      if (previousSavedState) {
        // Revert unsave: restore previous state
        // Restore localStorage
        localStorage.setItem('savedPostIds', JSON.stringify(previousSavedPostIds))
        // Restore posts state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              return { ...post, isSaved: true }
            }
            return post
          })
        )
        // Restore savedPosts - fetch lại từ localStorage
        if (activeTab === 'forum-saved') {
          await fetchSavedPosts(false)
        } else {
          // Nếu không ở tab forum-saved, chỉ cần thêm lại vào savedPosts nếu có
          const postToRestore = posts.find(p => p.PostId === postId)
          if (postToRestore) {
            setSavedPosts((prev) => {
              if (prev.some(p => p.PostId === postId)) {
                return prev
              }
              return [...prev, { ...postToRestore, isSaved: true }]
            })
          }
        }
      } else {
        // Revert save: remove from forum-saved
        removePostId(postId)
        setPosts((prev) =>
          prev.map((post) => {
            if (post.PostId === postId) {
              return { ...post, isSaved: false }
            }
            return post
          })
        )
        setSavedPosts((prev) => prev.filter((post) => post.PostId !== postId))
      }
    }
  }

  const handleComment = async (postId: string) => {
    if (!userInfo) {
      // Yêu cầu đăng nhập - redirect trực tiếp không hiển thị alert
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    const commentText = commentInputs[postId]?.trim()
    if (!commentText) return

    // Clear input ngay lập tức trước khi gửi request
    setCommentInputs((prev) => {
      const newInputs = { ...prev }
      delete newInputs[postId]
      return newInputs
    })

    try {
      setSubmittingComment(postId)
      await axiosInstance.post(API_ENDPOINTS.COMMENT, {
        PostId: postId, // Backend expect string
        Content: commentText,
        Images: null, // Không có ảnh trong comment input hiện tại
      })
      
      // Optimistic update
      const userName = userInfo.Name || userInfo.name || 'Bạn'
      const userId = userInfo.Id || userInfo.id
      setPosts((prev) =>
        prev.map((post) => {
          if (post.PostId === postId) {
            const newComment: PostComment = {
              PostCommentId: String(Date.now()),
              FullName: userName,
              Avatar: userInfo?.Avatar || userInfo?.avatar || '',
              Content: commentText,
              CreatedDate: new Date().toISOString(),
              Likes: [],
              Replies: [],
              AuthorId: userId,
            }
            return {
              ...post,
              Comments: [...(post.Comments || []), newComment],
            }
          }
          return post
        })
      )
      
      // Cập nhật savedPosts nếu cần
      setSavedPosts((prev) =>
        prev.map((post) => {
          if (post.PostId === postId) {
            const newComment: PostComment = {
              PostCommentId: String(Date.now()),
              FullName: userName,
              Avatar: userInfo?.Avatar || userInfo?.avatar || '',
              Content: commentText,
              CreatedDate: new Date().toISOString(),
              Likes: [],
              Replies: [],
              AuthorId: userId,
            }
            return {
              ...post,
              Comments: [...(post.Comments || []), newComment],
            }
          }
          return post
        })
      )
      
      // Fetch lại ở background để sync cache với server (fix comment biến mất sau F5)
      fetchPosts(true, true)
    } catch (err: any) {
      console.error('Error commenting:', err)
      // Chỉ refresh khi có lỗi để đảm bảo đồng bộ
      await fetchPosts(true)
    } finally {
      setSubmittingComment(null)
    }
  }

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditCommentInputs((prev) => ({
      ...prev,
      [commentId]: currentContent,
    }))
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentInputs((prev) => {
      const newInputs = { ...prev }
      delete newInputs[editingCommentId || '']
      return newInputs
    })
  }

  const handleUpdateComment = async (postId: string, commentId: string) => {
    if (!userInfo) {
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    const commentText = editCommentInputs[commentId]?.trim()
    if (!commentText) return

    try {
      await axiosInstance.put(`${API_ENDPOINTS.COMMENT}/${commentId}`, {
        Content: commentText,
        Images: null,
      })

      // Refresh posts
      await fetchPosts(true)
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts(true)
      }

      setEditingCommentId(null)
      setEditCommentInputs((prev) => {
        const newInputs = { ...prev }
        delete newInputs[commentId]
        return newInputs
      })
    } catch (err: any) {
      console.error('Error updating comment:', err)
      alert(err.response?.data?.message || 'Không thể cập nhật bình luận. Vui lòng thử lại.')
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!userInfo) {
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    // Hiển thị modal xác nhận thay vì confirm()
    setDeleteCommentConfirm({ postId, commentId })
  }

  const confirmDeleteComment = async () => {
    if (!deleteCommentConfirm) return

    const { postId, commentId } = deleteCommentConfirm

    try {
      setDeletingComment(commentId)
      setDeleteCommentConfirm(null) // Đóng modal ngay

      await axiosInstance.delete(`${API_ENDPOINTS.COMMENT}/${commentId}`)

      // Refresh posts
      await fetchPosts(true)
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts(true)
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      alert(err.response?.data?.message || 'Không thể xóa bình luận. Vui lòng thử lại.')
    } finally {
      setDeletingComment(null)
    }
  }

  const handleReplyComment = async (postId: string, parentCommentId: string) => {
    if (!userInfo) {
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    const replyKey = `${postId}-${parentCommentId}`
    const replyText = replyInputs[replyKey]?.trim()
    if (!replyText) return

    // Clear reply input ngay lập tức trước khi gửi request
    setReplyInputs((prev) => {
      const newInputs = { ...prev }
      delete newInputs[replyKey]
      return newInputs
    })

    try {
      setSubmittingReply(replyKey)
      
      // Optimistic update: thêm reply vào UI ngay lập tức
      const userId = userInfo.Id || userInfo.id
      const userName = userInfo.Name || userInfo.name || 'Bạn'
      const tempReplyId = `temp-${Date.now()}`
      
      setPosts((prev) =>
        prev.map((post) => {
          if (post.PostId === postId) {
            const addReplyToComment = (comments: PostComment[]): PostComment[] => {
              return comments.map((comment) => {
                if (comment.PostCommentId === parentCommentId) {
                  const newReply: PostComment = {
                    PostCommentId: tempReplyId,
                    FullName: userName,
                    Avatar: userInfo?.Avatar || userInfo?.avatar || '',
                    Content: replyText,
                    CreatedDate: new Date().toISOString(),
                    Likes: [],
                    Replies: [],
                    AuthorId: userId,
                    ParentCommentId: parseInt(parentCommentId),
                  }
                  return {
                    ...comment,
                    Replies: [...(comment.Replies || []), newReply],
                  }
                }
                // Recursively check replies
                if (comment.Replies && comment.Replies.length > 0) {
                  return {
                    ...comment,
                    Replies: addReplyToComment(comment.Replies),
                  }
                }
                return comment
              })
            }
            
            return {
              ...post,
              Comments: post.Comments ? addReplyToComment(post.Comments) : [],
            }
          }
          return post
        })
      )

      await axiosInstance.post(API_ENDPOINTS.COMMENT, {
        PostId: postId, // Backend expect string
        Content: replyText,
        Images: null,
        PostCommentId: parentCommentId, // Backend dùng PostCommentId để xác định parent comment (reply)
      })

      // Ẩn reply input sau khi gửi thành công
      setShowReplyInputs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(replyKey)
        return newSet
      })

      // Fetch lại ở background để sync cache với server (fix reply biến mất sau F5)
      fetchPosts(true, true)
    } catch (err: any) {
      console.error('Error replying to comment:', err)
      // Chỉ refresh khi có lỗi để đảm bảo đồng bộ
      await fetchPosts(true)
      if (activeTab === 'forum-saved') {
        await fetchSavedPosts(true)
      }
      alert(err.response?.data?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setSubmittingReply(null)
    }
  }

  const handleCommentReaction = async (postId: string, commentId: string, currentReactionId?: number) => {
    console.log('handleCommentReaction called:', { postId, commentId, currentReactionId })
    
    if (!userInfo) {
      navigate('/login', { state: { returnUrl: '/forum' } })
      return
    }

    const userId = userInfo.Id || userInfo.id
    const userName = userInfo.Name || userInfo.name || 'Bạn'
    console.log('User info:', { userId, userName })

    // Lưu state trước khi thay đổi để revert nếu có lỗi
    const previousPosts = posts
    const previousSavedPosts = savedPosts

    // Helper function để update comment likes trong posts
    const updateCommentLikes = (postsList: Post[], isLiking: boolean): Post[] => {
      return postsList.map((post) => {
        if (post.PostId !== postId) return post
        
        const updateComments = (comments: PostComment[]): PostComment[] => {
          return comments.map((comment) => {
            if (comment.PostCommentId === commentId) {
              if (isLiking) {
                // Thêm like mới
                const newLike = {
                  PostCommentLikeId: String(Date.now()),
                  AccountId: String(userId),
                  FullName: userName,
                  CreatedDate: new Date().toISOString(),
                }
                return {
                  ...comment,
                  Likes: [...(comment.Likes || []), newLike],
                  ReactionsCount: (comment.ReactionsCount || 0) + 1,
                  UserReactionId: Date.now(), // Temporary ID
                }
              } else {
                // Bỏ like
                const newLikes = (comment.Likes || []).filter(
                  (like: any) => String(like.AccountId) !== String(userId)
                )
                return {
                  ...comment,
                  Likes: newLikes,
                  ReactionsCount: Math.max(0, (comment.ReactionsCount || 0) - 1),
                  UserReactionId: undefined,
                }
              }
            }
            // Recursively update replies
            if (comment.Replies && comment.Replies.length > 0) {
              return {
                ...comment,
                Replies: updateComments(comment.Replies),
              }
            }
            return comment
          })
        }
        
        return {
          ...post,
          Comments: updateComments(post.Comments || []),
        }
      })
    }

    try {
      if (currentReactionId) {
        // Optimistic update - unlike
        setPosts((prev) => updateCommentLikes(prev, false))
        setSavedPosts((prev) => updateCommentLikes(prev, false))
        
        // Unlike - cần fetch reactionId thực nếu là temporary
        const isTemporaryId = String(currentReactionId).length > 10
        if (isTemporaryId) {
          // Fetch để lấy reactionId thực
          const response = await axiosInstance.get<Post[]>(`${API_ENDPOINTS.POST}/GetAllPost`)
          const approvedPosts = (response.data || []).filter(post => post.Status === 'Approved')
          const postData = approvedPosts.find(p => String(p.PostId || p.Id) === postId)
          if (postData) {
            const normalized = normalizePost(postData)
            // Tìm comment và reaction của user
            const findCommentReaction = (comments: PostComment[]): number | null => {
              for (const comment of comments) {
                if (comment.PostCommentId === commentId) {
                  const userReaction = comment.Likes?.find(
                    (like: any) => String(like.AccountId) === String(userId)
                  )
                  if (userReaction) {
                    return parseInt(userReaction.PostCommentLikeId || userReaction.Id)
                  }
                }
                if (comment.Replies && comment.Replies.length > 0) {
                  const found = findCommentReaction(comment.Replies)
                  if (found) return found
                }
              }
              return null
            }
            const realReactionId = findCommentReaction(normalized.Comments || [])
            if (realReactionId) {
              await axiosInstance.delete(`${API_ENDPOINTS.COMMENT_REACTION}/unlike/${realReactionId}`)
            }
          }
        } else {
          await axiosInstance.delete(`${API_ENDPOINTS.COMMENT_REACTION}/unlike/${currentReactionId}`)
        }
      } else {
        // Optimistic update - like
        setPosts((prev) => updateCommentLikes(prev, true))
        setSavedPosts((prev) => updateCommentLikes(prev, true))
        
        // Like - Backend expect PostCommentId as string
        console.log('Calling like API:', `${API_ENDPOINTS.COMMENT_REACTION}/like`, { PostCommentId: commentId })
        const response = await axiosInstance.post(`${API_ENDPOINTS.COMMENT_REACTION}/like`, {
          PostCommentId: commentId,
        })
        console.log('Like API response:', response.data)
        
        // Không refresh ngay - dùng optimistic update
        // ReactionId thực sẽ được lấy khi cần unlike
      }
    } catch (err: any) {
      console.error('Comment reaction error:', err.response?.data || err.message)
      console.error('Error reacting to comment:', err)
      // Revert optimistic update on error
      setPosts(previousPosts)
      setSavedPosts(previousSavedPosts)
      
      // Không hiển thị alert cho lỗi "đã thích rồi"
      if (!err.response?.data?.message?.includes('đã thích')) {
        console.error(err.response?.data?.message || 'Không thể thả cảm xúc. Vui lòng thử lại.')
      }
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string | undefined | null) => {
    // Kiểm tra dateString có hợp lệ không
    if (!dateString || dateString.trim() === '') {
      return 'Không rõ thời gian'
    }
    
    try {
      let date: Date
      
      // Backend trả về format "dd/MM/yyyy HH:mm", cần parse thủ công
      if (dateString.includes('/')) {
        const parts = dateString.split(' ')
        const dateParts = parts[0].split('/')
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10)
          const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
          const year = parseInt(dateParts[2], 10)
          
          if (parts.length > 1 && parts[1].includes(':')) {
            const timeParts = parts[1].split(':')
            const hours = parseInt(timeParts[0], 10)
            const minutes = parseInt(timeParts[1], 10)
            date = new Date(year, month, day, hours, minutes)
          } else {
            date = new Date(year, month, day)
          }
        } else {
          date = new Date(dateString)
        }
      } else {
        // ISO format hoặc format khác
        date = new Date(dateString)
      }
      
      // Kiểm tra date có hợp lệ không
      if (isNaN(date.getTime())) {
        return 'Không rõ thời gian'
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Vừa xong'
      if (diffMins < 60) return `${diffMins} phút trước`
      if (diffHours < 24) return `${diffHours} giờ trước`
      if (diffDays < 7) return `${diffDays} ngày trước`
      
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Không rõ thời gian'
    }
  }

  const displayPosts = activeTab === 'featured' ? posts : savedPosts

  // Post Card Skeleton Component
  const PostCardSkeleton = () => {
    return (
      <article className="forum-forum-skeleton-card">
        <div className="forum-forum-post-header">
          <div className="forum-forum-post-author">
            <div className="forum-forum-skeleton-avatar"></div>
            <div className="forum-forum-post-author-info" style={{ flex: 1 }}>
              <div className="forum-forum-skeleton-line forum-short"></div>
              <div className="forum-forum-skeleton-line" style={{ width: '40%', marginTop: '0.5rem' }}></div>
            </div>
          </div>
        </div>
        <div className="forum-forum-post-content" style={{ marginTop: '1rem' }}>
          <div className="forum-forum-skeleton-line forum-medium" style={{ marginBottom: '0.75rem' }}></div>
          <div className="forum-forum-skeleton-line" style={{ marginBottom: '0.5rem' }}></div>
          <div className="forum-forum-skeleton-line forum-short"></div>
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
          <div className="forum-forum-skeleton-line" style={{ width: '100px', height: '2rem' }}></div>
          <div className="forum-forum-skeleton-line" style={{ width: '100px', height: '2rem' }}></div>
          <div className="forum-forum-skeleton-line" style={{ width: '80px', height: '2rem' }}></div>
        </div>
      </article>
    )
  }

  return (
    <div className="forum-forum-page">
      <ConditionalHeader />

      <main className="forum-forum-main">
        {/* Page Header */}
        <section className="forum-forum-page-header">
          <div className="forum-forum-header-container">
            <h1 className="forum-forum-page-title">Diễn đàn</h1>
            <p className="forum-forum-page-subtitle">
              Chia sẻ và kết nối với cộng đồng
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="forum-forum-content-section">
          <div className="forum-forum-content-container">
            {/* Tabs and Create Post Button */}
            <div className="forum-forum-tabs-container">
              <div className="forum-forum-tabs">
                <button
                  className={`forum-forum-tab ${activeTab === 'featured' ? 'forum-active' : ''}`}
                  onClick={() => setActiveTab('featured')}
                >
                  Nổi bật
                </button>
                <button
                  className={`forum-forum-tab ${activeTab === 'forum-saved' ? 'forum-active' : ''}`}
                  onClick={() => setActiveTab('forum-saved')}
                >
                  Bài viết yêu thích
                </button>
              </div>
            </div>

            {/* Create Post Form - Facebook style */}
            {userInfo && (
              <div className="forum-forum-create-post-card">
                <div className="forum-forum-create-post-header">
                  <div className="forum-forum-create-post-avatar">
                    {(userInfo.Name || userInfo.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div 
                    className="forum-forum-create-post-input-placeholder"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <span>{userInfo.Name || userInfo.name || 'Bạn'} ơi, bạn đang nghĩ gì thế?</span>
                  </div>
                </div>
                <div className="forum-forum-create-post-actions">
                  <button 
                    className="forum-forum-create-post-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <ImageIcon className="forum-forum-create-post-action-icon forum-icon-image" />
                    <span>Ảnh/Video</span>
                  </button>
                  <button 
                    className="forum-forum-create-post-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <EditIcon className="forum-forum-create-post-action-icon forum-icon-edit" />
                    <span>Viết bài</span>
                  </button>
                </div>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="forum-forum-posts-list">
                {[...Array(3)].map((_, idx) => (
                  <PostCardSkeleton key={idx} />
                ))}
              </div>
            ) : error ? (
              <div className="forum-forum-error-container" role="alert">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p className="forum-error-message">{error}</p>
                <button
                  className="forum-forum-retry-btn"
                  onClick={() => fetchPosts(false)}
                  style={{ marginTop: '1rem' }}
                >
                  Thử lại
                </button>
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="forum-forum-empty-state">
                <p className="forum-empty-state-title">
                  {activeTab === 'forum-saved'
                    ? 'Chưa có bài viết yêu thích nào'
                    : 'Chưa có bài viết nào'}
                </p>
                <p className="forum-empty-state-description">
                  {activeTab === 'forum-saved'
                    ? 'Lưu các bài viết bạn yêu thích để xem lại sau.'
                    : 'Hiện tại chưa có bài viết nào được đăng. Vui lòng quay lại sau.'}
                </p>
              </div>
            ) : (
              <div className="forum-forum-posts-list">
                {displayPosts.map((post) => (
                  <PostCard
                    key={post.PostId}
                    post={post}
                    userInfo={userInfo}
                    userReactionTypeId={userReactions[post.PostId || '']}
                    onReaction={handleReaction}
                    onSave={handleSave}
                    onComment={handleComment}
                    expandedComments={expandedComments}
                    toggleComments={toggleComments}
                    commentInputs={commentInputs}
                    setCommentInputs={setCommentInputs}
                    submittingComment={submittingComment}
                    showReactionPicker={showReactionPicker[post.PostId || '']}
                    setShowReactionPicker={(show: boolean) => handleReactionPickerToggle(post.PostId || '', show)}
                    formatDate={formatDate}
                    reactionTypes={REACTION_TYPES}
                    getReactionTypeId={getReactionTypeId}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    showPostMenu={showPostMenu[post.PostId || '']}
                    setShowPostMenu={(show: boolean) => setShowPostMenu(prev => ({ ...prev, [post.PostId || '']: show }))}
                    deletingPost={deletingPost === post.PostId}
                    onEditComment={handleEditComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    onReplyComment={handleReplyComment}
                    onCommentReaction={handleCommentReaction}
                    editCommentInputs={editCommentInputs}
                    setEditCommentInputs={setEditCommentInputs}
                    editingCommentId={editingCommentId}
                    setEditingCommentId={setEditingCommentId}
                    replyInputs={replyInputs}
                    setReplyInputs={setReplyInputs}
                    submittingReply={submittingReply}
                    showReplyInputs={showReplyInputs}
                    setShowReplyInputs={setShowReplyInputs}
                    showCommentMenu={showCommentMenu}
                    setShowCommentMenu={setShowCommentMenu}
                    deletingComment={deletingComment}
                    onShowLikers={() => setShowLikersModal(post)}
                    setShowCommentLikersModal={setShowCommentLikersModal}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="forum-forum-modal-overlay" onClick={() => setShowCreatePostModal(false)}>
          <div className="forum-forum-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-modal-header">
              <h2 className="forum-forum-modal-title">
                {editingPost ? 'Chỉnh sửa bài viết' : 'Đăng bài viết mới'}
              </h2>
              <button
                className="forum-forum-modal-close"
                onClick={() => {
                  setShowCreatePostModal(false)
                  setEditingPost(null)
                  setCreatePostData({ ArticleTitle: '', PostContent: '', Images: [] })
                  setImageFiles([])
                  setImagePreviewUrls([])
                  setFormErrors({})
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                aria-label="Đóng"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="forum-forum-form">
              <div className="forum-forum-form-group">
                <label htmlFor="post-title" className="forum-forum-form-label">
                  Tiêu đề (tùy chọn)
                </label>
                <input
                  id="post-title"
                  type="text"
                  className="forum-forum-form-input"
                  value={createPostData.ArticleTitle}
                  onChange={(e) => setCreatePostData({ ...createPostData, ArticleTitle: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>

              <div className="forum-forum-form-group">
                <label htmlFor="post-content" className="forum-forum-form-label">
                  Nội dung <span className="forum-required">*</span>
                  <span className="forum-forum-form-char-count">
                    {createPostData.PostContent.length}/5000
                  </span>
                </label>
                <textarea
                  id="post-content"
                  className={`forum-forum-form-textarea ${formErrors.PostContent ? 'forum-error' : ''}`}
                  rows={8}
                  value={createPostData.PostContent}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 5000) // Giới hạn 5000 ký tự
                    setCreatePostData({ ...createPostData, PostContent: value })
                    if (formErrors.PostContent) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.PostContent
                        return newErrors
                      })
                    }
                  }}
                  placeholder="Chia sẻ suy nghĩ của bạn... (tối thiểu 10 ký tự)"
                  forum-required
                  maxLength={5000}
                />
                {formErrors.PostContent && (
                  <span className="forum-forum-form-error-text">{formErrors.PostContent}</span>
                )}
              </div>

              <div className="forum-forum-form-group">
                <label className="forum-forum-form-label">
                  Hình ảnh (tối đa 10 ảnh, mỗi ảnh tối đa 5MB)
                </label>
                
                {/* Drag & Drop Area */}
                <div
                  className={`forum-forum-upload-area ${isDragging ? 'forum-dragging' : ''} ${formErrors.Images ? 'forum-error' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="post-images"
                    accept="image/jpeg,image/forum-jpg,image/png,image/gif,image/webp"
                    multiple
                    className="forum-forum-file-input"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="forum-forum-upload-content">
                    <ImageIcon className="forum-forum-upload-icon" />
                    <p className="forum-forum-upload-text">
                      Kéo thả ảnh vào đây hoặc <span className="forum-forum-upload-link">chọn từ máy tính</span>
                    </p>
                    <p className="forum-forum-upload-hint">
                      Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 5MB/ảnh)
                    </p>
                  </div>
                </div>

                {formErrors.Images && (
                  <span className="forum-forum-form-error-text">{formErrors.Images}</span>
                )}

                {/* Image Preview Grid */}
                {imagePreviewUrls.length > 0 && (
                  <div className="forum-forum-image-preview-grid">
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={idx} className="forum-forum-image-preview-item">
                        <LazyImage
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="forum-forum-image-preview"
                          fallbackSrc="/img/banahills.forum-jpg"
                        />
                        <button
                          type="button"
                          className="forum-forum-image-remove-btn"
                          onClick={() => handleRemoveImage(idx)}
                          aria-label="Xóa ảnh"
                        >
                          <XIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {formErrors.PostContent && (
                <div className="forum-forum-form-error-message">
                  {formErrors.PostContent}
                </div>
              )}
              
              {formErrors.submit && (
                <div className="forum-forum-form-error-message">
                  {formErrors.submit}
                </div>
              )}

              <div className="forum-forum-form-actions">
                <button
                  type="button"
                  className="forum-forum-form-btn forum-forum-form-btn-cancel"
                  onClick={() => {
                    setShowCreatePostModal(false)
                    setEditingPost(null)
                    setCreatePostData({ ArticleTitle: '', PostContent: '', Images: [] })
                    setImageFiles([])
                    setImagePreviewUrls([])
                    setFormErrors({})
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  disabled={submittingPost}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="forum-forum-form-btn forum-forum-form-btn-submit"
                  disabled={submittingPost}
                >
                  {submittingPost ? (editingPost ? 'Đang cập nhật...' : 'Đang đăng...') : (editingPost ? 'Cập nhật' : 'Đăng bài')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thông báo bài viết đang chờ duyệt */}
      {showPendingModal && (
        <div className="forum-forum-modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="forum-forum-pending-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-pending-modal-icon">⏳</div>
            <h3 className="forum-forum-pending-modal-title">Bài viết đang chờ duyệt</h3>
            <p className="forum-forum-pending-modal-message">
              Bài viết của bạn đã được gửi thành công và đang chờ Admin duyệt. 
              Bài viết sẽ được hiển thị sau khi được phê duyệt.
            </p>
            <button 
              className="forum-forum-pending-modal-btn"
              onClick={() => setShowPendingModal(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa bình luận */}
      {deleteCommentConfirm && (
        <div className="forum-forum-modal-overlay" onClick={() => setDeleteCommentConfirm(null)}>
          <div className="forum-forum-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-confirm-modal-icon">🗑️</div>
            <h3 className="forum-forum-confirm-modal-title">Xóa bình luận</h3>
            <p className="forum-forum-confirm-modal-message">
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </p>
            <div className="forum-forum-confirm-modal-actions">
              <button 
                className="forum-forum-confirm-modal-btn forum-forum-confirm-modal-btn-cancel"
                onClick={() => setDeleteCommentConfirm(null)}
              >
                Hủy
              </button>
              <button 
                className="forum-forum-confirm-modal-btn forum-forum-confirm-modal-btn-delete"
                onClick={confirmDeleteComment}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa bài viết */}
      {deletePostConfirm && (
        <div className="forum-forum-modal-overlay" onClick={() => setDeletePostConfirm(null)}>
          <div className="forum-forum-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-confirm-modal-icon">🗑️</div>
            <h3 className="forum-forum-confirm-modal-title">Xóa bài viết</h3>
            <p className="forum-forum-confirm-modal-message">
              Bạn có chắc chắn muốn xóa bài viết này? Tất cả bình luận và phản ứng cũng sẽ bị xóa. Hành động này không thể hoàn tác.
            </p>
            <div className="forum-forum-confirm-modal-actions">
              <button 
                className="forum-forum-confirm-modal-btn forum-forum-confirm-modal-btn-cancel"
                onClick={() => setDeletePostConfirm(null)}
              >
                Hủy
              </button>
              <button 
                className="forum-forum-confirm-modal-btn forum-forum-confirm-modal-btn-delete"
                onClick={confirmDeletePost}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách người đã thích bài viết */}
      {showLikersModal && (
        <div className="forum-forum-modal-overlay" onClick={() => setShowLikersModal(null)}>
          <div className="forum-forum-likers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-likers-modal-header">
              <h3 className="forum-forum-likers-modal-title">Người đã phản ứng với bài viết</h3>
              <button 
                className="forum-forum-likers-modal-close"
                onClick={() => setShowLikersModal(null)}
                aria-label="Đóng"
              >
                <XIcon />
              </button>
            </div>
            <div className="forum-forum-likers-modal-content">
              {showLikersModal.Likes && showLikersModal.Likes.length > 0 ? (
                // Sắp xếp theo loại reaction (nhiều nhất trước)
                [...showLikersModal.Likes]
                  .sort((a, b) => {
                    // Đếm số lượng mỗi loại reaction
                    const countA = showLikersModal.Likes?.filter(l => l.ReactionType === a.ReactionType).length || 0
                    const countB = showLikersModal.Likes?.filter(l => l.ReactionType === b.ReactionType).length || 0
                    return countB - countA // Sắp xếp giảm dần
                  })
                  .map((like, index) => {
                  const reactionEmoji = REACTION_TYPES.find(
                    r => r.name.toLowerCase() === (like.ReactionType || 'like').toLowerCase()
                  )?.emoji || '👍'
                  
                  return (
                    <div key={like.PostLikeId || index} className="forum-forum-liker-modal-item">
                      {like.Avatar ? (
                        <img 
                          src={like.Avatar} 
                          alt={like.FullName} 
                          className="forum-forum-liker-avatar-img"
                          onError={(e) => {
                            // Fallback to letter avatar if image fails
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`forum-forum-liker-avatar ${like.Avatar ? 'hidden' : ''}`}>
                        {like.FullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="forum-forum-liker-info">
                        <span className="forum-forum-liker-modal-name">{like.FullName}</span>
                        <span className="forum-forum-liker-time">{formatDate(like.CreatedDate)}</span>
                      </div>
                      <span className="forum-forum-liker-reaction" role="img" aria-label="reaction">
                        {reactionEmoji}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="forum-forum-likers-empty">Chưa có ai thích bài viết này</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách người đã thích comment */}
      {showCommentLikersModal && (
        <div className="forum-forum-modal-overlay" onClick={() => setShowCommentLikersModal(null)}>
          <div className="forum-forum-likers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-forum-likers-modal-header">
              <h3 className="forum-forum-likers-modal-title">Người đã thích bình luận</h3>
              <button 
                className="forum-forum-likers-modal-close"
                onClick={() => setShowCommentLikersModal(null)}
                aria-label="Đóng"
              >
                <XIcon />
              </button>
            </div>
            <div className="forum-forum-likers-modal-content">
              {showCommentLikersModal.Likes && showCommentLikersModal.Likes.length > 0 ? (
                showCommentLikersModal.Likes.map((like: any, index: number) => (
                  <div key={like.PostCommentLikeId || like.Id || index} className="forum-forum-liker-modal-item">
                    {(like.Avatar || like.avatar) ? (
                      <img 
                        src={like.Avatar || like.avatar} 
                        alt={like.FullName || 'User'} 
                        className="forum-forum-liker-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`forum-forum-liker-avatar ${(like.Avatar || like.avatar) ? 'hidden' : ''}`}>
                      {like.FullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="forum-forum-liker-info">
                      <span className="forum-forum-liker-modal-name">{like.FullName || 'Người dùng'}</span>
                      <span className="forum-forum-liker-time">{formatDate(like.CreatedDate)}</span>
                    </div>
                    <span className="forum-forum-liker-reaction" role="img" aria-label="love">
                      ❤️
                    </span>
                  </div>
                ))
              ) : (
                <div className="forum-forum-likers-empty">Chưa có ai thích bình luận này</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

// Post Card Component
interface PostCardProps {
  post: Post
  userInfo: UserInfo | null
  userReactionTypeId?: number
  onReaction: (postId: string, reactionTypeId: number, reactionId?: number) => void
  onSave: (postId: string, isSaved: boolean) => void
  onComment: (postId: string) => void
  expandedComments: Set<string>
  toggleComments: (postId: string) => void
  commentInputs: Record<string, string>
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  submittingComment: string | null
  showReactionPicker: boolean
  setShowReactionPicker: (show: boolean) => void
  formatDate: (date: string) => string
  reactionTypes: Array<{ id: number; name: string; emoji: string }>
  getReactionTypeId: (reactionTypeName: string) => number
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  showPostMenu?: boolean
  setShowPostMenu?: (show: boolean) => void
  deletingPost?: boolean
  onEditComment?: (commentId: string, currentContent: string) => void
  onUpdateComment?: (postId: string, commentId: string) => void
  onDeleteComment?: (postId: string, commentId: string) => void
  onReplyComment?: (postId: string, parentCommentId: string) => void
  onCommentReaction?: (postId: string, commentId: string, currentReactionId?: number) => void
  editCommentInputs?: Record<string, string>
  setEditCommentInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>
  editingCommentId?: string | null
  setEditingCommentId?: React.Dispatch<React.SetStateAction<string | null>>
  replyInputs?: Record<string, string>
  setReplyInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>
  submittingReply?: string | null
  showReplyInputs?: Set<string>
  setShowReplyInputs?: React.Dispatch<React.SetStateAction<Set<string>>>
  showCommentMenu?: Record<string, boolean>
  setShowCommentMenu?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  deletingComment?: string | null
  onShowLikers?: () => void
  setShowCommentLikersModal?: React.Dispatch<React.SetStateAction<PostComment | null>>
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  userInfo,
  userReactionTypeId,
  onReaction,
  onSave,
  onComment,
  expandedComments,
  toggleComments,
  commentInputs,
  setCommentInputs,
  submittingComment,
  showReactionPicker,
  setShowReactionPicker,
  formatDate,
  reactionTypes,
  getReactionTypeId,
  onEdit,
  onDelete,
  showPostMenu = false,
  setShowPostMenu,
  deletingPost = false,
  onEditComment,
  onUpdateComment,
  onDeleteComment,
  onReplyComment,
  onCommentReaction,
  editCommentInputs = {},
  setEditCommentInputs,
  editingCommentId = null,
  setEditingCommentId,
  replyInputs = {},
  setReplyInputs,
  submittingReply = null,
  showReplyInputs = new Set(),
  setShowReplyInputs,
  showCommentMenu = {},
  setShowCommentMenu,
  deletingComment = null,
  onShowLikers,
  setShowCommentLikersModal,
}) => {
  const isCommentsExpanded = expandedComments.has(post.PostId || '')
  const reactionCount = post.Likes?.length || 0
  const commentCount = post.Comments?.length || 0
  
  // Tìm reaction của user hiện tại từ post.Likes (backup nếu userReactionTypeId không có)
  const userLike = useMemo(() => {
    if (!userInfo) return null
    const userId = userInfo.Id || userInfo.id
    return post.Likes?.find(like => {
      const likeAccountId = String(like.AccountId || '').trim()
      const currentUserId = String(userId || '').trim()
      return likeAccountId === currentUserId && likeAccountId !== ''
    })
  }, [post.Likes, userInfo])
  
  // Tính currentReaction từ userReactionTypeId hoặc từ userLike
  const currentReaction = useMemo(() => {
    if (userReactionTypeId) {
      return reactionTypes.find(r => r.id === userReactionTypeId) || null
    }
    if (userLike && userLike.ReactionType) {
      const typeId = getReactionTypeId(userLike.ReactionType)
      return reactionTypes.find(r => r.id === typeId) || null
    }
    if (userLike) {
      // Có like nhưng không có ReactionType -> mặc định là Like
      return reactionTypes.find(r => r.id === 1) || null
    }
    return null
  }, [userReactionTypeId, userLike, reactionTypes, getReactionTypeId])

  // Tính toán các loại cảm xúc để hiển thị icon
  const reactionCountsByType = useMemo(() => {
    const counts: Record<number, number> = {}
    post.Likes?.forEach((like) => {
      if (like.ReactionType) {
        const typeId = getReactionTypeId(like.ReactionType)
        counts[typeId] = (counts[typeId] || 0) + 1
      } else {
        // Mặc định là Like nếu không có ReactionType
        counts[1] = (counts[1] || 0) + 1
      }
    })
    return counts
  }, [post.Likes])

  // Lấy các icon cảm xúc đã có (tối đa 2-3 icon đầu tiên)
  const reactionIcons = useMemo(() => {
    const icons: Array<{ id: number; emoji: string; count: number }> = []
    // Sắp xếp theo thứ tự ưu tiên: Like, Love, Haha, Wow, Sad, Angry
    const priorityOrder = [1, 2, 3, 4, 5, 6]
    priorityOrder.forEach((typeId) => {
      if (reactionCountsByType[typeId] && reactionCountsByType[typeId] > 0) {
        const reaction = reactionTypes.find(r => r.id === typeId)
        if (reaction) {
          icons.push({ id: typeId, emoji: reaction.emoji, count: reactionCountsByType[typeId] })
        }
      }
    })
    return icons.slice(0, 3) // Chỉ hiển thị tối đa 3 icon
  }, [reactionCountsByType, reactionTypes])

  // Check if current user is the author
  const isAuthor = userInfo && (
    String(post.PosterId) === String(userInfo.Id || userInfo.id) ||
    String(post.AuthorId) === String(userInfo.Id || userInfo.id)
  )

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (setShowPostMenu) {
      setShowPostMenu(!showPostMenu)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(post)
      if (setShowPostMenu) {
        setShowPostMenu(false)
      }
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && post.PostId) {
      onDelete(post.PostId)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPostMenu && setShowPostMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.forum-forum-post-menu-wrapper')) {
          setShowPostMenu(false)
        }
      }
    }
    if (showPostMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPostMenu, setShowPostMenu])

  // Close comment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (setShowCommentMenu && Object.keys(showCommentMenu).length > 0) {
        const target = e.target as HTMLElement
        if (!target.closest('.forum-forum-comment-menu-wrapper')) {
          setShowCommentMenu({})
        }
      }
    }
    if (setShowCommentMenu && Object.keys(showCommentMenu).length > 0) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCommentMenu, setShowCommentMenu])

  return (
    <article className="forum-forum-post-card">
      <div className="forum-forum-post-header">
        <div className="forum-forum-post-author">
          {(post.PosterAvatar || post.Author?.Avatar) ? (
            <img 
              src={post.PosterAvatar || post.Author?.Avatar} 
              alt={post.PosterName || 'User'} 
              className="forum-forum-post-avatar-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`forum-forum-post-avatar ${(post.PosterAvatar || post.Author?.Avatar) ? 'hidden' : ''}`}>
            {post.PosterName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="forum-forum-post-author-info">
            <div className="forum-forum-post-author-name">{post.PosterName || 'Người dùng'}</div>
            <div className="forum-forum-post-meta">
              <ClockIcon className="forum-forum-meta-icon" />
              <span>{formatDate(post.PublicDate)}</span>
            </div>
          </div>
        </div>
        {isAuthor && (
          <div className="forum-forum-post-menu-wrapper">
            <button
              className="forum-forum-post-menu-btn"
              onClick={handleMenuToggle}
              aria-label="Tùy chọn"
              disabled={deletingPost}
            >
              <MoreVerticalIcon className="forum-forum-post-menu-icon" />
            </button>
            {showPostMenu && (
              <div className="forum-forum-post-menu">
                <button
                  className="forum-forum-post-menu-item"
                  onClick={handleEditClick}
                  disabled={deletingPost}
                >
                  <EditIcon className="forum-forum-post-menu-item-icon" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  className="forum-forum-post-menu-item forum-forum-post-menu-item-danger"
                  onClick={handleDeleteClick}
                  disabled={deletingPost}
                >
                  <TrashIcon className="forum-forum-post-menu-item-icon" />
                  <span>{deletingPost ? 'Đang xóa...' : 'Xóa'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="forum-forum-post-content">
        {post.ArticleTitle && (
          <h3 className="forum-forum-post-title">{post.ArticleTitle}</h3>
        )}
        <p className="forum-forum-post-text">{post.PostContent}</p>
        
        {post.Images && post.Images.length > 0 && (
          <div className="forum-forum-post-images">
            {(() => {
              // Lọc các ảnh hợp lệ (không phải fallback)
              const validImages = post.Images.filter(img => img && img.trim() && img !== '/img/banahills.forum-jpg')
              
              if (validImages.length === 0) {
                return null
              }
              
              if (validImages.length === 1) {
                return (
                  <LazyImage
                    src={validImages[0]}
                    alt="Post image"
                    className="forum-forum-post-image-single"
                    fallbackSrc="/img/banahills.forum-jpg"
                  />
                )
              }
              
              return (
                <div className="forum-forum-post-images-grid">
                  {validImages.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="forum-forum-post-image-wrapper">
                      <LazyImage
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className="forum-forum-post-image"
                        fallbackSrc="/img/banahills.forum-jpg"
                      />
                      {idx === 3 && validImages.length > 4 && (
                        <div className="forum-forum-post-image-overlay">
                          +{validImages.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Reaction summary - hiển thị icon cảm xúc + số lượng, click để xem danh sách */}
      {reactionCount > 0 && (
        <button 
          className="forum-forum-reaction-summary-btn"
          onClick={(e) => {
            e.stopPropagation()
            onShowLikers?.()
          }}
          title="Xem danh sách người đã thích"
        >
          <div className="forum-forum-reaction-icons">
            {reactionIcons.map((icon) => (
              <span key={icon.id} className="forum-forum-reaction-icon" role="img" aria-label={reactionTypes.find(r => r.id === icon.id)?.name}>
                {icon.emoji}
              </span>
            ))}
          </div>
          <span className="forum-forum-reaction-count">{reactionCount}</span>
        </button>
      )}

      <div className="forum-forum-post-actions">
        <div className="forum-forum-reaction-wrapper">
          {currentReaction ? (
            // Nếu đã có reaction, click vào icon để unlike
            <button
              className="forum-forum-action-btn forum-forum-reaction-btn forum-has-reaction"
              onClick={(e) => {
                e.stopPropagation()
                // Unlike: click vào icon cảm xúc hiện tại
                // Lấy reactionId từ post.userReactionId hoặc từ userLike
                const reactionId = post.userReactionId || (userLike ? parseInt(userLike.PostLikeId) : undefined)
                onReaction(post.PostId || '', userReactionTypeId || currentReaction.id, reactionId)
              }}
              onMouseEnter={() => userInfo && setShowReactionPicker(true)}
              onMouseLeave={() => {
                setTimeout(() => {
                  if (!document.querySelector('.forum-forum-reaction-picker:hover')) {
                    setShowReactionPicker(false)
                  }
                }, 100)
              }}
              title={userInfo ? `Bỏ ${currentReaction.name}` : 'Bạn cần đăng nhập để bỏ cảm xúc'}
              aria-label={userInfo ? `Bỏ ${currentReaction.name}` : 'Bạn cần đăng nhập để bỏ cảm xúc'}
            >
              <span className="forum-forum-reaction-emoji" role="img" aria-label={currentReaction.name}>
                {currentReaction.emoji}
              </span>
              <span>Thích</span>
            </button>
          ) : (
            // Nếu chưa có reaction, click để like ngay (reactionTypeId = 1)
            <button
              className="forum-forum-action-btn forum-forum-reaction-btn"
              onClick={(e) => {
                e.stopPropagation()
                // Click để like ngay với reactionTypeId = 1 (Like)
                onReaction(post.PostId || '', 1, undefined)
              }}
              onMouseEnter={() => userInfo && setShowReactionPicker(true)}
              onMouseLeave={() => {
                setTimeout(() => {
                  if (!document.querySelector('.forum-forum-reaction-picker:hover')) {
                    setShowReactionPicker(false)
                  }
                }, 100)
              }}
              title={userInfo ? 'Thích bài viết' : 'Bạn cần đăng nhập để thích'}
              aria-label={userInfo ? 'Thích bài viết' : 'Bạn cần đăng nhập để thích'}
            >
              <span className="forum-forum-like-icon" role="img" aria-label="like">👍</span>
              <span>Thích</span>
            </button>
          )}
          {showReactionPicker && userInfo && (
            <div 
              className="forum-forum-reaction-picker"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
              role="menu"
              aria-label="Chọn cảm xúc"
            >
              {reactionTypes.map((reaction) => (
                <button
                  key={reaction.id}
                  className={`forum-forum-reaction-option ${userReactionTypeId === reaction.id ? 'forum-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Chỉ click mới chọn reaction
                    onReaction(post.PostId || '', reaction.id, post.userReactionId)
                    setShowReactionPicker(false)
                  }}
                  title={reaction.name}
                  aria-label={reaction.name}
                  role="menuitem"
                >
                  <span className="forum-forum-reaction-emoji-large" role="img" aria-label={reaction.name}>
                    {reaction.emoji}
                  </span>
                  <span className="forum-forum-reaction-name">{reaction.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="forum-forum-action-btn"
          onClick={() => toggleComments(post.PostId || '')}
        >
          <CommentIcon className="forum-forum-action-icon" />
          <span>{commentCount} bình luận</span>
        </button>
        {userInfo && (
          <button
            className={`forum-forum-action-btn ${post.isSaved ? 'forum-saved' : ''}`}
            onClick={() => {
              const currentSavedState = !!post.isSaved
              onSave(post.PostId || '', currentSavedState)
            }}
          >
            <BookmarkIcon className="forum-forum-action-icon" filled={!!post.isSaved} />
            <span>{post.isSaved ? 'Đã lưu' : 'Lưu'}</span>
          </button>
        )}
      </div>

      {/* Comments Section */}
      {isCommentsExpanded && (
        <div className="forum-forum-post-comments">
          {/* Comment Input */}
          {userInfo && (
            <div className="forum-forum-comment-input-wrapper">
              <input
                type="text"
                className="forum-forum-comment-input"
                placeholder="Viết bình luận..."
                value={commentInputs[post.PostId] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [post.PostId]: e.target.value,
                  }))
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onComment(post.PostId)
                  }
                }}
              />
              <button
                className="forum-forum-comment-submit-btn"
                onClick={() => onComment(post.PostId || '')}
                disabled={!commentInputs[post.PostId || '']?.trim() || submittingComment === post.PostId}
                aria-label="Gửi bình luận"
              >
                {submittingComment === post.PostId ? (
                  <>
                    <span className="forum-forum-comment-submit-spinner"></span>
                    Đang gửi...
                  </>
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="forum-forum-comments-list">
            {post.Comments && post.Comments.length > 0 ? (
              post.Comments.map((comment) => {
                // Recursive function để render comment và replies
                const renderComment = (comment: PostComment, depth: number = 0): React.ReactNode => {
                  const commentKey = `${post.PostId}-${comment.PostCommentId}`
                  const isEditing = editingCommentId === comment.PostCommentId
                  const isCommentAuthor = userInfo && comment.AuthorId && (comment.AuthorId === userInfo.Id || comment.AuthorId === userInfo.id)
                  const isReplyOpen = showReplyInputs.has(commentKey)
                  const reactionCount = comment.ReactionsCount || comment.Likes?.length || 0
                  
                  // Tính hasUserReaction từ Likes array hoặc UserReactionId
                  const userId = userInfo?.Id || userInfo?.id
                  const userLikeInComment = userId ? comment.Likes?.find(
                    (like: any) => String(like.AccountId) === String(userId)
                  ) : null
                  const hasUserReaction = !!comment.UserReactionId || !!userLikeInComment
                  const userReactionId = comment.UserReactionId || (userLikeInComment ? parseInt(userLikeInComment.PostCommentLikeId || userLikeInComment.Id) : undefined)
                  
                  const isReply = depth > 0

                  return (
                    <div key={comment.PostCommentId} className={`forum-forum-comment-item ${isReply ? 'forum-forum-comment-reply' : ''}`} style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : '0' }}>
                      {comment.Avatar ? (
                        <img 
                          src={comment.Avatar} 
                          alt={comment.FullName || 'User'} 
                          className="forum-forum-comment-avatar-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`forum-forum-comment-avatar ${comment.Avatar ? 'hidden' : ''}`}>
                        {comment.FullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="forum-forum-comment-content-wrapper">
                        <div className="forum-forum-comment-content">
                          <div className="forum-forum-comment-header">
                            <span className="forum-forum-comment-author">{comment.FullName}</span>
                            {isCommentAuthor && setShowCommentMenu && (
                              <div className="forum-forum-comment-menu-wrapper">
                                <button
                                  className="forum-forum-comment-menu-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowCommentMenu((prev) => ({
                                      ...prev,
                                      [commentKey]: !prev[commentKey],
                                    }))
                                  }}
                                  aria-label="Tùy chọn"
                                  disabled={deletingComment === comment.PostCommentId}
                                >
                                  <MoreVerticalIcon className="forum-forum-comment-menu-icon" />
                                </button>
                                {showCommentMenu[commentKey] && (
                                  <div className="forum-forum-comment-menu">
                                    <button
                                      className="forum-forum-comment-menu-item"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (onEditComment && comment.Content) {
                                          onEditComment(comment.PostCommentId, comment.Content)
                                          setShowCommentMenu((prev) => {
                                            const newState = { ...prev }
                                            delete newState[commentKey]
                                            return newState
                                          })
                                        }
                                      }}
                                      disabled={deletingComment === comment.PostCommentId}
                                    >
                                      <EditIcon className="forum-forum-comment-menu-item-icon" />
                                      <span>Chỉnh sửa</span>
                                    </button>
                                    <button
                                      className="forum-forum-comment-menu-item forum-forum-comment-menu-item-danger"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (onDeleteComment && post.PostId) {
                                          onDeleteComment(post.PostId, comment.PostCommentId)
                                          setShowCommentMenu((prev) => {
                                            const newState = { ...prev }
                                            delete newState[commentKey]
                                            return newState
                                          })
                                        }
                                      }}
                                      disabled={deletingComment === comment.PostCommentId}
                                    >
                                      <TrashIcon className="forum-forum-comment-menu-item-icon" />
                                      <span>{deletingComment === comment.PostCommentId ? 'Đang xóa...' : 'Xóa'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="forum-forum-comment-edit-wrapper">
                              <input
                                type="text"
                                className="forum-forum-comment-edit-input"
                                value={editCommentInputs[comment.PostCommentId] || comment.Content}
                                onChange={(e) => {
                                  if (setEditCommentInputs) {
                                    setEditCommentInputs((prev) => ({
                                      ...prev,
                                      [comment.PostCommentId]: e.target.value,
                                    }))
                                  }
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    if (onUpdateComment && post.PostId) {
                                      onUpdateComment(post.PostId, comment.PostCommentId)
                                    }
                                  }
                                  if (e.key === 'Escape') {
                                    if (setEditingCommentId) {
                                      setEditingCommentId(null)
                                    }
                                  }
                                }}
                                autoFocus
                              />
                              <div className="forum-forum-comment-edit-actions">
                                <button
                                  className="forum-forum-comment-edit-btn forum-forum-comment-edit-btn-cancel"
                                  onClick={() => {
                                    if (setEditingCommentId) {
                                      setEditingCommentId(null)
                                    }
                                    if (setEditCommentInputs) {
                                      setEditCommentInputs((prev) => {
                                        const newState = { ...prev }
                                        delete newState[comment.PostCommentId]
                                        return newState
                                      })
                                    }
                                  }}
                                >
                                  Hủy
                                </button>
                                <button
                                  className="forum-forum-comment-edit-btn forum-forum-comment-edit-btn-save"
                                  onClick={() => {
                                    if (onUpdateComment && post.PostId) {
                                      onUpdateComment(post.PostId, comment.PostCommentId)
                                    }
                                  }}
                                  disabled={!editCommentInputs[comment.PostCommentId]?.trim()}
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="forum-forum-comment-text">{comment.Content}</p>
                              {comment.Images && comment.Images.length > 0 && (
                                <div className="forum-forum-comment-images">
                                  {comment.Images.map((img, idx) => (
                                    <LazyImage
                                      key={idx}
                                      src={img}
                                      alt={`Comment image ${idx + 1}`}
                                      className="forum-forum-comment-image"
                                      fallbackSrc="/img/banahills.forum-jpg"
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {/* Comment Actions: Thời gian, Tim, Trả lời */}
                        <div className="forum-forum-comment-actions">
                          {comment.CreatedDate && (
                            <span className="forum-forum-comment-time">{formatDate(comment.CreatedDate)}</span>
                          )}
                          <div className="forum-forum-comment-like-wrapper">
                            <button
                              className={`forum-forum-comment-action-btn forum-forum-comment-heart-btn ${hasUserReaction ? 'forum-liked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Heart button clicked!', { 
                                  postId: post.PostId, 
                                  commentId: comment.PostCommentId, 
                                  userReactionId: userReactionId,
                                  hasUserReaction,
                                  hasOnCommentReaction: !!onCommentReaction 
                                })
                                if (onCommentReaction && post.PostId) {
                                  onCommentReaction(post.PostId, comment.PostCommentId, userReactionId)
                                }
                              }}
                              title={hasUserReaction ? 'Bỏ thích' : 'Thích'}
                            >
                              <span className={`forum-forum-comment-heart-icon ${hasUserReaction ? 'forum-liked' : ''}`} role="img" aria-label="love">
                                {hasUserReaction ? '❤️' : '🤍'}
                              </span>
                            </button>
                            {reactionCount > 0 && (
                              <div className="forum-forum-comment-likers-wrapper">
                                <span 
                                  className="forum-forum-comment-reaction-count"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (setShowCommentLikersModal) {
                                      setShowCommentLikersModal(comment)
                                    }
                                  }}
                                  title={
                                    comment.Likes && comment.Likes.length > 0
                                      ? comment.Likes.slice(0, 3).map((like: any) => like.FullName || 'Người dùng').join(', ') + 
                                        (comment.Likes.length > 3 ? ` và ${comment.Likes.length - 3} người khác` : '')
                                      : 'Xem danh sách'
                                  }
                                >
                                  {reactionCount}
                                </span>
                                {/* Tooltip hiển thị 3 tên đầu tiên */}
                                {comment.Likes && comment.Likes.length > 0 && (
                                  <div className="forum-forum-comment-likers-tooltip">
                                    {comment.Likes.slice(0, 3).map((like: any, idx: number) => (
                                      <div key={idx} className="forum-forum-comment-liker-name">
                                        ❤️ {like.FullName || 'Người dùng'}
                                      </div>
                                    ))}
                                    {comment.Likes.length > 3 && (
                                      <div className="forum-forum-comment-liker-more">
                                        và {comment.Likes.length - 3} người khác...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            className="forum-forum-comment-action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (setShowReplyInputs) {
                                setShowReplyInputs((prev) => {
                                  const newSet = new Set(prev)
                                  if (newSet.has(commentKey)) {
                                    newSet.delete(commentKey)
                                  } else {
                                    newSet.add(commentKey)
                                  }
                                  return newSet
                                })
                              }
                            }}
                          >
                            Trả lời
                          </button>
                        </div>
                        {/* Reply Input */}
                        {isReplyOpen && userInfo && setReplyInputs && (
                          <div className="forum-forum-comment-reply-wrapper">
                            <input
                              type="text"
                              className="forum-forum-comment-reply-input"
                              placeholder="Viết phản hồi..."
                              value={replyInputs[commentKey] || ''}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({
                                  ...prev,
                                  [commentKey]: e.target.value,
                                }))
                              }
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  if (onReplyComment && post.PostId) {
                                    onReplyComment(post.PostId, comment.PostCommentId)
                                  }
                                }
                              }}
                            />
                            <div className="forum-forum-comment-reply-actions">
                              <button
                                className="forum-forum-comment-reply-btn forum-forum-comment-reply-btn-cancel"
                                onClick={() => {
                                  if (setShowReplyInputs) {
                                    setShowReplyInputs((prev) => {
                                      const newSet = new Set(prev)
                                      newSet.delete(commentKey)
                                      return newSet
                                    })
                                  }
                                  if (setReplyInputs) {
                                    setReplyInputs((prev) => {
                                      const newState = { ...prev }
                                      delete newState[commentKey]
                                      return newState
                                    })
                                  }
                                }}
                              >
                                Hủy
                              </button>
                              <button
                                className="forum-forum-comment-reply-btn forum-forum-comment-reply-btn-submit"
                                onClick={() => {
                                  if (onReplyComment && post.PostId) {
                                    onReplyComment(post.PostId, comment.PostCommentId)
                                  }
                                }}
                                disabled={!replyInputs[commentKey]?.trim() || submittingReply === commentKey}
                              >
                                {submittingReply === commentKey ? 'Đang gửi...' : 'Gửi'}
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Render Replies (nested) */}
                        {comment.Replies && comment.Replies.length > 0 && (
                          <div className="forum-forum-comment-replies">
                            {comment.Replies.map((reply) => renderComment(reply, depth + 1))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return renderComment(comment, 0)
              })
            ) : (
              <p className="forum-forum-no-comments">Chưa có bình luận nào</p>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export default ForumPage






