import { useEffect, useState, useMemo } from 'react'
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
  Legend
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
  const [dailyTimeSeriesData, setDailyTimeSeriesData] = useState<TimeSeriesDto>({ period: 'day', startDate: '', endDate: '', data: [] })
  const [topSpenders, setTopSpenders] = useState<TopSpenderDto[]>([])
  const [topHosts, setTopHosts] = useState<TopHostDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter by month and year
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())

  // Load dashboard data on mount
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load dashboard statistics
        const data = await fetchDashboardData('day')
        console.log('Dashboard main data loaded:', data)
        setDashboardData(data)

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

  // Load time series data when month/year changes
  useEffect(() => {
    const loadTimeSeriesData = async () => {
      try {
        // Calculate start and end date for selected month/year
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`
        
        console.log(`Loading time series for ${startDate} to ${endDate}`)
        
        const monthlyData = await fetchTimeSeriesData('month', startDate, endDate)
        console.log('Monthly time series data loaded:', monthlyData)
        setDailyTimeSeriesData(monthlyData)
      } catch (timeSeriesError) {
        console.warn('Time series API failed:', timeSeriesError)
      }
    }
    loadTimeSeriesData()
  }, [selectedMonth, selectedYear])

  // Prepare chart data - MUST be before any conditional returns
  const chartData = useMemo(() => {
    return dailyTimeSeriesData.data.map((item) => ({
      label: item.label || 'N/A',
      revenue: Number(item.revenue) || 0
    }))
  }, [dailyTimeSeriesData])

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

  return (
    <Box className="flex flex-col gap-[2.4rem]">
      {/* Biểu đồ doanh thu gộp */}
      <Box className="flex flex-col gap-[2.4rem] px-[2.4rem] pt-[2.4rem]">
        <Paper
          sx={{
            p: 3,
            borderRadius: '1.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Doanh thu
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                min={2020}
                max={new Date().getFullYear()}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', width: '80px' }}
              />
            </Box>
          </Box>
          <Box sx={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.length > 0 ? chartData : [{ label: 'Chưa có dữ liệu', revenue: 0 }]}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11 }} 
                  interval={2}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                  labelFormatter={(label) => label}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu (VNĐ)"
                  stroke="url(#strokeGradient)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenueGradient)"
                />
              </AreaChart>
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
