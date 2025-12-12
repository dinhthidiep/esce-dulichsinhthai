using ESCE_SYSTEM.Services.MessageService;
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
// Đảm bảo BaseController tồn tại hoặc thay bằng ControllerBase

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/chat")]
    [Authorize] // Cho phép tất cả authenticated users (Admin và non-Admin)
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserContextService _userContextService;

        public ChatController(IMessageService messageService, IUserContextService userContextService)
        {
            _messageService = messageService;
            _userContextService = userContextService;
        }

        [HttpGet("GetUserForChat")]
        public async Task<ActionResult> GetUserForChat()
        {
            try
            {
                // UserId là string từ Claims
                var rs = await _messageService.GetAllUserForChat(_userContextService.UserId);
                return Ok(rs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lấy danh sách người dùng để chat: {ex.Message}", error = ex.GetType().Name });
            }
        }

        [HttpGet("GetChattedUser")]
        public async Task<ActionResult> GetChattedUser()
        {
            try
            {
                // UserId là string từ Claims
                var rs = await _messageService.GetChattedUsers(_userContextService.UserId);
                return Ok(rs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lấy danh sách người dùng đã chat: {ex.Message}", error = ex.GetType().Name });
            }
        }

        [HttpGet("GetHistory/{toUserId}")]
        public async Task<ActionResult> GetHistory(string toUserId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(toUserId))
                {
                    return BadRequest(new { message = "ID người dùng không hợp lệ" });
                }

                // Truyền cả hai ID (đều là string) cho Service
                var rs = await _messageService.GetChatHistory(_userContextService.UserId, toUserId);
                return Ok(rs);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lấy lịch sử chat: {ex.Message}", error = ex.GetType().Name });
            }
        }
    }
}