import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ActivityCard from '~/components/common/ActivityCard'
import QuickStatic from '~/components/common/QuickStaticCard'
import { 
  fetchDashboardData, 
  fetchTimeSeriesData,
  fetchTopSpenders,
  fetchTopHosts,
  type DashboardDto, 
  type TimeSeriesDto,
  type TopSpenderDto,
  type TopHostDto
} from '~/api/instances/DashboardApi'
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


// Format currency helper
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ VNĐ`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} triệu VNĐ`
  }
  return `${value.toLocaleString('vi-VN')} VNĐ`
}

export default function MainDashBoardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null)
  const [monthlyTimeSeriesData, setMonthlyTimeSeriesData] = useState<TimeSeriesDto>({ period: 'month', startDate: '', endDate: '', data: [] })
  const [dailyTimeSeriesData, setDailyTimeSeriesData] = useState<TimeSeriesDto>({ period: 'day', startDate: '', endDate: '', data: [] })
  const [topSpenders, setTopSpenders] = useState<TopSpenderDto[]>([])
  const [topHosts, setTopHosts] = useState<TopHostDto[]>([])
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

        // Load time series data for charts
        try {
          const [yearlyData, monthlyData] = await Promise.all([
            fetchTimeSeriesData('year'), // Doanh thu theo từng tháng trong năm
            fetchTimeSeriesData('month') // Doanh thu theo từng ngày trong tháng hiện tại
          ])
          console.log('Yearly time series data loaded:', yearlyData)
          console.log('Monthly time series data loaded:', monthlyData)
          setMonthlyTimeSeriesData(yearlyData)
          setDailyTimeSeriesData(monthlyData)
        } catch (timeSeriesError) {
          console.warn('Time series API failed:', timeSeriesError)
        }

        // Load top spenders and hosts (separate try-catch to not affect charts)
        try {
          const spendersData = await fetchTopSpenders(6)
          console.log('Top spenders loaded:', spendersData)
          setTopSpenders(spendersData)
        } catch (spendersError) {
          console.warn('Top spenders API failed:', spendersError)
        }

        try {
          const hostsData = await fetchTopHosts(6)
          console.log('Top hosts loaded:', hostsData)
          setTopHosts(hostsData)
        } catch (hostsError) {
          console.warn('Top hosts API failed:', hostsError)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu')
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

  // Color palette for ranking
  const colorPalette = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-lime-500']

  // Top Host có doanh thu cao nhất (QuickStatic)
  const topHostsFeeds = topHosts.length > 0
    ? topHosts.map((host, index) => ({
        title: host.hostName || 'Unknown Host',
        value: formatCurrency(host.totalRevenue),
        valueClassName: colorPalette[index % colorPalette.length]
      }))
    : [{ title: 'Chưa có dữ liệu', value: '0 VNĐ', valueClassName: 'bg-gray-400' }]

  const quickStaticConfig = {
    title: 'Top Host có doanh thu cao nhất',
    data: topHostsFeeds
  }

  // Top Users có chi tiêu cao nhất (ActivityCard)
  const topSpendersFeeds = topSpenders.length > 0
    ? topSpenders.map((spender, index) => ({
        desc: `${spender.userName} - ${formatCurrency(spender.totalSpent)}`,
        time: `${spender.bookingCount} đơn đặt tour`,
        markColorClassName: colorPalette[index % colorPalette.length]
      }))
    : [{ desc: 'Chưa có dữ liệu', time: '', markColorClassName: 'bg-gray-400' }]

  const activityConfig = {
    data: topSpendersFeeds,
    title: 'Top User có chi tiêu cao nhất',
    bgClassName: 'bg-white'
  }

  // Prepare monthly revenue data from time-series (period=year -> theo tháng)
  const monthlyRevenueData = monthlyTimeSeriesData.data
    .map((item) => ({
      month: item.label || 'N/A',
      revenue: Number(item.revenue) || 0
    }))

  // Prepare daily revenue data from time-series (period=month -> theo ngày trong tháng)
  const dailyRevenueData = dailyTimeSeriesData.data
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

        {/* Biểu đồ 2: Doanh thu trong tháng */}
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
            Doanh thu trong tháng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Biểu đồ cột thể hiện doanh thu theo từng ngày trong tháng hiện tại.
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
        <ActivityCard {...(activityConfig as any)} />
        <QuickStatic {...(quickStaticConfig as any)} />
      </Box>
    </Box>
  )
}
