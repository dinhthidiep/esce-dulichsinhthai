import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ActivityCard from '~/components/common/ActivityCard'
import QuickStatic from '~/components/common/QuickStaticCard'
import PriorityTaskCard from '~/components/common/PriorityTaskCard'
import PopularPostCard from '~/components/common/PopularPostCard'
import { fetchDashboardData, type DashboardDto } from '~/api/instances/DashboardApi'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts'
import type {
  QuickStaticFeedProps,
  QuickStaticCardProps,
  ActivityFeedProps,
  ActivityCardProps,
  PriorityTaskCardFeedProps,
  PriorityTaskCardProps,
  PopularPostFeedProps,
  PopularPostProps
} from '~/types/common'

export default function MainDashBoardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchDashboardData()
        console.log('Dashboard main data loaded:', data)
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu')
        // Set fallback data
        setDashboardData({
          totalUsers: 0,
          userGrowth: '',
          totalPosts: 0,
          postGrowth: '',
          pendingSupports: 0,
          totalViews: 0,
          todayComments: 0,
          todayReactions: 0,
          todayChatMessages: 0,
          unreadNotifications: 0,
          activeTours: 0,
          todayBookings: 0,
          recentActivities: [],
          urgentSupports: 0,
          pendingUpgradeRequests: 0,
          unreadMessages: 0,
          popularPosts: []
        })
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <Box className="flex flex-col gap-[2.4rem]">
        <Box className="grid grid-cols-2 p-[2.4rem] gap-x-[2.4rem]">
          <Box
            sx={{
              height: '300px',
              bgcolor: 'grey.200',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'grey.400' }}>Đang tải...</Box>
          </Box>
          <Box
            sx={{
              height: '300px',
              bgcolor: 'grey.200',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'grey.400' }}>Đang tải...</Box>
          </Box>
        </Box>
        <Box className="grid grid-cols-3 gap-x-[2.4rem]">
          <Box
            sx={{
              height: '300px',
              bgcolor: 'grey.200',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'grey.400' }}>Đang tải...</Box>
          </Box>
          <Box
            sx={{
              height: '300px',
              bgcolor: 'grey.200',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'grey.400' }}>Đang tải...</Box>
          </Box>
          <Box
            sx={{
              height: '300px',
              bgcolor: 'grey.200',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'grey.400' }}>Đang tải...</Box>
          </Box>
        </Box>
      </Box>
    )
  }

  if (!dashboardData) {
    return (
      <Box className="flex flex-col gap-[2.4rem] p-[2.4rem]">
        <Box sx={{ p: 3, bgcolor: 'error.light', borderRadius: 2, color: 'error.main' }}>
          {error || 'Không thể tải dữ liệu Dashboard. Vui lòng thử lại sau.'}
        </Box>
      </Box>
    )
  }

  // Quick Static Config: Top doanh nghiệp có thu nhập cao (mock)
  const quickStaticFeeds: QuickStaticFeedProps[] = [
    {
      title: 'Công ty Du lịch ABC',
      value: '320.000.000 VNĐ',
      valueClassName: 'bg-emerald-500'
    },
    {
      title: 'Travel Agency XYZ',
      value: '280.000.000 VNĐ',
      valueClassName: 'bg-sky-500'
    },
    {
      title: 'Homestay Đà Lạt Xinh',
      value: '215.000.000 VNĐ',
      valueClassName: 'bg-violet-500'
    },
    {
      title: 'Resort Biển Xanh',
      value: '190.000.000 VNĐ',
      valueClassName: 'bg-amber-500'
    },
    {
      title: 'Tour Trekking Highlands',
      value: '155.000.000 VNĐ',
      valueClassName: 'bg-rose-500'
    },
    {
      title: 'Hostel City Center',
      value: '130.000.000 VNĐ',
      valueClassName: 'bg-lime-500'
    }
  ]

  const quickStaticConfig: QuickStaticCardProps = {
    title: 'Top doanh nghiệp có thu nhập cao',
    data: quickStaticFeeds
  }

  // Thay "Hoạt động gần đây" bằng "Top chi tiêu trong hệ thống"
  const spendingFeeds: ActivityFeedProps[] = [
    {
      desc: 'Nguyễn Văn A - 120.000.000 VNĐ',
      time: '15 đơn đặt tour',
      markColorClassName: 'bg-emerald-500'
    },
    {
      desc: 'Trần Thị B - 95.000.000 VNĐ',
      time: '12 đơn đặt tour',
      markColorClassName: 'bg-sky-500'
    },
    {
      desc: 'Lê Văn C - 72.500.000 VNĐ',
      time: '9 đơn đặt tour',
      markColorClassName: 'bg-violet-500'
    },
    {
      desc: 'Hoàng Minh D - 50.000.000 VNĐ',
      time: '6 đơn đặt tour',
      markColorClassName: 'bg-amber-500'
    }
  ]

  const activityConfig: ActivityCardProps = {
    data: spendingFeeds,
    title: 'Top chi tiêu trong hệ thống',
    bgClassName: 'bg-white'
  }

  // Priority Task Config
  const priorityTaskFeeds: PriorityTaskCardFeedProps[] = [
    {
      title: `${dashboardData.urgentSupports} tickets hỗ trợ`,
      subTitle: 'Chờ xử lí',
      status: 'Urgent',
      titleClassName: 'text-red-800',
      bgClassName: 'bg-red-50 border-red-200! border! border-solid',
      subTitleClassName: 'text-red-600',
      statusClassName: 'bg-red-600 border! border-solid! border-red-200!'
    },
    {
      title: `${dashboardData.pendingUpgradeRequests} yêu cầu nâng cấp`,
      titleClassName: 'text-yellow-800',
      subTitle: 'Chờ duyệt',
      subTitleClassName: 'text-yellow-600',
      status: 'Medium',
      statusClassName: 'bg-green-600 border! border-solid! border-yellow-200!',
      bgClassName: 'bg-yellow-50 border-yellow-200! border! border-solid'
    },
    {
      title: `${dashboardData.unreadMessages} tin nhắn chat`,
      titleClassName: 'text-blue-800',
      subTitle: 'Chưa đọc',
      subTitleClassName: 'text-blue-600',
      status: 'Low',
      statusClassName: 'bg-white! border! border-solid! border-green-600! text-green-600!',
      bgClassName: 'bg-blue-50 border-blue-200! border! border-solid'
    }
  ]

  const priorityTaskConfig: PriorityTaskCardProps = {
    title: 'Cần xử lý ưu tiên',
    data: priorityTaskFeeds
  }

  // Popular Posts Config
  const popularPostFeeds: PopularPostFeedProps[] =
    dashboardData.popularPosts.length > 0
      ? dashboardData.popularPosts.map((post) => ({
          title: post.title,
          subtitle: `${post.commentsCount} comments`,
          value: <span className="text-[1.4rem]! font-medium!">{post.reactionsCount} ❤️</span>
        }))
      : [
          {
            title: 'Chưa có bài viết nào',
            subtitle: '',
            value: <span className="text-[1.4rem]! font-medium!">-</span>
          }
        ]

  const popularPostConfig: PopularPostProps = {
    data: popularPostFeeds,
    title: 'Bài viết phổ biến'
  }

  // User Activity Config (using recent active users - simplified)
  const userActivityFeeds: PopularPostFeedProps[] =
    dashboardData.popularPosts.length > 0
      ? dashboardData.popularPosts.slice(0, 3).map((post) => ({
          title: post.authorName,
          subtitle: 'Author',
          value: (
            <span className="text-white text-[1.2rem]! bg-yellow-500 rounded-xl p-[0.2rem_0.8rem]! font-medium!">
              Active
            </span>
          )
        }))
      : [
          {
            title: 'Chưa có user nào',
            subtitle: '',
            value: (
              <span className="text-white text-[1.2rem]! bg-gray-500 rounded-xl p-[0.2rem_0.8rem]! font-medium!">
                -
              </span>
            )
          }
        ]

  const userActivityConfig: PopularPostProps = {
    data: userActivityFeeds,
    title: 'Users hoạt động'
  }

  // ============================
  // MOCK BIỂU ĐỒ DOANH THU
  // ============================
  // Do backend đang tắt, ta dùng dữ liệu mock để hiển thị 2 biểu đồ:
  // 1. Doanh thu theo từng tháng (12 tháng)
  // 2. Doanh thu theo từng ngày trong tháng hiện tại (30 ngày)

  const monthlyRevenueData = [
    { month: 'Tháng 1', revenue: 120_000_000 },
    { month: 'Tháng 2', revenue: 150_000_000 },
    { month: 'Tháng 3', revenue: 180_000_000 },
    { month: 'Tháng 4', revenue: 160_000_000 },
    { month: 'Tháng 5', revenue: 210_000_000 },
    { month: 'Tháng 6', revenue: 240_000_000 },
    { month: 'Tháng 7', revenue: 230_000_000 },
    { month: 'Tháng 8', revenue: 260_000_000 },
    { month: 'Tháng 9', revenue: 220_000_000 },
    { month: 'Tháng 10', revenue: 280_000_000 },
    { month: 'Tháng 11', revenue: 300_000_000 },
    { month: 'Tháng 12', revenue: 320_000_000 }
  ]

  const dailyRevenueData = Array.from({ length: 30 }, (_, idx) => {
    const day = idx + 1
    // Tạo pattern nhẹ: cuối tuần cao hơn
    const base = 3_000_000 + (day % 7 === 0 || day % 7 === 6 ? 4_000_000 : 0)
    const fluctuation = (day % 5) * 500_000
    return {
      day: `Ngày ${day}`,
      revenue: base + fluctuation
    }
  })

  return (
    <Box className="flex flex-col gap-[2.4rem]">
      {/* Hàng 1: Biểu đồ doanh thu (mỗi biểu đồ chiếm 1 hàng) */}
      <Box className="flex flex-col gap-[2.4rem] px-[2.4rem] pt-[2.4rem]">
        {/* Biểu đồ 1: Doanh thu theo từng tháng */}
        <Paper
          sx={{
            p: 3,
            borderRadius: '1.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Doanh thu theo từng tháng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Biểu đồ area thể hiện tổng doanh thu mock theo từng tháng trong năm.
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenueData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString('vi-VN')} VNĐ`}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Biểu đồ 2: Doanh thu theo từng ngày trong tháng */}
        <Paper
          sx={{
            p: 3,
            borderRadius: '1.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Doanh thu theo ngày trong tháng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Biểu đồ cột thể hiện doanh thu mock theo từng ngày trong tháng.
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyRevenueData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={3} tickMargin={8} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString('vi-VN')} VNĐ`}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Hàng 2: Hoạt động & Thống kê nhanh */}
      <Box className="grid grid-cols-2 p-[2.4rem] gap-x-[2.4rem]">
        <ActivityCard {...activityConfig} />
        <QuickStatic {...quickStaticConfig} />
      </Box>

      {/* Hàng 3: Các khối ưu tiên & bài viết phổ biến */}
      <Box className="grid grid-cols-3 gap-x-[2.4rem] px-[2.4rem] pb-[2.4rem]">
        <PriorityTaskCard {...priorityTaskConfig} />
        <PopularPostCard {...popularPostConfig} />
        <PopularPostCard {...userActivityConfig} />
      </Box>
    </Box>
  )
}
