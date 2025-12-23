import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  People as PeopleIcon,
  Article as ArticleIcon,
  BookOnline as BookOnlineIcon,
  Newspaper as NewspaperIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as RevenueIcon
} from '@mui/icons-material'
import { fetchStatistics, type StatisticsDto } from '~/api/instances/StatisticsApi'

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300'
]

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
      </Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
)

export default function StatisticsDashboard() {
  const [statistics, setStatistics] = useState<StatisticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)
        const data = await fetchStatistics()
        setStatistics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thống kê')
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!statistics) {
    return null
  }

  const roleChartData = statistics.userRoleStatistics.map((item) => ({
    name: item.roleName,
    value: item.count
  }))

  const revenueChartData = statistics.monthlyRevenues.map((item) => ({
    month: item.month,
    revenue: item.revenue
  }))

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom mb={3}>
        Thống kê tổng quan
      </Typography>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Tổng người dùng"
            value={statistics.totalUsers}
            icon={<PeopleIcon fontSize="large" />}
            color="#1976d2"
            subtitle={`Hoạt động: ${statistics.activeUsers} | Bị cấm: ${statistics.bannedUsers}`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Tổng bài viết"
            value={statistics.totalPosts}
            icon={<ArticleIcon fontSize="large" />}
            color="#2e7d32"
            subtitle={`Đã duyệt: ${statistics.approvedPosts} | Chờ duyệt: ${statistics.pendingPosts}`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Tổng đặt tour"
            value={statistics.totalBookings}
            icon={<BookOnlineIcon fontSize="large" />}
            color="#ed6c02"
            subtitle={`Đã xác nhận: ${statistics.confirmedBookings} | Chờ xử lý: ${statistics.pendingBookings}`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Tổng doanh thu"
            value={`${statistics.totalRevenue.toLocaleString('vi-VN')} VNĐ`}
            icon={<RevenueIcon fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Secondary Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Tin tức"
            value={statistics.totalNews}
            icon={<NewspaperIcon fontSize="large" />}
            color="#0288d1"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Dịch vụ"
            value={statistics.totalServices}
            icon={<BusinessIcon fontSize="large" />}
            color="#388e3c"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Combo dịch vụ"
            value={statistics.totalServiceCombos}
            icon={<InventoryIcon fontSize="large" />}
            color="#f57c00"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Chứng chỉ chờ duyệt"
            value={statistics.pendingAgencyCertificates + statistics.pendingHostCertificates}
            icon={<PendingIcon fontSize="large" />}
            color="#d32f2f"
            subtitle={`Agency: ${statistics.pendingAgencyCertificates} | Host: ${statistics.pendingHostCertificates}`}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* User Role Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom mb={2}>
              Phân bố người dùng theo vai trò
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {roleChartData.map((item, index) => {
                const total = roleChartData.reduce((sum, i) => sum + i.value, 0)
                const percentage = total > 0 ? (item.value / total) * 100 : 0
                return (
                  <Box key={item.name}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.value} ({percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Monthly Revenue */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom mb={2}>
              Doanh thu theo tháng (6 tháng gần nhất)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {revenueChartData.length > 0 ? (
                revenueChartData.map((item) => {
                  const maxRevenue = Math.max(...revenueChartData.map((r) => r.revenue), 1)
                  const percentage = (item.revenue / maxRevenue) * 100
                  return (
                    <Box key={item.month}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {item.month}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {item.revenue.toLocaleString('vi-VN')} VNĐ
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          backgroundColor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: '#8884d8',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  )
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu doanh thu
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Post Status Details */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PendingIcon color="warning" />
                <Typography variant="h6">Bài viết chờ duyệt</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {statistics.pendingPosts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">Bài viết đã duyệt</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {statistics.approvedPosts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CancelIcon color="error" />
                <Typography variant="h6">Bài viết bị từ chối</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {statistics.rejectedPosts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
