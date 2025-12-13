import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import {
  Typography,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Chip,
  TextField,
  Button,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material'
import {
  Search as SearchIcon,
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Person as PersonIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  getAllSupportRequests,
  getMySupportRequests,
  getSupportRequestById,
  createSupportRequest,
  updateSupportRequest,
  deleteSupportRequest,
  getSupportResponses,
  createSupportResponse,
  deleteSupportResponse,
  type RequestSupportDto,
  type SupportResponseDto,
  type CreateSupportRequestDto,
  type CreateSupportResponseDto,
  type UpdateSupportRequestDto,
  type SupportStatus
} from '~/api/instances/SupportApi'
import { uploadImageToFirebase } from '~/firebaseClient'

// Helper functions
const getStatusLabel = (status?: SupportStatus): string => {
  if (!status) return 'Chờ xử lý'
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'pending':
      return 'Chờ xử lý'
    case 'inprogress':
    case 'in_progress':
      return 'Đang xử lý'
    case 'resolved':
      return 'Đã giải quyết'
    case 'closed':
      return 'Đã đóng'
    default:
      return status
  }
}

const getStatusColor = (
  status?: SupportStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  if (!status) return 'warning'
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'pending':
      return 'warning'
    case 'inprogress':
    case 'in_progress':
      return 'info'
    case 'resolved':
      return 'success'
    case 'closed':
      return 'default'
    default:
      return 'default'
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

const formatTimeAgo = (dateString?: string | null): string => {
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
    return formatDateTime(dateString)
  } catch {
    return 'Vừa xong'
  }
}

export default function MainSupportsContent() {
  // Get current user
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

  const currentUser = getCurrentUser()

  // Check if user is Admin
  const isAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.roleName === 'Admin' ||
    currentUser?.Role === 'Admin' ||
    currentUser?.RoleName === 'Admin' ||
    currentUser?.roleId === 1 ||
    currentUser?.RoleId === 1 ||
    (typeof currentUser?.role === 'string' && currentUser.role.toLowerCase() === 'admin') ||
    (typeof currentUser?.roleName === 'string' && currentUser.roleName.toLowerCase() === 'admin') ||
    (typeof currentUser?.RoleName === 'string' && currentUser.RoleName.toLowerCase() === 'admin')

  // State
  const [tickets, setTickets] = useState<RequestSupportDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'All'>('All')
  const [selectedTicket, setSelectedTicket] = useState<RequestSupportDto | null>(null)
  const [responses, setResponses] = useState<SupportResponseDto[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteResponseDialogOpen, setDeleteResponseDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<RequestSupportDto | null>(null)
  const [responseToDelete, setResponseToDelete] = useState<SupportResponseDto | null>(null)

  // Form states
  const [newContent, setNewContent] = useState('')
  const [newSupportType, setNewSupportType] = useState('')
  const [newImage, setNewImage] = useState<string | null>(null)
  const [_newImageFile, setNewImageFile] = useState<File | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyImage, setReplyImage] = useState<string | null>(null)
  const [_replyImageFile, setReplyImageFile] = useState<File | null>(null)
  const [updateStatus, setUpdateStatus] = useState<SupportStatus | ''>('')

  // Error and success states
  const [error, setError] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({})
  const [responseMenuAnchor, setResponseMenuAnchor] = useState<{
    [key: number]: HTMLElement | null
  }>({})

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  // Load tickets - wrapped in useCallback to prevent infinite loop
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let data: RequestSupportDto[]
      if (isAdmin) {
        data = await getAllSupportRequests(
          statusFilter === 'All' ? undefined : (statusFilter as string)
        )
      } else {
        data = await getMySupportRequests()
      }

      setTickets(data || [])
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể tải danh sách yêu cầu hỗ trợ'
      // Chỉ hiển thị lỗi nếu là lỗi network thực sự, không phải 404 hoặc null
      if (
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('NetworkError') ||
        errorMsg.includes('Network request failed') ||
        errorMsg.includes('kết nối đến server')
      ) {
        setError(errorMsg)
      } else {
        // Với các lỗi khác (404, null, etc.), không hiển thị lỗi, chỉ set empty array
        setError(null)
      }
      console.error('Error loading tickets:', err)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, isAdmin])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Load responses when ticket is selected
  const loadResponses = async (ticketId: number) => {
    try {
      setLoadingResponses(true)
      const data = await getSupportResponses(ticketId)
      setResponses(data)
    } catch (err: any) {
      console.error('Error loading responses:', err)
      setResponses([])
    } finally {
      setLoadingResponses(false)
    }
  }

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!searchText.trim()) {
      return tickets
    }
    const searchLower = searchText.toLowerCase()
    return tickets.filter(
      (ticket) =>
        ticket.content?.toLowerCase().includes(searchLower) ||
        ticket.userName?.toLowerCase().includes(searchLower) ||
        ticket.supportType?.toLowerCase().includes(searchLower)
    )
  }, [tickets, searchText])

  // Open detail dialog
  const handleOpenDetail = async (ticket: RequestSupportDto) => {
    setSelectedTicket(ticket)
    setDetailDialogOpen(true)
    setReplyMessage('')
    setReplyImage(null)
    setReplyImageFile(null)
    setUpdateStatus(ticket.status || '')
    await loadResponses(ticket.id)
  }

  // Close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false)
    setSelectedTicket(null)
    setResponses([])
    setReplyMessage('')
    setReplyImage(null)
    setReplyImageFile(null)
    setUpdateStatus('')
  }

  // Open create dialog
  const handleOpenCreate = () => {
    setCreateDialogOpen(true)
    setNewContent('')
    setNewSupportType('')
    setNewImage(null)
    setNewImageFile(null)
    setError(null)
  }

  // Close create dialog
  const handleCloseCreate = () => {
    setCreateDialogOpen(false)
    setNewContent('')
    setNewSupportType('')
    setNewImage(null)
    setNewImageFile(null)
    setError(null)
  }

  // Handle image upload for create
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showSnackbar('Vui lòng chọn file ảnh hợp lệ', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Kích thước ảnh không được vượt quá 5MB', 'error')
      return
    }

    try {
      // Upload ảnh yêu cầu hỗ trợ lên Firebase
      const url = await uploadImageToFirebase(file, 'supports')
      setNewImage(url)
      setNewImageFile(file)
    } catch (err) {
      console.error('Error uploading support image to Firebase:', err)
      showSnackbar('Không thể upload ảnh. Vui lòng thử lại', 'error')
    }
  }

  // Handle remove image for create
  const handleRemoveImage = () => {
    setNewImage(null)
    setNewImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle image upload for reply
  const handleReplyImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showSnackbar('Vui lòng chọn file ảnh hợp lệ', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Kích thước ảnh không được vượt quá 5MB', 'error')
      return
    }

    try {
      // Upload ảnh trong phản hồi lên Firebase
      const url = await uploadImageToFirebase(file, 'supports')
      setReplyImage(url)
      setReplyImageFile(file)
    } catch (err) {
      console.error('Error uploading reply image to Firebase:', err)
      showSnackbar('Không thể upload ảnh. Vui lòng thử lại', 'error')
    }
  }

  // Handle remove image for reply
  const handleRemoveReplyImage = () => {
    setReplyImage(null)
    setReplyImageFile(null)
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = ''
    }
  }

  // Create support request
  const handleCreateRequest = async () => {
    if (!newContent.trim()) {
      setError('Vui lòng nhập nội dung yêu cầu hỗ trợ')
      return
    }

    if (newContent.trim().length > 1000) {
      setError('Nội dung yêu cầu hỗ trợ tối đa 1000 ký tự')
      return
    }

    try {
      setError(null)
      const dto: CreateSupportRequestDto = {
        content: newContent.trim(),
        supportType: newSupportType.trim() || undefined,
        image: newImage || undefined
      }

      await createSupportRequest(dto)
      showSnackbar('Tạo yêu cầu hỗ trợ thành công', 'success')
      handleCloseCreate()
      await loadTickets()
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể tạo yêu cầu hỗ trợ'
      setError(errorMsg)
      console.error('Error creating support request:', err)
    }
  }

  // Send reply
  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      return
    }

    try {
      setError(null)
      const dto: CreateSupportResponseDto = {
        content: replyMessage.trim(),
        image: replyImage || undefined
      }

      await createSupportResponse(selectedTicket.id, dto)
      showSnackbar('Gửi phản hồi thành công', 'success')
      setReplyMessage('')
      setReplyImage(null)
      setReplyImageFile(null)
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = ''
      }

      // Reload responses
      await loadResponses(selectedTicket.id)

      // Update ticket status if it's pending
      if (selectedTicket.status === 'Pending' || selectedTicket.status === 'pending') {
        await loadTickets()
        const updatedTicket = tickets.find((t) => t.id === selectedTicket.id)
        if (updatedTicket) {
          setSelectedTicket(updatedTicket)
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể gửi phản hồi'
      setError(errorMsg)
      console.error('Error sending reply:', err)
    }
  }

  // Update ticket status
  const handleUpdateStatus = async (ticketId: number, newStatus: SupportStatus) => {
    try {
      setError(null)
      const dto: UpdateSupportRequestDto = {
        status: newStatus
      }

      await updateSupportRequest(ticketId, dto)
      showSnackbar('Cập nhật trạng thái thành công', 'success')
      setUpdateStatus(newStatus)
      await loadTickets()

      // Update selected ticket
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updated = await getSupportRequestById(ticketId)
        setSelectedTicket(updated)
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể cập nhật trạng thái'
      setError(errorMsg)
      console.error('Error updating status:', err)
    }
  }

  // Delete ticket
  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return

    try {
      setError(null)
      await deleteSupportRequest(ticketToDelete.id)
      showSnackbar('Xóa yêu cầu hỗ trợ thành công', 'success')
      setDeleteDialogOpen(false)
      setTicketToDelete(null)

      if (selectedTicket && selectedTicket.id === ticketToDelete.id) {
        handleCloseDetail()
      }

      await loadTickets()
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể xóa yêu cầu hỗ trợ'
      setError(errorMsg)
      console.error('Error deleting ticket:', err)
    }
  }

  // Delete response
  const handleDeleteResponse = async () => {
    if (!responseToDelete) return

    try {
      setError(null)
      await deleteSupportResponse(responseToDelete.id)
      showSnackbar('Xóa phản hồi thành công', 'success')
      setDeleteResponseDialogOpen(false)
      setResponseToDelete(null)

      if (selectedTicket) {
        await loadResponses(selectedTicket.id)
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể xóa phản hồi'
      setError(errorMsg)
      console.error('Error deleting response:', err)
    }
  }

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ticketId: number) => {
    setMenuAnchor({ ...menuAnchor, [ticketId]: event.currentTarget })
  }

  const handleMenuClose = (ticketId: number) => {
    setMenuAnchor({ ...menuAnchor, [ticketId]: null })
  }

  const handleResponseMenuOpen = (event: React.MouseEvent<HTMLElement>, responseId: number) => {
    setResponseMenuAnchor({ ...responseMenuAnchor, [responseId]: event.currentTarget })
  }

  const handleResponseMenuClose = (responseId: number) => {
    setResponseMenuAnchor({ ...responseMenuAnchor, [responseId]: null })
  }

  // Check if current user is the responder
  const isCurrentUserResponder = (response: SupportResponseDto): boolean => {
    return (
      currentUser?.id === response.responderId ||
      currentUser?.userId === response.responderId ||
      currentUser?.Id === response.responderId ||
      currentUser?.UserId === response.responderId
    )
  }

  // Check if current user is the ticket owner
  const isCurrentUserOwner = (ticket: RequestSupportDto): boolean => {
    return (
      currentUser?.id === ticket.userId ||
      currentUser?.userId === ticket.userId ||
      currentUser?.Id === ticket.userId ||
      currentUser?.UserId === ticket.userId
    )
  }

  // Snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header with Create Button and Filters */}
      <Box
        sx={{
          bgcolor: 'white',
          p: 2.5,
          borderRadius: 2,
          boxShadow: 1,
          mb: 3
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={2}
        >
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {isAdmin ? 'Quản lý Hỗ trợ' : 'Yêu cầu Hỗ trợ của tôi'}
          </Typography>
          {!isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                fontSize: '1.4rem',
                fontWeight: 600,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              Tạo yêu cầu mới
            </Button>
          )}
        </Box>

        {/* Search and Filter */}
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo nội dung, tên người dùng hoặc loại hỗ trợ..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'grey.500' }} />
                </InputAdornment>
              )
            }}
            sx={{
              flex: 1,
              minWidth: '200px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'grey.50',
                fontSize: '1.4rem',
                '&:hover': {
                  bgcolor: 'white'
                },
                '&.Mui-focused': {
                  bgcolor: 'white'
                }
              }
            }}
          />
          {isAdmin && (
            <FormControl
              sx={{
                minWidth: '180px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.4rem',
                  bgcolor: 'grey.50',
                  '&:hover': {
                    bgcolor: 'white'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white'
                  }
                }
              }}
            >
              <InputLabel>Lọc theo trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Lọc theo trạng thái"
                onChange={(e) => setStatusFilter(e.target.value as SupportStatus | 'All')}
              >
                <MenuItem value="All">Tất cả</MenuItem>
                <MenuItem value="Pending">Chờ xử lý</MenuItem>
                <MenuItem value="InProgress">Đang xử lý</MenuItem>
                <MenuItem value="Resolved">Đã giải quyết</MenuItem>
                <MenuItem value="Closed">Đã đóng</MenuItem>
              </Select>
            </FormControl>
          )}
          <IconButton
            onClick={loadTickets}
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 2,
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tickets List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredTickets.length === 0 ? (
              <Card
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: 2,
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {searchText || statusFilter !== 'All'
                    ? 'Không tìm thấy yêu cầu hỗ trợ nào'
                    : 'Chưa có yêu cầu hỗ trợ nào'}
                </Typography>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  onClick={() => handleOpenDetail(ticket)}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'primary.main',
                          fontSize: '1.6rem',
                          fontWeight: 600
                        }}
                      >
                        {ticket.userName?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    }
                    action={
                      (isAdmin || isCurrentUserOwner(ticket)) && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMenuOpen(e, ticket.id)
                          }}
                          sx={{
                            '&:hover': {
                              bgcolor: 'grey.100'
                            }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )
                    }
                    title={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="h6" fontWeight={600}>
                          {ticket.userName || 'Người dùng'}
                        </Typography>
                        {ticket.supportType && (
                          <Chip
                            label={ticket.supportType}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '1.1rem',
                              fontWeight: 500
                            }}
                          />
                        )}
                        <Chip
                          label={getStatusLabel(ticket.status)}
                          size="small"
                          color={getStatusColor(ticket.status)}
                          sx={{
                            height: 24,
                            fontSize: '1.1rem',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {formatTimeAgo(ticket.createdAt)}
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: ticket.responsesCount && ticket.responsesCount > 0 ? 1.5 : 0,
                        lineHeight: 1.6
                      }}
                    >
                      {ticket.content}
                    </Typography>
                    {ticket.image && (
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={ticket.image}
                          alt="Support"
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                        />
                      </Box>
                    )}
                    {ticket.responsesCount && ticket.responsesCount > 0 && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
                        <SupportAgentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                          {ticket.responsesCount} phản hồi
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Box>

          {/* Menu for each ticket */}
          {tickets.map((ticket) => (
            <Menu
              key={ticket.id}
              anchorEl={menuAnchor[ticket.id]}
              open={Boolean(menuAnchor[ticket.id])}
              onClose={() => handleMenuClose(ticket.id)}
              onClick={(e) => e.stopPropagation()}
            >
              {isAdmin && (
                <>
                  <MenuItem
                    onClick={() => {
                      handleUpdateStatus(ticket.id, 'InProgress')
                      handleMenuClose(ticket.id)
                    }}
                    disabled={ticket.status === 'InProgress' || ticket.status === 'in_progress'}
                  >
                    <CheckCircleIcon sx={{ mr: 1, fontSize: '1.6rem' }} />
                    Đánh dấu đang xử lý
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleUpdateStatus(ticket.id, 'Resolved')
                      handleMenuClose(ticket.id)
                    }}
                    disabled={ticket.status === 'Resolved' || ticket.status === 'resolved'}
                  >
                    <CheckCircleIcon sx={{ mr: 1, fontSize: '1.6rem', color: 'success.main' }} />
                    Đánh dấu đã giải quyết
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleUpdateStatus(ticket.id, 'Closed')
                      handleMenuClose(ticket.id)
                    }}
                    disabled={ticket.status === 'Closed' || ticket.status === 'closed'}
                  >
                    <CancelIcon sx={{ mr: 1, fontSize: '1.6rem' }} />
                    Đóng yêu cầu
                  </MenuItem>
                  <Divider />
                </>
              )}
              {(isAdmin || isCurrentUserOwner(ticket)) && (
                <MenuItem
                  onClick={() => {
                    setTicketToDelete(ticket)
                    setDeleteDialogOpen(true)
                    handleMenuClose(ticket.id)
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon sx={{ mr: 1, fontSize: '1.6rem' }} />
                  Xóa yêu cầu
                </MenuItem>
              )}
            </Menu>
          ))}
        </>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreate}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '2.4rem',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          Tạo yêu cầu hỗ trợ mới
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '1.2rem' }}>
              {error}
            </Alert>
          )}
          <Box className="space-y-[1.6rem]">
            <TextField
              fullWidth
              label="Loại hỗ trợ (tùy chọn)"
              placeholder="Ví dụ: Thanh toán, Đặt tour, Tài khoản..."
              value={newSupportType}
              onChange={(e) => {
                setNewSupportType(e.target.value)
                setError(null)
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.4rem',
                  bgcolor: 'grey.50',
                  '&:hover': {
                    bgcolor: 'white'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Nội dung yêu cầu *"
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value)
                setError(null)
              }}
              multiline
              rows={6}
              required
              helperText={`${newContent.length}/1000 ký tự`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.4rem',
                  bgcolor: 'grey.50',
                  '&:hover': {
                    bgcolor: 'white'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white'
                  }
                }
              }}
            />
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {newImage ? (
                <Box>
                  <Box className="relative">
                    <img
                      src={newImage}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        borderRadius: '1.2rem',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: '1.4rem',
                    py: 1.5,
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  Thêm ảnh (tùy chọn)
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button
            onClick={handleCloseCreate}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 2.5
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateRequest}
            disabled={!newContent.trim()}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Tạo yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <span>Chi tiết yêu cầu hỗ trợ</span>
          {isAdmin && selectedTicket && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={updateStatus || selectedTicket.status || 'Pending'}
                  onChange={(e) =>
                    handleUpdateStatus(selectedTicket.id, e.target.value as SupportStatus)
                  }
                  sx={{
                    borderRadius: 2,
                    fontSize: '1.4rem',
                    bgcolor: 'grey.50',
                    '&:hover': {
                      bgcolor: 'white'
                    }
                  }}
                >
                  <MenuItem value="Pending">Chờ xử lý</MenuItem>
                  <MenuItem value="InProgress">Đang xử lý</MenuItem>
                  <MenuItem value="Resolved">Đã giải quyết</MenuItem>
                  <MenuItem value="Closed">Đã đóng</MenuItem>
                </Select>
              </FormControl>
              {(selectedTicket.status === 'Pending' || selectedTicket.status === 'pending') && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    px: 2.5
                  }}
                  startIcon={<CheckCircleIcon />}
                >
                  Phê duyệt yêu cầu
                </Button>
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '1.2rem' }}>
              {error}
            </Alert>
          )}
          {selectedTicket && (
            <Box>
              {/* Ticket Info */}
              <Box className="mb-[2.4rem]">
                <Box className="flex items-center gap-[1.2rem] mb-[1.6rem]">
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }} src={undefined}>
                    {selectedTicket.userName?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Box className="flex-1">
                    <Box className="flex items-center gap-[0.8rem] flex-wrap mb-[0.4rem]">
                      <Typography className="font-semibold! text-[1.6rem]!">
                        {selectedTicket.userName || 'Người dùng'}
                      </Typography>
                      {selectedTicket.supportType && (
                        <Chip
                          label={selectedTicket.supportType}
                          size="small"
                          sx={{ height: 22, fontSize: '1.1rem' }}
                        />
                      )}
                      <Chip
                        label={getStatusLabel(selectedTicket.status)}
                        size="small"
                        color={getStatusColor(selectedTicket.status)}
                        sx={{ height: 22, fontSize: '1.1rem' }}
                      />
                    </Box>
                    <Typography className="text-[1.2rem]! text-gray-500">
                      Tạo lúc: {formatDateTime(selectedTicket.createdAt)}
                    </Typography>
                    {selectedTicket.updatedAt &&
                      selectedTicket.updatedAt !== selectedTicket.createdAt && (
                        <Typography className="text-[1.2rem]! text-gray-500">
                          Cập nhật: {formatDateTime(selectedTicket.updatedAt)}
                        </Typography>
                      )}
                  </Box>
                </Box>

                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: '1.2rem',
                    mb: 2
                  }}
                >
                  <Typography className="text-[1.4rem]! whitespace-pre-wrap">
                    {selectedTicket.content}
                  </Typography>
                </Paper>

                {selectedTicket.image && (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={selectedTicket.image}
                      alt="Support"
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Responses */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Phản hồi ({responses.length})
              </Typography>

              {loadingResponses ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress />
                </Box>
              ) : responses.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Chưa có phản hồi nào
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {responses.map((response) => {
                    const isAdminResponse = response.responderRole?.toLowerCase() === 'admin'
                    const isMyResponse = isCurrentUserResponder(response)
                    return (
                      <Box
                        key={response.id}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          flexDirection: isAdminResponse ? 'row-reverse' : 'row'
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: isAdminResponse ? 'primary.main' : 'grey.400'
                          }}
                        >
                          {isAdminResponse ? <SupportAgentIcon /> : <PersonIcon />}
                        </Avatar>
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdminResponse ? 'flex-end' : 'flex-start',
                            position: 'relative'
                          }}
                        >
                          {(isAdmin || isMyResponse) && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResponseMenuOpen(e, response.id)
                              }}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: isAdminResponse ? -8 : 'auto',
                                left: isAdminResponse ? 'auto' : -8,
                                bgcolor: 'common.white',
                                boxShadow: 1,
                                '&:hover': {
                                  bgcolor: 'grey.100'
                                }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )}
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: isAdminResponse ? 'primary.main' : 'grey.200',
                              color: isAdminResponse ? 'white' : 'text.primary',
                              borderRadius: 2,
                              maxWidth: '80%',
                              boxShadow: 1
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{
                                mb: 0.5,
                                color: isAdminResponse ? 'white' : 'text.primary'
                              }}
                            >
                              {response.responderName || (isAdminResponse ? 'Admin' : 'Người dùng')}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                                color: isAdminResponse ? 'white' : 'text.primary'
                              }}
                            >
                              {response.content}
                            </Typography>
                            {response.image && (
                              <Box sx={{ mt: 1 }}>
                                <img
                                  src={response.image}
                                  alt="Response"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                  }}
                                />
                              </Box>
                            )}
                          </Paper>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              textAlign: isAdminResponse ? 'right' : 'left',
                              mt: 0.5
                            }}
                          >
                            {formatTimeAgo(response.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              )}

              {/* Reply Input */}
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                  {isAdmin ? 'Phản hồi' : 'Gửi phản hồi'}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Nhập phản hồi của bạn..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'grey.50',
                      fontSize: '1.4rem',
                      '&:hover': {
                        bgcolor: 'white'
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white'
                      }
                    }
                  }}
                />
                <Box className="mb-[1.6rem]">
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReplyImageUpload}
                    style={{ display: 'none' }}
                  />
                  {replyImage ? (
                    <Box className="relative">
                      <img
                        src={replyImage}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          borderRadius: '1.2rem',
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        onClick={handleRemoveReplyImage}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.7)'
                          }
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      onClick={() => replyFileInputRef.current?.click()}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontSize: '1.4rem',
                        borderColor: 'grey.300',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                    >
                      Thêm ảnh (tùy chọn)
                    </Button>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim()}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    fontSize: '1.4rem',
                    fontWeight: 600
                  }}
                >
                  Gửi phản hồi
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button
            onClick={handleCloseDetail}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 2.5
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setTicketToDelete(null)
        }}
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 600 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Bạn có chắc chắn muốn xóa yêu cầu hỗ trợ này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
              setTicketToDelete(null)
            }}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 2.5
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTicket}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Response Dialog */}
      <Dialog
        open={deleteResponseDialogOpen}
        onClose={() => {
          setDeleteResponseDialogOpen(false)
          setResponseToDelete(null)
        }}
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 600 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Bạn có chắc chắn muốn xóa phản hồi này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setDeleteResponseDialogOpen(false)
              setResponseToDelete(null)
            }}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 2.5
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteResponse}
            sx={{
              textTransform: 'none',
              fontSize: '1.4rem',
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Menu */}
      {responses.map((response) => (
        <Menu
          key={response.id}
          anchorEl={responseMenuAnchor[response.id]}
          open={Boolean(responseMenuAnchor[response.id])}
          onClose={() => handleResponseMenuClose(response.id)}
        >
          {(isAdmin || isCurrentUserResponder(response)) && (
            <MenuItem
              onClick={() => {
                setResponseToDelete(response)
                setDeleteResponseDialogOpen(true)
                handleResponseMenuClose(response.id)
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1, fontSize: '1.6rem' }} />
              Xóa phản hồi
            </MenuItem>
          )}
        </Menu>
      ))}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            borderRadius: '1.2rem',
            fontSize: '1.4rem'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
