using ESCE_SYSTEM.DTOs.Statistics;

namespace ESCE_SYSTEM.Services.StatisticsService
{
    public interface IStatisticsService
    {
        // Th?ng k� t?ng quan dashboard
        Task<DashboardStatisticsDto> GetDashboardStatisticsAsync(StatisticsFilterDto filter);

        // Th?ng k� theo th?i gian (bi?u d?)
        Task<TimeSeriesStatisticsDto> GetTimeSeriesStatisticsAsync(StatisticsFilterDto filter);

        // Th?ng k� chi ti?t ngu?i d�ng
        Task<UserStatisticsDto> GetUserStatisticsAsync(StatisticsFilterDto filter);

        // Th?ng k� doanh thu
        Task<RevenueStatisticsDto> GetRevenueStatisticsAsync(StatisticsFilterDto filter);

        // Th?ng k� Servicecombo
        Task<ServiceComboStatisticsDto> GetServiceComboStatisticsAsync(StatisticsFilterDto filter);

        // Th?ng k� b�i vi?t
        Task<PostStatisticsDto> GetPostStatisticsAsync(StatisticsFilterDto filter);
    }
}
