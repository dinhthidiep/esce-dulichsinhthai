import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ActivityCard from '~/components/common/ActivityCard'
import QuickStatic from '~/components/common/QuickStaticCard'
import { fetchDashboardData, type DashboardDto } from '~/api/instances/DashboardApi'
import { fetchWithFallback, getAuthToken } from '~/api/instances/httpClient'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topServiceCombos, setTopServiceCombos] = useState<any[]>([])
  const [timeSeriesMonthly, setTimeSeriesMonthly] = useState<any>(null)
  const [timeSeriesDaily, setTimeSeriesDaily] = useState<any>(null)
  const [topCustomers, setTopCustomers] = useState<any[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load dashboard data
        const data = await fetchDashboardData()
        console.log('Dashboard main data loaded:', data)
        setDashboardData(data)

        // Load top service combos (for QuickStatic)
        try {
          const token = getAuthToken()
          const serviceComboRes = await fetchWithFallback('/api/Statistics/service-combos?period=month', {
            method: 'GET',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'Content-Type': 'application/json'
            }
          })
          if (serviceComboRes.ok) {
            const serviceComboData = await serviceComboRes.json()
            setTopServiceCombos(serviceComboData?.topServiceCombos || serviceComboData?.TopServiceCombos || [])
          }
        } catch (e) {
          console.warn('Failed to load service combos:', e)
        }

        // Load time series data for monthly chart
        try {
          const token = getAuthToken()
          const timeSeriesMonthlyRes = await fetchWithFallback('/api/Statistics/time-series?period=year', {
            method: 'GET',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'Content-Type': 'application/json'
            }
          })
          if (timeSeriesMonthlyRes.ok) {
            const timeSeries = await timeSeriesMonthlyRes.json()
            setTimeSeriesMonthly(timeSeries)
          }
        } catch (e) {
          console.warn('Failed to load monthly time series:', e)
        }

        // Load time series data for daily chart
        try {
          const token = getAuthToken()
          const timeSeriesDailyRes = await fetchWithFallback('/api/Statistics/time-series?period=month', {
            method: 'GET',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'Content-Type': 'application/json'
            }
          })
          if (timeSeriesDailyRes.ok) {
            const timeSeries = await timeSeriesDailyRes.json()
            setTimeSeriesDaily(timeSeries)
          }
        } catch (e) {
          console.warn('Failed to load daily time series:', e)
        }

        // Load top customers from bookings
        try {
          const token = getAuthToken()
          const bookingsRes = await fetchWithFallback('/api/Booking', {
            method: 'GET',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'Content-Type': 'application/json'
            }
          })
          if (bookingsRes.ok) {
            const bookings = await bookingsRes.json()
            // Group by customer and calculate total spending
            const customerMap = new Map()
            bookings.forEach((booking: any) => {
              if (booking.status === 'completed' && booking.customerId) {
                const customerId = booking.customerId
                const amount = booking.totalAmount || 0
                if (!customerMap.has(customerId)) {
                  customerMap.set(customerId, { customerId, totalAmount: 0, bookingCount: 0, customerName: booking.customerName || 'Khách hàng' })
                }
                const customer = customerMap.get(customerId)
                customer.totalAmount += amount
                customer.bookingCount += 1
              }
            })
            const topCustomersList = Array.from(customerMap.values())
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .slice(0, 6)
            setTopCustomers(topCustomersList)
          }
        } catch (e) {
          console.warn('Failed to load top customers:', e)
        }
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

  // Quick Static Config: Top doanh nghiệp có thu nhập cao (từ database)
  const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-lime-500']
  const quickStaticFeeds: QuickStaticFeedProps[] = topServiceCombos.length > 0
    ? topServiceCombos.slice(0, 6).map((combo, index) => ({
        title: combo.name || combo.Name || 'N/A',
        value: `${(combo.revenue || combo.Revenue || 0).toLocaleString('vi-VN')} VNĐ`,
        valueClassName: colors[index % colors.length]
      }))
    : [
        {
          title: 'Chưa có dữ liệu',
          value: '0 VNĐ',
          valueClassName: 'bg-gray-500'
        }
      ]

  const quickStaticConfig: QuickStaticCardProps = {
    title: 'Top doanh nghiệp có thu nhập cao',
    data: quickStaticFeeds
  }

  // Top chi tiêu trong hệ thống (từ database)
  const spendingFeeds: ActivityFeedProps[] = topCustomers.length > 0
    ? topCustomers.slice(0, 4).map((customer, index) => ({
        desc: `${customer.customerName} - ${customer.totalAmount.toLocaleString('vi-VN')} VNĐ`,
        time: `${customer.bookingCount} đơn đặt tour`,
        markColorClassName: colors[index % colors.length]
      }))
    : [
        {
          desc: 'Chưa có dữ liệu',
          time: '',
          markColorClassName: 'bg-gray-500'
        }
      ]

  const activityConfig: ActivityCardProps = {
    data: spendingFeeds,
    title: 'Top chi tiêu trong hệ thống',
    bgClassName: 'bg-white'
  }


  // ============================
  // BIỂU ĐỒ DOANH THU TỪ DATABASE
  // ============================
  // Lấy dữ liệu từ TimeSeriesStatistics

  // Biểu đồ theo tháng (12 tháng trong năm)
  const monthlyRevenueData = timeSeriesMonthly?.data || timeSeriesMonthly?.Data || []
  const monthlyChartData = monthlyRevenueData.length > 0
    ? monthlyRevenueData.map((point: any) => ({
        month: point.label || point.Label || '',
        revenue: Number(point.revenue || point.Revenue || 0)
      }))
    : Array.from({ length: 12 }, (_, idx) => ({
        month: `Tháng ${idx + 1}`,
        revenue: 0
      }))

  // Biểu đồ theo ngày (các ngày trong tháng hiện tại)
  const dailyRevenueData = timeSeriesDaily?.data || timeSeriesDaily?.Data || []
  const dailyChartData = dailyRevenueData.length > 0
    ? dailyRevenueData.map((point: any) => ({
        day: point.label || point.Label || '',
        revenue: Number(point.revenue || point.Revenue || 0)
      }))
    : Array.from({ length: 30 }, (_, idx) => {
        const day = idx + 1
        return {
          day: `Ngày ${day}`,
          revenue: 0
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
            Biểu đồ area thể hiện tổng doanh thu theo từng tháng trong năm (từ database).
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyChartData}
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
            Biểu đồ cột thể hiện doanh thu theo từng ngày trong tháng (từ database).
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyChartData}
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

    </Box>
  )
}
