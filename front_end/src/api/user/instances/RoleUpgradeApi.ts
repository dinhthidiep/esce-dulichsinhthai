import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

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

const ensureAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const handleResponse = async <T>(response: Response, clonedResponse?: Response): Promise<T> => {
  // Sử dụng clonedResponse nếu có (khi đã đọc body để log)
  const res = clonedResponse || response
  
  if (!res.ok) {
    const fallbackMessage = `HTTP ${res.status}: ${res.statusText}`
    throw new Error(await extractErrorMessage(res, fallbackMessage))
  }

  if (res.status === 204) {
    return null as T
  }

  return res.json()
}

export const requestAgencyUpgrade = async (payload: {
  companyName: string
  licenseFile: string
  phone: string
  email: string
  website?: string
}) => {
  // Convert to PascalCase for C# backend
  const requestBody = {
    CompanyName: payload.companyName,
    LicenseFile: payload.licenseFile,
    Phone: payload.phone,
    Email: payload.email,
    Website: payload.website || ''
  }
  
  const token = getAuthToken()
  console.log('🚀 [requestAgencyUpgrade] Sending request:', {
    url: '/user/request-upgrade-to-agency',
    hasToken: !!token,
    body: { ...requestBody, LicenseFile: requestBody.LicenseFile?.substring(0, 50) + '...' }
  })
  
  const response = await fetchWithFallback('/user/request-upgrade-to-agency', {
    method: 'POST',
    headers: ensureAuthHeaders(),
    body: JSON.stringify(requestBody)
  })
  
  console.log('📥 [requestAgencyUpgrade] Response status:', response.status, response.statusText)
  
  // Clone response để có thể đọc body nhiều lần
  const clonedResponse = response.clone()
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [requestAgencyUpgrade] Error response:', errorText)
  }
  
  return await handleResponse(clonedResponse)
}

export const requestHostUpgrade = async (payload: {
  businessName: string
  businessLicenseFile: string
  phone: string
  email: string
}) => {
  // Convert to PascalCase for C# backend
  const requestBody = {
    BusinessName: payload.businessName,
    BusinessLicenseFile: payload.businessLicenseFile,
    Phone: payload.phone,
    Email: payload.email
  }
  
  const token = getAuthToken()
  console.log('🚀 [requestHostUpgrade] Sending request:', {
    url: '/user/request-upgrade-to-host',
    hasToken: !!token,
    body: { ...requestBody, BusinessLicenseFile: requestBody.BusinessLicenseFile?.substring(0, 50) + '...' }
  })
  
  const response = await fetchWithFallback('/user/request-upgrade-to-host', {
    method: 'POST',
    headers: ensureAuthHeaders(),
    body: JSON.stringify(requestBody)
  })
  
  console.log('📥 [requestHostUpgrade] Response status:', response.status, response.statusText)
  
  // Clone response để có thể đọc body nhiều lần
  const clonedResponse = response.clone()
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [requestHostUpgrade] Error response:', errorText)
  }
  
  return await handleResponse(clonedResponse)
}

export const requestAgencyUpgradeWithPayment = async (payload: {
  companyName: string
  licenseFile: string
  phone: string
  email: string
  website?: string
}) => {
  // Bước 1: Gửi yêu cầu nâng cấp
  const upgradeResponse = await requestAgencyUpgrade(payload)
  
  // Bước 2: Trả về thông tin để frontend xử lý thanh toán
  const responseData = upgradeResponse && typeof upgradeResponse === 'object' ? upgradeResponse : {}
  return {
    ...responseData,
    requiresPayment: true,
    amount: 1000000 // 1,000,000 VND
  }
}



