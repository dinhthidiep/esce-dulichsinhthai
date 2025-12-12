import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  ImageList,
  ImageListItem,
  DialogContentText,
  Select,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  ThumbUpAlt as LikeIcon,
  ThumbUpOffAlt as LikeBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Favorite as FavoriteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material'
import { uploadImageToFirebase } from '~/firebaseClient'
import {
  fetchAllPosts,
  createPost,
  updatePost,
  deletePost,
  approvePost,
  rejectPost,
  toggleLikePost,
  fetchCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  lockPost,
  unlockPost,
  lockComment,
  unlockComment,
  type PostDto,
  type CreatePostDto,
  type UpdatePostDto,
  type PostComment
} from '~/api/instances/PostsApi'

const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'primary'
    case 'travel agency':
    case 'agency':
      return 'info'
    case 'host':
      return 'secondary'
    default:
      return 'default'
  }
}

// ĐÃ BỎ dữ liệu ảo cho bài viết (MOCK_POSTS) theo yêu cầu, chỉ dùng dữ liệu thật từ backend

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return 'default'
  }
}

// Reaction types for posts - map sang ReactionTypeId trong backend
// Backend mapping: 1 Like, 2 Love, 3 Haha, 4 Wow, 5 Sad, 6 Angry
type ReactionKey = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

const REACTION_ID_MAP: Record<ReactionKey, number> = {
  like: 1,
  love: 2,
  haha: 3,
  wow: 4,
  sad: 5,
  angry: 6
}

const REACTIONS: { key: ReactionKey; label: string; emoji: string }[] = [
  { key: 'like', label: 'Thích', emoji: '👍' },
  { key: 'love', label: 'Tim', emoji: '❤️' },
  { key: 'haha', label: 'Haha', emoji: '😂' },
  { key: 'wow', label: 'Wow', emoji: '😮' },
  { key: 'sad', label: 'Buồn', emoji: '😢' },
  { key: 'angry', label: 'Phẫn nộ', emoji: '😡' }
]

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Vừa xong'

  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 30) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  } catch {
    return 'Vừa xong'
  }
}

export default function PostsManagement() {
  const [posts, setPosts] = useState<PostDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity?: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '' })

  // Likes Dialog State
  const [likesDialogOpen, setLikesDialogOpen] = useState(false)
  const [selectedPostLikes, setSelectedPostLikes] = useState<PostDto['likes']>([])
  const [_selectedPostTitle, setSelectedPostTitle] = useState('')
  // Hiển thị popup reaction khi hover vào nút like
  const [reactionMenuPostId, setReactionMenuPostId] = useState<number | null>(null)
  const reactionHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create Post State
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Edit Post State
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostDto | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [editNewImages, setEditNewImages] = useState<File[]>([])
  const [editNewImagePreviews, setEditNewImagePreviews] = useState<string[]>([])
  const [updating, setUpdating] = useState(false)

  // Delete Post State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPost, setDeletingPost] = useState<PostDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  // Lock/Unlock Post State
  const [lockingPost, setLockingPost] = useState<Set<number>>(new Set())
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
  const [lockingPostData, setLockingPostData] = useState<PostDto | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [unlockReason, setUnlockReason] = useState('')

  // Lock/Unlock Comment State
  const [lockingComment, setLockingComment] = useState<Set<string>>(new Set())
  const [lockCommentDialogOpen, setLockCommentDialogOpen] = useState(false)
  const [unlockCommentDialogOpen, setUnlockCommentDialogOpen] = useState(false)
  const [lockingCommentData, setLockingCommentData] = useState<{ comment: PostComment; postId: number } | null>(null)
  const [lockCommentReason, setLockCommentReason] = useState('')
  const [unlockCommentReason, setUnlockCommentReason] = useState('')

  // Approve/Reject State
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reviewingPost, setReviewingPost] = useState<PostDto | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Helpers cho reaction menu (giữ menu mở lâu hơn một chút)
  const showReactionMenu = (postId: number) => {
    if (reactionHideTimeoutRef.current) {
      clearTimeout(reactionHideTimeoutRef.current)
      reactionHideTimeoutRef.current = null
    }
    setReactionMenuPostId(postId)
  }

  const scheduleHideReactionMenu = (postId: number) => {
    if (reactionHideTimeoutRef.current) {
      clearTimeout(reactionHideTimeoutRef.current)
    }
    reactionHideTimeoutRef.current = setTimeout(() => {
      setReactionMenuPostId((current) => (current === postId ? null : current))
      reactionHideTimeoutRef.current = null
    }, 400) // giữ thêm ~0.4s sau khi rời chuột
  }

  // Menu State
  const [menuAnchor, setMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({})

  // Like State
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set())

  // Comment State
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
  const [postComments, setPostComments] = useState<{ [postId: number]: PostComment[] }>({})
  const [commentTexts, setCommentTexts] = useState<{ [postId: number]: string }>({})
  const [editingComments, setEditingComments] = useState<{ [commentId: string]: string }>({})
  const [creatingComment, setCreatingComment] = useState<{ [postId: number]: boolean }>({})
  const [updatingComment, setUpdatingComment] = useState<Set<string>>(new Set())
  const [deletingComment, setDeletingComment] = useState<Set<string>>(new Set())
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())

  // Get current user - make it a state so it can be updated
  const [currentUser, setCurrentUser] = useState<any>(null)

  const getCurrentUser = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        return JSON.parse(userInfoStr)
      }
    } catch (error) {
      console.error('Error parsing userInfo:', error)
    }
    return null
  }

  // Load user info on mount and when profile is updated
  useEffect(() => {
    const loadUserInfo = () => {
      const user = getCurrentUser()
      setCurrentUser(user)
    }

    loadUserInfo()

    // Listen for profile update events
    const handleProfileUpdate = () => {
      console.log('Profile updated event received in PostsManagement, reloading userInfo...')
      loadUserInfo()
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    // Reload when window gets focus
    const handleFocus = () => {
      loadUserInfo()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const isAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.roleName === 'Admin' ||
    currentUser?.Role === 'Admin' ||
    currentUser?.roleId === 1
  const isAuthenticated = !!currentUser

  // Debug: Log current user info
  useEffect(() => {
    if (currentUser) {
      console.log('Current User Info:', {
        id: currentUser.id,
        Id: currentUser.Id,
        userId: currentUser.userId,
        UserId: currentUser.UserId,
        ID: currentUser.ID,
        avatar: currentUser.avatar || currentUser.Avatar,
        allKeys: Object.keys(currentUser)
      })
    }
  }, [currentUser])

  // Lấy reaction hiện tại của user cho 1 post (nếu có)
  const getCurrentUserReaction = (post: PostDto): ReactionKey | null => {
    if (!currentUser || !post.likes || post.likes.length === 0) return null

    const userId =
      currentUser?.id ??
      currentUser?.Id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.ID ??
      null
    if (!userId) return null

    const userIdStr = String(userId)
    const userLike = post.likes.find((like) => String(like.accountId ?? '') === userIdStr)
    if (!userLike) return null

    const rawType = (userLike.reactionType ?? '').toString().toLowerCase()
    switch (rawType) {
      case 'like':
        return 'like'
      case 'love':
        return 'love'
      case 'haha':
        return 'haha'
      case 'wow':
        return 'wow'
      case 'sad':
        return 'sad'
      case 'angry':
        return 'angry'
      default:
        return 'like'
    }
  }

  const getReactionDisplay = (reaction: ReactionKey | null) => {
    if (!reaction) return { label: 'Thích', emoji: '👍' }
    return REACTIONS.find((r) => r.key === reaction) ?? { label: 'Thích', emoji: '👍' }
  }

  // Load Posts
  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[PostsManagement] Loading posts...')
      const data = await fetchAllPosts()
      console.log('[PostsManagement] Fetched posts:', data?.length || 0, 'posts')
      console.log('[PostsManagement] Posts data:', data)
      setPosts(data || [])
      console.log('[PostsManagement] Posts state updated, count:', data?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài viết')
      console.error('[PostsManagement] Error loading posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  // Filter Posts - optimized
  const filteredPosts = useMemo(() => {
    console.log('[PostsManagement] Filtering posts. Total:', posts.length, 'Status filter:', statusFilter, 'Search:', searchText)
    
    if (posts.length === 0) {
      console.log('[PostsManagement] No posts to filter')
      return []
    }

    let filtered = posts
    console.log('[PostsManagement] Before filtering:', filtered.length, 'posts')

    // Filter by status (fast)
    if (statusFilter !== 'All') {
      const statusLower = statusFilter.toLowerCase()
      filtered = filtered.filter((post) => {
        const postStatus = post.status?.toLowerCase() ?? ''
        const matches = postStatus === statusLower
        if (!matches) {
          console.log('[PostsManagement] Post filtered out by status:', post.postId, 'Status:', post.status, 'Filter:', statusFilter)
        }
        return matches
      })
      console.log('[PostsManagement] After status filter:', filtered.length, 'posts')
    }

    // Filter by search text (fast)
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase()
      filtered = filtered.filter((item) => {
        const title = (item.title ?? '').toLowerCase()
        const content = (item.content ?? '').toLowerCase()
        const author = (item.authorName ?? '').toLowerCase()
        const matches = (
          title.includes(lowerSearch) ||
          content.includes(lowerSearch) ||
          author.includes(lowerSearch)
        )
        if (!matches) {
          console.log('[PostsManagement] Post filtered out by search:', item.postId)
        }
        return matches
      })
      console.log('[PostsManagement] After search filter:', filtered.length, 'posts')
    }

    console.log('[PostsManagement] Final filtered posts:', filtered.length)
    return filtered
  }, [posts, searchText, statusFilter])

  // Create Post Handlers
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true)
    setNewTitle('')
    setNewContent('')
    setNewImages([])
    setNewImagePreviews([])
  }

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false)
    setNewTitle('')
    setNewContent('')
    setNewImages([])
    setNewImagePreviews([])
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'))

      if (fileArray.length === 0) return

      setNewImages((prev) => {
        const existingNames = new Set(prev.map((f) => f.name))
        const newFiles = fileArray.filter((f) => !existingNames.has(f.name))
        return [...prev, ...newFiles]
      })

      const previews = fileArray.map((file) => URL.createObjectURL(file))
      setNewImagePreviews((prev) => [...prev, ...previews])
      e.target.value = ''
    }
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleCreatePost = async () => {
    if (!newTitle.trim() && !newContent.trim() && newImages.length === 0) {
      return
    }

    try {
      setCreating(true)
      setError(null)

      const imageUrls: string[] = []
      const processedFiles = new Set<string>()

      for (const file of newImages) {
        if (processedFiles.has(file.name)) continue

        try {
          // Upload từng ảnh lên Firebase, lấy URL
          const url = await uploadImageToFirebase(file, 'posts')
          imageUrls.push(url)
          processedFiles.add(file.name)
        } catch (fileError) {
          console.error(`Error uploading file ${file.name} to Firebase:`, fileError)
        }
      }

      if (imageUrls.length === 0 && newImages.length > 0) {
        setError('Không thể upload ảnh lên Firebase. Vui lòng thử lại với ảnh khác.')
        setCreating(false)
        return
      }

      const dto: CreatePostDto = {
        title: newTitle.trim(),
        content: newContent.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined
      }

      await createPost(dto)
      await loadPosts()
      handleCloseCreateDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo bài viết')
      console.error('Error creating post:', err)
    } finally {
      setCreating(false)
    }
  }

  // Edit Post Handlers
  const handleOpenEditDialog = (post: PostDto) => {
    setEditingPost(post)
    setEditTitle(post.title)
    setEditContent(post.content)
    setEditImages([...post.images])
    setEditNewImages([])
    setEditNewImagePreviews([])
    setEditDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingPost(null)
    setEditTitle('')
    setEditContent('')
    setEditImages([])
    setEditNewImages([])
    setEditNewImagePreviews([])
  }

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'))
      setEditNewImages((prev) => [...prev, ...fileArray])

      const previews = fileArray.map((file) => URL.createObjectURL(file))
      setEditNewImagePreviews((prev) => [...prev, ...previews])
      e.target.value = ''
    }
  }

  const removeEditImage = (index: number, isNew: boolean) => {
    if (isNew) {
      setEditNewImages((prev) => prev.filter((_, i) => i !== index))
      setEditNewImagePreviews((prev) => {
        URL.revokeObjectURL(prev[index])
        return prev.filter((_, i) => i !== index)
      })
    } else {
      setEditImages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost) return

    try {
      setUpdating(true)
      setError(null)

      const newImageUrls: string[] = []

      for (const file of editNewImages) {
        try {
          const url = await uploadImageToFirebase(file, 'posts')
          newImageUrls.push(url)
        } catch (fileError) {
          console.error(`Error uploading edit image ${file.name} to Firebase:`, fileError)
        }
      }

      const allImages = [...editImages, ...newImageUrls]

      const dto: UpdatePostDto = {
        title: editTitle.trim() || undefined,
        content: editContent.trim() || undefined,
        images: allImages.length > 0 ? allImages : undefined
      }

      await updatePost(editingPost.postId, dto)
      await loadPosts()
      handleCloseEditDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật bài viết')
      console.error('Error updating post:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Delete Post Handlers
  const handleOpenDeleteDialog = (post: PostDto) => {
    setDeletingPost(post)
    setDeleteReason('')
    setDeleteDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDeletingPost(null)
    setDeleteReason('')
  }

  const handleDeletePost = async () => {
    if (!deletingPost || !deleteReason.trim()) {
      setError('Vui lòng nhập lý do xóa bài viết')
      return
    }

    try {
      setDeleting(true)
      await deletePost(deletingPost.postId, deleteReason.trim())

      // Remove from local state immediately for better UX
      setPosts((prev) => prev.filter((p) => p.postId !== deletingPost.postId))

      // Reload to ensure sync with backend
      await loadPosts()

      handleCloseDeleteDialog()
      setSnackbar({ open: true, message: 'Đã xóa bài viết và gửi thông báo đến tác giả', severity: 'success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa bài viết')
      console.error('Error deleting post:', err)
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Không thể xóa bài viết', severity: 'error' })
      // Reload on error to ensure state is correct
      await loadPosts()
    } finally {
      setDeleting(false)
    }
  }

  // Approve/Reject Handlers
  const handleOpenApproveDialog = (post: PostDto) => {
    setReviewingPost(post)
    setApproveDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false)
    setReviewingPost(null)
  }

  const handleApprovePost = async () => {
    if (!reviewingPost) return

    try {
      setReviewing(true)
      await approvePost(reviewingPost.postId)
      await loadPosts()
      handleCloseApproveDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể duyệt bài viết')
      console.error('Error approving post:', err)
    } finally {
      setReviewing(false)
    }
  }

  const handleOpenRejectDialog = (post: PostDto) => {
    setReviewingPost(post)
    setRejectComment('')
    setRejectDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false)
    setReviewingPost(null)
    setRejectComment('')
  }

  const handleRejectPost = async () => {
    if (!reviewingPost || !rejectComment.trim()) return

    try {
      setReviewing(true)
      await rejectPost(reviewingPost.postId, rejectComment.trim())
      await loadPosts()
      handleCloseRejectDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể từ chối bài viết')
      console.error('Error rejecting post:', err)
    } finally {
      setReviewing(false)
    }
  }

  // Lock/Unlock Post Handlers
  const handleOpenLockDialog = (post: PostDto) => {
    setLockingPostData(post)
    setLockReason('')
    setLockDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseLockDialog = () => {
    setLockDialogOpen(false)
    setLockingPostData(null)
    setLockReason('')
  }

  const handleLockPost = async () => {
    if (!lockingPostData || !lockReason.trim()) {
      setError('Vui lòng nhập lý do khóa bài viết')
      return
    }

    try {
      setLockingPost((prev) => new Set(prev).add(lockingPostData.postId))
      await lockPost(lockingPostData.postId, lockReason.trim())
      await loadPosts()
      setSnackbar({ open: true, message: 'Đã khóa bài viết và gửi thông báo đến tác giả', severity: 'success' })
      handleCloseLockDialog()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể khóa bài viết'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error locking post:', err)
    } finally {
      setLockingPost((prev) => {
        const next = new Set(prev)
        next.delete(lockingPostData?.postId ?? 0)
        return next
      })
    }
  }

  const handleOpenUnlockDialog = (post: PostDto) => {
    setLockingPostData(post)
    setUnlockReason('')
    setUnlockDialogOpen(true)
    handleMenuClose(post.postId)
  }

  const handleCloseUnlockDialog = () => {
    setUnlockDialogOpen(false)
    setLockingPostData(null)
    setUnlockReason('')
  }

  const handleUnlockPost = async () => {
    if (!lockingPostData || !unlockReason.trim()) {
      setError('Vui lòng nhập lý do mở khóa bài viết')
      return
    }

    try {
      setLockingPost((prev) => new Set(prev).add(lockingPostData.postId))
      await unlockPost(lockingPostData.postId, unlockReason.trim())
      await loadPosts()
      setSnackbar({ open: true, message: 'Đã mở khóa bài viết và gửi thông báo đến tác giả', severity: 'success' })
      handleCloseUnlockDialog()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể mở khóa bài viết'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error unlocking post:', err)
    } finally {
      setLockingPost((prev) => {
        const next = new Set(prev)
        next.delete(lockingPostData?.postId ?? 0)
        return next
      })
    }
  }

  // Menu Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: number) => {
    setMenuAnchor((prev) => ({ ...prev, [postId]: event.currentTarget }))
  }

  const handleMenuClose = (postId: number) => {
    setMenuAnchor((prev) => ({ ...prev, [postId]: null }))
  }

  const canEditOrDelete = (post: PostDto) => {
    // Admin can edit/delete any post, or user can edit/delete their own posts
    if (isAdmin) return true

    if (!currentUser) return false

    // Check multiple possible user ID fields from currentUser
    const userId =
      currentUser?.id ??
      currentUser?.Id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.ID ??
      0
    const postAuthorId = post.authorId ?? 0

    // Convert to numbers for comparison (handle both string and number)
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : Number(userId)
    const authorIdNum =
      typeof postAuthorId === 'string' ? parseInt(String(postAuthorId), 10) : Number(postAuthorId)

    return userIdNum === authorIdNum && userIdNum > 0
  }

  // Admin can see menu for all posts (to lock/unlock/delete)
  const canSeeMenu = (post: PostDto) => {
    return isAdmin || canEditOrDelete(post)
  }

  // Reaction handler: chọn/bỏ reaction, gửi reactionTypeId tương ứng xuống backend
  // Optimistic update - cập nhật UI ngay lập tức, không cần chờ API
  const handleReactionClick = async (post: PostDto, reaction: ReactionKey) => {
    // Double check authentication - giống handleToggleLike
    if (!isAuthenticated || !currentUser) {
      const message = 'Vui lòng đăng nhập để bày tỏ cảm xúc'
      setError(message)
      setSnackbar({ open: true, message, severity: 'warning' })
      return
    }

    const userId = currentUser?.id ?? currentUser?.Id ?? currentUser?.userId ?? currentUser?.UserId ?? null
    if (!userId) return

    const userIdStr = String(userId)
    const reactionTypeId = REACTION_ID_MAP[reaction] ?? REACTION_ID_MAP.like
    const currentUserReaction = getCurrentUserReaction(post)
    
    // Lưu state cũ để rollback nếu có lỗi
    const previousPost = { ...post }
    const previousLikes = post.likes ? [...post.likes] : []

    // Optimistic update - cập nhật UI ngay lập tức
    setPosts((prev) => {
      return prev.map((p) => {
        if (p.postId !== post.postId) return p

        const currentLikes = p.likes || []
        const existingLikeIndex = currentLikes.findIndex(
          (like) => String(like.accountId ?? '') === userIdStr
        )

        let newLikes: PostLikeDto['likes']
        let newLikesCount = p.likesCount
        let newIsLiked = p.isLiked

        if (currentUserReaction === reaction) {
          // Nếu đã có reaction cùng loại -> unlike (xóa reaction)
          newLikes = currentLikes.filter((like) => String(like.accountId ?? '') !== userIdStr)
          newLikesCount = Math.max(0, p.likesCount - 1)
          newIsLiked = false
        } else if (existingLikeIndex >= 0) {
          // Nếu đã có reaction khác loại -> cập nhật reaction type
          newLikes = [...currentLikes]
          newLikes[existingLikeIndex] = {
            ...newLikes[existingLikeIndex],
            reactionType: reaction
          }
          // likesCount không đổi, chỉ đổi loại
          newIsLiked = true
        } else {
          // Chưa có reaction -> thêm reaction mới
          const reactionNames = ['', 'like', 'love', 'haha', 'wow', 'sad', 'angry']
          newLikes = [
            ...currentLikes,
            {
              postLikeId: `temp-${Date.now()}`, // Temporary ID, sẽ được cập nhật từ backend
              accountId: userIdStr,
              fullName: currentUser?.name ?? currentUser?.Name ?? 'Bạn',
              createdDate: new Date().toISOString(),
              reactionType: reaction
            }
          ]
          newLikesCount = p.likesCount + 1
          newIsLiked = true
        }

        return {
          ...p,
          likes: newLikes,
          likesCount: newLikesCount,
          isLiked: newIsLiked
        }
      })
    })

    // Gọi API trong background (không chờ response để cập nhật UI)
    try {
      setLikingPosts((prev) => new Set(prev).add(post.postId))
      const updatedPost = await toggleLikePost(post.postId, post, reactionTypeId)

      // Cập nhật lại với dữ liệu chính xác từ backend (để có postLikeId đúng)
      setPosts((prev) => prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p)))
    } catch (err) {
      // Rollback về state cũ nếu có lỗi
      setPosts((prev) => prev.map((p) => (p.postId === post.postId ? previousPost : p)))
      
      const errorMessage = err instanceof Error ? err.message : 'Không thể bày tỏ cảm xúc'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error toggling reaction:', err)
    } finally {
      setLikingPosts((prev) => {
        const next = new Set(prev)
        next.delete(post.postId)
        return next
      })
    }
  }

  // Comment Handlers
  const handleToggleComments = async (postId: number) => {
    const isExpanded = expandedComments.has(postId)

    if (isExpanded) {
      setExpandedComments((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    } else {
      setExpandedComments((prev) => new Set(prev).add(postId))
      // Load comments if not already loaded or force reload
      try {
        setError(null) // Clear previous errors
        console.log('[PostsManagement] Loading comments for post:', postId)
        const comments = await fetchCommentsByPost(postId)
        console.log('[PostsManagement] Loaded comments:', {
          postId,
          count: comments.length,
          comments
        })
        setPostComments((prev) => ({ ...prev, [postId]: comments }))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải bình luận'
        console.error('[PostsManagement] Error loading comments:', {
          postId,
          error: err,
          message: errorMessage
        })
        setPostComments((prev) => ({ ...prev, [postId]: [] }))
        setError(errorMessage)
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        })
      }
    }
  }

  const handleCreateComment = async (postId: number) => {
    const content = commentTexts[postId]?.trim()
    if (!content || !isAuthenticated) {
      if (!isAuthenticated) {
        setSnackbar({ open: true, message: 'Vui lòng đăng nhập để bình luận', severity: 'warning' })
      }
      return
    }

    try {
      setCreatingComment((prev) => ({ ...prev, [postId]: true }))
      setError(null) // Clear previous errors

      // Ensure comments section is expanded
      if (!expandedComments.has(postId)) {
        setExpandedComments((prev) => new Set(prev).add(postId))
      }

      console.log('[PostsManagement] Creating comment:', { postId, content })

      await createComment({
        postId: String(postId),
        content
      })

      console.log('[PostsManagement] Comment created successfully, reloading comments...')

      // Reload comments after a short delay to ensure backend has processed
      await new Promise((resolve) => setTimeout(resolve, 300))
      const comments = await fetchCommentsByPost(postId)

      console.log('[PostsManagement] Reloaded comments:', {
        postId,
        count: comments.length,
        comments
      })

      setPostComments((prev) => ({ ...prev, [postId]: comments }))

      // Clear comment text
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }))

      // Update post comment count
      setPosts((prev) =>
        prev.map((p) => (p.postId === postId ? { ...p, commentsCount: comments.length } : p))
      )

      // Show success message
      setSnackbar({ open: true, message: 'Bình luận đã được thêm', severity: 'success' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo bình luận'
      console.error('[PostsManagement] Error creating comment:', {
        postId,
        error: err,
        message: errorMessage
      })
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    } finally {
      setCreatingComment((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingComments((prev) => ({ ...prev, [commentId]: currentContent }))
  }

  const handleCancelEditComment = (commentId: string) => {
    setEditingComments((prev) => {
      const next = { ...prev }
      delete next[commentId]
      return next
    })
  }

  const handleUpdateComment = async (commentId: string, postId: number) => {
    const content = editingComments[commentId]?.trim()
    if (!content) return

    try {
      setUpdatingComment((prev) => new Set(prev).add(commentId))
      await updateComment(parseInt(commentId, 10), { content })

      // Reload comments
      const comments = await fetchCommentsByPost(postId)
      setPostComments((prev) => ({ ...prev, [postId]: comments }))

      // Clear editing state
      handleCancelEditComment(commentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật bình luận')
      console.error('Error updating comment:', err)
    } finally {
      setUpdatingComment((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleDeleteComment = async (commentId: string, postId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return

    try {
      setDeletingComment((prev) => new Set(prev).add(commentId))
      await deleteComment(parseInt(commentId, 10))

      // Reload comments
      const comments = await fetchCommentsByPost(postId)
      setPostComments((prev) => ({ ...prev, [postId]: comments }))

      // Update post comment count
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
        )
      )
      setSnackbar({ open: true, message: 'Đã xóa bình luận', severity: 'success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa bình luận')
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Không thể xóa bình luận', severity: 'error' })
      console.error('Error deleting comment:', err)
    } finally {
      setDeletingComment((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  // Lock/Unlock Comment Handlers
  const handleOpenLockCommentDialog = (comment: PostComment, postId: number) => {
    setLockingCommentData({ comment, postId })
    setLockCommentReason('')
    setLockCommentDialogOpen(true)
  }

  const handleCloseLockCommentDialog = () => {
    setLockCommentDialogOpen(false)
    setLockingCommentData(null)
    setLockCommentReason('')
  }

  const handleLockComment = async () => {
    if (!lockingCommentData || !lockCommentReason.trim()) {
      setError('Vui lòng nhập lý do khóa bình luận')
      return
    }

    const commentId = getCommentId(lockingCommentData.comment)
    try {
      setLockingComment((prev) => new Set(prev).add(commentId))
      await lockComment(parseInt(commentId, 10), lockCommentReason.trim())
      
      // Reload comments
      const comments = await fetchCommentsByPost(lockingCommentData.postId)
      setPostComments((prev) => ({ ...prev, [lockingCommentData.postId]: comments }))
      
      setSnackbar({ open: true, message: 'Đã khóa bình luận và gửi thông báo đến tác giả', severity: 'success' })
      handleCloseLockCommentDialog()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể khóa bình luận'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error locking comment:', err)
    } finally {
      setLockingComment((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleOpenUnlockCommentDialog = (comment: PostComment, postId: number) => {
    setLockingCommentData({ comment, postId })
    setUnlockCommentReason('')
    setUnlockCommentDialogOpen(true)
  }

  const handleCloseUnlockCommentDialog = () => {
    setUnlockCommentDialogOpen(false)
    setLockingCommentData(null)
    setUnlockCommentReason('')
  }

  const handleUnlockComment = async () => {
    if (!lockingCommentData || !unlockCommentReason.trim()) {
      setError('Vui lòng nhập lý do mở khóa bình luận')
      return
    }

    const commentId = getCommentId(lockingCommentData.comment)
    try {
      setLockingComment((prev) => new Set(prev).add(commentId))
      await unlockComment(parseInt(commentId, 10), unlockCommentReason.trim())
      
      // Reload comments
      const comments = await fetchCommentsByPost(lockingCommentData.postId)
      setPostComments((prev) => ({ ...prev, [lockingCommentData.postId]: comments }))
      
      setSnackbar({ open: true, message: 'Đã mở khóa bình luận và gửi thông báo đến tác giả', severity: 'success' })
      handleCloseUnlockCommentDialog()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể mở khóa bình luận'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error unlocking comment:', err)
    } finally {
      setLockingComment((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const canEditOrDeleteComment = (comment: PostComment) => {
    if (!isAuthenticated) return false
    // User can edit/delete their own comments
    const commentAuthorId = comment.authorId ?? comment.authorID ?? 0
    const userId = currentUser?.id ?? currentUser?.userId ?? 0
    return commentAuthorId === userId
  }

  // Admin can delete/lock/unlock any comment
  const canAdminManageComment = (comment: PostComment) => {
    return isAdmin && isAuthenticated
  }

  const getCommentId = (comment: PostComment): string => {
    return comment.postCommentId ?? String(comment.id ?? 0)
  }

  const getCommentAuthorAvatar = (comment: PostComment): string | undefined => {
    // Ưu tiên avatar lấy trực tiếp từ dữ liệu comment (Author từ backend)
    if (comment.authorAvatar && comment.authorAvatar.trim() !== '') {
      return comment.authorAvatar
    }

    // Nếu là comment của current user thì dùng avatar trong thông tin user hiện tại
    if (currentUser) {
      const commentAuthorId = comment.authorId ?? comment.authorID
      const currentUserId =
        currentUser.id ??
        currentUser.Id ??
        currentUser.userId ??
        currentUser.UserId ??
        currentUser.ID ??
        null

      if (commentAuthorId && currentUserId && String(commentAuthorId) === String(currentUserId)) {
        const userAvatar = (currentUser as any).avatar || (currentUser as any).Avatar
        if (typeof userAvatar === 'string' && userAvatar.trim() !== '') {
          return userAvatar
        }
      }
    }

    return undefined
  }

  const getCommentAuthorName = (comment: PostComment): string => {
    return comment.fullName ?? comment.authorName ?? 'Người dùng'
  }

  const getCommentDate = (comment: PostComment): string => {
    return comment.createdDate ?? comment.createdAt ?? ''
  }

  const getCommentLikesCount = (comment: PostComment): number => {
    return Array.isArray(comment.likes) ? comment.likes.length : 0
  }

  const isCommentLikedByCurrentUser = (comment: PostComment): boolean => {
    if (!currentUser || !Array.isArray(comment.likes) || comment.likes.length === 0) return false
    const currentUserId =
      currentUser?.id ??
      currentUser?.Id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.ID ??
      null
    if (!currentUserId) return false
    const currentUserIdStr = String(currentUserId)
    return comment.likes!.some((like) => String(like.accountId ?? '') === currentUserIdStr)
  }

  const handleToggleCommentLike = async (postId: number, comment: PostComment) => {
    if (!isAuthenticated || !currentUser) {
      const message = 'Vui lòng đăng nhập để thích bình luận'
      setSnackbar({ open: true, message, severity: 'warning' })
      return
    }

    const commentId = getCommentId(comment)
    try {
      setLikingComments((prev) => new Set(prev).add(commentId))

      // Reload comments cho post này để đồng bộ likes
      const comments = await fetchCommentsByPost(postId)
      setPostComments((prev) => ({ ...prev, [postId]: comments }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể thích bình luận'
      setError(errorMessage)
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
      console.error('Error toggling comment like:', err)
    } finally {
      setLikingComments((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          bgcolor: 'white',
          p: 2,
          borderRadius: 2,
          boxShadow: 1
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Quản lý Bài viết
        </Typography>
        {isAuthenticated && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              borderRadius: 2,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Tạo bài viết mới
          </Button>
        )}
      </Box>

      {/* Search and Filter */}
      <Box mb={3} display="flex" gap={2}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm bài viết..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{
            borderRadius: 2,
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main'
              }
            }
          }}
        />
        {isAdmin && (
          <FormControl sx={{ minWidth: 150, bgcolor: 'white' }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">Tất cả</MenuItem>
              <MenuItem value="Pending">Đang chờ</MenuItem>
              <MenuItem value="Approved">Đã duyệt</MenuItem>
              <MenuItem value="Rejected">Đã từ chối</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography textAlign="center" color="text.secondary" py={4}>
              {searchText || statusFilter !== 'All'
                ? 'Không tìm thấy bài viết nào'
                : 'Chưa có bài viết nào'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {filteredPosts.map((post) => (
            <Card
              key={post.postId}
              sx={{
                borderRadius: 2,
                bgcolor: 'white',
                boxShadow: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar
                      src={(() => {
                        // Nếu post là của current user, dùng avatar từ userInfo
                        const currentUserId =
                          currentUser?.id ||
                          currentUser?.Id ||
                          currentUser?.userId ||
                          currentUser?.UserId
                        const postAuthorId = post.authorId
                        if (
                          currentUserId &&
                          postAuthorId &&
                          String(currentUserId) === String(postAuthorId)
                        ) {
                          // Dùng avatar từ userInfo
                          const userAvatar = currentUser?.avatar || currentUser?.Avatar
                          if (userAvatar && userAvatar.trim() !== '') {
                            // Nếu là URL đầy đủ, dùng trực tiếp
                            if (
                              userAvatar.startsWith('http://') ||
                              userAvatar.startsWith('https://')
                            ) {
                              return userAvatar
                            }
                            // Nếu là base64, dùng trực tiếp
                            if (userAvatar.startsWith('data:image/')) {
                              return userAvatar
                            }
                          }
                        }
                        // Nếu không phải post của current user hoặc không có avatar trong userInfo, dùng post.authorAvatar
                        return post.authorAvatar
                      })()}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {post.authorName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="text.primary"
                        mb={0.5}
                      >
                        {post.authorName}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={post.authorRole}
                          size="small"
                          color={getRoleColor(post.authorRole)}
                          sx={{ fontWeight: 'medium' }}
                        />
                        <Chip
                          label={post.status}
                          size="small"
                          color={getStatusColor(post.status)}
                          sx={{ fontWeight: 'medium' }}
                        />
                        {post.isLocked && (
                          <Chip
                            icon={<LockIcon sx={{ fontSize: '0.875rem !important' }} />}
                            label="Đã khóa"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 'medium' }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {formatTimeAgo(post.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Menu button - luôn hiển thị cho Admin, hoặc cho user sở hữu bài viết */}
                  {(isAdmin || canEditOrDelete(post)) && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, post.postId)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      title="Tùy chọn"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Box>

                {/* Title */}
                {post.title && (
                  <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
                    {post.title}
                  </Typography>
                )}

                {/* Content */}
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2,
                    whiteSpace: 'pre-wrap',
                    color: 'text.primary',
                    lineHeight: 1.7,
                    fontSize: '1rem'
                  }}
                >
                  {post.content}
                </Typography>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <Box mb={2}>
                    <ImageList cols={3} gap={8} sx={{ mb: 0 }}>
                      {post.images
                        .filter((img) => {
                          if (!img || typeof img !== 'string') return false
                          const trimmed = img.trim()
                          return trimmed !== '' && trimmed.length > 10
                        })
                        .map((image, index) => {
                          let imageSrc = image.trim()

                          // If it's already a data URL or HTTP(S) URL, use as is
                          if (imageSrc.startsWith('data:image/')) {
                            // Validate it has base64 data
                            if (!imageSrc.includes('base64,')) {
                              return null
                            }
                          } else if (
                            imageSrc.startsWith('http://') ||
                            imageSrc.startsWith('https://')
                          ) {
                            // HTTP(S) URL, use as is
                          } else {
                            // Assume it's base64 without prefix
                            const base64Pattern = /^[A-Za-z0-9+/=\s]+$/
                            const cleaned = imageSrc.replace(/\s/g, '')

                            if (base64Pattern.test(cleaned) && cleaned.length > 50) {
                              imageSrc = `data:image/jpeg;base64,${cleaned}`
                            } else {
                              return null
                            }
                          }

                          return (
                            <ImageListItem key={`${post.postId}-img-${index}`}>
                              <img
                                src={imageSrc}
                                alt={`Post ${post.postId} - ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '12px',
                                  border: '2px solid #e0e0e0',
                                  backgroundColor: '#f5f5f5'
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                                loading="lazy"
                              />
                            </ImageListItem>
                          )
                        })
                        .filter(Boolean)}
                    </ImageList>
                  </Box>
                )}

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
                    {post.hashtags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={`#${tag}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 2, bgcolor: 'grey.200' }} />

                <Divider sx={{ my: 2, bgcolor: 'grey.200' }} />

                {/* Actions - Reaction button + comments */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {/* Nút reaction chính (giống Facebook like) + popup nhiều reaction khi hover */}
                  <Box
                    position="relative"
                    onMouseEnter={() => showReactionMenu(post.postId)}
                    onMouseLeave={() => scheduleHideReactionMenu(post.postId)}
                  >
                    {/* Nút chính - hiển thị reaction hiện tại của user (nếu có) */}
                    <IconButton
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleReactionClick(post, 'like')
                      }}
                      disabled={likingPosts.has(post.postId)}
                      title={
                        !isAuthenticated
                          ? 'Vui lòng đăng nhập để bày tỏ cảm xúc'
                          : post.isLiked
                            ? 'Bỏ cảm xúc'
                            : 'Thích'
                      }
                      sx={{
                        color: post.isLiked ? 'error.main' : 'text.secondary',
                        opacity: !isAuthenticated ? 0.5 : 1,
                        cursor: !isAuthenticated ? 'not-allowed' : 'pointer',
                        '&:hover': {
                          bgcolor: post.isLiked ? 'error.light' : 'grey.100',
                          color: post.isLiked ? 'error.dark' : 'error.main'
                        },
                        '&.Mui-disabled': {
                          opacity: 0.3
                        }
                      }}
                    >
                      {(() => {
                        const userReaction = getCurrentUserReaction(post)
                        const display = getReactionDisplay(userReaction)
                        return (
                          <span style={{ fontSize: '1.6rem' }} aria-label={display.label}>
                            {display.emoji}
                          </span>
                        )
                      })()}
                    </IconButton>

                    {/* Popup reaction khi hover */}
                    {reactionMenuPostId === post.postId && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          mb: 0.5,
                          px: 0.75,
                          py: 0.5,
                          bgcolor: 'background.paper',
                          borderRadius: 999,
                          boxShadow: 3,
                          display: 'flex',
                          gap: 0.5,
                          zIndex: 10,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {REACTIONS.map((reaction) => (
                          <IconButton
                            key={reaction.key}
                            size="small"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleReactionClick(post, reaction.key)
                            }}
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: '1.2rem'
                            }}
                          >
                            <span aria-label={reaction.label}>{reaction.emoji}</span>
                          </IconButton>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="medium"
                    onClick={() => {
                      if (post.likesCount > 0) {
                        setSelectedPostLikes(post.likes || [])
                        setSelectedPostTitle(post.title || 'Bài viết')
                        setLikesDialogOpen(true)
                      }
                    }}
                    sx={{
                      cursor: post.likesCount > 0 ? 'pointer' : 'default',
                      '&:hover':
                        post.likesCount > 0
                          ? {
                              textDecoration: 'underline',
                              color: 'primary.main'
                            }
                          : {}
                    }}
                  >
                    {post.likesCount} lượt thích
                  </Typography>

                  <IconButton
                    onClick={() => handleToggleComments(post.postId)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <CommentIcon />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {post.commentsCount} bình luận
                  </Typography>
                </Box>

                {/* Comments Section */}
                {expandedComments.has(post.postId) && (
                  <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                    {/* Comment Input */}
                    {isAuthenticated && (
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Viết bình luận..."
                          value={commentTexts[post.postId] || ''}
                          onChange={(e) =>
                            setCommentTexts((prev) => ({ ...prev, [post.postId]: e.target.value }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleCreateComment(post.postId)
                            }
                          }}
                          sx={{ bgcolor: 'background.default' }}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleCreateComment(post.postId)}
                          disabled={
                            !commentTexts[post.postId]?.trim() || creatingComment[post.postId]
                          }
                        >
                          {creatingComment[post.postId] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </Box>
                    )}

                    {/* Comments List */}
                    {postComments[post.postId] && postComments[post.postId].length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={2}>
                        {postComments[post.postId].map((comment) => {
                          const commentId = getCommentId(comment)
                          const isEditing = editingComments[commentId] !== undefined
                          const canEdit = canEditOrDeleteComment(comment)
                          const commentAuthorId = comment.authorId ?? comment.authorID ?? 0
                          const userId = currentUser?.id ?? currentUser?.userId ?? currentUser?.Id ?? currentUser?.UserId ?? 0
                          const isCommentOwner = commentAuthorId === userId

                          return (
                            <Box
                              key={commentId}
                              sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1, position: 'relative' }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                mb={1}
                              >
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Avatar
                                    src={getCommentAuthorAvatar(comment)}
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: 'primary.main',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {getCommentAuthorName(comment).charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="bold"
                                      color="text.primary"
                                    >
                                      {getCommentAuthorName(comment)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatTimeAgo(getCommentDate(comment))}
                                    </Typography>
                                  </Box>
                                </Box>
                                {/* Action buttons - Always show for Admin, show for user if own comment */}
                                {/* Positioned at top right corner */}
                                <Box 
                                  display="flex" 
                                  gap={0.5} 
                                  alignItems="center"
                                  sx={{ 
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 1
                                  }}
                                >
                                  {/* User can edit own comment */}
                                  {isCommentOwner && !isEditing && (
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleStartEditComment(commentId, comment.content)
                                      }
                                      disabled={comment.isLocked}
                                      title={comment.isLocked ? 'Bình luận đã bị khóa' : 'Chỉnh sửa'}
                                      sx={{ 
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover' }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  {/* Admin can lock/unlock any comment - Always visible for Admin */}
                                  {isAdmin && !isEditing && (
                                    <>
                                      {comment.isLocked ? (
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenUnlockCommentDialog(comment, post.postId)}
                                          disabled={lockingComment.has(commentId)}
                                          title="Mở khóa bình luận"
                                          sx={{ 
                                            color: 'success.main',
                                            bgcolor: 'background.paper',
                                            '&:hover': { bgcolor: 'action.hover' }
                                          }}
                                        >
                                          {lockingComment.has(commentId) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <LockOpenIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      ) : (
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenLockCommentDialog(comment, post.postId)}
                                          disabled={lockingComment.has(commentId)}
                                          title="Khóa bình luận"
                                          sx={{ 
                                            color: 'warning.main',
                                            bgcolor: 'background.paper',
                                            '&:hover': { bgcolor: 'action.hover' }
                                          }}
                                        >
                                          {lockingComment.has(commentId) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <LockIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      )}
                                    </>
                                  )}
                                  {/* User can delete own comment, Admin can delete any comment */}
                                  {(isCommentOwner || isAdmin) && !isEditing && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteComment(commentId, post.postId)}
                                      disabled={deletingComment.has(commentId)}
                                      sx={{ 
                                        color: 'error.main',
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover' }
                                      }}
                                      title="Xóa bình luận"
                                    >
                                      {deletingComment.has(commentId) ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <DeleteIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>

                              {isEditing ? (
                                <Box display="flex" gap={1} alignItems="flex-start">
                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    value={editingComments[commentId]}
                                    onChange={(e) =>
                                      setEditingComments((prev) => ({
                                        ...prev,
                                        [commentId]: e.target.value
                                      }))
                                    }
                                    sx={{ bgcolor: 'white' }}
                                    disabled={comment.isLocked}
                                  />
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleUpdateComment(commentId, post.postId)}
                                    disabled={updatingComment.has(commentId) || comment.isLocked}
                                  >
                                    {updatingComment.has(commentId) ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <CheckCircleIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCancelEditComment(commentId)}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <>
                                  {comment.isLocked && (
                                    <Chip
                                      icon={<LockIcon sx={{ fontSize: '0.75rem !important' }} />}
                                      label="Đã khóa"
                                      size="small"
                                      color="error"
                                      sx={{ mb: 1, fontSize: '0.7rem' }}
                                    />
                                  )}
                                  <Typography
                                    variant="body2"
                                    color="text.primary"
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                  >
                                    {comment.content}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleToggleCommentLike(post.postId, comment)}
                                      disabled={!isAuthenticated || likingComments.has(commentId)}
                                      sx={{
                                        color: isCommentLikedByCurrentUser(comment)
                                          ? 'error.main'
                                          : 'text.secondary'
                                      }}
                                    >
                                      <FavoriteIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="caption" color="text.secondary">
                                      {getCommentLikesCount(comment)} lượt thích
                                    </Typography>
                                  </Box>
                                </>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        Chưa có bình luận nào
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>

              {/* Menu - Admin luôn thấy menu với các nút Xóa/Khóa/Mở khóa */}
              <Menu
                anchorEl={menuAnchor[post.postId]}
                open={Boolean(menuAnchor[post.postId])}
                onClose={() => handleMenuClose(post.postId)}
              >
                {/* Duyệt/Từ chối - chỉ hiển thị cho Admin khi bài viết đang Pending */}
                {isAdmin && post.status === 'Pending' && (
                  <>
                    <MenuItem onClick={() => handleOpenApproveDialog(post)}>
                      <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" color="success" />
                      Duyệt bài viết
                    </MenuItem>
                    <MenuItem onClick={() => handleOpenRejectDialog(post)}>
                      <CancelIcon sx={{ mr: 1 }} fontSize="small" color="error" />
                      Từ chối
                    </MenuItem>
                    <Divider />
                  </>
                )}
                
                {/* Khóa/Mở khóa - Admin luôn thấy */}
                {isAdmin && (
                  <>
                    {post.isLocked ? (
                      <MenuItem
                        onClick={() => handleOpenUnlockDialog(post)}
                        disabled={lockingPost.has(post.postId)}
                      >
                        <LockOpenIcon sx={{ mr: 1 }} fontSize="small" color="success" />
                        Mở khóa bài viết
                      </MenuItem>
                    ) : (
                      <MenuItem
                        onClick={() => handleOpenLockDialog(post)}
                        disabled={lockingPost.has(post.postId)}
                      >
                        <LockIcon sx={{ mr: 1 }} fontSize="small" color="warning" />
                        Khóa bài viết
                      </MenuItem>
                    )}
                  </>
                )}
                
                {/* Xóa - Admin luôn thấy, user chỉ thấy bài viết của mình */}
                {isAdmin && (
                  <MenuItem
                    onClick={() => handleOpenDeleteDialog(post)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                    Xóa bài viết
                  </MenuItem>
                )}
                
                {/* Chỉnh sửa/Xóa - chỉ cho user sở hữu bài viết (không phải Admin) */}
                {!isAdmin && canEditOrDelete(post) && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => handleOpenEditDialog(post)}>
                      <EditIcon sx={{ mr: 1 }} fontSize="small" />
                      Chỉnh sửa
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleOpenDeleteDialog(post)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                      Xóa
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Tạo bài viết mới
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <TextField
            fullWidth
            label="Tiêu đề"
            placeholder="Nhập tiêu đề bài viết..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{
              mb: 2,
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Nội dung"
            placeholder="Nhập nội dung bài viết..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            sx={{
              mb: 2,
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />
          <Box mb={2}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="create-image-upload"
              type="file"
              multiple
              onChange={handleImageSelect}
            />
            <label htmlFor="create-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.light',
                    color: 'white'
                  }
                }}
              >
                Thêm hình ảnh
              </Button>
            </label>
          </Box>
          {newImagePreviews.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {newImagePreviews.map((preview, index) => (
                <Box
                  key={index}
                  position="relative"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'primary.light'
                  }}
                >
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeNewImage(index)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'error.dark',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseCreateDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={
              creating || (!newTitle.trim() && !newContent.trim() && newImages.length === 0)
            }
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', fontWeight: 'bold' }}>
          Chỉnh sửa bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <TextField
            fullWidth
            label="Tiêu đề"
            placeholder="Nhập tiêu đề bài viết..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{
              mb: 2,
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'secondary.main'
                }
              }
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Nội dung"
            placeholder="Nhập nội dung bài viết..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{
              mb: 2,
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'secondary.main'
                }
              }
            }}
          />
          <Box mb={2}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="edit-image-upload"
              type="file"
              multiple
              onChange={handleEditImageSelect}
            />
            <label htmlFor="edit-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.dark',
                    bgcolor: 'secondary.light',
                    color: 'white'
                  }
                }}
              >
                Thêm hình ảnh mới
              </Button>
            </label>
          </Box>
          {(editImages.length > 0 || editNewImagePreviews.length > 0) && (
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {editImages.map((image, index) => (
                <Box
                  key={`existing-${index}`}
                  position="relative"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'secondary.light'
                  }}
                >
                  <img
                    src={
                      image.startsWith('data:image/') || image.startsWith('http')
                        ? image
                        : `data:image/jpeg;base64,${image}`
                    }
                    alt={`Existing ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeEditImage(index, false)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'error.dark',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {editNewImagePreviews.map((preview, index) => (
                <Box
                  key={`new-${index}`}
                  position="relative"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'primary.light'
                  }}
                >
                  <img
                    src={preview}
                    alt={`New ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeEditImage(index, true)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'error.dark',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdatePost}
            variant="contained"
            disabled={
              updating ||
              (!editTitle.trim() &&
                !editContent.trim() &&
                editImages.length === 0 &&
                editNewImages.length === 0)
            }
            sx={{
              bgcolor: 'secondary.main',
              '&:hover': {
                bgcolor: 'secondary.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {updating ? <CircularProgress size={20} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
          Xác nhận xóa bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lý do xóa (bắt buộc)"
            placeholder="Nhập lý do xóa bài viết..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            required
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'error.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleDeletePost}
            variant="contained"
            disabled={deleting || !deleteReason.trim()}
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lock Dialog */}
      <Dialog
        open={lockDialogOpen}
        onClose={handleCloseLockDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white', fontWeight: 'bold' }}>
          Khóa bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Bạn có chắc chắn muốn khóa bài viết này? Lý do sẽ được gửi đến tác giả qua email và thông báo.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lý do khóa (bắt buộc)"
            placeholder="Nhập lý do khóa bài viết..."
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            required
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'warning.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseLockDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleLockPost}
            variant="contained"
            disabled={lockingPost.has(lockingPostData?.postId ?? 0) || !lockReason.trim()}
            sx={{
              bgcolor: 'warning.main',
              '&:hover': {
                bgcolor: 'warning.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {lockingPost.has(lockingPostData?.postId ?? 0) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Khóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog
        open={unlockDialogOpen}
        onClose={handleCloseUnlockDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
          Mở khóa bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Bạn có chắc chắn muốn mở khóa bài viết này? Lý do sẽ được gửi đến tác giả qua email và thông báo.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lý do mở khóa (bắt buộc)"
            placeholder="Nhập lý do mở khóa bài viết..."
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            required
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'success.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseUnlockDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleUnlockPost}
            variant="contained"
            disabled={lockingPost.has(lockingPostData?.postId ?? 0) || !unlockReason.trim()}
            sx={{
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {lockingPost.has(lockingPostData?.postId ?? 0) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Mở khóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={handleCloseApproveDialog}
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
          Duyệt bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem' }}>
            Bạn có chắc chắn muốn duyệt bài viết này?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseApproveDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleApprovePost}
            variant="contained"
            disabled={reviewing}
            sx={{
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {reviewing ? <CircularProgress size={20} color="inherit" /> : 'Duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleCloseRejectDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
          Từ chối bài viết
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Vui lòng nhập lý do từ chối:
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Nhập lý do từ chối..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'error.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseRejectDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleRejectPost}
            variant="contained"
            disabled={reviewing || !rejectComment.trim()}
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {reviewing ? <CircularProgress size={20} color="inherit" /> : 'Từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Likes Dialog */}
      <Dialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle
          sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Người đã thả cảm xúc
            </Typography>
            <IconButton
              onClick={() => setLikesDialogOpen(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 2 }}>
          {selectedPostLikes && selectedPostLikes.length > 0 ? (
            <Box>
              {selectedPostLikes.map((like, index) => {
                // Lấy reaction type từ like object
                const reactionType = (like.reactionType || 'like').toLowerCase() as ReactionKey
                const reaction = REACTIONS.find(r => r.key === reactionType) || REACTIONS[0] // Default to 'like'
                
                return (
                  <Box
                    key={like.postLikeId || index}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    py={1.5}
                    sx={{
                      borderBottom: index < selectedPostLikes.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {like.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {like.fullName || 'Người dùng'}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '1.2rem',
                            lineHeight: 1
                          }}
                          title={reaction.label}
                        >
                          {reaction.emoji}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(like.createdDate)}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <LikeBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Chưa có ai thả cảm xúc cho bài viết này
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Lock Comment Dialog */}
      <Dialog
        open={lockCommentDialogOpen}
        onClose={handleCloseLockCommentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white', fontWeight: 'bold' }}>
          Khóa bình luận
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Bạn có chắc chắn muốn khóa bình luận này? Lý do sẽ được gửi đến tác giả qua thông báo.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lý do khóa (bắt buộc)"
            placeholder="Nhập lý do khóa bình luận..."
            value={lockCommentReason}
            onChange={(e) => setLockCommentReason(e.target.value)}
            required
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'warning.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseLockCommentDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleLockComment}
            variant="contained"
            disabled={lockingComment.has(getCommentId(lockingCommentData?.comment ?? {} as PostComment)) || !lockCommentReason.trim()}
            sx={{
              bgcolor: 'warning.main',
              '&:hover': {
                bgcolor: 'warning.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {lockingComment.has(getCommentId(lockingCommentData?.comment ?? {} as PostComment)) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Khóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlock Comment Dialog */}
      <Dialog
        open={unlockCommentDialogOpen}
        onClose={handleCloseUnlockCommentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
          Mở khóa bình luận
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default', pt: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '1rem', mb: 2 }}>
            Bạn có chắc chắn muốn mở khóa bình luận này? Lý do sẽ được gửi đến tác giả qua thông báo.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lý do mở khóa (bắt buộc)"
            placeholder="Nhập lý do mở khóa bình luận..."
            value={unlockCommentReason}
            onChange={(e) => setUnlockCommentReason(e.target.value)}
            required
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'success.main'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', px: 3, pb: 2 }}>
          <Button onClick={handleCloseUnlockCommentDialog} sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button
            onClick={handleUnlockComment}
            variant="contained"
            disabled={lockingComment.has(getCommentId(lockingCommentData?.comment ?? {} as PostComment)) || !unlockCommentReason.trim()}
            sx={{
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              }
            }}
          >
            {lockingComment.has(getCommentId(lockingCommentData?.comment ?? {} as PostComment)) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Mở khóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
