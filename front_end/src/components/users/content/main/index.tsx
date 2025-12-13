import { useState, useMemo, useEffect } from 'react'
import { getAllUsers, banAccount, unbanAccount } from '~/api/instances/AdminManaUser'
import Box from '@mui/material/Box'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Pagination,
  Stack
} from '@mui/material'
import type { ChipProps } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

type RoleType = 'Admin' | 'Host' | 'Agency' | 'Customer'
type ChipColor = NonNullable<ChipProps['color']>

// Type definition
type User = {
  id: number
  name: string
  email: string
  avatar: string | null
  phone: string | null
  dob: string | null
  gender: string | null
  address: string | null
  role: RoleType
  roleId?: number
  status: 'active' | 'blocked'
  joinDate: string
  verified: boolean
}

const DEFAULT_ROLE: RoleType = 'Customer'

const ROLE_LABELS: Record<RoleType, string> = {
  Admin: 'Admin',
  Host: 'Host',
  Agency: 'Agency',
  Customer: 'Customer'
}

const ROLE_FILTER_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'Host', label: ROLE_LABELS.Host },
  { value: 'Agency', label: ROLE_LABELS.Agency },
  { value: 'Customer', label: ROLE_LABELS.Customer }
]

const ROLE_CHIP_COLOR_MAP: Record<RoleType, ChipColor> = {
  Admin: 'warning',
  Host: 'secondary',
  Agency: 'primary',
  Customer: 'default'
}

const ROLE_ID_MAP: Record<number, RoleType> = {
  1: 'Admin',
  2: 'Host',
  3: 'Agency',
  4: 'Customer'
}

const ROLE_NAME_MAP: Record<string, RoleType> = {
  admin: 'Admin',
  host: 'Host',
  agency: 'Agency',
  'travel agency': 'Agency',
  travelagency: 'Agency',
  customer: 'Customer',
  tourist: 'Customer'
}

// Helper function to map backend user data to frontend format
const mapBackendUserToFrontend = (backendUser: any): User => {
  // Back-end đang trả PascalCase (Name, Email, Role, ...), nhưng cũng giữ fallback cho camelCase
  const rolePayload = backendUser.Role ?? backendUser.role ?? {}
  const rawRoleName =
    rolePayload?.Name ??
    rolePayload?.name ??
    backendUser.RoleName ??
    backendUser.roleName ??
    (typeof backendUser.Role === 'string' ? backendUser.Role : null) ??
    (typeof backendUser.role === 'string' ? backendUser.role : null) ??
    null

  const rawRoleId =
    backendUser.RoleId ??
    backendUser.roleId ??
    rolePayload?.Id ??
    rolePayload?.id ??
    (typeof backendUser.RoleId === 'number' ? backendUser.RoleId : null)

  const normalizedRoleName =
    typeof rawRoleName === 'string' ? rawRoleName.trim().toLowerCase() : null

  const parsedRoleId =
    typeof rawRoleId === 'string'
      ? Number.parseInt(rawRoleId, 10)
      : typeof rawRoleId === 'number'
        ? rawRoleId
        : undefined

  const normalizedRoleId =
    typeof parsedRoleId === 'number' && !Number.isNaN(parsedRoleId) ? parsedRoleId : undefined

  const roleFromName = normalizedRoleName ? ROLE_NAME_MAP[normalizedRoleName] : undefined
  const roleFromId =
    typeof normalizedRoleId === 'number' ? ROLE_ID_MAP[normalizedRoleId] : undefined
  const resolvedRole: RoleType = roleFromName ?? roleFromId ?? DEFAULT_ROLE

  // Backend trả về IS_BANNED (PascalCase với underscore) hoặc IsBanned
  const isBanned = backendUser.IS_BANNED ?? backendUser.IsBanned ?? backendUser.isBanned ?? false
  const isActive = backendUser.IsActive ?? backendUser.isActive ?? true

  const rawCreatedAt = backendUser.CreatedAt ?? backendUser.createdAt
  const joinDate = rawCreatedAt
    ? new Date(rawCreatedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const rawId =
    backendUser.Id ?? backendUser.id ?? backendUser.AccountId ?? backendUser.accountId ?? 0

  const parsedId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId

  const normalizedId = typeof parsedId === 'number' && !Number.isNaN(parsedId) ? parsedId : 0

  const rawDob = backendUser.Dob ?? backendUser.dob ?? backendUser.DOB ?? null
  const dob = rawDob
    ? typeof rawDob === 'string'
      ? rawDob
      : new Date(rawDob).toISOString().split('T')[0]
    : null

  return {
    id: normalizedId,
    name: backendUser.Name ?? backendUser.name ?? '',
    email: backendUser.Email ?? backendUser.email ?? '',
    avatar: backendUser.Avatar ?? backendUser.avatar ?? null,
    phone: backendUser.Phone ?? backendUser.phone ?? null,
    dob: dob,
    gender: backendUser.Gender ?? backendUser.gender ?? null,
    address: backendUser.Address ?? backendUser.address ?? null,
    role: resolvedRole,
    roleId: normalizedRoleId,
    status: isBanned ? 'blocked' : isActive ? 'active' : 'blocked',
    joinDate,
    verified: Boolean(isActive && !isBanned)
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'blocked':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Hoạt động'
    case 'blocked':
      return 'Khóa'
    default:
      return status
  }
}

const getRoleLabel = (role: RoleType) => ROLE_LABELS[role] ?? role

export default function MainUsersContent() {
  const [users, setUsers] = useState<User[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(5)

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [unbanReason, setUnbanReason] = useState('')

  // Helper function to reload users from API (only when necessary)
  const reloadUsersFromAPI = async (silent = false): Promise<boolean> => {
    try {
      if (!silent) setLoading(true)
      const data = await getAllUsers()

      if (!Array.isArray(data)) {
        console.warn('Reload returned non-array data:', typeof data)
        return false
      }

      if (data.length === 0) {
        console.warn('Reload returned empty array')
        return false
      }

      // Map each user individually to avoid losing all users if one fails
      const mappedUsers: User[] = []
      let hasErrors = false

      for (let i = 0; i < data.length; i++) {
        try {
          const mappedUser = mapBackendUserToFrontend(data[i])
          mappedUsers.push(mappedUser)
        } catch (mapErr: any) {
          console.error(`Failed to map user at index ${i}:`, mapErr)
          hasErrors = true
        }
      }

      if (mappedUsers.length > 0) {
        setUsers(mappedUsers)
        if (hasErrors) {
          console.warn(
            `Successfully mapped ${mappedUsers.length} out of ${data.length} users. Some users were skipped.`
          )
        }
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to reload users:', err)
      if (!silent) {
        setError(err.message || 'Không thể tải lại danh sách người dùng')
      }
      return false
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllUsers()

        // Validate data is an array
        if (!Array.isArray(data)) {
          console.error('Invalid data format from API:', typeof data, data)
          setError('Dữ liệu từ server không hợp lệ. Vui lòng thử lại sau.')
          setUsers([])
          return
        }

        // Map users data - map each user individually to avoid losing all users if one fails
        const mappedUsers: User[] = []
        let hasErrors = false

        for (let i = 0; i < data.length; i++) {
          try {
            const mappedUser = mapBackendUserToFrontend(data[i])
            mappedUsers.push(mappedUser)
          } catch (mapErr: any) {
            console.error(`Failed to map user at index ${i}:`, mapErr, data[i])
            hasErrors = true
            // Continue mapping other users instead of stopping
          }
        }

        if (mappedUsers.length > 0) {
          setUsers(mappedUsers)
          if (hasErrors) {
            console.warn(
              `Successfully mapped ${mappedUsers.length} out of ${data.length} users. Some users were skipped due to mapping errors.`
            )
          }
        } else {
          // If no users could be mapped, show error
          console.error('No users could be mapped from API response')
          setError('Không thể xử lý dữ liệu người dùng. Vui lòng thử lại sau.')
          setUsers([])
        }
      } catch (err: any) {
        console.error('Failed to load users:', err)
        setError(err.message || 'Không thể tải danh sách người dùng')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Filter users based on search text (by name and email) and selected role
  const filteredUsers = useMemo(() => {
    const searchLower = searchText.toLowerCase().trim()

    return users.filter((user) => {
      // Always exclude Admin users from the list
      if (user.role === 'Admin') {
        return false
      }

      // Search by name or email
      const matchesSearch =
        searchLower === '' ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)

      // Filter by role
      const matchesRole = selectedRole === null || user.role === selectedRole

      return matchesSearch && matchesRole
    })
  }, [users, searchText, selectedRole])

  // Calculate statistics from filtered users
  const statistics = useMemo(() => {
    const totalUsers = filteredUsers.length
    const verifiedUsers = filteredUsers.filter((u) => u.verified).length
    const blockedUsers = filteredUsers.filter((u) => u.status === 'blocked').length

    // Users mới: chỉ tính những user tham gia trong vòng 1 ngày (24 giờ)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const newUsers = filteredUsers.filter((u) => {
      const joinDate = new Date(u.joinDate)
      return joinDate >= oneDayAgo
    }).length

    return {
      total: totalUsers,
      new: newUsers,
      verified: verifiedUsers,
      blocked: blockedUsers
    }
  }, [filteredUsers])

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, page, rowsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)

  // Reset page when filter changes
  useEffect(() => {
    // Reset to page 1 when search or role filter changes
    setPage(1)
  }, [searchText, selectedRole])

  const handleRoleFilter = (role: RoleType) => {
    const newRole = role === selectedRole ? null : role
    setSelectedRole(newRole)
    // Page will reset automatically via useEffect
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    // Page will reset automatically via useEffect
  }

  // Ban account (khóa tài khoản) - mở dialog
  const handleBanAccount = (user: User) => {
    setSelectedUser(user)
    setBanReason('')
    setBanDialogOpen(true)
  }

  // Confirm ban account
  const handleConfirmBan = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setError(null)

    try {
      const reason = banReason.trim() || 'Tài khoản bị khóa bởi admin'
      await banAccount(selectedUser.id, reason)

      // Optimistic update - update local state immediately
      setUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              status: 'blocked' as const,
              verified: false // Blocked users cannot be verified
            }
          }
          return user
        })
      })

      // Close dialog and reset state
      setBanDialogOpen(false)
      setSelectedUser(null)
      setBanReason('')

      // No need to reload - optimistic update is sufficient
    } catch (err: any) {
      console.error('Failed to ban account:', err)
      setError(err.message || 'Không thể khóa tài khoản')
      // On error, reload to get correct state from backend
      await reloadUsersFromAPI(true)
    } finally {
      setActionLoading(false)
    }
  }

  // Unban account (mở khóa tài khoản - hoạt động) - mở dialog
  const handleUnbanAccount = (user: User) => {
    setSelectedUser(user)
    setUnbanReason('')
    setUnbanDialogOpen(true)
  }

  // Confirm unban account
  const handleConfirmUnban = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setError(null)

    try {
      const reason = unbanReason.trim() || 'Tài khoản đã được mở khóa bởi admin'
      await unbanAccount(selectedUser.id, reason)

      // Optimistic update - update local state immediately
      // Note: Unbanning makes account active, but verified status depends on IsActive from backend
      // We'll set verified based on the original logic: active && !banned
      setUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              status: 'active' as const,
              verified: true // Unbanned accounts are active, assume verified (backend will confirm)
            }
          }
          return user
        })
      })

      // Close dialog and reset state
      setUnbanDialogOpen(false)
      setSelectedUser(null)
      setUnbanReason('')

      // No need to reload - optimistic update is sufficient
    } catch (err: any) {
      console.error('Failed to unban account:', err)
      setError(err.message || 'Không thể mở khóa tài khoản')
      // On error, reload to get correct state from backend
      await reloadUsersFromAPI(true)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Box
      sx={{
        bgcolor: 'common.white'
      }}
      className="p-[2.4rem]! rounded-3xl shadow-3xl"
    >
      <Box className="flex items-center justify-start mb-[2.4rem]">
        <Typography
          sx={{
            background: (theme) => theme.customBackgroundColor.main,
            backgroundClip: 'text',
            color: 'transparent'
          }}
          className="text-[1.6rem]!"
        >
          Danh sách User
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 2, borderRadius: '1.2rem' }}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box className="flex justify-center items-center py-[4.8rem]">
          <Typography className="text-[1.6rem]! text-gray-500">
            Đang tải danh sách người dùng...
          </Typography>
        </Box>
      )}

      {/* Statistics Cards */}
      <Box className="grid grid-cols-4 gap-[1.6rem] mb-[2.4rem]">
        <Card
          sx={{
            borderRadius: '1.6rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
            color: 'white',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 0.5
                  }}
                >
                  Tổng số User
                </Typography>
                <Typography
                  sx={{
                    fontSize: '2.4rem',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {statistics.total}
                </Typography>
              </Box>
              <PeopleIcon
                sx={{
                  fontSize: '4rem',
                  color: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '1.6rem',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important',
            color: 'white',
            boxShadow: '0 4px 20px rgba(245, 87, 108, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(245, 87, 108, 0.4)'
            }
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 0.5
                  }}
                >
                  Users mới
                </Typography>
                <Typography
                  sx={{
                    fontSize: '2.4rem',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {statistics.new}
                </Typography>
              </Box>
              <PersonAddIcon
                sx={{
                  fontSize: '4rem',
                  color: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '1.6rem',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important',
            color: 'white',
            boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(79, 172, 254, 0.4)'
            }
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 0.5
                  }}
                >
                  Đã xác thực
                </Typography>
                <Typography
                  sx={{
                    fontSize: '2.4rem',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {statistics.verified}
                </Typography>
              </Box>
              <CheckCircleIcon
                sx={{
                  fontSize: '4rem',
                  color: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '1.6rem',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important',
            color: 'white',
            boxShadow: '0 4px 20px rgba(250, 112, 154, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(250, 112, 154, 0.4)'
            }
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 0.5
                  }}
                >
                  Đã khóa
                </Typography>
                <Typography
                  sx={{
                    fontSize: '2.4rem',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {statistics.blocked}
                </Typography>
              </Box>
              <LockIcon
                sx={{
                  fontSize: '4rem',
                  color: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filter Section */}
      <Box className="flex flex-col gap-[1.6rem] mb-[2.4rem]">
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '1.2rem',
              bgcolor: 'grey.50',
              fontSize: '1.4rem',
              '& fieldset': {
                borderColor: 'grey.300'
              },
              '&:hover fieldset': {
                borderColor: 'primary.main'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main'
              }
            },
            '& .MuiInputBase-input': {
              fontSize: '1.4rem',
              py: 1.5
            }
          }}
        />

        {/* Role Filter Buttons */}
        <Box className="flex items-center gap-[1.2rem]">
          <Typography className="text-[1.4rem]! font-medium! text-gray-600">
            Lọc theo vai trò:
          </Typography>
          <ButtonGroup variant="outlined" size="medium">
            {ROLE_FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleRoleFilter(option.value)}
                variant={selectedRole === option.value ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: '0.8rem',
                  textTransform: 'none',
                  px: 2
                }}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
          {selectedRole && (
            <Button
              onClick={() => setSelectedRole(null)}
              size="small"
              sx={{
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Box>
      </Box>

      {!loading && (
        <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell className="font-semibold!">User</TableCell>
                <TableCell className="font-semibold!">Email</TableCell>
                <TableCell className="font-semibold!">Vai trò</TableCell>
                <TableCell className="font-semibold!">Trạng thái</TableCell>
                <TableCell className="font-semibold!">Ngày tham gia</TableCell>
                <TableCell className="font-semibold!">Xác thực</TableCell>
                <TableCell className="font-semibold! text-center!">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-[3.2rem]!">
                    <Typography className="text-gray-500">Không tìm thấy User nào</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-[1.2rem]">
                        <Avatar
                          src={user.avatar || undefined}
                          sx={{ width: 40, height: 40 }}
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        >
                          {user.name.charAt(0)}
                        </Avatar>
                        <Typography className="font-medium!">{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={ROLE_CHIP_COLOR_MAP[user.role]}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(user.status)}
                        size="small"
                        color={getStatusColor(user.status) as 'success' | 'default' | 'error'}
                      />
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                        size="small"
                        color={user.verified ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center justify-center gap-[0.8rem]">
                        {/* Đã bỏ nút Edit - Admin không thể chỉnh sửa thông tin user khác */}
                        {user.status === 'blocked' ? (
                          <IconButton
                            size="small"
                            color="success"
                            title="Mở khóa (Hoạt động)"
                            onClick={() => handleUnbanAccount(user)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'success.light',
                                color: 'white'
                              }
                            }}
                          >
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            color="warning"
                            title="Khóa tài khoản"
                            onClick={() => handleBanAccount(user)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'warning.light',
                                color: 'white'
                              }
                            }}
                          >
                            <LockIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <Box className="flex justify-center mt-[2.4rem]">
          <Stack spacing={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '1.4rem',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important'
                    }
                  }
                }
              }}
            />
          </Stack>
        </Box>
      )}

      {/* Ban Account Dialog */}
      <Dialog
        open={banDialogOpen}
        onClose={() => {
          if (!actionLoading) {
            setBanDialogOpen(false)
            setBanReason('')
            setSelectedUser(null)
            setError(null)
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '2.4rem'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            pb: 1
          }}
        >
          Khóa tài khoản
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2, borderRadius: '1.2rem' }}>
                Bạn có chắc chắn muốn khóa tài khoản này không? Người dùng sẽ nhận được thông báo về
                lý do khóa.
              </Alert>
              <Box className="flex items-center gap-[1.2rem] p-[1.6rem] bg-gray-50 rounded-[1.2rem] mb-[2rem]">
                <Avatar sx={{ width: 56, height: 56 }}>{selectedUser.name.charAt(0)}</Avatar>
                <Box>
                  <Typography className="font-semibold! text-[1.6rem]!">
                    {selectedUser.name}
                  </Typography>
                  <Typography className="text-[1.4rem]! text-gray-600">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lý do khóa tài khoản"
                placeholder="Nhập lý do khóa tài khoản (sẽ được gửi đến người dùng)..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '1.2rem'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setBanDialogOpen(false)
              setBanReason('')
              setSelectedUser(null)
              setError(null)
            }}
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: '1.2rem',
              px: 3
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmBan}
            variant="contained"
            color="warning"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: '1.2rem',
              px: 3
            }}
          >
            {actionLoading ? 'Đang khóa...' : 'Khóa tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unban Account Dialog */}
      <Dialog
        open={unbanDialogOpen}
        onClose={() => {
          if (!actionLoading) {
            setUnbanDialogOpen(false)
            setUnbanReason('')
            setSelectedUser(null)
            setError(null)
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '2.4rem'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.8rem',
            fontWeight: 600,
            pb: 1
          }}
        >
          Mở khóa tài khoản
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: '1.2rem' }}>
                Bạn có chắc chắn muốn mở khóa tài khoản này không? Tài khoản sẽ được kích hoạt lại
                và người dùng có thể đăng nhập bình thường.
              </Alert>
              <Box className="flex items-center gap-[1.2rem] p-[1.6rem] bg-gray-50 rounded-[1.2rem] mb-[2rem]">
                <Avatar sx={{ width: 56, height: 56 }}>{selectedUser.name.charAt(0)}</Avatar>
                <Box>
                  <Typography className="font-semibold! text-[1.6rem]!">
                    {selectedUser.name}
                  </Typography>
                  <Typography className="text-[1.4rem]! text-gray-600">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lý do mở khóa tài khoản"
                placeholder="Nhập lý do mở khóa tài khoản (sẽ được gửi đến người dùng)..."
                value={unbanReason}
                onChange={(e) => setUnbanReason(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '1.2rem'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setUnbanDialogOpen(false)
              setUnbanReason('')
              setSelectedUser(null)
              setError(null)
            }}
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: '1.2rem',
              px: 3
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmUnban}
            variant="contained"
            color="success"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: '1.2rem',
              px: 3
            }}
          >
            {actionLoading ? 'Đang mở khóa...' : 'Mở khóa tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
