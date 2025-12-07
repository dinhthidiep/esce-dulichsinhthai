using ESCE_SYSTEM.DTOs.Statistics;
using ESCE_SYSTEM.Services.StatisticsService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statisticsService;

        public StatisticsController(IStatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        /// <summary>
        /// Lấy thống kê tổng quan cho dashboard
        /// </summary>
        /// <param name="period">Kỳ thống kê: day, week, month, year</param>
        /// <param name="startDate">Ngày bắt đầu (optional)</param>
        /// <param name="endDate">Ngày kết thúc (optional)</param>
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardStatisticsDto>> GetDashboardStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetDashboardStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê dashboard", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê theo thời gian (dữ liệu cho biểu đồ)
        /// </summary>
        /// <param name="period">Kỳ thống kê: day (theo giờ), week (theo ngày), month (theo ngày), year (theo tháng)</param>
        /// <param name="startDate">Ngày bắt đầu (optional)</param>
        /// <param name="endDate">Ngày kết thúc (optional)</param>
        [HttpGet("time-series")]
        public async Task<ActionResult<TimeSeriesStatisticsDto>> GetTimeSeriesStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetTimeSeriesStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê time series", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê chi tiết người dùng
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<UserStatisticsDto>> GetUserStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetUserStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê người dùng", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê doanh thu
        /// </summary>
        [HttpGet("revenue")]
        public async Task<ActionResult<RevenueStatisticsDto>> GetRevenueStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetRevenueStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê doanh thu", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê ServiceCombo
        /// </summary>
        [HttpGet("service-combos")]
        public async Task<ActionResult<ServiceComboStatisticsDto>> GetServiceComboStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetServiceComboStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê service combo", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê bài viết
        /// </summary>
        [HttpGet("posts")]
        public async Task<ActionResult<PostStatisticsDto>> GetPostStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _statisticsService.GetPostStatisticsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê bài viết", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy tất cả thống kê cùng lúc
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllStatistics(
            [FromQuery] string period = "day",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var filter = new StatisticsFilterDto
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var dashboard = await _statisticsService.GetDashboardStatisticsAsync(filter);
                var timeSeries = await _statisticsService.GetTimeSeriesStatisticsAsync(filter);
                var users = await _statisticsService.GetUserStatisticsAsync(filter);
                var revenue = await _statisticsService.GetRevenueStatisticsAsync(filter);
                var serviceCombos = await _statisticsService.GetServiceComboStatisticsAsync(filter);
                var posts = await _statisticsService.GetPostStatisticsAsync(filter);

                return Ok(new
                {
                    Dashboard = dashboard,
                    TimeSeries = timeSeries,
                    Users = users,
                    Revenue = revenue,
                    ServiceCombos = serviceCombos,
                    Posts = posts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy tất cả thống kê", error = ex.Message });
            }
        }
    }
}