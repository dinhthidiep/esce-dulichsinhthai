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

export const requestAgencyUpgrade = async (payload: {
  companyName: string
  licenseFile: string
  phone: string
  email: string
  website?: string
}) => {
  const response = await fetchWithFallback('/api/user/request-upgrade-to-agency', {
    method: 'POST',
    headers: ensureAuthHeaders(),
    body: JSON.stringify(payload)
  })
  return await handleResponse(response)
}

export const requestHostUpgrade = async (payload: {
  businessName: string
  businessLicenseFile: string
  phone: string
  email: string
}) => {
  const response = await fetchWithFallback('/api/user/request-upgrade-to-host', {
    method: 'POST',
    headers: ensureAuthHeaders(),
    body: JSON.stringify(payload)
  })
  return await handleResponse(response)
}

