import { fetchWithFallback, extractErrorMessage, getAuthToken, DISABLE_BACKEND } from './httpClient'

export type DashboardDto = {
  totalUsers: number
  userGrowth: string
  totalPosts: number
  postGrowth: string
  totalServiceCombos: number
  serviceComboGrowth: string
  totalRevenue: number
  revenueGrowth: string
  totalBookings: number
  bookingGrowth: string
  pendingSupports: number
  totalViews: number
  todayComments: number
  todayReactions: number
  todayChatMessages: number
  unreadNotifications: number
  activeTours: number
  todayBookings: number
  recentActivities: ActivityDto[]
  urgentSupports: number
  pendingUpgradeRequests: number
  unreadMessages: number
  popularPosts: PopularPostDto[]
}

export interface ActivityDto {
  description: string
  timeAgo: string
  type: string
}

export interface PopularPostDto {
  id: number
  title: string
  authorName: string
  reactionsCount: number
  commentsCount: number
  createdAt: string | null
}

// Kết nối backend thật
const USE_MOCK_DASHBOARD = false

const MOCK_DASHBOARD: DashboardDto = {
  totalUsers: 1280,
  userGrowth: '+12% so với kỳ trước',
  totalPosts: 342,
  postGrowth: '+8% so với kỳ trước',
  totalServiceCombos: 45,
  serviceComboGrowth: '+5% so với kỳ trước',
  totalRevenue: 2500000000,
  revenueGrowth: '+15% so với kỳ trước',
  totalBookings: 156,
  bookingGrowth: '+10% so với kỳ trước',
  pendingSupports: 5,
  totalViews: 45210,
  todayComments: 37,
  todayReactions: 128,
  todayChatMessages: 64,
  unreadNotifications: 9,
  activeTours: 24,
  todayBookings: 12,
  urgentSupports: 2,
  pendingUpgradeRequests: 3,
  unreadMessages: 4,
  recentActivities: [
    { description: 'Người dùng A vừa gửi yêu cầu hỗ trợ mới', timeAgo: '5 phút trước', type: 'support' },
    { description: 'Bài viết mới được tạo bởi Admin', timeAgo: '20 phút trước', type: 'post' },
    { description: 'Có 2 yêu cầu nâng cấp vai trò mới', timeAgo: '1 giờ trước', type: 'role' }
  ],
  popularPosts: [
    {
      id: 1,
      title: 'Top 10 địa điểm du lịch nổi bật',
      authorName: 'Admin',
      reactionsCount: 120,
      commentsCount: 34,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Kinh nghiệm du lịch Đà Lạt tự túc',
      authorName: 'Nguyễn Văn B',
      reactionsCount: 85,
      commentsCount: 18,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
}

const authorizedRequest = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {})
  }
  if (token) {
    ;(headers as any).Authorization = `Bearer ${token}`
  } else if (!token && !DISABLE_BACKEND) {
    throw new Error('Vui lòng đăng nhập để tiếp tục.')
  } else {
    console.warn('[DashboardApi] No token, but DISABLE_BACKEND=true -> gửi request không Authorization')
  }

  const response = await fetchWithFallback(input as string, {
    ...init,
    headers
  })

  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(await extractErrorMessage(response, fallbackMessage))
  }

  return response.json()
}

// Backend DTO structure
interface DashboardStatisticsDto {
  totalUsers: number
  TotalUsers: number
  totalServiceCombos: number
  TotalServiceCombos: number
  totalPosts: number
  TotalPosts: number
  totalRevenue: number
  TotalRevenue: number
  totalBookings: number
  TotalBookings: number
  usersGrowthPercent: number
  UsersGrowthPercent: number
  serviceCombosGrowthPercent: number
  ServiceCombosGrowthPercent: number
  postsGrowthPercent: number
  PostsGrowthPercent: number
  revenueGrowthPercent: number
  RevenueGrowthPercent: number
  bookingsGrowthPercent: number
  BookingsGrowthPercent: number
}

// Helper function to format growth percentage
const formatGrowthPercent = (percent: number): string => {
  if (percent === 0) return 'Không thay đổi'
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(1)}% so với kỳ trước`
}

const normalizeDashboard = (payload: DashboardStatisticsDto, extraData?: any): DashboardDto => {
  const totalUsers = payload?.totalUsers ?? payload?.TotalUsers ?? 0
  const totalPosts = payload?.totalPosts ?? payload?.TotalPosts ?? 0
  const totalServiceCombos = payload?.totalServiceCombos ?? payload?.TotalServiceCombos ?? 0
  const totalRevenue = payload?.totalRevenue ?? payload?.TotalRevenue ?? 0
  const totalBookings = payload?.totalBookings ?? payload?.TotalBookings ?? 0
  
  const usersGrowthPercent = payload?.usersGrowthPercent ?? payload?.UsersGrowthPercent ?? 0
  const postsGrowthPercent = payload?.postsGrowthPercent ?? payload?.PostsGrowthPercent ?? 0
  const serviceCombosGrowthPercent = payload?.serviceCombosGrowthPercent ?? payload?.ServiceCombosGrowthPercent ?? 0
  const revenueGrowthPercent = payload?.revenueGrowthPercent ?? payload?.RevenueGrowthPercent ?? 0
  const bookingsGrowthPercent = payload?.bookingsGrowthPercent ?? payload?.BookingsGrowthPercent ?? 0

  // Extract extra data from additional API calls
  const badges = extraData?.badges || {}
  const postStats = extraData?.postStats || {}

  return {
    totalUsers,
    userGrowth: formatGrowthPercent(usersGrowthPercent),
    totalPosts,
    postGrowth: formatGrowthPercent(postsGrowthPercent),
    totalServiceCombos,
    serviceComboGrowth: formatGrowthPercent(serviceCombosGrowthPercent),
    totalRevenue,
    revenueGrowth: formatGrowthPercent(revenueGrowthPercent),
    totalBookings,
    bookingGrowth: formatGrowthPercent(bookingsGrowthPercent),
    // Admin badges - pendingSupports từ badges
    pendingSupports: badges?.PendingUpgradeRequests ?? badges?.pendingUpgradeRequests ?? 0,
    pendingUpgradeRequests: badges?.PendingUpgradeRequests ?? badges?.pendingUpgradeRequests ?? 0,
    unreadMessages: badges?.UnreadMessages ?? badges?.unreadMessages ?? 0,
    // Sử dụng totalBookings làm totalViews
    totalViews: totalBookings,
    // Post statistics
    todayComments: postStats?.TotalComments ?? postStats?.totalComments ?? 0,
    todayReactions: postStats?.TotalReactions ?? postStats?.totalReactions ?? 0,
    todayChatMessages: 0,
    unreadNotifications: 0,
    activeTours: totalServiceCombos,
    todayBookings: 0,
    recentActivities: [],
    urgentSupports: badges?.PendingUpgradeRequests ?? 0,
    popularPosts: []
  }
}

export const fetchDashboardData = async (
  period: string = 'day',
  startDate?: string,
  endDate?: string
): Promise<DashboardDto> => {
  if (USE_MOCK_DASHBOARD) {
    console.warn('[DashboardApi] Using MOCK_DASHBOARD data (backend disabled)')
    return MOCK_DASHBOARD
  }

  // Build query parameters
  const params = new URLSearchParams({ period })
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  // Fetch statistics in parallel
  const [dashboardData, badges, postStats] = await Promise.all([
    authorizedRequest(`/api/statistics/dashboard?${params.toString()}`, { method: 'GET' }),
    authorizedRequest('/api/statistics/admin-badges', { method: 'GET' }).catch(() => ({})),
    authorizedRequest(`/api/statistics/posts?${params.toString()}`, { method: 'GET' }).catch(() => ({}))
  ])

  return normalizeDashboard(dashboardData, { badges, postStats })
}

// Time Series DTO for charts
export interface TimeSeriesDataPoint {
  label: string
  date: string
  newUsers: number
  newServiceCombos: number
  newPosts: number
  revenue: number
  newBookings: number
}

export interface TimeSeriesDto {
  period: string
  startDate: string
  endDate: string
  data: TimeSeriesDataPoint[]
}

// Fetch time series data for charts
// period: 'year' -> doanh thu theo từng tháng trong năm
// period: 'month' -> doanh thu theo từng ngày trong tháng hiện tại
export const fetchTimeSeriesData = async (
  period: string = 'month',
  startDate?: string,
  endDate?: string
): Promise<TimeSeriesDto> => {
  const params = new URLSearchParams({ period })
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const data = await authorizedRequest(`/api/statistics/time-series?${params.toString()}`, {
    method: 'GET'
  })

  // Normalize the response
  return {
    period: data?.period ?? data?.Period ?? period,
    startDate: data?.startDate ?? data?.StartDate ?? '',
    endDate: data?.endDate ?? data?.EndDate ?? '',
    data: (data?.data ?? data?.Data ?? []).map((item: any) => ({
      label: item?.label ?? item?.Label ?? '',
      date: item?.date ?? item?.Date ?? '',
      newUsers: item?.newUsers ?? item?.NewUsers ?? 0,
      newServiceCombos: item?.newServiceCombos ?? item?.NewServiceCombos ?? 0,
      newPosts: item?.newPosts ?? item?.NewPosts ?? 0,
      revenue: item?.revenue ?? item?.Revenue ?? 0,
      newBookings: item?.newBookings ?? item?.NewBookings ?? 0
    }))
  }
}

// Top Spender DTO
export interface TopSpenderDto {
  userId: number
  userName: string
  email: string
  role: string
  totalSpent: number
  bookingCount: number
}

// Top Host DTO
export interface TopHostDto {
  hostId: number
  hostName: string
  email: string
  totalRevenue: number
  serviceComboCount: number
  totalBookings: number
}

// Fetch top users có chi tiêu cao nhất
export const fetchTopSpenders = async (top: number = 10): Promise<TopSpenderDto[]> => {
  const data = await authorizedRequest(`/api/statistics/top-spenders?top=${top}`, { method: 'GET' })
  return (data ?? []).map((item: any) => ({
    userId: item?.UserId ?? item?.userId ?? 0,
    userName: item?.UserName ?? item?.userName ?? 'Unknown',
    email: item?.Email ?? item?.email ?? '',
    role: item?.Role ?? item?.role ?? '',
    totalSpent: item?.TotalSpent ?? item?.totalSpent ?? 0,
    bookingCount: item?.BookingCount ?? item?.bookingCount ?? 0
  }))
}

// Fetch top hosts có doanh thu cao nhất
export const fetchTopHosts = async (top: number = 10): Promise<TopHostDto[]> => {
  const data = await authorizedRequest(`/api/statistics/top-hosts?top=${top}`, { method: 'GET' })
  return (data ?? []).map((item: any) => ({
    hostId: item?.HostId ?? item?.hostId ?? 0,
    hostName: item?.HostName ?? item?.hostName ?? 'Unknown',
    email: item?.Email ?? item?.email ?? '',
    totalRevenue: item?.TotalRevenue ?? item?.totalRevenue ?? 0,
    serviceComboCount: item?.ServiceComboCount ?? item?.serviceComboCount ?? 0,
    totalBookings: item?.TotalBookings ?? item?.totalBookings ?? 0
  }))
}
