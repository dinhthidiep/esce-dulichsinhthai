// Utility functions

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

// Tạo slug từ name (Vietnamese to slug)
export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

// Xử lý đường dẫn ảnh từ database
// Database có thể trả về đường dẫn public URL (/img/xxx.jpg), backend URL, hoặc null/empty
// Function này sẽ đảm bảo đường dẫn ảnh luôn hợp lệ
export const getImageUrl = (imagePath: string | null | undefined, fallbackImage: string | null = null): string | null => {
  // Nếu không có đường dẫn, trả về fallback
  if (!imagePath || imagePath.trim() === '') {
    return fallbackImage
  }

  // Trim whitespace
  const trimmedPath = imagePath.trim()

  // Filter các URL không hợp lệ (example.com, placeholder URLs)
  const invalidUrlPatterns = [
    'example.com',
    'placeholder',
    'dummy',
    'test.com',
    'localhost:5001', // Backend cũ
  ]
  
  const isInvalidUrl = invalidUrlPatterns.some(pattern => 
    trimmedPath.toLowerCase().includes(pattern.toLowerCase())
  )
  
  if (isInvalidUrl) {
    // Chỉ log trong development mode để tránh spam console
    if (import.meta.env.DEV) {
      console.warn(`⚠️ [getImageUrl] Phát hiện URL không hợp lệ: "${trimmedPath}", sử dụng fallback`)
    }
    return fallbackImage
  }

  // Nếu đường dẫn là URL đầy đủ (http/https), kiểm tra hợp lệ
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    // Cho phép backend URLs (localhost:7267 hoặc localhost:5002)
    if (trimmedPath.includes('localhost:7267') || trimmedPath.includes('localhost:5002')) {
      return trimmedPath
    }
    
    // Cho phép các external URLs khác - để LazyImage component xử lý error
    // Nếu URL không load được, LazyImage sẽ tự động fallback
    return trimmedPath
  }

  // Kiểm tra xem có phải là file ảnh hợp lệ không (có extension)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  const hasImageExtension = imageExtensions.some(ext => 
    trimmedPath.toLowerCase().endsWith(ext)
  )

  // Nếu không phải URL đầy đủ và không có extension ảnh hợp lệ
  // và không bắt đầu bằng /, có thể là đường dẫn không hợp lệ
  if (!hasImageExtension && !trimmedPath.startsWith('/')) {
    // Kiểm tra xem có phải là đường dẫn hợp lệ không (có chứa / hoặc .)
    // Nếu chỉ là text đơn giản như "abc", "test" thì không hợp lệ
    const looksLikePath = trimmedPath.includes('/') || trimmedPath.includes('.')
    if (!looksLikePath) {
      // Chỉ log trong development mode
      if (import.meta.env.DEV) {
        console.warn(`⚠️ [getImageUrl] Đường dẫn không hợp lệ (không phải file ảnh): "${trimmedPath}", sử dụng fallback`)
      }
      return fallbackImage
    }
  }

  // Nếu đường dẫn bắt đầu bằng / (public URL), trả về nguyên
  // React sẽ tự động serve từ public folder
  if (trimmedPath.startsWith('/')) {
    // Kiểm tra xem có extension ảnh hoặc là đường dẫn hợp lệ
    if (hasImageExtension || trimmedPath.includes('/img/') || trimmedPath.includes('/images/')) {
      return trimmedPath
    }
    // Nếu không có extension và không phải đường dẫn ảnh thông thường, có thể không hợp lệ
    // Nhưng vẫn thử load (có thể là đường dẫn đặc biệt)
    return trimmedPath
  }

  // Nếu đường dẫn không có / ở đầu, thêm / để đảm bảo là public URL
  // Nhưng chỉ nếu có extension ảnh hoặc trông giống đường dẫn hợp lệ
  if (hasImageExtension || trimmedPath.includes('.')) {
    return `/${trimmedPath}`
  }

  // Nếu không có extension và không trông giống đường dẫn hợp lệ, trả về fallback
  if (import.meta.env.DEV) {
    console.warn(`⚠️ [getImageUrl] Đường dẫn không hợp lệ: "${trimmedPath}", sử dụng fallback`)
  }
  return fallbackImage
}

/**
 * Xác định URL redirect dựa trên role của user
 * @param userInfo - Thông tin user từ response (có thể có RoleId, roleId, Role.Name, role.name, RoleName, roleName)
 * @returns URL path để redirect
 */
export const getRedirectUrlByRole = (userInfo: any): string => {
  if (!userInfo) {
    return '/'
  }

  // Lấy roleId hoặc role name từ userInfo
  let roleId: number | null = null
  let roleName: string | null = null

  // Kiểm tra RoleId hoặc roleId
  if (userInfo.RoleId !== undefined && userInfo.RoleId !== null) {
    roleId = Number(userInfo.RoleId)
  } else if (userInfo.roleId !== undefined && userInfo.roleId !== null) {
    roleId = Number(userInfo.roleId)
  }

  // Kiểm tra Role.Name hoặc role.name
  if (userInfo.Role?.Name) {
    roleName = userInfo.Role.Name
  } else if (userInfo.role?.name) {
    roleName = userInfo.role.name
  } else if (userInfo.RoleName) {
    roleName = userInfo.RoleName
  } else if (userInfo.roleName) {
    roleName = userInfo.roleName
  }

  // Ưu tiên sử dụng roleId nếu có
  if (roleId !== null) {
    // Role mapping: 1 = Admin, 2 = Host, 3 = Agency, 4 = Tourist
    if (roleId === 2) {
      return '/host-dashboard' // Host
    }
    if (roleId === 3) {
      return '/profile' // Agency - sử dụng profile page
    }
    if (roleId === 4) {
      return '/profile' // Tourist - sử dụng profile page
    }
    // Admin hoặc role khác - về trang chủ
    return '/'
  }

  // Nếu không có roleId, sử dụng roleName
  if (roleName) {
    const roleNameLower = roleName.toLowerCase()
    if (roleNameLower === 'host') {
      return '/host-dashboard'
    }
    if (roleNameLower === 'agency') {
      return '/profile'
    }
    if (roleNameLower === 'tourist' || roleNameLower === 'user') {
      return '/profile'
    }
  }

  // Mặc định về trang chủ
  return '/'
}


