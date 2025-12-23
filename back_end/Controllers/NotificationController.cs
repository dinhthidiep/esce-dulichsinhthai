using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Services.UserService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/notification")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;

        public NotificationController(IConfiguration configuration, IUserService userService, INotificationService notificationService)
        {
            _configuration = configuration;
            _userService = userService;
            _notificationService = notificationService;
        }

        // Hàm hỗ trợ chuyển đổi string ID -> int
        private int ParseNotificationId(string notificationId)
        {
            if (int.TryParse(notificationId, out int id)) return id;
            throw new ArgumentException($"ID thông báo '{notificationId}' không hợp lệ.");
        }

        // Lấy userId từ JWT token
        private string? GetUserIdFromToken()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id")?.Value;
        }

        // Lấy tất cả thông báo chưa đọc của user hiện tại
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult> GetByUserId(int userId)
        {
            try
            {
                var notifications = await _notificationService.GetNotificationUnReadByUserIdAsyc(userId.ToString());
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Đánh dấu thông báo đã đọc
        [HttpPut("Read/{notificationId}")]
        [Authorize]
        public async Task<ActionResult> Read(string notificationId)
        {
            try
            {
                var id = ParseNotificationId(notificationId);
                await _notificationService.IsRead(id);
                return Ok(new { message = "Đã đánh dấu đã đọc" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Đánh dấu tất cả thông báo đã đọc
        [HttpPut("ReadAll/{userId}")]
        [Authorize]
        public async Task<ActionResult> ReadAll(int userId)
        {
            try
            {
                await _notificationService.MarkAllAsReadAsync(userId);
                return Ok(new { message = "Đã đánh dấu tất cả đã đọc" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Xóa thông báo
        [HttpDelete("{notificationId}")]
        [Authorize]
        public async Task<ActionResult> Delete(int notificationId)
        {
            try
            {
                await _notificationService.Delete(notificationId);
                return Ok(new { message = "Đã xóa thông báo" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}