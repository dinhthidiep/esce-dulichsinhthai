using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Services.UserService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

// Đảm bảo các using cần thiết khác tồn tại
// namespace ESCE_SYSTEM.DTOs
// namespace ESCE_SYSTEM.Services.UserService;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/notification")]
    [ApiController] // Sửa lại BaseController thành ControllerBase
    public class NotificationController : ControllerBase
    {
        // Giữ lại các dependencies cần thiết
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration; // Giả định cần thiết
        private readonly IUserService _userService; // Giả định cần thiết

        public NotificationController(IConfiguration configuration, IUserService userService, INotificationService notificationService)
        {
            _configuration = configuration;
            _userService = userService;
            _notificationService = notificationService;
        }

        // 🟢 HÀM HỖ TRỢ CHUYỂN ĐỔI STRING ID -> INT
        private int ParseNotificationId(string notificationId)
        {
            if (int.TryParse(notificationId, out int id)) return id;
            throw new ArgumentException($"ID thông báo '{notificationId}' không hợp lệ.");
        }

        [HttpPut("Read/{notificationId}")]
        [Authorize]
        public async Task<ActionResult> Read(string notificationId)
        {
            try
            {
                // 🟢 Chuyển đổi ID string -> int
                var id = ParseNotificationId(notificationId);
                await _notificationService.IsRead(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("Delete/{notificationId}")]
        [Authorize]
        public async Task<ActionResult> Delete(string notificationId)
        {
            try
            {
                // 🟢 Chuyển đổi ID string -> int
                var id = ParseNotificationId(notificationId);
                await _notificationService.Delete(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ⚠️ Nếu bạn có endpoint GetAllNotifications, cần phải thêm vào đây
        // VD:
        /*
        [HttpGet("GetAll")]
        [Authorize]
        public async Task<ActionResult> GetAll()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var notifications = await _notificationService.GetNotificationUnReadByUserIdAsyc(userId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        */
    }
}