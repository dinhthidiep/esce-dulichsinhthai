import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ActivityCard from '~/components/common/ActivityCard'
import QuickStatic from '~/components/common/QuickStaticCard'
import { fetchDashboardData, fetchTimeSeriesData, type DashboardDto, type TimeSeriesDto } from '~/api/instances/DashboardApi'
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
  ActivityCardProps
} from '~/types/common'

export default function MainDashBoardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null)
  const [monthlyTimeSeriesData, setMonthlyTimeSeriesData] = useState<TimeSeriesDto>({ period: 'month', startDate: '', endDate: '', data: [] })
  const [dailyTimeSeriesData, setDailyTimeSeriesData] = useState<TimeSeriesDto>({ period: 'day', startDate: '', endDate: '', data: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load dashboard statistics
        const data = await fetchDashboardData('day')
        console.log('Dashboard main data loaded:', data)
        setDashboardData(data)

        // Load time series data for charts in parallel
        try {
          const [monthlyData, dailyData] = await Promise.all([
            fetchTimeSeriesData('month'), // Last 12 months
            fetchTimeSeriesData('day') // Last 30 days
          ])
          console.log('Monthly time series data loaded:', monthlyData)
          console.log('Daily time series data loaded:', dailyData)
          setMonthlyTimeSeriesData(monthlyData)
          setDailyTimeSeriesData(dailyData)
        } catch (timeSeriesError) {
          // Nếu time series API fail, giữ empty data (đã khởi tạo ban đầu)
          console.warn('Time series API failed, using empty data:', timeSeriesError)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu')
        // Time series data đã được khởi tạo với empty array, không cần set lại
        // Set fallback data
        setDashboardData({
          totalUsers: 0,
          userGrowth: '',
          totalPosts: 0,
          postGrowth: '',
          totalServiceCombos: 0,
          serviceComboGrowth: '',
          totalRevenue: 0,
          revenueGrowth: '',
          totalBookings: 0,
          bookingGrowth: '',
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

  // ============================
  // BIỂU ĐỒ DOANH THU TỪ API
  // ============================
  // Sử dụng dữ liệu từ time-series API
  // 1. Doanh thu theo từng tháng (từ time-series với period=month)
  // 2. Doanh thu theo từng ngày trong tháng hiện tại (từ time-series với period=day)

  // Prepare monthly revenue data from time-series
  const monthlyRevenueData = monthlyTimeSeriesData.data
    .filter((item) => item.revenue > 0) // Only show months with revenue
    .slice(-12) // Last 12 months
    .map((item) => ({
      month: item.label || 'N/A',
      revenue: Number(item.revenue) || 0
    }))

  // Prepare daily revenue data from time-series
  const dailyRevenueData = dailyTimeSeriesData.data
    .filter((item) => item.revenue > 0) // Only show days with revenue
    .slice(-30) // Last 30 days
    .map((item) => ({
      day: item.label || 'N/A',
      revenue: Number(item.revenue) || 0
    }))

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
            Biểu đồ area thể hiện tổng doanh thu theo từng tháng trong năm.
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenueData.length > 0 ? monthlyRevenueData : [{ month: 'Chưa có dữ liệu', revenue: 0 }]}
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
                  domain={[0, 'auto']}
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
            Biểu đồ cột thể hiện doanh thu theo từng ngày trong tháng.
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyRevenueData.length > 0 ? dailyRevenueData : [{ day: 'Chưa có dữ liệu', revenue: 0 }]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={3} tickMargin={8} />
                <YAxis
                  domain={[0, 'auto']}
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
    </Box>
  )
}
