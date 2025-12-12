import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Avatar from '@mui/material/Avatar'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CancelIcon from '@mui/icons-material/Cancel'
import MenuItem from '@mui/material/MenuItem'
import PhoneIcon from '@mui/icons-material/Phone'
import WcIcon from '@mui/icons-material/Wc'
import HomeIcon from '@mui/icons-material/Home'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { uploadImageToFirebase } from '~/firebaseClient'
import { styled } from '@mui/material/styles'
import { updateProfile as updateProfileApi, changePassword } from '~/api/instances/UserApi'

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
  dob?: string
}

interface EditProfileProps {
  onCancel: () => void
  onSave: () => void
}

interface FormState {
  name: string
  email: string
  phone: string
  gender: string
  address: string
  dateOfBirth: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  avatar: string
}

const StyledAvatar = styled(Avatar)(() => ({
  width: 120,
  height: 120,
  border: '3px solid white',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  fontSize: '3.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
  }
}))

const AvatarContainer = styled(Box)(() => ({
  position: 'relative',
  display: 'inline-block',
  '&:hover .camera-overlay': {
    opacity: 1
  }
}))

const CameraOverlay = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: 'primary.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '3px solid white',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease',
  opacity: 0.9,
  '&:hover': {
    backgroundColor: 'primary.dark',
    transform: 'scale(1.1)'
  }
}))

export default function EditProfile({ onCancel, onSave }: EditProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractDateOnly = (value?: string | null) => {
    if (!value) return ''
    const date = value.includes('T') ? value.split('T')[0] : value
    return date
  }

  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    gender: '',
    address: '',
    dateOfBirth: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: ''
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      
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
            setIsLoading(false)
            setSnackbar({
              open: true,
              message: 'Chỉ Admin mới có thể truy cập trang này.',
              severity: 'error'
            })
            return
          }
        }
      } catch (err) {
        console.error('Error checking admin role:', err)
        setIsLoading(false)
        setSnackbar({
          open: true,
          message: 'Không thể xác thực quyền truy cập.',
          severity: 'error'
        })
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
          setIsLoading(false)
          setSnackbar({
            open: true,
            message: 'Chỉ Admin mới có thể truy cập trang này.',
            severity: 'error'
          })
          return
        }
        
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          gender: profile.gender || '',
          address: profile.address || '',
          dateOfBirth: extractDateOnly(profile.dob),
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          avatar: profile.avatar || ''
        })
        setAvatarPreview(profile.avatar || null)
      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback to localStorage (chỉ nếu là Admin)
        try {
          const userInfoStr = localStorage.getItem('userInfo')
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr)
            const roleId = userInfo?.roleId ?? userInfo?.RoleId
            const roleName = userInfo?.roleName ?? userInfo?.RoleName ?? userInfo?.role ?? userInfo?.Role
            const isAdmin = roleId === 1 || 
                           roleName === 'Admin' || 
                           (typeof roleName === 'string' && roleName.toLowerCase() === 'admin')
            
            if (isAdmin) {
              setFormData({
                name: userInfo.name || userInfo.fullName || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                gender: userInfo.gender || '',
                address: userInfo.address || '',
                dateOfBirth: extractDateOnly(userInfo.dateOfBirth || userInfo.dob),
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                avatar: userInfo.avatar || ''
              })
              setAvatarPreview(userInfo.avatar || null)
            } else {
              setSnackbar({
                open: true,
                message: 'Chỉ Admin mới có thể truy cập trang này.',
                severity: 'error'
              })
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
    // Sync with localStorage if it changes (from other components)
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        const updatedUserInfo = JSON.parse(userInfoStr)
        setFormData(prev => ({
          ...prev,
          name: updatedUserInfo.name || updatedUserInfo.fullName || prev.name,
          email: updatedUserInfo.email || prev.email,
          phone: updatedUserInfo.phone || prev.phone,
          gender: updatedUserInfo.gender || prev.gender,
          address: updatedUserInfo.address || prev.address,
          dateOfBirth: extractDateOnly(updatedUserInfo.dateOfBirth || updatedUserInfo.dob) || prev.dateOfBirth,
          avatar: updatedUserInfo.avatar || prev.avatar
        }))
        if (updatedUserInfo.avatar) {
          setAvatarPreview(updatedUserInfo.avatar)
        }
      }
    } catch (error) {
      console.error('Error syncing with localStorage:', error)
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

  const handleInputChange =
    (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [field]: e.target.value })
    }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.warn('[EditProfile] No file selected')
      return
    }

    console.log('[EditProfile] File selected:', {
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(2) + ' KB'
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Vui lòng chọn file ảnh', severity: 'error' })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'Kích thước ảnh không được vượt quá 5MB',
        severity: 'error'
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setIsUploadingAvatar(true)
    try {
      console.log('[EditProfile] Starting upload to Firebase...')
      // Upload avatar lên Firebase và dùng URL trả về
      const url = await uploadImageToFirebase(file, 'avatars')
      console.log('[EditProfile] Upload successful, URL:', url)
      setAvatarPreview(url)
      setFormData((prev) => ({ ...prev, avatar: url }))
      setSnackbar({
        open: true,
        message: 'Upload ảnh đại diện thành công! Nhấn "Lưu" để cập nhật.',
        severity: 'success'
      })
    } catch (error) {
      console.error('[EditProfile] Error uploading avatar to Firebase:', error)
      let errorMessage = 'Không thể upload ảnh đại diện. Vui lòng thử lại.'
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload ảnh quá lâu. Vui lòng thử lại với ảnh nhỏ hơn.'
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'Không có quyền upload ảnh. Vui lòng kiểm tra cấu hình Firebase.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra kết nối internet và thử lại.'
        } else {
          errorMessage = error.message || errorMessage
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input để có thể chọn lại file cùng tên
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setFormData({ ...formData, avatar: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    // Validate
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập tên', severity: 'error' })
      return
    }

    if (showPasswordFields) {
      if (!formData.currentPassword) {
        setSnackbar({ open: true, message: 'Vui lòng nhập mật khẩu hiện tại', severity: 'error' })
        return
      }

      if (!formData.newPassword) {
        setSnackbar({ open: true, message: 'Vui lòng nhập mật khẩu mới', severity: 'error' })
        return
      }

      if (formData.newPassword.length < 6) {
        setSnackbar({
          open: true,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
          severity: 'error'
        })
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setSnackbar({ open: true, message: 'Mật khẩu xác nhận không khớp', severity: 'error' })
        return
      }
    }

    try {
      setIsSaving(true)

      // Nếu user muốn đổi mật khẩu, gọi API change password trước
      if (showPasswordFields) {
        try {
          await changePassword({
            OldPassword: formData.currentPassword,
            NewPassword: formData.newPassword
          })
          // Không hiển thị snackbar ở đây, sẽ hiển thị sau khi update profile thành công
        } catch (passwordError) {
          const errorMessage = passwordError instanceof Error ? passwordError.message : 'Không thể đổi mật khẩu'
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
          })
          setIsSaving(false)
          return // Dừng lại nếu đổi mật khẩu thất bại
        }
      }

      // Cập nhật profile
      // Nếu avatar là empty string, gửi empty string để backend set về null
      const payload = {
        Name: formData.name.trim(),
        Phone: formData.phone ?? '',
        Avatar: formData.avatar || '', // Gửi empty string nếu muốn xóa avatar
        Gender: formData.gender ?? '',
        Address: formData.address ?? '',
        DOB: formData.dateOfBirth ?? ''
      }

      const response = await updateProfileApi(payload)
      const updatedUser = response.user

      const updatedUserInfo = {
        id: updatedUser.id,
        name: updatedUser.name,
        fullName: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar ?? '',
        phone: updatedUser.phone ?? '',
        gender: updatedUser.gender ?? '',
        address: updatedUser.address ?? '',
        dateOfBirth: extractDateOnly(updatedUser.dob),
        dob: updatedUser.dob ?? null
      }

      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      setFormData((prev) => ({
        ...prev,
        name: updatedUserInfo.name,
        phone: updatedUserInfo.phone,
        gender: updatedUserInfo.gender,
        address: updatedUserInfo.address,
        dateOfBirth: updatedUserInfo.dateOfBirth,
        avatar: updatedUserInfo.avatar
      }))
      setAvatarPreview(updatedUserInfo.avatar || null)

      // Dispatch custom event to notify other components (e.g., SocialMedia) that profile was updated
      window.dispatchEvent(new CustomEvent('userProfileUpdated'))

      // Hiển thị thông báo thành công
      const successMessage = showPasswordFields
        ? 'Đổi mật khẩu và cập nhật thông tin thành công!'
        : response.message || 'Cập nhật thông tin thành công!'
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      })

      // Reset password fields nếu đã đổi mật khẩu
      if (showPasswordFields) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        setShowPasswordFields(false)
      }

      // Gọi callback để refresh view
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (error) {
      console.error('Update profile error:', error)
      setSnackbar({
        open: true,
        message: 'Cập nhật thông tin thất bại. Vui lòng thử lại!',
        severity: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box>
      <Card
        sx={{
          bgcolor: 'white',
          borderRadius: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box className="space-y-[3.6rem]">
            {/* Tiêu đề */}
            <Box>
              <Typography
                sx={{
                  fontSize: '2.4rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1
                }}
              >
                Chỉnh sửa thông tin cá nhân
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  color: 'text.secondary'
                }}
              >
                Cập nhật thông tin tài khoản của bạn
              </Typography>
            </Box>

            {/* Upload ảnh đại diện */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <AvatarContainer>
                <StyledAvatar
                  src={avatarPreview || undefined}
                  alt={formData.name || 'User'}
                  onClick={handleAvatarClick}
                  sx={{
                    bgcolor: avatarPreview ? 'transparent' : 'primary.main',
                    color: avatarPreview ? 'transparent' : 'white'
                  }}
                >
                  {!avatarPreview && getInitials(formData.name || 'User')}
                </StyledAvatar>
                <CameraOverlay className="camera-overlay" onClick={handleAvatarClick}>
                  <CameraAltIcon sx={{ color: 'white', fontSize: '2rem' }} />
                </CameraOverlay>
                {avatarPreview && (
                  <IconButton
                    onClick={handleRemoveAvatar}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'error.dark'
                      }
                    }}
                  >
                    <CancelIcon sx={{ fontSize: '1.6rem' }} />
                  </IconButton>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </AvatarContainer>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {isUploadingAvatar ? (
                <Typography
                  sx={{
                    fontSize: '1.3rem',
                    color: 'text.secondary'
                  }}
                >
                  Đang upload ảnh...
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: '1.3rem',
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                  onClick={handleAvatarClick}
                >
                  Nhấn để thay đổi ảnh đại diện
                </Typography>
              )}
            </Box>

            {/* Thông tin cá nhân */}
            <Box>
              <Box className="flex items-center gap-[1.2rem] mb-[2rem]">
                <PersonIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.6
                  }}
                >
                  Thông tin cá nhân
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Tên người dùng"
                value={formData.name}
                onChange={handleInputChange('name')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  bgcolor: 'white',
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '1.2rem',
                    py: 0.5,
                    '& .MuiInputBase-input': {
                      py: 1.5,
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1.4rem',
                    lineHeight: 1.6
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  bgcolor: 'grey.100',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '1.2rem',
                    py: 0.5,
                    '& .MuiInputBase-input': {
                      py: 1.5,
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '& fieldset': {
                      borderColor: 'grey.300'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1.4rem',
                    lineHeight: 1.6
                  }
                }}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: '2rem'
                }}
              >
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1.2rem',
                      py: 0.5,
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                />
                <TextField
                  select
                  fullWidth
                  label="Giới tính"
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WcIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1.2rem',
                      py: 0.5,
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value="">Không xác định</MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: '2rem'
                }}
              >
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  multiline
                  minRows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1.2rem',
                      py: 0.5,
                      '& .MuiInputBase-input': {
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange('dateOfBirth')}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1.2rem',
                      py: 0.5,
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.4rem',
                      lineHeight: 1.6
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Đổi mật khẩu */}
            <Box>
              <Box className="flex items-center gap-[1.2rem] mb-[2rem]">
                <LockIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Typography
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.6
                  }}
                >
                  Đổi mật khẩu
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showPasswordFields}
                    onChange={(e) => setShowPasswordFields(e.target.checked)}
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: '2rem'
                      }
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '1.4rem' }}>Tôi muốn đổi mật khẩu</Typography>}
                sx={{ mb: showPasswordFields ? 2 : 0 }}
              />

              {showPasswordFields && (
                <Box className="space-y-[2rem]">
                  <TextField
                    fullWidth
                    label="Mật khẩu hiện tại"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={handleInputChange('currentPassword')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                            sx={{ color: 'grey.400' }}
                          >
                            {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      bgcolor: 'white',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '1.2rem',
                        py: 0.5,
                        '& .MuiInputBase-input': {
                          py: 1.5,
                          fontSize: '1.4rem',
                          lineHeight: 1.6
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Mật khẩu mới"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange('newPassword')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{ color: 'grey.400' }}
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      bgcolor: 'white',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '1.2rem',
                        py: 0.5,
                        '& .MuiInputBase-input': {
                          py: 1.5,
                          fontSize: '1.4rem',
                          lineHeight: 1.6
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Xác nhận mật khẩu mới"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'grey.400', fontSize: '2rem' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: 'grey.400' }}
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      bgcolor: 'white',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '1.2rem',
                        py: 0.5,
                        '& .MuiInputBase-input': {
                          py: 1.5,
                          fontSize: '1.4rem',
                          lineHeight: 1.6
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Nút lưu và hủy */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                onClick={onCancel}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  borderRadius: '1.2rem',
                  px: 4,
                  py: 1.2,
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'grey.400',
                    bgcolor: 'grey.50'
                  }
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={isSaving}
                sx={{
                  textTransform: 'none',
                  borderRadius: '1.2rem',
                  px: 4,
                  py: 1.2,
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
                  }
                }}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            fontSize: '1.4rem',
            '& .MuiAlert-icon': {
              fontSize: '2rem'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
