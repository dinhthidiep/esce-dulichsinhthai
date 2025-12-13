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
  rejectCertificate
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
    'All' | 'Pending' | 'Approved' | 'Rejected'
  >('Pending')
  const [agencyRequests, setAgencyRequests] = useState<AgencyCertificate[]>([])
  const [hostRequests, setHostRequests] = useState<HostCertificate[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    request: AdminRequest | null
    comment: string
  }>({
    open: false,
    request: null,
    comment: ''
  })
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean
    request: AdminRequest | null
  }>({
    open: false,
    request: null
  })

  const loadAdminRequests = async () => {
    setAdminLoading(true)
    setAdminError(null)
    try {
      const [agency, host] = await Promise.all([
        getAgencyCertificates(adminStatusFilter === 'All' ? undefined : adminStatusFilter),
        getHostCertificates(adminStatusFilter === 'All' ? undefined : adminStatusFilter)
      ])
      setAgencyRequests(agency)
      setHostRequests(host)
    } catch (error) {
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

  const handleApproveRequest = async () => {
    if (!approveDialog.request) return
    const request = approveDialog.request
    
    try {
      setProcessingId(request.certificateId)
      await approveCertificate({ certificateId: request.certificateId, type: request.type })
      setAdminError(null)
      setAdminSuccess(`Đã phê duyệt yêu cầu nâng cấp ${request.type === 'Agency' ? 'Agency' : 'Host'} của ${request.applicantName} thành công!`)
      setApproveDialog({ open: false, request: null })
      await loadAdminRequests()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể phê duyệt yêu cầu.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectRequest = async () => {
    if (!rejectDialog.request) return
    if (!rejectDialog.comment.trim()) {
      setAdminError('Vui lòng nhập lý do từ chối.')
      return
    }
    
    const request = rejectDialog.request
    
    try {
      setProcessingId(request.certificateId)
      await rejectCertificate({
        certificateId: request.certificateId,
        type: request.type,
        comment: rejectDialog.comment.trim()
      })
      setRejectDialog({ open: false, request: null, comment: '' })
      setAdminError(null)
      setAdminSuccess(`Đã từ chối yêu cầu nâng cấp ${request.type === 'Agency' ? 'Agency' : 'Host'} của ${request.applicantName}.`)
      await loadAdminRequests()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Không thể từ chối yêu cầu.')
    } finally {
      setProcessingId(null)
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
            <Stack direction="row" spacing={1}>
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
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
          {adminSuccess && (
            <Alert 
              severity="success" 
              sx={{ borderRadius: '1.2rem', mb: 2 }}
              onClose={() => setAdminSuccess(null)}
            >
              {adminSuccess}
            </Alert>
          )}
          {adminLoading ? (
            <Skeleton
              variant="rectangular"
              height={220}
              sx={{ borderRadius: '1.6rem', bgcolor: 'rgba(148,163,184,0.25)' }}
            />
          ) : adminError ? (
            <Alert 
              severity="error" 
              sx={{ borderRadius: '1.2rem' }}
              onClose={() => setAdminError(null)}
            >
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
                                  disabled={!canModerate(request.status) || processingId === request.certificateId}
                                  onClick={() => setApproveDialog({ open: true, request })}
                                  fullWidth
                                >
                                  {processingId === request.certificateId ? 'Đang xử lý...' : 'Phê duyệt'}
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Từ chối" arrow>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  disabled={!canModerate(request.status) || processingId === request.certificateId}
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

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, request: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận phê duyệt</DialogTitle>
        <DialogContent>
          {approveDialog.request && (
            <Box>
              <Typography sx={{ mb: 1 }}>
                Bạn có chắc chắn muốn phê duyệt yêu cầu nâng cấp này không?
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(76,175,80,0.08)', borderRadius: '0.8rem', mt: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{approveDialog.request.applicantName}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '1.4rem' }}>
                  Email: {approveDialog.request.applicantEmail}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '1.4rem' }}>
                  Vai trò: {approveDialog.request.type === 'Agency' ? 'Travel Agency' : 'Host'}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '1.4rem' }}>
                  Doanh nghiệp: {approveDialog.request.businessName}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Sau khi phê duyệt, tài khoản sẽ được nâng cấp vai trò tự động.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, request: null })}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleApproveRequest}
            disabled={processingId !== null}
          >
            {processingId !== null ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
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
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRejectRequest}
            disabled={processingId !== null}
          >
            {processingId !== null ? 'Đang xử lý...' : 'Từ chối'}
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
