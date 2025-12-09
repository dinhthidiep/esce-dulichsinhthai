namespace ESCE_SYSTEM.DTOs.Statistics
{
    // DTO cho thống kê tổng quan
    public class DashboardStatisticsDto
    {
        public int TotalUsers { get; set; }
        public int TotalServiceCombos { get; set; }
        public int TotalPosts { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalBookings { get; set; }

        // So sánh với kỳ trước
        public double UsersGrowthPercent { get; set; }
        public double ServiceCombosGrowthPercent { get; set; }
        public double PostsGrowthPercent { get; set; }
        public double RevenueGrowthPercent { get; set; }
        public double BookingsGrowthPercent { get; set; }
    }

    // DTO cho thống kê theo thời gian
    public class TimeSeriesStatisticsDto
    {
        public string Period { get; set; } = string.Empty; // "day", "week", "month", "year"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<TimeSeriesDataPoint> Data { get; set; } = new List<TimeSeriesDataPoint>();
    }

    public class TimeSeriesDataPoint
    {
        public string Label { get; set; } = string.Empty; // Ngày/Tuần/Tháng/Năm
        public DateTime Date { get; set; }
        public int NewUsers { get; set; }
        public int NewServiceCombos { get; set; }
        public int NewPosts { get; set; }
        public decimal Revenue { get; set; }
        public int NewBookings { get; set; }
    }

    // DTO cho thống kê chi tiết người dùng
    public class UserStatisticsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int BannedUsers { get; set; }
        public int NewUsersThisPeriod { get; set; }
        public List<UsersByRoleDto> UsersByRole { get; set; } = new List<UsersByRoleDto>();
    }

    public class UsersByRoleDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // DTO cho thống kê doanh thu
    public class RevenueStatisticsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal RevenueThisPeriod { get; set; }
        public decimal RevenuePreviousPeriod { get; set; }
        public double GrowthPercent { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int PendingBookings { get; set; }
        public int CancelledBookings { get; set; }
        public decimal AverageOrderValue { get; set; }
    }

    // DTO cho thống kê ServiceCombo
    public class ServiceComboStatisticsDto
    {
        public int TotalServiceCombos { get; set; }
        public int ActiveServiceCombos { get; set; }
        public int NewServiceCombosThisPeriod { get; set; }
        public List<TopServiceComboDto> TopServiceCombos { get; set; } = new List<TopServiceComboDto>();
    }

    public class TopServiceComboDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
    }

    // DTO cho thống kê bài viết
    public class PostStatisticsDto
    {
        public int TotalPosts { get; set; }
        public int ApprovedPosts { get; set; }
        public int PendingPosts { get; set; }
        public int RejectedPosts { get; set; }
        public int NewPostsThisPeriod { get; set; }
        public int TotalReactions { get; set; }
        public int TotalComments { get; set; }
    }

    // Request DTO cho filter
    public class StatisticsFilterDto
    {
        public string Period { get; set; } = "day"; // day, week, month, year
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? HostId { get; set; } // Lọc theo Host (nếu cần)
    }
}