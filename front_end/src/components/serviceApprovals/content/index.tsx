import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, CardContent, CardHeader, Typography, Chip, Button,
  Stack, Alert, Skeleton, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Grid, Avatar, TextField, InputAdornment
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as SlotIcon,
  MiscellaneousServices as ServiceIcon,
  PendingActions as PendingActionsIcon,
  Policy as PolicyIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import {
  getAllServiceCombosForAdmin, approveServiceCombo, rejectServiceCombo,
  type ServiceComboForApproval, type ServiceStatus
} from '~/api/instances/ServiceApprovalApi'

const statusMeta: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'default'; bg: string }> = {
  pending: { label: 'Chờ duyệt', color: 'warning', bg: 'rgba(255,193,7,0.12)' },
  approved: { label: 'Đã duyệt', color: 'success', bg: 'rgba(76,175,80,0.12)' },
  rejected: { label: 'Đã từ chối', color: 'error', bg: 'rgba(244,67,54,0.12)' },
  open: { label: 'Đang mở', color: 'info', bg: 'rgba(3,169,244,0.12)' },
  closed: { label: 'Đã đóng', color: 'default', bg: 'rgba(158,158,158,0.12)' }
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

export default function ServiceApprovalsContent() {
  const [services, setServices] = useState<ServiceComboForApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    service: ServiceComboForApproval | null; 
    action: 'approve' | 'reject' | null 
  }>({
    open: false, service: null, action: null
  })

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllServiceCombosForAdmin()
      setServices(data)
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  // Filter by status first, then by search query
  const filteredServices = useMemo(() => {
    let result = services
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status?.toLowerCase() === statusFilter.toLowerCase())
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.address?.toLowerCase().includes(query) ||
        s.hostName?.toLowerCase().includes(query) ||
        s.id?.toString().includes(query)
      )
    }
    
    return result
  }, [services, statusFilter, searchQuery])

  const handleApprove = async () => {
    if (!confirmDialog.service) return
    try {
      setProcessingId(confirmDialog.service.id)
      await approveServiceCombo(confirmDialog.service.id)
      setSuccess(`Đã phê duyệt dịch vụ "${confirmDialog.service.name}"`)
      setConfirmDialog({ open: false, service: null, action: null })
      await loadServices()
    } catch (err: any) {
      setError(err?.message || 'Không thể phê duyệt dịch vụ')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!confirmDialog.service) return
    try {
      setProcessingId(confirmDialog.service.id)
      await rejectServiceCombo(confirmDialog.service.id)
      setSuccess(`Đã từ chối dịch vụ "${confirmDialog.service.name}"`)
      setConfirmDialog({ open: false, service: null, action: null })
      await loadServices()
    } catch (err: any) {
      setError(err?.message || 'Không thể từ chối dịch vụ')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = services.filter(s => s.status?.toLowerCase() === 'pending').length

  const canModerate = (status?: ServiceStatus) =>
    status === null || status === undefined || status?.toLowerCase() === 'pending'

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
              Danh sách dịch vụ chờ duyệt
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Phê duyệt hoặc từ chối các dịch vụ combo từ Host.
            </Typography>
          }
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: '0.8rem' }}
                >
                  <MenuItem value="all">Tất cả ({services.length})</MenuItem>
                  <MenuItem value="pending">Chờ duyệt ({pendingCount})</MenuItem>
                  <MenuItem value="approved">Đã duyệt</MenuItem>
                  <MenuItem value="rejected">Đã từ chối</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Làm mới">
                <IconButton onClick={loadServices} disabled={loading} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
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
            placeholder="Tìm kiếm theo tên dịch vụ, địa điểm, mô tả, tên Host..."
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
                <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: '1.4rem', bgcolor: 'rgba(148,163,184,0.25)' }} />
              ))}
            </Stack>
          ) : filteredServices.length === 0 ? (
            <Alert severity="info" icon={<PendingActionsIcon />} sx={{ borderRadius: '1.2rem' }}>
              {searchQuery 
                ? `Không tìm thấy dịch vụ nào với từ khóa "${searchQuery}"` 
                : `Không có dịch vụ nào ${statusFilter !== 'all' ? `với trạng thái "${statusMeta[statusFilter]?.label || statusFilter}"` : ''}`}
            </Alert>
          ) : (
            <Stack spacing={2}>
              {filteredServices.map((service) => {
                const meta = statusMeta[service.status?.toLowerCase() ?? 'pending'] ?? statusMeta.pending
                return (
                  <Card
                    key={service.id}
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
                          <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                              <Avatar
                                sx={{
                                  bgcolor: alpha('#9c27b0', 0.15),
                                  color: 'secondary.main',
                                  width: 56,
                                  height: 56
                                }}
                              >
                                <ServiceIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
                                    {service.name}
                                  </Typography>
                                  <Chip label={meta.label} color={meta.color} size="small" sx={{ fontWeight: 600 }} />
                                </Stack>
                                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                  ID: {service.id} • Tạo lúc: {formatDateTime(service.createdAt)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Box
                              sx={{
                                p: 2,
                                bgcolor: 'rgba(0,0,0,0.02)',
                                borderRadius: '1rem',
                                border: '1px solid rgba(0,0,0,0.06)'
                              }}
                            >
                              {service.address && (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                  <LocationIcon fontSize="small" sx={{ color: 'error.main' }} />
                                  <Typography sx={{ fontSize: '0.95rem' }}>{service.address}</Typography>
                                </Stack>
                              )}

                              <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <MoneyIcon fontSize="small" sx={{ color: 'success.main' }} />
                                  <Typography sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {formatPrice(service.price)}
                                  </Typography>
                                </Stack>
                                {service.availableSlots && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <SlotIcon fontSize="small" sx={{ color: 'info.main' }} />
                                    <Typography sx={{ color: 'text.secondary' }}>
                                      {service.availableSlots} chỗ
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>

                              {service.hostName && (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                                  <PersonIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                  <Typography sx={{ fontSize: '0.9rem' }}>
                                    Host: <strong>{service.hostName}</strong>
                                    {service.hostEmail && ` (${service.hostEmail})`}
                                  </Typography>
                                </Stack>
                              )}

                              {service.description && (
                                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>
                                  {service.description.length > 200
                                    ? `${service.description.substring(0, 200)}...`
                                    : service.description}
                                </Typography>
                              )}
                            </Box>

                            {service.cancellationPolicy && (
                              <Stack direction="row" spacing={0.5} alignItems="flex-start">
                                <PolicyIcon fontSize="small" sx={{ color: 'warning.main', mt: 0.3 }} />
                                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                  Chính sách hủy: {service.cancellationPolicy}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <Stack spacing={1.2} sx={{ height: '100%', justifyContent: 'center' }}>
                            {service.image && (
                              <Box
                                component="img"
                                src={service.image}
                                alt={service.name}
                                sx={{
                                  width: '100%',
                                  height: 120,
                                  objectFit: 'cover',
                                  borderRadius: '1rem',
                                  mb: 1
                                }}
                              />
                            )}
                            
                            {canModerate(service.status) && (
                              <>
                                <Tooltip title="Phê duyệt dịch vụ" arrow>
                                  <span>
                                    <Button
                                      variant="contained"
                                      color="success"
                                      startIcon={<CheckCircleIcon />}
                                      disabled={processingId === service.id}
                                      onClick={() => setConfirmDialog({ open: true, service, action: 'approve' })}
                                      fullWidth
                                      sx={{ borderRadius: '0.8rem', py: 1 }}
                                    >
                                      {processingId === service.id ? 'Đang xử lý...' : 'Phê duyệt'}
                                    </Button>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Từ chối dịch vụ" arrow>
                                  <span>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      startIcon={<CancelIcon />}
                                      disabled={processingId === service.id}
                                      onClick={() => setConfirmDialog({ open: true, service, action: 'reject' })}
                                      fullWidth
                                      sx={{ borderRadius: '0.8rem', py: 1 }}
                                    >
                                      Từ chối
                                    </Button>
                                  </span>
                                </Tooltip>
                              </>
                            )}
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, service: null, action: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmDialog.action === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.service && (
            <Box>
              <Typography sx={{ mb: 2 }}>
                Bạn có chắc chắn muốn {confirmDialog.action === 'approve' ? 'phê duyệt' : 'từ chối'} dịch vụ này?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: confirmDialog.action === 'approve' ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)',
                  borderRadius: '1rem'
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
                  {confirmDialog.service.name}
                </Typography>
                <Stack spacing={0.5}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    Host: {confirmDialog.service.hostName || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                    Giá: {formatPrice(confirmDialog.service.price)}
                  </Typography>
                  {confirmDialog.service.address && (
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                      Địa điểm: {confirmDialog.service.address}
                    </Typography>
                  )}
                </Stack>
              </Box>
              {confirmDialog.action === 'approve' && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: '0.8rem' }}>
                  Sau khi phê duyệt, dịch vụ sẽ được hiển thị công khai cho người dùng.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog({ open: false, service: null, action: null })} sx={{ borderRadius: '0.8rem' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
            onClick={confirmDialog.action === 'approve' ? handleApprove : handleReject}
            disabled={processingId !== null}
            sx={{ borderRadius: '0.8rem' }}
          >
            {processingId !== null ? 'Đang xử lý...' : (confirmDialog.action === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
