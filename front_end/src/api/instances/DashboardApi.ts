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
  // Khi đang dev UI với mock data hoặc backend tắt, cho phép không có token
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

const normalizeDashboard = (payload: DashboardStatisticsDto): DashboardDto => {
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
    // These fields are not available in DashboardStatisticsDto, will need separate API calls
    pendingSupports: 0,
    totalViews: 0,
    todayComments: 0,
    todayReactions: 0,
    todayChatMessages: 0,
    unreadNotifications: 0,
    activeTours: totalServiceCombos, // Use totalServiceCombos as activeTours
    todayBookings: 0,
    recentActivities: [],
    urgentSupports: 0,
    pendingUpgradeRequests: 0,
    unreadMessages: 0,
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

  const data = await authorizedRequest(`/api/statistics/dashboard?${params.toString()}`, {
    method: 'GET'
  })
  return normalizeDashboard(data)
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

// Mock time series data for screenshots
const MOCK_MONTHLY_TIME_SERIES: TimeSeriesDto = {
  period: 'month',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  data: [
    { label: 'Tháng 1', date: '2024-01-01', newUsers: 120, newServiceCombos: 5, newPosts: 25, revenue: 120_000_000, newBookings: 45 },
    { label: 'Tháng 2', date: '2024-02-01', newUsers: 150, newServiceCombos: 8, newPosts: 30, revenue: 150_000_000, newBookings: 52 },
    { label: 'Tháng 3', date: '2024-03-01', newUsers: 180, newServiceCombos: 12, newPosts: 35, revenue: 180_000_000, newBookings: 58 },
    { label: 'Tháng 4', date: '2024-04-01', newUsers: 160, newServiceCombos: 10, newPosts: 28, revenue: 160_000_000, newBookings: 48 },
    { label: 'Tháng 5', date: '2024-05-01', newUsers: 210, newServiceCombos: 15, newPosts: 42, revenue: 210_000_000, newBookings: 65 },
    { label: 'Tháng 6', date: '2024-06-01', newUsers: 240, newServiceCombos: 18, newPosts: 48, revenue: 240_000_000, newBookings: 72 },
    { label: 'Tháng 7', date: '2024-07-01', newUsers: 230, newServiceCombos: 16, newPosts: 45, revenue: 230_000_000, newBookings: 68 },
    { label: 'Tháng 8', date: '2024-08-01', newUsers: 260, newServiceCombos: 20, newPosts: 52, revenue: 260_000_000, newBookings: 75 },
    { label: 'Tháng 9', date: '2024-09-01', newUsers: 220, newServiceCombos: 14, newPosts: 38, revenue: 220_000_000, newBookings: 62 },
    { label: 'Tháng 10', date: '2024-10-01', newUsers: 280, newServiceCombos: 22, newPosts: 55, revenue: 280_000_000, newBookings: 82 },
    { label: 'Tháng 11', date: '2024-11-01', newUsers: 300, newServiceCombos: 25, newPosts: 60, revenue: 300_000_000, newBookings: 88 },
    { label: 'Tháng 12', date: '2024-12-01', newUsers: 320, newServiceCombos: 28, newPosts: 65, revenue: 320_000_000, newBookings: 95 }
  ]
}

const MOCK_DAILY_TIME_SERIES: TimeSeriesDto = {
  period: 'day',
  startDate: '2024-12-01',
  endDate: '2024-12-30',
  data: Array.from({ length: 30 }, (_, idx) => {
    const day = idx + 1
    const base = 3_000_000 + (day % 7 === 0 || day % 7 === 6 ? 4_000_000 : 0)
    const fluctuation = (day % 5) * 500_000
    return {
      label: `Ngày ${day}`,
      date: `2024-12-${String(day).padStart(2, '0')}`,
      newUsers: Math.floor(Math.random() * 20) + 5,
      newServiceCombos: Math.floor(Math.random() * 3) + 1,
      newPosts: Math.floor(Math.random() * 8) + 2,
      revenue: base + fluctuation,
      newBookings: Math.floor(Math.random() * 10) + 3
    }
  })
}

// Fetch time series data for charts
export const fetchTimeSeriesData = async (
  period: string = 'month',
  startDate?: string,
  endDate?: string
): Promise<TimeSeriesDto> => {
  // Return mock data if USE_MOCK_DASHBOARD is true
  if (USE_MOCK_DASHBOARD) {
    console.warn('[DashboardApi] Using MOCK time series data (backend disabled)')
    return period === 'month' ? MOCK_MONTHLY_TIME_SERIES : MOCK_DAILY_TIME_SERIES
  }

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

