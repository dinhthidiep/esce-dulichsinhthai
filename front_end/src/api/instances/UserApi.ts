import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export type UserProfile = {
  id: number
  name: string
  email: string
  avatar?: string
  phone?: string
  gender?: string
  address?: string
  dob?: string | null
  roleId?: number
  roleName?: string
}

export type UpdateProfilePayload = {
  Name: string
  Phone: string
  Avatar: string
  Gender: string
  Address: string
  DOB: string
}

const authorizedRequest = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }

  const response = await fetchWithFallback(input as string, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {})
    }
  })

  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  return response.json()
}

const normalizeProfile = (payload: any): UserProfile => {
  // Handle Role object (from backend with navigation property)
  const roleObj = payload?.Role ?? payload?.role
  const roleNameFromObj = roleObj?.Name ?? roleObj?.name ?? roleObj?.RoleName ?? roleObj?.roleName
  
  // Get roleId from multiple sources
  const roleId = payload?.roleId ?? 
                 payload?.RoleId ?? 
                 roleObj?.Id ?? 
                 roleObj?.id ?? 
                 roleObj?.RoleId ?? 
                 roleObj?.roleId ?? 
                 undefined
  
  // Get roleName from multiple sources
  const roleName = payload?.roleName ?? 
                   payload?.RoleName ?? 
                   roleNameFromObj ??
                   (typeof payload?.Role === 'string' ? payload.Role : null) ??
                   (typeof payload?.role === 'string' ? payload.role : null) ??
                   undefined
  
  return {
    id: Number(payload?.id ?? payload?.Id ?? 0),
    name: payload?.name ?? payload?.Name ?? '',
    email: payload?.email ?? payload?.Email ?? '',
    avatar: payload?.avatar ?? payload?.Avatar ?? undefined,
    phone: payload?.phone ?? payload?.Phone ?? undefined,
    gender: payload?.gender ?? payload?.Gender ?? undefined,
    address: payload?.address ?? payload?.Address ?? undefined,
    dob:
      payload?.dob ??
      payload?.Dob ??
      payload?.dateOfBirth ??
      payload?.DateOfBirth ??
      (payload?.user?.dob ?? payload?.user?.Dob ?? null),
    roleId: roleId ? Number(roleId) : undefined,
    roleName: roleName ? String(roleName) : undefined
  }
}

// Fallback load profile từ localStorage hoặc giá trị mặc định,
// dùng khi backend không có /api/user/profile GET hoặc trả lỗi.
const loadProfileFromLocalStorage = (): UserProfile => {
  try {
    const raw = localStorage.getItem('userInfo')
    if (raw) {
      const parsed = JSON.parse(raw)
      return normalizeProfile(parsed)
    }
  } catch (err) {
    console.error('[UserApi] Lỗi đọc userInfo từ localStorage:', err)
  }

  // Giá trị mặc định cho admin nếu không có gì trong localStorage
  return {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    avatar: undefined,
    phone: undefined,
    gender: undefined,
    address: undefined,
    dob: null,
    roleId: 1,
    roleName: 'Admin'
  }
}

export const fetchProfile = async () => {
  try {
    // Backend: [HttpGet("profile")] GetProfile trong UserController
    // Endpoint này tự động lấy userId từ JWT token, không cần truyền userId
    const result = await authorizedRequest('/api/user/profile', {
      method: 'GET'
    })
    const normalizedProfile = normalizeProfile(result)
    
    // Đồng bộ với localStorage để các component khác có thể dùng
    try {
      const merged = {
        ...(JSON.parse(localStorage.getItem('userInfo') || '{}') || {}),
        ...normalizedProfile
      }
      localStorage.setItem('userInfo', JSON.stringify(merged))
    } catch (err) {
      console.error('[UserApi] Lỗi lưu userInfo sau khi fetchProfile:', err)
    }
    
    return normalizedProfile
  } catch (error) {
    console.error('[UserApi] fetchProfile lỗi, dùng dữ liệu từ localStorage hoặc mặc định.', error)
    return loadProfileFromLocalStorage()
  }
}

export const updateProfile = async (payload: UpdateProfilePayload) => {
  try {
    const result = await authorizedRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })

    const normalizedUser = normalizeProfile(result?.user ?? result)

    // Đồng bộ với localStorage để ViewProfile & EditProfile dùng lại sau này
    try {
      const merged = {
        ...(JSON.parse(localStorage.getItem('userInfo') || '{}') || {}),
        ...normalizedUser
      }
      localStorage.setItem('userInfo', JSON.stringify(merged))
    } catch (err) {
      console.error('[UserApi] Lỗi lưu userInfo sau khi updateProfile:', err)
    }

    return {
      message: result?.message ?? 'Cập nhật hồ sơ thành công',
      user: normalizedUser
    }
  } catch (error) {
    console.error('[UserApi] updateProfile lỗi, fallback chỉ lưu trên trình duyệt.', error)

    // Fallback: cập nhật dữ liệu trong localStorage dựa trên payload,
    // không chạm back_end nhưng vẫn giúp UI hiển thị thông tin mới.
    const current = loadProfileFromLocalStorage()
    const fallbackUser: UserProfile = {
      ...current,
      name: payload.Name || current.name,
      phone: payload.Phone || current.phone,
      avatar: payload.Avatar || current.avatar,
      gender: payload.Gender || current.gender,
      address: payload.Address || current.address,
      dob: payload.DOB || current.dob
    }

    try {
      localStorage.setItem('userInfo', JSON.stringify(fallbackUser))
    } catch (err) {
      console.error('[UserApi] Lỗi lưu userInfo trong fallback updateProfile:', err)
    }

    return {
      message: 'Cập nhật hồ sơ (chỉ lưu trên trình duyệt, server hiện đang lỗi).',
      user: fallbackUser
    }
  }
}

export type ChangePasswordPayload = {
  OldPassword: string
  NewPassword: string
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  try {
    const result = await authorizedRequest('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    return {
      message: result?.message ?? 'Đổi mật khẩu thành công'
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể đổi mật khẩu'
    console.error('[UserApi] changePassword lỗi:', error)
    
    if (errorMessage.includes('Old password is incorrect') || 
        errorMessage.includes('Mật khẩu cũ không đúng')) {
      throw new Error('Mật khẩu cũ không đúng. Vui lòng kiểm tra lại.')
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

