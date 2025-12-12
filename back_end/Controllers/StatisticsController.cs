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
        /// L?y th?ng k?t?ng quan cho dashboard
        /// </summary>
        /// <param name="period">K? th?ng k? day, week, month, year</param>
        /// <param name="startDate">Ng? b?t d?u (optional)</param>
        /// <param name="endDate">Ng? k?t th? (optional)</param>
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?dashboard", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y th?ng k?theo th?i gian (d? li?u cho bi?u d?)
        /// </summary>
        /// <param name="period">K? th?ng k? day (theo gi?), week (theo ng?), month (theo ng?), year (theo th?g)</param>
        /// <param name="startDate">Ng? b?t d?u (optional)</param>
        /// <param name="endDate">Ng? k?t th? (optional)</param>
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?time series", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y th?ng k?chi ti?t ngu?i d?g
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?ngu?i d?g", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y th?ng k?doanh thu
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?doanh thu", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y th?ng k?Servicecombo
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?service combo", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y th?ng k?b? vi?t
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
                return StatusCode(500, new { message = "L?i khi l?y th?ng k?b? vi?t", error = ex.Message });
            }
        }

        /// <summary>
        /// L?y t?t c? th?ng k?c?g l?
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
                var ServiceCombos = await _statisticsService.GetServiceComboStatisticsAsync(filter);
                var posts = await _statisticsService.GetPostStatisticsAsync(filter);

                return Ok(new
                {
                    Dashboard = dashboard,
                    TimeSeries = timeSeries,
                    Users = users,
                    Revenue = revenue,
                    ServiceCombos = ServiceCombos,
                    Posts = posts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "L?i khi l?y t?t c? th?ng k?", error = ex.Message });
            }
        }
    }
}
