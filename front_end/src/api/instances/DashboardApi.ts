import { fetchWithFallback, extractErrorMessage, getAuthToken, DISABLE_BACKEND } from './httpClient'

export type DashboardDto = {
  totalUsers: number
  userGrowth: string
  totalPosts: number
  postGrowth: string
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
  userGrowth: '+12% so với tháng trước',
  totalPosts: 342,
  postGrowth: '+8%',
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

const normalizeDashboard = (payload: any): DashboardDto => ({
  totalUsers: payload?.totalUsers ?? payload?.TotalUsers ?? 0,
  userGrowth: payload?.userGrowth ?? payload?.UserGrowth ?? '',
  totalPosts: payload?.totalPosts ?? payload?.TotalPosts ?? 0,
  postGrowth: payload?.postGrowth ?? payload?.PostGrowth ?? '',
  pendingSupports: payload?.pendingSupports ?? payload?.PendingSupports ?? 0,
  totalViews: payload?.totalViews ?? payload?.TotalViews ?? 0,
  todayComments: payload?.todayComments ?? payload?.TodayComments ?? 0,
  todayReactions: payload?.todayReactions ?? payload?.TodayReactions ?? 0,
  todayChatMessages: payload?.todayChatMessages ?? payload?.TodayChatMessages ?? 0,
  unreadNotifications: payload?.unreadNotifications ?? payload?.UnreadNotifications ?? 0,
  activeTours: payload?.activeTours ?? payload?.ActiveTours ?? 0,
  todayBookings: payload?.todayBookings ?? payload?.TodayBookings ?? 0,
  recentActivities: (payload?.recentActivities ?? payload?.RecentActivities ?? []).map((item: any) => ({
    description: item?.description ?? item?.Description ?? '',
    timeAgo: item?.timeAgo ?? item?.TimeAgo ?? '',
    type: item?.type ?? item?.Type ?? ''
  })),
  urgentSupports: payload?.urgentSupports ?? payload?.UrgentSupports ?? 0,
  pendingUpgradeRequests: payload?.pendingUpgradeRequests ?? payload?.PendingUpgradeRequests ?? 0,
  unreadMessages: payload?.unreadMessages ?? payload?.UnreadMessages ?? 0,
  popularPosts: (payload?.popularPosts ?? payload?.PopularPosts ?? []).map((item: any) => ({
    id: item?.id ?? item?.Id ?? 0,
    title: item?.title ?? item?.Title ?? '',
    authorName: item?.authorName ?? item?.AuthorName ?? '',
    reactionsCount: item?.reactionsCount ?? item?.ReactionsCount ?? 0,
    commentsCount: item?.commentsCount ?? item?.CommentsCount ?? 0,
    createdAt: item?.createdAt ?? item?.CreatedAt ?? null
  }))
})

export const fetchDashboardData = async (): Promise<DashboardDto> => {
  if (USE_MOCK_DASHBOARD) {
    console.warn('[DashboardApi] Using MOCK_DASHBOARD data (backend disabled)')
    return MOCK_DASHBOARD
  }

  const data = await authorizedRequest('/api/dashboard', {
    method: 'GET'
  })
  return normalizeDashboard(data)
}

