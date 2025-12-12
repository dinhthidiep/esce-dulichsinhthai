import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import InfoIcon from '@mui/icons-material/Info'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type {
  CertificateType,
  AgencyCertificate,
  HostCertificate
} from '~/api/instances/RoleUpgradeApi'
import {
  approveCertificate,
  getAgencyCertificates,
  getHostCertificates,
  rejectCertificate,
  reviewCertificate
} from '~/api/instances/RoleUpgradeApi'

type CertificateStatus = 'Pending' | 'Approved' | 'Rejected' | 'Review' | string | null | undefined

type AdminRequest = {
  certificateId: number
  type: CertificateType
  applicantName: string
  applicantEmail: string
  phone: string
  businessName: string
  licenseFile: string
  status?: CertificateStatus
  createdAt?: string
  rejectComment?: string | null
}

const statusMeta: Record<
  string,
  { label: string; color: 'info' | 'warning' | 'success' | 'error'; bg: string }
> = {
  Pending: { label: 'Đang chờ duyệt', color: 'warning', bg: 'rgba(255,193,7,0.12)' },
  Approved: { label: 'Đã phê duyệt', color: 'success', bg: 'rgba(76,175,80,0.12)' },
  Rejected: { label: 'Đã từ chối', color: 'error', bg: 'rgba(244,67,54,0.12)' },
  Review: { label: 'Yêu cầu bổ sung', color: 'info', bg: 'rgba(3,169,244,0.12)' }
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const toAdminRequest = (
  certificate: AgencyCertificate | HostCertificate,
  type: CertificateType
): AdminRequest => ({
  certificateId:
    type === 'Agency'
      ? (certificate as AgencyCertificate).agencyId
      : (certificate as HostCertificate).certificateId,

  type,

  applicantName:
    type === 'Agency'
      ? ((certificate as AgencyCertificate).userName ?? '')
      : ((certificate as HostCertificate).hostName ?? ''),

  applicantEmail:
    type === 'Agency'
      ? ((certificate as AgencyCertificate).userEmail ?? '')
      : ((certificate as HostCertificate).hostEmail ?? ''),

  phone: certificate.phone,
  businessName:
    type === 'Agency'
      ? (certificate as AgencyCertificate).companyName
      : (certificate as HostCertificate).businessName,

  licenseFile:
    type === 'Agency'
      ? (certificate as AgencyCertificate).licenseFile
      : (certificate as HostCertificate).businessLicenseFile,

  status: certificate.status,
  createdAt: certificate.createdAt,
  rejectComment: certificate.rejectComment
})

export default function MainRoleUpgradeContent() {
  const [adminStatusFilter, setAdminStatusFilter] = useState<
    'All' | 'Pending' | 'Approved' | 'Rejected' | 'Review'
  >('Pending')
  const [agencyRequests, setAgencyRequests] = useState<AgencyCertificate[]>([])
  const [hostRequests, setHostRequests] = useState<HostCertificate[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    request: AdminRequest | null
    comment: string
  }>({
    open: false,
    request: null,
    comment: ''
  })
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    request: AdminRequest | null
    comment: string
  }>({
    open: false,
    request: null,
    comment: ''
  })

  const loadAdminRequests = async () => {
    setAdminLoading(true)
    setAdminError(null)
    try {
      const statusParam = adminStatusFilter === 'All' ? undefined : adminStatusFilter
      console.log('[RoleUpgrade] Loading requests with filter:', { adminStatusFilter, statusParam })
      
      const [agency, host] = await Promise.all([
        getAgencyCertificates(statusParam),
        getHostCertificates(statusParam)
      ])
      
      console.log('[RoleUpgrade] Loaded data:', { 
        agencyCount: agency.length, 
        hostCount: host.length,
        agency,
        host
      })
      
      setAgencyRequests(agency)
      setHostRequests(host)
    } catch (error) {
      console.error('[RoleUpgrade] Error loading requests:', error)
      setAdminError(error instanceof Error ? error.message : 'Không thể tải danh sách yêu cầu.')
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    loadAdminRequests()
  }, [adminStatusFilter])

  const unifiedRequests: AdminRequest[] = useMemo(() => {
    const mappedAgency = agencyRequests.map((item) => toAdminRequest(item, 'Agency'))
    const mappedHost = hostRequests.map((item) => toAdminRequest(item, 'Host'))
    return [...mappedAgency, ...mappedHost].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
  }, [agencyRequests, hostRequests])

  const handleApproveRequest = async (request: AdminRequest) => {
    try {
      await approveCertificate({ certificateId: request.certificateId, type: request.type })
      setAdminError(null)
      // Reload để cập nhật mock data (certificate sẽ biến mất sau khi approve)
      await loadAdminRequests()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể phê duyệt yêu cầu.')
    }
  }

  const handleRejectRequest = async () => {
    if (!rejectDialog.request) return
    if (!rejectDialog.comment.trim()) {
      setAdminError('Vui lòng nhập lý do từ chối.')
      return
    }
    try {
      await rejectCertificate({
        certificateId: rejectDialog.request.certificateId,
        type: rejectDialog.request.type,
        comment: rejectDialog.comment.trim()
      })
      setRejectDialog({ open: false, request: null, comment: '' })
      setAdminError(null)
      await loadAdminRequests()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể từ chối yêu cầu.')
    }
  }

  const handleReviewRequest = async () => {
    if (!reviewDialog.request) return
    if (!reviewDialog.comment.trim()) {
      setAdminError('Vui lòng nhập nội dung yêu cầu bổ sung.')
      return
    }
    try {
      await reviewCertificate({
        certificateId: reviewDialog.request.certificateId,
        type: reviewDialog.request.type,
        comment: reviewDialog.comment.trim()
      })
      setReviewDialog({ open: false, request: null, comment: '' })
      setAdminError(null)
      await loadAdminRequests()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể gửi yêu cầu bổ sung.')
    }
  }

  const canModerate = (status?: CertificateStatus) =>
    status === null || status === undefined || status === 'Pending'

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
              Danh sách yêu cầu nâng cấp vai trò
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Phê duyệt hoặc từ chối các yêu cầu chờ xử lý.
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(['All', 'Pending', 'Review', 'Approved', 'Rejected'] as const).map((status) => (
                <Chip
                  key={status}
                  label={status === 'All' ? 'Tất cả' : (statusMeta[status]?.label ?? status)}
                  color={adminStatusFilter === status ? 'primary' : 'default'}
                  variant={adminStatusFilter === status ? 'filled' : 'outlined'}
                  onClick={() => setAdminStatusFilter(status)}
                  sx={{
                    borderRadius: '999px',
                    fontWeight: adminStatusFilter === status ? 600 : 500,
                    px: 1.5
                  }}
                />
              ))}
            </Stack>
          }
        />
        <CardContent>
          {adminLoading ? (
            <Skeleton
              variant="rectangular"
              height={220}
              sx={{ borderRadius: '1.6rem', bgcolor: 'rgba(148,163,184,0.25)' }}
            />
          ) : adminError ? (
            <Alert severity="error" sx={{ borderRadius: '1.2rem' }}>
              {adminError}
            </Alert>
          ) : unifiedRequests.length === 0 ? (
            <Alert severity="info" icon={<PendingActionsIcon />}>
              Không có yêu cầu nào trong bộ lọc hiện tại.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {unifiedRequests.map((request) => {
                const meta = statusMeta[request.status ?? 'Pending'] ?? statusMeta.Pending
                return (
                  <Card
                    key={`${request.type}-${request.certificateId}`}
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
                          <Stack spacing={0.8}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar
                                sx={{
                                  bgcolor:
                                    request.type === 'Agency'
                                      ? alpha('#1976d2', 0.2)
                                      : alpha('#9c27b0', 0.2),
                                  color:
                                    request.type === 'Agency' ? 'primary.main' : 'secondary.main'
                                }}
                              >
                                {request.applicantName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  {request.applicantName}
                                </Typography>
                                <Typography sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>
                                  Yêu cầu: {request.type === 'Agency' ? 'Travel Agency' : 'Host'}
                                </Typography>
                              </Box>
                              <Chip
                                label={meta.label}
                                color={meta.color}
                                size="small"
                                sx={{ ml: 'auto' }}
                              />
                            </Stack>
                            <Typography sx={{ color: 'text.secondary' }}>
                              Doanh nghiệp: {request.businessName}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary' }}>
                              Email: {request.applicantEmail}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary' }}>
                              Phone: {request.phone || '---'}
                            </Typography>
                            <Typography sx={{ color: 'text.disabled', fontSize: '1.2rem' }}>
                              Gửi lúc: {formatDateTime(request.createdAt)}
                            </Typography>
                            {request.rejectComment && (
                              <Alert severity="warning" sx={{ mt: 1 }}>
                                Ghi chú: {request.rejectComment}
                              </Alert>
                            )}
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Stack spacing={1.2}>
                            <Button
                              variant="outlined"
                              href={request.licenseFile || '#'}
                              target="_blank"
                              rel="noreferrer"
                              startIcon={<UploadFileIcon />}
                            >
                              Giấy phép / Hồ sơ
                            </Button>
                            <Tooltip title="Phê duyệt" arrow>
                              <span>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircleIcon />}
                                  disabled={!canModerate(request.status)}
                                  onClick={() => handleApproveRequest(request)}
                                  fullWidth
                                >
                                  Phê duyệt
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Từ chối" arrow>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  disabled={!canModerate(request.status)}
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      request,
                                      comment: request.rejectComment ?? ''
                                    })
                                  }
                                  fullWidth
                                >
                                  Từ chối
                                </Button>
                              </span>
                            </Tooltip>
                            {request.status === 'Pending' && (
                              <Tooltip title="Yêu cầu bổ sung thông tin" arrow>
                                <span>
                                  <Button
                                    variant="outlined"
                                    color="info"
                                    startIcon={<InfoIcon />}
                                    onClick={() =>
                                      setReviewDialog({
                                        open: true,
                                        request,
                                        comment: ''
                                      })
                                    }
                                    fullWidth
                                  >
                                    Yêu cầu bổ sung
                                  </Button>
                                </span>
                              </Tooltip>
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

      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, request: null, comment: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Từ chối yêu cầu nâng cấp</DialogTitle>
        <DialogContent>
          {rejectDialog.request && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>{rejectDialog.request.applicantName}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Vai trò: {rejectDialog.request.type === 'Agency' ? 'Travel Agency' : 'Host'}
              </Typography>
            </Box>
          )}
          <TextField
            label="Lý do từ chối"
            multiline
            minRows={3}
            value={rejectDialog.comment}
            onChange={(event) =>
              setRejectDialog((prev) => ({
                ...prev,
                comment: event.target.value
              }))
            }
            fullWidth
            placeholder="Nhập lý do để người dùng biết cần bổ sung gì..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, request: null, comment: '' })}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleRejectRequest}>
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, request: null, comment: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yêu cầu bổ sung thông tin</DialogTitle>
        <DialogContent>
          {reviewDialog.request && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>{reviewDialog.request.applicantName}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Vai trò: {reviewDialog.request.type === 'Agency' ? 'Travel Agency' : 'Host'}
              </Typography>
            </Box>
          )}
          <TextField
            label="Nội dung yêu cầu bổ sung"
            multiline
            minRows={3}
            value={reviewDialog.comment}
            onChange={(event) =>
              setReviewDialog((prev) => ({
                ...prev,
                comment: event.target.value
              }))
            }
            fullWidth
            placeholder="Nhập nội dung yêu cầu bổ sung thông tin..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, request: null, comment: '' })}>
            Hủy
          </Button>
          <Button variant="contained" color="info" onClick={handleReviewRequest}>
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          borderRadius: '1.2rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.2))',
          color: 'common.white'
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Lưu ý</Typography>
        <Typography sx={{ fontSize: '1.3rem' }}>
          - Người dùng cần chuẩn bị giấy phép hợp lệ dưới dạng ảnh/pdf và chia sẻ đường dẫn. <br />
          - Chỉ Admin mới có quyền phê duyệt/từ chối yêu cầu nâng cấp vai trò. <br />- Sau khi phê
          duyệt, hệ thống tự động cập nhật vai trò tài khoản.
        </Typography>
      </Alert>
    </Stack>
  )
}
