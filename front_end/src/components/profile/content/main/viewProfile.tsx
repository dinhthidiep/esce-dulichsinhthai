import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BadgeIcon from '@mui/icons-material/Badge'
import PhoneIcon from '@mui/icons-material/Phone'
import WcIcon from '@mui/icons-material/Wc'
import HomeIcon from '@mui/icons-material/Home'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { fetchProfile } from '~/api/instances/UserApi'

interface UserInfo {
  id?: number
  name?: string
  fullName?: string
  email?: string
  role?: string
  roleName?: string
  avatar?: string
  phone?: string
  gender?: string
  address?: string
  dateOfBirth?: string
  dob?: string | null
  roleId?: number
}

interface ViewProfileProps {
  onEdit: () => void
}

const StyledAvatar = styled(Avatar)(() => ({
  width: 150,
  height: 150,
  border: '4px solid white',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  fontSize: '4rem',
  fontWeight: 600
}))

const InfoItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1.6rem',
  padding: '1.6rem',
  borderRadius: '1.2rem',
  backgroundColor: '#f8f9fa',
  marginBottom: '1.6rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#e9ecef',
    transform: 'translateX(4px)'
  }
}))

export default function ViewProfile({ onEdit }: ViewProfileProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'Admin'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)
      
      // Kiểm tra role Admin trước khi load profile
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const parsed = JSON.parse(userInfoStr)
          const roleId = parsed?.roleId ?? parsed?.RoleId
          const roleName = parsed?.roleName ?? parsed?.RoleName ?? parsed?.role ?? parsed?.Role
          
          // Chỉ Admin (roleId = 1 hoặc roleName = 'Admin') mới được truy cập
          const isAdmin = roleId === 1 || 
                         roleName === 'Admin' || 
                         (typeof roleName === 'string' && roleName.toLowerCase() === 'admin')
          
          if (!isAdmin) {
            setError('Chỉ Admin mới có thể truy cập trang này.')
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('Error checking admin role:', err)
        setError('Không thể xác thực quyền truy cập.')
        setIsLoading(false)
        return
      }
      
      try {
        const { fetchProfile } = await import('~/api/instances/UserApi')
        const profile = await fetchProfile()
        
        // Kiểm tra lại role từ API response
        const isAdminFromApi = profile.roleId === 1 || 
                              profile.roleName === 'Admin' ||
                              (typeof profile.roleName === 'string' && profile.roleName.toLowerCase() === 'admin')
        
        if (!isAdminFromApi) {
          setError('Chỉ Admin mới có thể truy cập trang này.')
          setIsLoading(false)
          return
        }
        
        setUserInfo({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          phone: profile.phone,
          gender: profile.gender,
          address: profile.address,
          dateOfBirth: profile.dob,
          dob: profile.dob,
          role: profile.roleName || 'Admin',
          roleName: profile.roleName || 'Admin',
          roleId: profile.roleId
        })
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ')
        
        // Fallback to localStorage (chỉ nếu là Admin)
        try {
          const userInfoStr = localStorage.getItem('userInfo')
          if (userInfoStr) {
            const parsed = JSON.parse(userInfoStr)
            const roleId = parsed?.roleId ?? parsed?.RoleId
            const roleName = parsed?.roleName ?? parsed?.RoleName ?? parsed?.role ?? parsed?.Role
            const isAdmin = roleId === 1 || 
                           roleName === 'Admin' || 
                           (typeof roleName === 'string' && roleName.toLowerCase() === 'admin')
            
            if (isAdmin) {
              const roleObj = parsed?.Role ?? parsed?.role
              setUserInfo({
                ...parsed,
                roleName:
                  parsed?.roleName ??
                  parsed?.RoleName ??
                  roleObj?.Name ??
                  roleObj?.name ??
                  (typeof parsed?.Role === 'string' ? parsed.Role : null) ??
                  (typeof parsed?.role === 'string' ? parsed.role : null) ??
                  'Admin',
                role:
                  parsed?.role ??
                  parsed?.Role ??
                  (typeof parsed?.Role === 'string' ? parsed.Role : null) ??
                  'Admin',
                roleId: parsed?.roleId ?? parsed?.RoleId ?? roleObj?.Id ?? roleObj?.id ?? 1
              })
            } else {
              setError('Chỉ Admin mới có thể truy cập trang này.')
            }
          }
        } catch (localErr) {
          console.error('Error parsing userInfo from localStorage:', localErr)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const profile = await fetchProfile()
        if (!isMounted) return

        const normalizedProfile: UserInfo = {
          id: profile.id,
          name: profile.name,
          fullName: profile.name,
          email: profile.email,
          avatar: profile.avatar ?? undefined,
          phone: profile.phone ?? undefined,
          gender: profile.gender ?? undefined,
          address: profile.address ?? undefined,
          dateOfBirth: profile.dob ?? undefined,
          dob: profile.dob ?? null,
          roleId: profile.roleId,
          roleName: profile.roleName,
          // Also set role for backward compatibility
          role:
            profile.roleName ??
            (profile.roleId
              ? { 1: 'Admin', 2: 'Host', 3: 'Travel Agency', 4: 'Customer' }[profile.roleId] ||
                'Customer'
              : undefined)
        }

        setUserInfo(normalizedProfile)
        localStorage.setItem('userInfo', JSON.stringify(normalizedProfile))
      } catch (err) {
        console.error('Failed to load profile', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getRoleDisplay = () => {
    // Priority: roleName > role > map from roleId > default
    if (userInfo.roleName) {
      return userInfo.roleName
    }
    if (userInfo.role) {
      return userInfo.role
    }

    // Map roleId to role name if available
    if (userInfo.roleId) {
      const roleMap: Record<number, string> = {
        1: 'Admin',
        2: 'Host',
        3: 'Travel Agency',
        4: 'Customer'
      }
      return roleMap[userInfo.roleId] || 'Customer'
    }

    // Try to get from localStorage userInfo
    try {
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo)
        if (parsed.roleName) return parsed.roleName
        if (parsed.role) return parsed.role
        if (parsed.RoleName) return parsed.RoleName
        if (parsed.Role) {
          if (typeof parsed.Role === 'string') return parsed.Role
          if (parsed.Role?.Name) return parsed.Role.Name
        }
        if (parsed.roleId) {
          const roleMap: Record<number, string> = {
            1: 'Admin',
            2: 'Host',
            3: 'Travel Agency',
            4: 'Customer'
          }
          return roleMap[parsed.roleId] || 'Customer'
        }
      }
    } catch (err) {
      console.error('Error reading role from localStorage:', err)
    }

    return 'Customer'
  }

  const getGenderDisplay = () => {
    if (!userInfo.gender) return 'Chưa cập nhật'
    const gender = userInfo.gender.toLowerCase()
    if (gender === 'male' || gender === 'nam') return 'Nam'
    if (gender === 'female' || gender === 'nữ' || gender === 'nu') return 'Nữ'
    if (gender === 'other' || gender === 'khác' || gender === 'khac') return 'Khác'
    return userInfo.gender
  }

  const formatDateDisplay = (date?: string) => {
    if (!date) return 'Chưa cập nhật'
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }
    return parsedDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Box>
      <Card
        sx={{
          bgcolor: 'white',
          borderRadius: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header với gradient */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 6,
            px: 4,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ position: 'relative', mb: 2 }}>
              <StyledAvatar
                src={userInfo.avatar}
                alt={userInfo.name || userInfo.fullName || 'User'}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                {!userInfo.avatar && getInitials(userInfo.name || userInfo.fullName || 'User')}
              </StyledAvatar>
            </Box>
            <Typography
              sx={{
                fontSize: '2.8rem',
                fontWeight: 700,
                color: 'white',
                mb: 0.5,
                textAlign: 'center'
              }}
            >
              {userInfo.name || userInfo.fullName || 'Người dùng'}
            </Typography>
            <Typography
              sx={{
                fontSize: '1.6rem',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center'
              }}
            >
              {getRoleDisplay()}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {/* Nút chỉnh sửa */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <IconButton
              onClick={onEdit}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              <EditIcon sx={{ fontSize: '2.4rem' }} />
            </IconButton>
          </Box>

          {/* Thông tin chi tiết */}
          <Box>
            <InfoItem>
              <PersonIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Tên người dùng
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {userInfo.name || userInfo.fullName || 'Chưa có tên'}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <EmailIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Email
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {userInfo.email || 'Chưa có email'}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <BadgeIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Vai trò
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {getRoleDisplay()}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <PhoneIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Số điện thoại
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {userInfo.phone || 'Chưa cập nhật'}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <WcIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Giới tính
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {getGenderDisplay()}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <HomeIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Địa chỉ
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {userInfo.address || 'Chưa cập nhật'}
                </Typography>
              </Box>
            </InfoItem>

            <InfoItem>
              <CalendarTodayIcon sx={{ color: 'primary.main', fontSize: '2.4rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Ngày sinh
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {formatDateDisplay(userInfo.dateOfBirth)}
                </Typography>
              </Box>
            </InfoItem>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
