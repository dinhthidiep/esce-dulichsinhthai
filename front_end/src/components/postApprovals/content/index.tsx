import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, CardContent, CardHeader, Avatar, Typography, Chip, Button,
  Stack, Alert, Skeleton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Grid, InputAdornment
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  PendingActions as PendingActionsIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import {
  getPendingPosts, approvePost, rejectPost, reviewPost,
  type PendingPost
} from '~/api/instances/PostApprovalApi'

const statusMeta: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'info'; bg: string }> = {
  Pending: { label: 'Chờ duyệt', color: 'warning', bg: 'rgba(255,193,7,0.12)' },
  Approved: { label: 'Đã duyệt', color: 'success', bg: 'rgba(76,175,80,0.12)' },
  Rejected: { label: 'Đã từ chối', color: 'error', bg: 'rgba(244,67,54,0.12)' },
  Review: { label: 'Yêu cầu sửa', color: 'info', bg: 'rgba(3,169,244,0.12)' }
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export default function PostApprovalsContent() {
  const [posts, setPosts] = useState<PendingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; post: PendingPost | null; comment: string }>({
    open: false, post: null, comment: ''
  })
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; post: PendingPost | null; comment: string }>({
    open: false, post: null, comment: ''
  })
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; post: PendingPost | null }>({
    open: false, post: null
  })
  const [imageDialog, setImageDialog] = useState<{ open: boolean; images: string[] }>({
    open: false, images: []
  })

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const query = searchQuery.toLowerCase()
    return posts.filter(post =>
      post.articleTitle?.toLowerCase().includes(query) ||
      post.postContent?.toLowerCase().includes(query) ||
      post.posterName?.toLowerCase().includes(query) ||
      post.posterId?.toString().includes(query)
    )
  }, [posts, searchQuery])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPendingPosts()
      setPosts(data)
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleApprove = async () => {
    if (!approveDialog.post) return
    try {
      setProcessingId(approveDialog.post.id)
      await approvePost(approveDialog.post.id)
      setSuccess(`Đã phê duyệt bài viết của ${approveDialog.post.posterName}`)
      setApproveDialog({ open: false, post: null })
      await loadPosts()
    } catch (err: any) {
      setError(err?.message || 'Không thể phê duyệt bài viết')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.post || !rejectDialog.comment.trim()) {
      setError('Vui lòng nhập lý do từ chối')
      return
    }
    try {
      setProcessingId(rejectDialog.post.id)
      await rejectPost(rejectDialog.post.id, rejectDialog.comment)
      setSuccess(`Đã từ chối bài viết của ${rejectDialog.post.posterName}`)
      setRejectDialog({ open: false, post: null, comment: '' })
      await loadPosts()
    } catch (err: any) {
      setError(err?.message || 'Không thể từ chối bài viết')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReview = async () => {
    if (!reviewDialog.post || !reviewDialog.comment.trim()) {
      setError('Vui lòng nhập nội dung yêu cầu chỉnh sửa')
      return
    }
    try {
      setProcessingId(reviewDialog.post.id)
      await reviewPost(reviewDialog.post.id, reviewDialog.comment)
      setSuccess(`Đã gửi yêu cầu chỉnh sửa cho ${reviewDialog.post.posterName}`)
      setReviewDialog({ open: false, post: null, comment: '' })
      await loadPosts()
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu chỉnh sửa')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          borderRadius: '1.6rem',
          boxShadow: '0 18px 45px rgba(15, 118, 110, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,250,0.98))'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Danh sách bài viết chờ duyệt
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Phê duyệt, từ chối hoặc yêu cầu chỉnh sửa các bài viết.
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={<ArticleIcon />}
                label={`${filteredPosts.length}/${posts.length} bài viết`}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: '999px', fontWeight: 600 }}
              />
              <Tooltip title="Làm mới">
                <IconButton onClick={loadPosts} disabled={loading} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <CardContent>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tiêu đề, nội dung, tên người đăng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '1rem',
                bgcolor: 'rgba(0,0,0,0.02)'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          {success && (
            <Alert severity="success" sx={{ borderRadius: '1.2rem', mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ borderRadius: '1.2rem', mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: '1.4rem', bgcolor: 'rgba(148,163,184,0.25)' }} />
              ))}
            </Stack>
          ) : filteredPosts.length === 0 ? (
            <Alert severity="info" icon={<PendingActionsIcon />} sx={{ borderRadius: '1.2rem' }}>
              {searchQuery ? `Không tìm thấy bài viết nào với từ khóa "${searchQuery}"` : 'Không có bài viết nào đang chờ duyệt.'}
            </Alert>
          ) : (
            <Stack spacing={2}>
              {filteredPosts.map((post) => {
                const meta = statusMeta[post.status ?? 'Pending'] ?? statusMeta.Pending
                return (
                  <Card
                    key={post.id}
                    variant="outlined"
                    sx={{
                      borderRadius: '1.4rem',
                      borderColor: meta.bg,
                      backgroundColor: 'rgba(255,255,255,0.96)',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.15s ease-in-out'
                      }
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                src={post.posterAvatar || undefined}
                                sx={{
                                  bgcolor: alpha('#1976d2', 0.2),
                                  color: 'primary.main',
                                  width: 48,
                                  height: 48
                                }}
                              >
                                {post.posterName?.charAt(0).toUpperCase() || 'U'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                  {post.posterName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                  ID: {post.posterId} • {formatDateTime(post.createdAt)}
                                </Typography>
                              </Box>
                              <Chip label={meta.label} color={meta.color} size="small" sx={{ fontWeight: 600 }} />
                            </Stack>

                            {post.articleTitle && (
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                                {post.articleTitle}
                              </Typography>
                            )}

                            <Box
                              sx={{
                                p: 2,
                                bgcolor: 'rgba(0,0,0,0.02)',
                                borderRadius: '1rem',
                                border: '1px solid rgba(0,0,0,0.06)'
                              }}
                            >
                              <Typography sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', fontSize: '0.95rem' }}>
                                {post.postContent?.length > 300
                                  ? `${post.postContent.substring(0, 300)}...`
                                  : post.postContent}
                              </Typography>
                            </Box>

                            {post.images && post.images.length > 0 && (
                              <Button
                                startIcon={<ImageIcon />}
                                onClick={() => setImageDialog({ open: true, images: post.images || [] })}
                                variant="outlined"
                                size="small"
                                sx={{ alignSelf: 'flex-start', borderRadius: '999px' }}
                              >
                                Xem {post.images.length} ảnh
                              </Button>
                            )}

                            {post.hashtags && post.hashtags.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {post.hashtags.map((tag, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`#${tag}`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(25,118,210,0.08)', color: 'primary.main' }}
                                  />
                                ))}
                              </Box>
                            )}

                            {post.rejectComment && (
                              <Alert severity="warning" sx={{ borderRadius: '0.8rem', mt: 1 }}>
                                Ghi chú: {post.rejectComment}
                              </Alert>
                            )}
                          </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <Stack spacing={1.2}>
                            <Tooltip title="Phê duyệt bài viết" arrow>
                              <span>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircleIcon />}
                                  disabled={processingId === post.id}
                                  onClick={() => setApproveDialog({ open: true, post })}
                                  fullWidth
                                  sx={{ borderRadius: '0.8rem', py: 1 }}
                                >
                                  {processingId === post.id ? 'Đang xử lý...' : 'Phê duyệt'}
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Từ chối bài viết" arrow>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  disabled={processingId === post.id}
                                  onClick={() => setRejectDialog({ open: true, post, comment: '' })}
                                  fullWidth
                                  sx={{ borderRadius: '0.8rem', py: 1 }}
                                >
                                  Từ chối
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Yêu cầu chỉnh sửa" arrow>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="info"
                                  startIcon={<ReviewIcon />}
                                  disabled={processingId === post.id}
                                  onClick={() => setReviewDialog({ open: true, post, comment: '' })}
                                  fullWidth
                                  sx={{ borderRadius: '0.8rem', py: 1 }}
                                >
                                  Yêu cầu sửa
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, post: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận phê duyệt</DialogTitle>
        <DialogContent>
          {approveDialog.post && (
            <Box>
              <Typography sx={{ mb: 2 }}>Bạn có chắc chắn muốn phê duyệt bài viết này?</Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(76,175,80,0.08)', borderRadius: '1rem' }}>
                <Typography sx={{ fontWeight: 600 }}>{approveDialog.post.posterName}</Typography>
                {approveDialog.post.articleTitle && (
                  <Typography sx={{ color: 'primary.main', fontWeight: 500, mt: 0.5 }}>
                    {approveDialog.post.articleTitle}
                  </Typography>
                )}
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>
                  {approveDialog.post.postContent?.substring(0, 150)}...
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApproveDialog({ open: false, post: null })} sx={{ borderRadius: '0.8rem' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processingId !== null}
            sx={{ borderRadius: '0.8rem' }}
          >
            {processingId !== null ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, post: null, comment: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Từ chối bài viết</DialogTitle>
        <DialogContent>
          {rejectDialog.post && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(244,67,54,0.05)', borderRadius: '1rem' }}>
              <Typography sx={{ fontWeight: 600 }}>{rejectDialog.post.posterName}</Typography>
              {rejectDialog.post.articleTitle && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                  {rejectDialog.post.articleTitle}
                </Typography>
              )}
            </Box>
          )}
          <TextField
            label="Lý do từ chối"
            multiline
            rows={3}
            fullWidth
            value={rejectDialog.comment}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Nhập lý do từ chối để người dùng biết..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, post: null, comment: '' })} sx={{ borderRadius: '0.8rem' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={processingId !== null}
            sx={{ borderRadius: '0.8rem' }}
          >
            {processingId !== null ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false, post: null, comment: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Yêu cầu chỉnh sửa bài viết</DialogTitle>
        <DialogContent>
          {reviewDialog.post && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(3,169,244,0.05)', borderRadius: '1rem' }}>
              <Typography sx={{ fontWeight: 600 }}>{reviewDialog.post.posterName}</Typography>
              {reviewDialog.post.articleTitle && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                  {reviewDialog.post.articleTitle}
                </Typography>
              )}
            </Box>
          )}
          <TextField
            label="Nội dung yêu cầu chỉnh sửa"
            multiline
            rows={3}
            fullWidth
            value={reviewDialog.comment}
            onChange={(e) => setReviewDialog(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Nhập nội dung cần chỉnh sửa..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewDialog({ open: false, post: null, comment: '' })} sx={{ borderRadius: '0.8rem' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleReview}
            disabled={processingId !== null}
            sx={{ borderRadius: '0.8rem' }}
          >
            {processingId !== null ? 'Đang xử lý...' : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog.open} onClose={() => setImageDialog({ open: false, images: [] })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Hình ảnh bài viết</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {imageDialog.images.map((img, idx) => (
              <Box key={idx} sx={{ width: '48%' }}>
                <img src={img} alt={`Image ${idx + 1}`} style={{ width: '100%', borderRadius: 12 }} />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImageDialog({ open: false, images: [] })} sx={{ borderRadius: '0.8rem' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
