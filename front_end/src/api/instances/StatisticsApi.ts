import { fetchWithFallback, extractErrorMessage, getAuthToken } from './httpClient'

export interface StatisticsDto {
  totalUsers: number
  totalPosts: number
  totalBookings: number
  totalNews: number
  totalServices: number
  totalServiceCombos: number
  pendingPosts: number
  approvedPosts: number
  rejectedPosts: number
  activeUsers: number
  bannedUsers: number
  totalRevenue: number
  pendingBookings: number
  confirmedBookings: number
  cancelledBookings: number
  pendingAgencyCertificates: number
  pendingHostCertificates: number
  userRoleStatistics: UserRoleStatistic[]
  monthlyRevenues: MonthlyRevenue[]
}

export interface UserRoleStatistic {
  roleName: string
  count: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
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

const normalizeStatistics = (payload: any): StatisticsDto => ({
  totalUsers: payload?.totalUsers ?? payload?.TotalUsers ?? 0,
  totalPosts: payload?.totalPosts ?? payload?.TotalPosts ?? 0,
  totalBookings: payload?.totalBookings ?? payload?.TotalBookings ?? 0,
  totalNews: payload?.totalNews ?? payload?.TotalNews ?? 0,
  totalServices: payload?.totalServices ?? payload?.TotalServices ?? 0,
  totalServiceCombos: payload?.totalServiceCombos ?? payload?.TotalServiceCombos ?? 0,
  pendingPosts: payload?.pendingPosts ?? payload?.PendingPosts ?? 0,
  approvedPosts: payload?.approvedPosts ?? payload?.ApprovedPosts ?? 0,
  rejectedPosts: payload?.rejectedPosts ?? payload?.RejectedPosts ?? 0,
  activeUsers: payload?.activeUsers ?? payload?.ActiveUsers ?? 0,
  bannedUsers: payload?.bannedUsers ?? payload?.BannedUsers ?? 0,
  totalRevenue: payload?.totalRevenue ?? payload?.TotalRevenue ?? 0,
  pendingBookings: payload?.pendingBookings ?? payload?.PendingBookings ?? 0,
  confirmedBookings: payload?.confirmedBookings ?? payload?.ConfirmedBookings ?? 0,
  cancelledBookings: payload?.cancelledBookings ?? payload?.CancelledBookings ?? 0,
  pendingAgencyCertificates: payload?.pendingAgencyCertificates ?? payload?.PendingAgencyCertificates ?? 0,
  pendingHostCertificates: payload?.pendingHostCertificates ?? payload?.PendingHostCertificates ?? 0,
  userRoleStatistics: (payload?.userRoleStatistics ?? payload?.UserRoleStatistics ?? []).map((item: any) => ({
    roleName: item?.roleName ?? item?.RoleName ?? '',
    count: item?.count ?? item?.Count ?? 0
  })),
  monthlyRevenues: (payload?.monthlyRevenues ?? payload?.MonthlyRevenues ?? []).map((item: any) => ({
    month: item?.month ?? item?.Month ?? '',
    revenue: item?.revenue ?? item?.Revenue ?? 0
  }))
})

export const fetchStatistics = async (): Promise<StatisticsDto> => {
  const data = await authorizedRequest('/api/statistics', {
    method: 'GET'
  })
  return normalizeStatistics(data)
}

