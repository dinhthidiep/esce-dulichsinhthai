using ESCE_SYSTEM.DTOs.Statistics;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services.StatisticsService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statisticsService;
        private readonly ESCEContext _context;

        public StatisticsController(IStatisticsService statisticsService, ESCEContext context)
        {
            _statisticsService = statisticsService;
            _context = context;
        }

        /// <summary>
        /// Lấy số lượng badge cho Admin sidebar (pending posts, services, upgrade requests, unread messages)
        /// </summary>
        [HttpGet("admin-badges")]
        public async Task<IActionResult> GetAdminBadges()
        {
            try
            {
                // Pending posts cần duyệt
                var pendingPosts = await _context.Posts
                    .CountAsync(p => p.Status == "Pending" && !p.IsDeleted);

                // Pending services cần duyệt (Services table)
                var pendingServices = await _context.Services
                    .CountAsync(s => s.Status == "Pending");

                // Pending service combos cần duyệt
                var pendingServiceCombos = await _context.Servicecombos
                    .CountAsync(s => s.Status == "pending");

                // Pending upgrade requests (Host + Agency certificates)
                var pendingHostCertificates = await _context.HostCertificates
                    .CountAsync(c => c.Status == "Pending" || c.Status == "PaidPending" || c.Status == "Review");
                var pendingAgencyCertificates = await _context.AgencieCertificates
                    .CountAsync(c => c.Status == "Pending" || c.Status == "PaidPending" || c.Status == "Review");
                var pendingUpgradeRequests = pendingHostCertificates + pendingAgencyCertificates;

                // Unread messages (tin nhắn gửi đến Admin chưa đọc)
                var adminUsers = await _context.Accounts
                    .Where(a => a.RoleId == 1) // Admin role
                    .Select(a => a.Id)
                    .ToListAsync();
                
                var unreadMessages = await _context.Messages
                    .CountAsync(m => adminUsers.Contains(m.ReceiverId) && m.IsRead == false);

                return Ok(new
                {
                    PendingPosts = pendingPosts,
                    PendingServices = pendingServices + pendingServiceCombos,
                    PendingUpgradeRequests = pendingUpgradeRequests,
                    UnreadMessages = unreadMessages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy admin badges", error = ex.Message });
            }
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
