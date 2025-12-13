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
  
  // Format DOB: Backend trả về DateTime? hoặc string, frontend cần format thành yyyy-MM-dd
  let dobFormatted: string | null = null
  const dobRaw = payload?.dob ?? payload?.Dob ?? payload?.DOB ?? payload?.dateOfBirth ?? payload?.DateOfBirth ?? (payload?.user?.dob ?? payload?.user?.Dob ?? null)
  
  if (dobRaw) {
    if (typeof dobRaw === 'string') {
      // Nếu đã là string, kiểm tra format
      if (/^\d{4}-\d{2}-\d{2}/.test(dobRaw)) {
        // Đã là yyyy-MM-dd format
        dobFormatted = dobRaw.split('T')[0] // Lấy phần date nếu có time
      } else {
        // Thử parse và format lại
        try {
          const date = new Date(dobRaw)
          if (!isNaN(date.getTime())) {
            dobFormatted = date.toISOString().split('T')[0]
          }
        } catch {
          dobFormatted = dobRaw // Giữ nguyên nếu không parse được
        }
      }
    } else if (dobRaw instanceof Date) {
      dobFormatted = dobRaw.toISOString().split('T')[0]
    } else {
      // Có thể là DateTime object từ backend (C#)
      try {
        const date = new Date(String(dobRaw))
        if (!isNaN(date.getTime())) {
          dobFormatted = date.toISOString().split('T')[0]
        }
      } catch {
        dobFormatted = null
      }
    }
  }
  
  return {
    id: Number(payload?.id ?? payload?.Id ?? 0),
    name: payload?.name ?? payload?.Name ?? '',
    email: payload?.email ?? payload?.Email ?? '',
    avatar: payload?.avatar ?? payload?.Avatar ?? undefined,
    phone: payload?.phone ?? payload?.Phone ?? undefined,
    gender: payload?.gender ?? payload?.Gender ?? undefined,
    address: payload?.address ?? payload?.Address ?? undefined,
    dob: dobFormatted,
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
    // Lấy userId từ localStorage (userInfo được lưu sau khi login)
    let userId: number | null = null
    try {
      const raw = localStorage.getItem('userInfo')
      if (raw) {
        const parsed = JSON.parse(raw)
        const rawId = parsed?.id ?? parsed?.Id
        if (rawId !== undefined && rawId !== null) {
          const parsedId = typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId)
          if (!Number.isNaN(parsedId) && parsedId > 0) {
            userId = parsedId
          }
        }
      }
    } catch (err) {
      console.warn('[UserApi] Không parse được userInfo từ localStorage:', err)
    }

    if (!userId) {
      // Nếu không lấy được userId, fallback về localStorage
      return loadProfileFromLocalStorage()
    }

    // Backend: [HttpGet("{id}")] GetUserById trong UserController
    const result = await authorizedRequest(`/api/user/${userId}`, {
      method: 'GET'
    })
    return normalizeProfile(result)
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

    // Backend trả về Account entity trong result.user, nhưng có thể không có Role navigation property
    // Luôn reload lại từ GetUserById để đảm bảo có đầy đủ thông tin mới nhất sau khi update
    let normalizedUser: UserProfile
    try {
      // Reload lại từ API để đảm bảo có dữ liệu mới nhất
      const fullProfile = await fetchProfile()
      normalizedUser = fullProfile
      
      // Merge với dữ liệu từ response nếu có (fallback)
      if (result?.user) {
        const responseUser = normalizeProfile(result.user)
        normalizedUser = {
          ...normalizedUser,
          // Ưu tiên dữ liệu từ fullProfile (đã reload), nhưng merge các field có thể thiếu
          name: fullProfile.name || responseUser.name,
          email: fullProfile.email || responseUser.email,
          avatar: fullProfile.avatar || responseUser.avatar,
          phone: fullProfile.phone || responseUser.phone,
          gender: fullProfile.gender || responseUser.gender,
          address: fullProfile.address || responseUser.address,
          dob: fullProfile.dob || responseUser.dob,
          roleId: fullProfile.roleId || responseUser.roleId,
          roleName: fullProfile.roleName || responseUser.roleName
        }
      }
    } catch (reloadError) {
      console.warn('[UserApi] Không thể reload profile sau update, dùng dữ liệu từ response:', reloadError)
      // Fallback: dùng dữ liệu từ response
      normalizedUser = normalizeProfile(result?.user ?? result)
    }

    // Đồng bộ với localStorage để ViewProfile & EditProfile dùng lại sau này
    try {
      const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}') || {}
      const merged: UserProfile = {
        ...currentUserInfo,
        ...normalizedUser,
        // Đảm bảo các field quan trọng được giữ lại
        id: normalizedUser.id || currentUserInfo.id,
        name: normalizedUser.name || currentUserInfo.name,
        email: normalizedUser.email || currentUserInfo.email,
        avatar: normalizedUser.avatar ?? currentUserInfo.avatar,
        phone: normalizedUser.phone ?? currentUserInfo.phone,
        gender: normalizedUser.gender ?? currentUserInfo.gender,
        address: normalizedUser.address ?? currentUserInfo.address,
        dob: normalizedUser.dob ?? currentUserInfo.dob,
        roleId: normalizedUser.roleId || currentUserInfo.roleId,
        roleName: normalizedUser.roleName || currentUserInfo.roleName
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

