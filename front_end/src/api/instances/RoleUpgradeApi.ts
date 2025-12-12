import { fetchWithFallback, extractErrorMessage, getAuthToken, DISABLE_BACKEND } from './httpClient'

type CertificateStatus = 'Pending' | 'Approved' | 'Rejected' | 'Review' | string | null | undefined

export type AgencyCertificate = {
  agencyId: number
  accountId: number
  companyName: string
  licenseFile: string
  phone: string
  email: string
  website?: string | null
  status?: CertificateStatus
  rejectComment?: string | null
  createdAt?: string
  updatedAt?: string
  userName?: string
  userEmail?: string
}

export type HostCertificate = {
  certificateId: number
  hostId: number
  businessLicenseFile: string
  businessName: string
  phone: string
  email: string
  status?: CertificateStatus
  rejectComment?: string | null
  createdAt?: string
  updatedAt?: string
  hostName?: string
  hostEmail?: string
}

export type CertificateType = 'Agency' | 'Host'

// Kết nối backend thật
// Đặt USE_MOCK_ROLE_UPGRADE = true để xem mock data
const USE_MOCK_ROLE_UPGRADE = true

// Mock data chỉ hiển thị các đơn từ Customer (RoleId = 4)
// Sau khi approve, role của user thay đổi nên certificate không còn hiển thị
// Vì vậy mock data chỉ có các status: Pending, Review, Rejected (chưa được approve)
// Sử dụng let để có thể cập nhật khi xử lý đơn
let MOCK_AGENCY_CERTIFICATES: AgencyCertificate[] = [
  {
    agencyId: 1,
    accountId: 10,
    companyName: 'Công ty Du lịch ABC',
    licenseFile: 'https://example.com/licenses/abc-license.pdf',
    phone: '0901234567',
    email: 'abc@example.com',
    website: 'https://abc-travel.vn',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: undefined,
    userName: 'Nguyễn Văn A (Customer)',
    userEmail: 'customer1@example.com'
  },
  {
    agencyId: 2,
    accountId: 11,
    companyName: 'Công ty Lữ hành Việt Nam',
    licenseFile: 'https://example.com/licenses/vietnam-travel-license.pdf',
    phone: '0923456789',
    email: 'info@vietnamtravel.vn',
    website: 'https://vietnamtravel.vn',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: undefined,
    userName: 'Trần Thị B (Customer)',
    userEmail: 'customer2@example.com'
  },
  {
    agencyId: 3,
    accountId: 12,
    companyName: 'Công ty Du lịch Sinh thái',
    licenseFile: 'https://example.com/licenses/eco-travel-license.pdf',
    phone: '0934567890',
    email: 'contact@ecotravel.vn',
    website: 'https://ecotravel.vn',
    status: 'Review',
    rejectComment: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    userName: 'Lê Văn C (Customer)',
    userEmail: 'customer3@example.com'
  },
  {
    agencyId: 4,
    accountId: 13,
    companyName: 'Công ty Du lịch Quốc tế',
    licenseFile: 'https://example.com/licenses/international-license.pdf',
    phone: '0945678901',
    email: 'info@internationaltravel.com',
    website: 'https://internationaltravel.com',
    status: 'Rejected',
    rejectComment: 'Giấy phép kinh doanh không hợp lệ, vui lòng cung cấp bản gốc',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    userName: 'Phạm Thị D (Customer)',
    userEmail: 'customer4@example.com'
  },
  {
    agencyId: 5,
    accountId: 14,
    companyName: 'Công ty Tổ chức Tour',
    licenseFile: 'https://example.com/licenses/tour-org-license.pdf',
    phone: '0956789012',
    email: 'sales@tourorg.vn',
    website: 'https://tourorg.vn',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(), // 12 giờ trước
    updatedAt: undefined,
    userName: 'Hoàng Văn E (Customer)',
    userEmail: 'customer5@example.com'
  },
  {
    agencyId: 6,
    accountId: 15,
    companyName: 'Công ty Du lịch Miền Trung',
    licenseFile: 'https://example.com/licenses/mientrung-travel-license.pdf',
    phone: '0967890123',
    email: 'info@mientrungtravel.vn',
    website: 'https://mientrungtravel.vn',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 0.25 * 86400000).toISOString(), // 6 giờ trước
    updatedAt: undefined,
    userName: 'Võ Thị F (Customer)',
    userEmail: 'customer6@example.com'
  }
]

// Mock data chỉ hiển thị các đơn từ Customer (RoleId = 4)
// Sau khi approve, role của user thay đổi nên certificate không còn hiển thị
// Vì vậy mock data chỉ có các status: Pending, Review, Rejected (chưa được approve)
// Sử dụng let để có thể cập nhật khi xử lý đơn
let MOCK_HOST_CERTIFICATES: HostCertificate[] = [
  {
    certificateId: 1,
    hostId: 20,
    businessLicenseFile: 'https://example.com/licenses/homestay-dalat-license.pdf',
    businessName: 'Homestay Đà Lạt Xinh',
    phone: '0987654321',
    email: 'customer7@example.com',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: undefined,
    hostName: 'Lê Văn G (Customer)',
    hostEmail: 'customer7@example.com'
  },
  {
    certificateId: 2,
    hostId: 21,
    businessLicenseFile: 'https://example.com/licenses/villa-bien-xanh-license.pdf',
    businessName: 'Villa Biển Xanh',
    phone: '0977777777',
    email: 'customer8@example.com',
    status: 'Rejected',
    rejectComment: 'Thiếu giấy tờ xác minh địa chỉ kinh doanh',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    hostName: 'Phạm Thị H (Customer)',
    hostEmail: 'customer8@example.com'
  },
  {
    certificateId: 3,
    hostId: 22,
    businessLicenseFile: 'https://example.com/licenses/resort-mountain-license.pdf',
    businessName: 'Resort Núi Rừng',
    phone: '0955555555',
    email: 'customer9@example.com',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: undefined,
    hostName: 'Trần Văn I (Customer)',
    hostEmail: 'customer9@example.com'
  },
  {
    certificateId: 4,
    hostId: 23,
    businessLicenseFile: 'https://example.com/licenses/camping-site-license.pdf',
    businessName: 'Khu Cắm Trại Thiên Nhiên',
    phone: '0944444444',
    email: 'customer10@example.com',
    status: 'Review',
    rejectComment: null,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    hostName: 'Lê Thị K (Customer)',
    hostEmail: 'customer10@example.com'
  },
  {
    certificateId: 5,
    hostId: 24,
    businessLicenseFile: 'https://example.com/licenses/beach-house-license.pdf',
    businessName: 'Nhà Nghỉ Biển Đẹp',
    phone: '0933333333',
    email: 'customer11@example.com',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 0.25 * 86400000).toISOString(), // 6 giờ trước
    updatedAt: undefined,
    hostName: 'Phạm Văn L (Customer)',
    hostEmail: 'customer11@example.com'
  },
  {
    certificateId: 6,
    hostId: 25,
    businessLicenseFile: 'https://example.com/licenses/boutique-hotel-license.pdf',
    businessName: 'Boutique Hotel Phố Cổ',
    phone: '0922222222',
    email: 'customer12@example.com',
    status: 'Rejected',
    rejectComment: 'Giấy phép kinh doanh đã hết hạn, cần gia hạn',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    hostName: 'Hoàng Thị M (Customer)',
    hostEmail: 'customer12@example.com'
  },
  {
    certificateId: 7,
    hostId: 26,
    businessLicenseFile: 'https://example.com/licenses/farm-stay-license.pdf',
    businessName: 'Farm Stay Sinh thái',
    phone: '0911111111',
    email: 'customer13@example.com',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: undefined,
    hostName: 'Nguyễn Văn N (Customer)',
    hostEmail: 'customer13@example.com'
  }
]

const ensureAuthHeaders = () => {
  const token = getAuthToken()
  // Khi đang dev UI với mock data hoặc backend tắt, cho phép không có token
  if (!token && DISABLE_BACKEND) {
    console.warn('[RoleUpgradeApi] No token, but DISABLE_BACKEND=true -> dùng header không có Authorization')
    return {
      'Content-Type': 'application/json'
    }
  }
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

const normalizeAgencyCertificate = (payload: any): AgencyCertificate => {
  try {
    return {
      agencyId: Number(payload?.agencyId ?? payload?.AgencyId ?? 0),
      accountId: Number(payload?.accountId ?? payload?.AccountId ?? 0),
      companyName: payload?.companyName ?? payload?.CompanyName ?? '',
      licenseFile: payload?.licenseFile ?? payload?.LicenseFile ?? '',
      phone: payload?.phone ?? payload?.Phone ?? '',
      email: payload?.email ?? payload?.Email ?? '',
      website: payload?.website ?? payload?.Website ?? null,
      status: payload?.status ?? payload?.Status ?? null,
      rejectComment: payload?.rejectComment ?? payload?.RejectComment ?? null,
      createdAt: payload?.createdAt ?? payload?.CreatedAt ?? null,
      updatedAt: payload?.updatedAt ?? payload?.UpdatedAt ?? null,
      userName: payload?.userName ?? payload?.UserName ?? '',
      userEmail: payload?.userEmail ?? payload?.UserEmail ?? ''
    }
  } catch (error) {
    console.warn('[RoleUpgradeApi] Failed to normalize AgencyCertificate:', payload, error)
    throw new Error('Dữ liệu chứng chỉ Agency không hợp lệ')
  }
}

const normalizeHostCertificate = (payload: any): HostCertificate => {
  try {
    return {
      certificateId: Number(payload?.certificateId ?? payload?.CertificateId ?? 0),
      hostId: Number(payload?.hostId ?? payload?.HostId ?? 0),
      businessLicenseFile: payload?.businessLicenseFile ?? payload?.BusinessLicenseFile ?? '',
      businessName: payload?.businessName ?? payload?.BusinessName ?? '',
      phone: payload?.phone ?? payload?.Phone ?? '',
      email: payload?.email ?? payload?.Email ?? '',
      status: payload?.status ?? payload?.Status ?? null,
      rejectComment: payload?.rejectComment ?? payload?.RejectComment ?? null,
      createdAt: payload?.createdAt ?? payload?.CreatedAt ?? null,
      updatedAt: payload?.updatedAt ?? payload?.UpdatedAt ?? null,
      hostName: payload?.hostName ?? payload?.HostName ?? '',
      hostEmail: payload?.hostEmail ?? payload?.HostEmail ?? ''
    }
  } catch (error) {
    console.warn('[RoleUpgradeApi] Failed to normalize HostCertificate:', payload, error)
    throw new Error('Dữ liệu chứng chỉ Host không hợp lệ')
  }
}

/**
 * Yêu cầu nâng cấp lên Agency (Chỉ Customer)
 * Endpoint: POST /api/user/request-upgrade-to-agency
 * Requires: Authentication + Customer role
 * @param payload - Thông tin yêu cầu nâng cấp
 */
export const requestAgencyUpgrade = async (payload: {
  companyName: string
  licenseFile: string
  phone: string
  email: string
  website?: string
}): Promise<string> => {
  try {
    if (USE_MOCK_ROLE_UPGRADE) {
      console.warn('[RoleUpgradeApi] requestAgencyUpgrade MOCK only (backend disabled)', payload)
      return 'Yêu cầu nâng cấp Agency (mock) đã được ghi nhận.'
    }
    // Validate required fields
    if (!payload.companyName?.trim()) {
      throw new Error('Tên công ty không được để trống')
    }
    if (!payload.licenseFile?.trim()) {
      throw new Error('File giấy phép không được để trống')
    }
    if (!payload.phone?.trim()) {
      throw new Error('Số điện thoại không được để trống')
    }
    if (!payload.email?.trim()) {
      throw new Error('Email không được để trống')
    }

    const endpoint = '/api/user/request-upgrade-to-agency'
    console.log('[RoleUpgradeApi] Requesting agency upgrade:', { companyName: payload.companyName })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'POST',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CompanyName: payload.companyName.trim(),
        LicenseFile: payload.licenseFile.trim(),
        Phone: payload.phone.trim(),
        Email: payload.email.trim(),
        ...(payload.website?.trim() ? { Website: payload.website.trim() } : {})
      })
    })
    
    const result = await handleResponse<string>(response)
    console.log('[RoleUpgradeApi] Agency upgrade request submitted successfully')
    return result || 'Yêu cầu nâng cấp đã được gửi thành công. Vui lòng chờ admin phê duyệt.'
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể gửi yêu cầu nâng cấp'
    console.error('[RoleUpgradeApi] Error requesting agency upgrade:', error)
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

/**
 * Yêu cầu nâng cấp lên Host (Chỉ Customer)
 * Endpoint: POST /api/user/request-upgrade-to-host
 * Requires: Authentication + Customer role
 * @param payload - Thông tin yêu cầu nâng cấp
 */
export const requestHostUpgrade = async (payload: {
  businessName: string
  businessLicenseFile: string
  phone: string
  email: string
}): Promise<string> => {
  try {
    if (USE_MOCK_ROLE_UPGRADE) {
      console.warn('[RoleUpgradeApi] requestHostUpgrade MOCK only (backend disabled)', payload)
      return 'Yêu cầu nâng cấp Host (mock) đã được ghi nhận.'
    }
    // Validate required fields
    if (!payload.businessName?.trim()) {
      throw new Error('Tên doanh nghiệp không được để trống')
    }
    if (!payload.businessLicenseFile?.trim()) {
      throw new Error('File giấy phép kinh doanh không được để trống')
    }
    if (!payload.phone?.trim()) {
      throw new Error('Số điện thoại không được để trống')
    }
    if (!payload.email?.trim()) {
      throw new Error('Email không được để trống')
    }

    const endpoint = '/api/user/request-upgrade-to-host'
    console.log('[RoleUpgradeApi] Requesting host upgrade:', { businessName: payload.businessName })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'POST',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        BusinessName: payload.businessName.trim(),
        BusinessLicenseFile: payload.businessLicenseFile.trim(),
        Phone: payload.phone.trim(),
        Email: payload.email.trim()
      })
    })
    
    const result = await handleResponse<string>(response)
    console.log('[RoleUpgradeApi] Host upgrade request submitted successfully')
    return result || 'Yêu cầu nâng cấp đã được gửi thành công. Vui lòng chờ admin phê duyệt.'
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể gửi yêu cầu nâng cấp'
    console.error('[RoleUpgradeApi] Error requesting host upgrade:', error)
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

const buildQuery = (status?: string) => (status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '')

/**
 * Lấy danh sách chứng chỉ Agency (Chỉ Admin)
 * Endpoint: GET /api/user/agency-certificates?status={status}
 * Requires: Authentication + Admin role
 * @param status - Lọc theo trạng thái (Pending, Approved, Rejected, Review) hoặc undefined để lấy tất cả
 */
export const getAgencyCertificates = async (status?: string): Promise<AgencyCertificate[]> => {
  if (USE_MOCK_ROLE_UPGRADE) {
    console.warn('[RoleUpgradeApi] Using MOCK_AGENCY_CERTIFICATES (backend disabled)')
    if (!status || status === 'All') return MOCK_AGENCY_CERTIFICATES
    const lower = status.toLowerCase()
    return MOCK_AGENCY_CERTIFICATES.filter(c => (c.status || '').toLowerCase() === lower)
  }

  try {
    const endpoint = `/api/user/agency-certificates${buildQuery(status)}`
    console.log('[RoleUpgradeApi] Fetching agency certificates:', { status })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: ensureAuthHeaders()
    })
    
    // Nếu response không ok, kiểm tra xem có phải lỗi do không có dữ liệu không
    if (!response.ok) {
      // Nếu là lỗi 404 hoặc lỗi liên quan đến null/empty, trả về mảng rỗng
      if (response.status === 404 || response.status === 400) {
        try {
          const errorText = await response.text()
          if (errorText.includes('null') || errorText.includes('Value cannot be null') || errorText.includes('Parameter \'json\'')) {
            console.warn('[RoleUpgradeApi] Backend returned null/empty error, returning empty array')
            return []
          }
        } catch {
          // Nếu không đọc được error text, vẫn trả về mảng rỗng
          console.warn('[RoleUpgradeApi] Could not read error text, returning empty array')
          return []
        }
      }
      // Nếu là lỗi network, throw error
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
      }
      // Với các lỗi khác (400, 401, 403), cũng trả về mảng rỗng để hiển thị "chưa có yêu cầu"
      console.warn('[RoleUpgradeApi] Response not ok, returning empty array to show "no requests" message')
      return []
    }
    
    const result = await handleResponse<any[]>(response)
    
    // Nếu result là null hoặc undefined, trả về mảng rỗng
    if (result == null) {
      console.warn('[RoleUpgradeApi] getAgencyCertificates: Response is null/undefined, returning empty array')
      return []
    }
    
    if (!Array.isArray(result)) {
      console.warn('[RoleUpgradeApi] getAgencyCertificates: Response is not an array:', result)
      return []
    }
    
    const normalized = result.map(normalizeAgencyCertificate)
    console.log(`[RoleUpgradeApi] Fetched ${normalized.length} agency certificates`)
    return normalized
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể lấy danh sách chứng chỉ Agency'
    console.error('[RoleUpgradeApi] Error fetching agency certificates:', error)
    
    // Nếu lỗi liên quan đến null hoặc empty data, trả về mảng rỗng thay vì throw
    if (errorMessage.includes('Value cannot be null') || 
        errorMessage.includes('Parameter \'json\'') ||
        errorMessage.includes('null')) {
      console.warn('[RoleUpgradeApi] Error related to null/empty data, returning empty array')
      return []
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    // Với các lỗi khác, cũng trả về mảng rỗng để không hiển thị lỗi cho user
    // (vì có thể là do chưa có dữ liệu)
    console.warn('[RoleUpgradeApi] Unknown error, returning empty array to show "no requests" message')
    return []
  }
}

/**
 * Lấy danh sách chứng chỉ Host (Chỉ Admin)
 * Endpoint: GET /api/user/host-certificates?status={status}
 * Requires: Authentication + Admin role
 * @param status - Lọc theo trạng thái (Pending, Approved, Rejected, Review) hoặc undefined để lấy tất cả
 */
export const getHostCertificates = async (status?: string): Promise<HostCertificate[]> => {
  if (USE_MOCK_ROLE_UPGRADE) {
    console.warn('[RoleUpgradeApi] Using MOCK_HOST_CERTIFICATES (backend disabled)')
    if (!status || status === 'All') return MOCK_HOST_CERTIFICATES
    const lower = status.toLowerCase()
    return MOCK_HOST_CERTIFICATES.filter(c => (c.status || '').toLowerCase() === lower)
  }

  try {
    const endpoint = `/api/user/host-certificates${buildQuery(status)}`
    console.log('[RoleUpgradeApi] Fetching host certificates:', { status })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: ensureAuthHeaders()
    })
    
    // Nếu response không ok, kiểm tra xem có phải lỗi do không có dữ liệu không
    if (!response.ok) {
      // Nếu là lỗi 404 hoặc lỗi liên quan đến null/empty, trả về mảng rỗng
      if (response.status === 404 || response.status === 400) {
        try {
          const errorText = await response.text()
          if (errorText.includes('null') || errorText.includes('Value cannot be null') || errorText.includes('Parameter \'json\'')) {
            console.warn('[RoleUpgradeApi] Backend returned null/empty error, returning empty array')
            return []
          }
        } catch {
          // Nếu không đọc được error text, vẫn trả về mảng rỗng
          console.warn('[RoleUpgradeApi] Could not read error text, returning empty array')
          return []
        }
      }
      // Nếu là lỗi network, throw error
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
      }
      // Với các lỗi khác (400, 401, 403), cũng trả về mảng rỗng để hiển thị "chưa có yêu cầu"
      console.warn('[RoleUpgradeApi] Response not ok, returning empty array to show "no requests" message')
      return []
    }
    
    const result = await handleResponse<any[]>(response)
    
    // Nếu result là null hoặc undefined, trả về mảng rỗng
    if (result == null) {
      console.warn('[RoleUpgradeApi] getHostCertificates: Response is null/undefined, returning empty array')
      return []
    }
    
    if (!Array.isArray(result)) {
      console.warn('[RoleUpgradeApi] getHostCertificates: Response is not an array:', result)
      return []
    }
    
    const normalized = result.map(normalizeHostCertificate)
    console.log(`[RoleUpgradeApi] Fetched ${normalized.length} host certificates`)
    return normalized
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể lấy danh sách chứng chỉ Host'
    console.error('[RoleUpgradeApi] Error fetching host certificates:', error)
    
    // Nếu lỗi liên quan đến null hoặc empty data, trả về mảng rỗng thay vì throw
    if (errorMessage.includes('Value cannot be null') || 
        errorMessage.includes('Parameter \'json\'') ||
        errorMessage.includes('null')) {
      console.warn('[RoleUpgradeApi] Error related to null/empty data, returning empty array')
      return []
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    // Với các lỗi khác, cũng trả về mảng rỗng để không hiển thị lỗi cho user
    // (vì có thể là do chưa có dữ liệu)
    console.warn('[RoleUpgradeApi] Unknown error, returning empty array to show "no requests" message')
    return []
  }
}

/**
 * ⚠️ DEPRECATED: Endpoint không tồn tại trong backend
 * Backend không có endpoint GET /api/user/my-agency-request
 * Để lấy chứng chỉ Agency của user hiện tại, sử dụng getAgencyCertificates() và filter theo accountId
 * 
 * @deprecated Endpoint không tồn tại trong backend
 */
export const getMyAgencyCertificate = async (): Promise<AgencyCertificate | null> => {
  console.warn('[RoleUpgradeApi] getMyAgencyCertificate is deprecated - endpoint does not exist in backend')
  return null
}

/**
 * ⚠️ DEPRECATED: Endpoint không tồn tại trong backend
 * Backend không có endpoint GET /api/user/my-host-request
 * Để lấy chứng chỉ Host của user hiện tại, sử dụng getHostCertificates() và filter theo hostId
 * 
 * @deprecated Endpoint không tồn tại trong backend
 */
export const getMyHostCertificate = async (): Promise<HostCertificate | null> => {
  console.warn('[RoleUpgradeApi] getMyHostCertificate is deprecated - endpoint does not exist in backend')
  return null
}

/**
 * Phê duyệt chứng chỉ (Chỉ Admin)
 * Endpoint: PUT /api/user/approve-certificate
 * Requires: Authentication + Admin role
 * @param payload - Thông tin chứng chỉ cần phê duyệt
 */
export const approveCertificate = async (payload: { certificateId: number; type: CertificateType }): Promise<string> => {
  try {
    // Validate input
    if (!payload.certificateId || payload.certificateId <= 0) {
      throw new Error('ID chứng chỉ không hợp lệ')
    }
    if (!payload.type || (payload.type !== 'Agency' && payload.type !== 'Host')) {
      throw new Error('Loại chứng chỉ không hợp lệ (phải là Agency hoặc Host)')
    }

    // Mock data: Xóa certificate khỏi danh sách (vì sau khi approve, role đã thay đổi nên không còn hiển thị)
    if (USE_MOCK_ROLE_UPGRADE) {
      console.log('[RoleUpgradeApi] Approving certificate (MOCK):', { certificateId: payload.certificateId, type: payload.type })
      if (payload.type === 'Agency') {
        MOCK_AGENCY_CERTIFICATES = MOCK_AGENCY_CERTIFICATES.filter(
          c => c.agencyId !== payload.certificateId
        )
        console.log('[RoleUpgradeApi] Removed approved agency certificate from mock data')
      } else {
        MOCK_HOST_CERTIFICATES = MOCK_HOST_CERTIFICATES.filter(
          c => c.certificateId !== payload.certificateId
        )
        console.log('[RoleUpgradeApi] Removed approved host certificate from mock data')
      }
      return 'Chứng chỉ đã được phê duyệt thành công. (Mock)'
    }

    const endpoint = '/api/user/approve-certificate'
    console.log('[RoleUpgradeApi] Approving certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    // Convert type string to number (Agency = 1, Host = 2)
    const typeNumber = payload.type === 'Agency' ? 1 : 2
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: typeNumber
      })
    })
    
    const result = await handleResponse<string>(response)
    console.log('[RoleUpgradeApi] Certificate approved successfully')
    return result || 'Chứng chỉ đã được phê duyệt thành công.'
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể phê duyệt chứng chỉ'
    console.error('[RoleUpgradeApi] Error approving certificate:', error)
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

/**
 * Từ chối chứng chỉ (Chỉ Admin)
 * Endpoint: PUT /api/user/reject-certificate
 * Requires: Authentication + Admin role
 * @param payload - Thông tin chứng chỉ cần từ chối
 */
export const rejectCertificate = async (payload: { certificateId: number; type: CertificateType; comment: string }): Promise<string> => {
  try {
    // Validate input
    if (!payload.certificateId || payload.certificateId <= 0) {
      throw new Error('ID chứng chỉ không hợp lệ')
    }
    if (!payload.type || (payload.type !== 'Agency' && payload.type !== 'Host')) {
      throw new Error('Loại chứng chỉ không hợp lệ (phải là Agency hoặc Host)')
    }
    if (!payload.comment?.trim()) {
      throw new Error('Lý do từ chối không được để trống')
    }

    // Mock data: Cập nhật status thành Rejected và thêm rejectComment
    if (USE_MOCK_ROLE_UPGRADE) {
      console.log('[RoleUpgradeApi] Rejecting certificate (MOCK):', { certificateId: payload.certificateId, type: payload.type, comment: payload.comment })
      if (payload.type === 'Agency') {
        const cert = MOCK_AGENCY_CERTIFICATES.find(c => c.agencyId === payload.certificateId)
        if (cert) {
          cert.status = 'Rejected'
          cert.rejectComment = payload.comment.trim()
          cert.updatedAt = new Date().toISOString()
          console.log('[RoleUpgradeApi] Updated agency certificate status to Rejected in mock data')
        }
      } else {
        const cert = MOCK_HOST_CERTIFICATES.find(c => c.certificateId === payload.certificateId)
        if (cert) {
          cert.status = 'Rejected'
          cert.rejectComment = payload.comment.trim()
          cert.updatedAt = new Date().toISOString()
          console.log('[RoleUpgradeApi] Updated host certificate status to Rejected in mock data')
        }
      }
      return 'Chứng chỉ đã bị từ chối. (Mock)'
    }

    const endpoint = '/api/user/reject-certificate'
    console.log('[RoleUpgradeApi] Rejecting certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    // Convert type string to number (Agency = 1, Host = 2)
    const typeNumber = payload.type === 'Agency' ? 1 : 2
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: typeNumber,
        Comment: payload.comment.trim()
      })
    })
    
    const result = await handleResponse<string>(response)
    console.log('[RoleUpgradeApi] Certificate rejected successfully')
    return result || 'Chứng chỉ đã bị từ chối.'
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể từ chối chứng chỉ'
    console.error('[RoleUpgradeApi] Error rejecting certificate:', error)
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

/**
 * Yêu cầu bổ sung thông tin chứng chỉ (Chỉ Admin)
 * Endpoint: PUT /api/user/review-certificate
 * Requires: Authentication + Admin role
 * @param payload - Thông tin chứng chỉ cần yêu cầu bổ sung
 */
export const reviewCertificate = async (payload: { certificateId: number; type: CertificateType; comment: string }): Promise<string> => {
  try {
    // Validate input
    if (!payload.certificateId || payload.certificateId <= 0) {
      throw new Error('ID chứng chỉ không hợp lệ')
    }
    if (!payload.type || (payload.type !== 'Agency' && payload.type !== 'Host')) {
      throw new Error('Loại chứng chỉ không hợp lệ (phải là Agency hoặc Host)')
    }
    if (!payload.comment?.trim()) {
      throw new Error('Nội dung yêu cầu bổ sung không được để trống')
    }

    // Mock data: Cập nhật status thành Review
    if (USE_MOCK_ROLE_UPGRADE) {
      console.log('[RoleUpgradeApi] Reviewing certificate (MOCK):', { certificateId: payload.certificateId, type: payload.type, comment: payload.comment })
      if (payload.type === 'Agency') {
        const cert = MOCK_AGENCY_CERTIFICATES.find(c => c.agencyId === payload.certificateId)
        if (cert) {
          cert.status = 'Review'
          cert.updatedAt = new Date().toISOString()
          console.log('[RoleUpgradeApi] Updated agency certificate status to Review in mock data')
        }
      } else {
        const cert = MOCK_HOST_CERTIFICATES.find(c => c.certificateId === payload.certificateId)
        if (cert) {
          cert.status = 'Review'
          cert.updatedAt = new Date().toISOString()
          console.log('[RoleUpgradeApi] Updated host certificate status to Review in mock data')
        }
      }
      return 'Yêu cầu bổ sung thông tin đã được gửi. (Mock)'
    }

    const endpoint = '/api/user/review-certificate'
    console.log('[RoleUpgradeApi] Reviewing certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    // Convert type string to number (Agency = 1, Host = 2)
    const typeNumber = payload.type === 'Agency' ? 1 : 2
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: typeNumber,
        Comment: payload.comment.trim()
      })
    })
    
    const result = await handleResponse<string>(response)
    console.log('[RoleUpgradeApi] Certificate review request sent successfully')
    return result || 'Yêu cầu bổ sung thông tin đã được gửi.'
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể gửi yêu cầu bổ sung thông tin'
    console.error('[RoleUpgradeApi] Error reviewing certificate:', error)
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?')
    }
    
    throw error
  }
}

