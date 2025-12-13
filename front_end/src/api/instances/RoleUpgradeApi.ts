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

// Backend enum values
const CertificateTypeEnum = {
  Agency: 1,
  Host: 2
} as const

// Kết nối backend thật
const USE_MOCK_ROLE_UPGRADE = false

const MOCK_AGENCY_CERTIFICATES: AgencyCertificate[] = [
  {
    agencyId: 1,
    accountId: 10,
    companyName: 'Công ty Du lịch ABC',
    licenseFile: 'Giấy phép kinh doanh số 0123456789',
    phone: '0901234567',
    email: 'abc@example.com',
    website: 'https://abc-travel.vn',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: undefined,
    userName: 'Nguyễn Văn A',
    userEmail: 'a@example.com'
  },
  {
    agencyId: 2,
    accountId: 11,
    companyName: 'Công ty Du lịch XYZ',
    licenseFile: 'Giấy phép số 987654321',
    phone: '0912345678',
    email: 'xyz@example.com',
    website: null,
    status: 'Approved',
    rejectComment: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    userName: 'Trần Thị B',
    userEmail: 'b@example.com'
  }
]

const MOCK_HOST_CERTIFICATES: HostCertificate[] = [
  {
    certificateId: 1,
    hostId: 20,
    businessLicenseFile: 'Giấy phép kinh doanh homestay 123',
    businessName: 'Homestay Đà Lạt Xinh',
    phone: '0987654321',
    email: 'host1@example.com',
    status: 'Pending',
    rejectComment: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: undefined,
    hostName: 'Lê Văn C',
    hostEmail: 'c@example.com'
  },
  {
    certificateId: 2,
    hostId: 21,
    businessLicenseFile: 'Giấy phép villa biển',
    businessName: 'Villa Biển Xanh',
    phone: '0977777777',
    email: 'host2@example.com',
    status: 'Rejected',
    rejectComment: 'Thiếu giấy tờ xác minh địa chỉ',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    hostName: 'Phạm Thị D',
    hostEmail: 'd@example.com'
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

  // Check content type to handle both JSON and text responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  // If not JSON, return text as-is (backend returns plain string for success messages)
  const text = await response.text()
  return text as T
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

    const endpoint = '/api/user/approve-certificate'
    console.log('[RoleUpgradeApi] Approving certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: CertificateTypeEnum[payload.type] // Convert string to enum number
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

    const endpoint = '/api/user/reject-certificate'
    console.log('[RoleUpgradeApi] Rejecting certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: CertificateTypeEnum[payload.type], // Convert string to enum number
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

    const endpoint = '/api/user/review-certificate'
    console.log('[RoleUpgradeApi] Reviewing certificate:', { certificateId: payload.certificateId, type: payload.type })
    
    const response = await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers: ensureAuthHeaders(),
      body: JSON.stringify({
        CertificateId: payload.certificateId,
        Type: CertificateTypeEnum[payload.type], // Convert string to enum number
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

