using ESCE_SYSTEM.DTOs.Statistics;
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.StatisticsService
{
    public class StatisticsService :  IStatisticsService
    {
        private readonly ESCEContext _context;

        public StatisticsService(ESCEContext context)
        {
            _context = context;
        }

        #region Dashboard Statistics
        public async Task<DashboardStatisticsDto> GetDashboardStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, previousStartDate, previousEndDate) = GetDateRange(filter);

            // Thống kê kỳ hiện tại
            var currentUsers = await _context.Accounts
                .CountAsync(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate);
            var currentServiceCombos = await _context.Servicecombos
                .CountAsync(s => s.CreatedAt >= startDate && s.CreatedAt <= endDate);
            var currentPosts = await _context.Posts
                .CountAsync(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate && !p.IsDeleted);
            // Lấy doanh thu từ Bookings completed thay vì Payments success
            var currentRevenue = await _context.Bookings
                .Where(b => b.BookingDate >= startDate && b.BookingDate <= endDate && b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;
            var currentBookings = await _context.Bookings
                .CountAsync(b => b.BookingDate >= startDate && b.BookingDate <= endDate);

            // Thống kê kỳ trước (để tính % tăng trưởng)
            var previousUsers = await _context.Accounts
                .CountAsync(a => a.CreatedAt >= previousStartDate && a.CreatedAt < startDate);
            var previousServiceCombos = await _context.Servicecombos
                .CountAsync(s => s.CreatedAt >= previousStartDate && s.CreatedAt < startDate);
            var previousPosts = await _context.Posts
                .CountAsync(p => p.CreatedAt >= previousStartDate && p.CreatedAt < startDate && !p.IsDeleted);
            var previousRevenue = await _context.Bookings
                .Where(b => b.BookingDate >= previousStartDate && b.BookingDate < startDate && b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;
            var previousBookings = await _context.Bookings
                .CountAsync(b => b.BookingDate >= previousStartDate && b.BookingDate < startDate);

            // Tổng số
            var totalUsers = await _context.Accounts.CountAsync();
            var totalServiceCombos = await _context.Servicecombos.CountAsync();
            var totalPosts = await _context.Posts.CountAsync(p => !p.IsDeleted);
            var totalRevenue = await _context.Bookings
                .Where(b => b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;
            var totalBookings = await _context.Bookings.CountAsync();

            return new DashboardStatisticsDto
            {
                TotalUsers = totalUsers,
                TotalServiceCombos = totalServiceCombos,
                TotalPosts = totalPosts,
                TotalRevenue = totalRevenue,
                TotalBookings = totalBookings,
                UsersGrowthPercent = CalculateGrowthPercent(previousUsers, currentUsers),
                ServiceCombosGrowthPercent = CalculateGrowthPercent(previousServiceCombos, currentServiceCombos),
                PostsGrowthPercent = CalculateGrowthPercent(previousPosts, currentPosts),
                RevenueGrowthPercent = CalculateGrowthPercent(previousRevenue, currentRevenue),
                BookingsGrowthPercent = CalculateGrowthPercent(previousBookings, currentBookings)
            };
        }
        #endregion

        #region Time Series Statistics
        public async Task<TimeSeriesStatisticsDto> GetTimeSeriesStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, _, _) = GetDateRange(filter);
            var dataPoints = new List<TimeSeriesDataPoint>();

            var dates = GetDatePoints(filter.Period, startDate, endDate);

            foreach (var (pointStart, pointEnd, label) in dates)
            {
                var newUsers = await _context.Accounts
                    .CountAsync(a => a.CreatedAt >= pointStart && a.CreatedAt < pointEnd);

                var newServiceCombos = await _context.Servicecombos
                    .CountAsync(s => s.CreatedAt >= pointStart && s.CreatedAt < pointEnd);

                var newPosts = await _context.Posts
                    .CountAsync(p => p.CreatedAt >= pointStart && p.CreatedAt < pointEnd && !p.IsDeleted);

                // Lấy doanh thu từ Bookings với status = "completed" thay vì Payments
                var revenue = await _context.Bookings
                    .Where(b => b.BookingDate >= pointStart && b.BookingDate < pointEnd && b.Status == "completed")
                    .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

                var newBookings = await _context.Bookings
                    .CountAsync(b => b.BookingDate >= pointStart && b.BookingDate < pointEnd);

                dataPoints.Add(new TimeSeriesDataPoint
                {
                    Label = label,
                    Date = pointStart,
                    NewUsers = newUsers,
                    NewServiceCombos = newServiceCombos,
                    NewPosts = newPosts,
                    Revenue = revenue,
                    NewBookings = newBookings
                });
            }

            return new TimeSeriesStatisticsDto
            {
                Period = filter.Period,
                StartDate = startDate,
                EndDate = endDate,
                Data = dataPoints
            };
        }
        #endregion

        #region User Statistics
        public async Task<UserStatisticsDto> GetUserStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, _, _) = GetDateRange(filter);

            var totalUsers = await _context.Accounts.CountAsync();
            var activeUsers = await _context.Accounts.CountAsync(a => a.IsActive == true && !a.IS_BANNED);
            var bannedUsers = await _context.Accounts.CountAsync(a => a.IS_BANNED);
            var newUsersThisPeriod = await _context.Accounts
                .CountAsync(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate);

            var usersByRole = await _context.Accounts
                .Include(a => a.Role)
                .GroupBy(a => new { a.RoleId, a.Role.Name })
                .Select(g => new UsersByRoleDto
                {
                    RoleId = g.Key.RoleId,
                    RoleName = g.Key.Name,
                    Count = g.Count()
                })
                .ToListAsync();

            return new UserStatisticsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                BannedUsers = bannedUsers,
                NewUsersThisPeriod = newUsersThisPeriod,
                UsersByRole = usersByRole
            };
        }
        #endregion

        #region Revenue Statistics
        public async Task<RevenueStatisticsDto> GetRevenueStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, previousStartDate, _) = GetDateRange(filter);

            // Lấy doanh thu từ Bookings completed thay vì Payments success
            var totalRevenue = await _context.Bookings
                .Where(b => b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

            var revenueThisPeriod = await _context.Bookings
                .Where(b => b.BookingDate >= startDate && b.BookingDate <= endDate && b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

            var revenuePreviousPeriod = await _context.Bookings
                .Where(b => b.BookingDate >= previousStartDate && b.BookingDate < startDate && b.Status == "completed")
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

            var totalBookings = await _context.Bookings.CountAsync();
            var completedBookings = await _context.Bookings.CountAsync(b => b.Status == "completed");
            var pendingBookings = await _context.Bookings.CountAsync(b => b.Status == "pending");
            var cancelledBookings = await _context.Bookings.CountAsync(b => b.Status == "cancelled");

            var averageOrderValue = completedBookings > 0
                ? totalRevenue / completedBookings
                : 0;

            return new RevenueStatisticsDto
            {
                TotalRevenue = totalRevenue,
                RevenueThisPeriod = revenueThisPeriod,
                RevenuePreviousPeriod = revenuePreviousPeriod,
                GrowthPercent = CalculateGrowthPercent(revenuePreviousPeriod, revenueThisPeriod),
                TotalBookings = totalBookings,
                CompletedBookings = completedBookings,
                PendingBookings = pendingBookings,
                CancelledBookings = cancelledBookings,
                AverageOrderValue = averageOrderValue
            };
        }
        #endregion

        #region ServiceCombo Statistics
        public async Task<ServiceComboStatisticsDto> GetServiceComboStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, _, _) = GetDateRange(filter);

            var totalServiceCombos = await _context.Servicecombos.CountAsync();
            var activeServiceCombos = await _context.Servicecombos.CountAsync(s => s.Status == "open");
            var newServiceCombosThisPeriod = await _context.Servicecombos
                .CountAsync(s => s.CreatedAt >= startDate && s.CreatedAt <= endDate);

            // Top ServiceCombos theo số booking
            var topServiceCombos = await _context.Servicecombos
                .Select(s => new TopServiceComboDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    BookingCount = _context.Bookings.Count(b => b.ServiceComboId == s.Id),
                    Revenue = _context.Bookings
                        .Where(b => b.ServiceComboId == s.Id && b.Status == "completed")
                        .Sum(b => (decimal?)b.TotalAmount) ?? 0
                })
                .OrderByDescending(s => s.BookingCount)
                .Take(10)
                .ToListAsync();

            return new ServiceComboStatisticsDto
            {
                TotalServiceCombos = totalServiceCombos,
                ActiveServiceCombos = activeServiceCombos,
                NewServiceCombosThisPeriod = newServiceCombosThisPeriod,
                TopServiceCombos = topServiceCombos
            };
        }
        #endregion

        #region Post Statistics
        public async Task<PostStatisticsDto> GetPostStatisticsAsync(StatisticsFilterDto filter)
        {
            var (startDate, endDate, _, _) = GetDateRange(filter);

            var totalPosts = await _context.Posts.CountAsync(p => !p.IsDeleted);
            var approvedPosts = await _context.Posts.CountAsync(p => p.Status == "Approved" && !p.IsDeleted);
            var pendingPosts = await _context.Posts.CountAsync(p => p.Status == "Pending" && !p.IsDeleted);
            var rejectedPosts = await _context.Posts.CountAsync(p => p.Status == "Rejected" && !p.IsDeleted);
            var newPostsThisPeriod = await _context.Posts
                .CountAsync(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate && !p.IsDeleted);

            var totalReactions = await _context.Posts.Where(p => !p.IsDeleted).SumAsync(p => p.ReactionsCount);
            var totalComments = await _context.Posts.Where(p => !p.IsDeleted).SumAsync(p => p.CommentsCount);

            return new PostStatisticsDto
            {
                TotalPosts = totalPosts,
                ApprovedPosts = approvedPosts,
                PendingPosts = pendingPosts,
                RejectedPosts = rejectedPosts,
                NewPostsThisPeriod = newPostsThisPeriod,
                TotalReactions = totalReactions,
                TotalComments = totalComments
            };
        }
        #endregion

        #region Helper Methods
        private (DateTime startDate, DateTime endDate, DateTime previousStartDate, DateTime previousEndDate) GetDateRange(StatisticsFilterDto filter)
        {
            var endDate = filter.EndDate?.Date.AddDays(1).AddSeconds(-1) ?? DateTime.Now;
            DateTime startDate;
            DateTime previousStartDate;
            DateTime previousEndDate;

            switch (filter.Period?.ToLower())
            {
                case "day":
                    startDate = filter.StartDate?.Date ?? DateTime.Today;
                    endDate = startDate.AddDays(1).AddSeconds(-1);
                    previousStartDate = startDate.AddDays(-1);
                    previousEndDate = startDate.AddSeconds(-1);
                    break;
                case "week":
                    startDate = filter.StartDate?.Date ?? DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
                    endDate = startDate.AddDays(7).AddSeconds(-1);
                    previousStartDate = startDate.AddDays(-7);
                    previousEndDate = startDate.AddSeconds(-1);
                    break;
                case "year":
                    startDate = filter.StartDate?.Date ?? new DateTime(DateTime.Today.Year, 1, 1);
                    endDate = startDate.AddYears(1).AddSeconds(-1);
                    previousStartDate = startDate.AddYears(-1);
                    previousEndDate = startDate.AddSeconds(-1);
                    break;
                case "month":
                default:
                    startDate = filter.StartDate?.Date ?? new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                    endDate = startDate.AddMonths(1).AddSeconds(-1);
                    previousStartDate = startDate.AddMonths(-1);
                    previousEndDate = startDate.AddSeconds(-1);
                    break;
            }

            return (startDate, endDate, previousStartDate, previousEndDate);
        }

        private List<(DateTime start, DateTime end, string label)> GetDatePoints(string period, DateTime startDate, DateTime endDate)
        {
            var points = new List<(DateTime, DateTime, string)>();

            switch (period?.ToLower())
            {
                case "day":
                    // Thống kê theo giờ trong ngày
                    for (var hour = 0; hour < 24; hour++)
                    {
                        var start = startDate.Date.AddHours(hour);
                        var end = start.AddHours(1);
                        points.Add((start, end, $"{hour}:00"));
                    }
                    break;
                case "week":
                    // Thống kê theo ngày trong tuần
                    for (var day = 0; day < 7; day++)
                    {
                        var start = startDate.Date.AddDays(day);
                        var end = start.AddDays(1);
                        points.Add((start, end, start.ToString("ddd dd/MM")));
                    }
                    break;
                case "year":
                    // Thống kê theo tháng trong năm
                    for (var month = 0; month < 12; month++)
                    {
                        var start = new DateTime(startDate.Year, month + 1, 1);
                        var end = start.AddMonths(1);
                        points.Add((start, end, start.ToString("MMM yyyy")));
                    }
                    break;
                case "month":
                default:
                    // Thống kê theo ngày trong tháng
                    var daysInMonth = DateTime.DaysInMonth(startDate.Year, startDate.Month);
                    for (var day = 1; day <= daysInMonth; day++)
                    {
                        var start = new DateTime(startDate.Year, startDate.Month, day);
                        var end = start.AddDays(1);
                        points.Add((start, end, start.ToString("dd/MM")));
                    }
                    break;
            }

            return points;
        }

        private double CalculateGrowthPercent(decimal previous, decimal current)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return Math.Round((double)((current - previous) / previous * 100), 2);
        }

        private double CalculateGrowthPercent(int previous, int current)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return Math.Round((double)(current - previous) / previous * 100, 2);
        }
        #endregion
    }
}