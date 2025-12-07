using ESCE_SYSTEM.Services.MessageService;
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
// Đảm bảo BaseController tồn tại hoặc thay bằng ControllerBase

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase // Đã thay BaseController bằng ControllerBase
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
            catch (Exception)
            {
                // Nên trả về lỗi BadRequest kèm message trong môi trường DEV/LOGGING
                return BadRequest("Lỗi khi lấy danh sách người dùng để chat.");
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
            catch (Exception)
            {
                return BadRequest("Lỗi khi lấy danh sách người dùng đã chat.");
            }
        }

        [HttpGet("GetHistory/{toUserId}")]
        public async Task<ActionResult> GetHistory(string toUserId)
        {
            try
            {
                // Truyền cả hai ID (đều là string) cho Service
                var rs = await _messageService.GetChatHistory(_userContextService.UserId, toUserId);
                return Ok(rs);
            }
            catch (Exception)
            {
                return BadRequest("Lỗi khi lấy lịch sử chat.");
            }
        }
    }
}