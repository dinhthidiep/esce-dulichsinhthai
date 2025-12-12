import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import {
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Divider
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Article as ArticleIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { fetchAllPostsPending, approvePost, rejectPost, type PostDto } from '~/api/instances/PostsApi'
import {
  getAllPendingServiceCombos,
  approveServiceCombo,
  rejectServiceCombo,
  type ServiceComboDto
} from '~/api/instances/ServiceComboApprovalApi'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ApprovalContent() {
  const [tabValue, setTabValue] = useState(0)
  const [posts, setPosts] = useState<PostDto[]>([])
  const [serviceCombos, setServiceCombos] = useState<ServiceComboDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ type: 'post' | 'servicecombo'; id: number; name: string } | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [processing, setProcessing] = useState(false)

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [postsData, combosData] = await Promise.all([
        fetchAllPostsPending(),
        getAllPendingServiceCombos()
      ])

      setPosts(postsData || [])
      setServiceCombos(combosData || [])
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể tải dữ liệu'
      setError(errorMsg)
      console.error('Error loading approval data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Handle approve
  const handleOpenApproveDialog = (type: 'post' | 'servicecombo', id: number, name: string) => {
    setSelectedItem({ type, id, name })
    setApproveDialogOpen(true)
  }

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false)
    setSelectedItem(null)
  }

  const handleApprove = async () => {
    if (!selectedItem) return

    try {
      setProcessing(true)
      setError(null)

      if (selectedItem.type === 'post') {
        await approvePost(selectedItem.id)
      } else {
        await approveServiceCombo(selectedItem.id)
      }

      handleCloseApproveDialog()
      await loadData()
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể phê duyệt'
      setError(errorMsg)
      console.error('Error approving:', err)
    } finally {
      setProcessing(false)
    }
  }

  // Handle reject
  const handleOpenRejectDialog = (type: 'post' | 'servicecombo', id: number, name: string) => {
    setSelectedItem({ type, id, name })
    setRejectComment('')
    setRejectDialogOpen(true)
  }

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false)
    setSelectedItem(null)
    setRejectComment('')
  }

  const handleReject = async () => {
    if (!selectedItem || !rejectComment.trim()) {
      setError('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      if (selectedItem.type === 'post') {
        await rejectPost(selectedItem.id, rejectComment.trim())
      } else {
        await rejectServiceCombo(selectedItem.id, rejectComment.trim())
      }

      handleCloseRejectDialog()
      await loadData()
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể từ chối'
      setError(errorMsg)
      console.error('Error rejecting:', err)
    } finally {
      setProcessing(false)
    }
  }

  const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return 'Vừa xong'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Vừa xong'
    }
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Phê duyệt yêu cầu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Duyệt và cập nhật trạng thái các đơn đăng ServiceCombo và bài viết từ người dùng
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="approval tabs">
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArticleIcon />
                <span>Bài viết ({posts.length})</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                <span>ServiceCombo ({serviceCombos.length})</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Posts Tab */}
          <TabPanel value={tabValue} index={0}>
            {posts.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 5,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Không có bài viết nào đang chờ phê duyệt
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {posts.map((post) => (
                  <Card key={post.postId} sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {post.title}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" mb={1}>
                            <Chip
                              label="Bài viết"
                              size="small"
                              color="primary"
                              icon={<ArticleIcon />}
                            />
                            <Chip
                              label={`Tác giả: ${post.authorName}`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(post.createdAt)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {post.content}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenApproveDialog('post', post.postId, post.title)}
                        >
                          Phê duyệt
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenRejectDialog('post', post.postId, post.title)}
                        >
                          Từ chối
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* ServiceCombo Tab */}
          <TabPanel value={tabValue} index={1}>
            {serviceCombos.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 5,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Không có ServiceCombo nào đang chờ phê duyệt
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {serviceCombos.map((combo) => (
                  <Card key={combo.id} sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box display="flex" gap={2} mb={2}>
                        {combo.image && (
                          <Avatar
                            src={combo.image}
                            variant="rounded"
                            sx={{ width: 120, height: 120 }}
                          />
                        )}
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {combo.name}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" mb={1} flexWrap="wrap">
                            <Chip
                              label="ServiceCombo"
                              size="small"
                              color="secondary"
                              icon={<BusinessIcon />}
                            />
                            <Chip
                              label={`Host: ${combo.hostName || 'N/A'}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${combo.price.toLocaleString('vi-VN')} VNĐ`}
                              size="small"
                              color="info"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(combo.createdAt)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {combo.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Địa chỉ: {combo.address}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenApproveDialog('servicecombo', combo.id, combo.name)}
                        >
                          Phê duyệt
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenRejectDialog('servicecombo', combo.id, combo.name)}
                        >
                          Từ chối
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 600 }}>
          Xác nhận phê duyệt
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '1.4rem' }}>
            Bạn có chắc chắn muốn phê duyệt{' '}
            <strong>{selectedItem?.type === 'post' ? 'bài viết' : 'ServiceCombo'}</strong> "{selectedItem?.name}"?
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '1.3rem', color: 'text.secondary' }}>
            Sau khi phê duyệt, {selectedItem?.type === 'post' ? 'bài viết' : 'ServiceCombo'} này sẽ hiển thị cho tất cả người dùng.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseApproveDialog}
            disabled={processing}
            sx={{ fontSize: '1.3rem', textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={processing}
            sx={{ fontSize: '1.3rem', textTransform: 'none' }}
          >
            {processing ? <CircularProgress size={20} /> : 'Xác nhận phê duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 600 }}>
          Từ chối {selectedItem?.type === 'post' ? 'bài viết' : 'ServiceCombo'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: '1.4rem' }}>
            Vui lòng nhập lý do từ chối "{selectedItem?.name}":
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            sx={{ fontSize: '1.4rem' }}
            error={!rejectComment.trim()}
            helperText={!rejectComment.trim() ? 'Lý do từ chối không được để trống' : ''}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '1.2rem' }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseRejectDialog}
            disabled={processing}
            sx={{ fontSize: '1.3rem', textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectComment.trim() || processing}
            sx={{ fontSize: '1.3rem', textTransform: 'none' }}
          >
            {processing ? <CircularProgress size={20} /> : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}


