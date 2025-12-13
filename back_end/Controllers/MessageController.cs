using ESCE_SYSTEM.Services.MessageService;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserContextService _userContextService;
        private readonly IHubContext<ChatHub> _chatHub;

        public ChatController(
            IMessageService messageService, 
            IUserContextService userContextService,
            IHubContext<ChatHub> chatHub)
        {
            _messageService = messageService;
            _userContextService = userContextService;
            _chatHub = chatHub;
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

        [HttpDelete("DeleteConversation/{otherUserId}")]
        public async Task<ActionResult> DeleteConversation(string otherUserId)
        {
            try
            {
                var result = await _messageService.DeleteConversation(_userContextService.UserId, otherUserId);
                if (result)
                {
                    return Ok(new { message = "Đã xóa đoạn chat thành công." });
                }
                return NotFound(new { message = "Không tìm thấy đoạn chat để xóa." });
            }
            catch (Exception)
            {
                return BadRequest("Lỗi khi xóa đoạn chat.");
            }
        }

        [HttpPost("SendMessage")]
        public async Task<ActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.ToUserId) || string.IsNullOrEmpty(request.Content))
                {
                    return BadRequest("Thiếu thông tin người nhận hoặc nội dung tin nhắn.");
                }

                // Save to database
                await _messageService.AddNewChatMessage(_userContextService.UserId, request.ToUserId, request.Content);

                // Broadcast to receiver via SignalR
                var message = new
                {
                    senderId = _userContextService.UserId,
                    receiverId = request.ToUserId,
                    content = request.Content,
                    timestamp = DateTime.UtcNow
                };

                // Send to receiver
                await _chatHub.Clients.User(request.ToUserId).SendAsync("ReceiveMessage", message);

                return Ok(new { message = "Gửi tin nhắn thành công." });
            }
            catch (Exception)
            {
                return BadRequest("Lỗi khi gửi tin nhắn.");
            }
        }

        [HttpGet("UnreadCount")]
        public async Task<ActionResult> GetUnreadCount()
        {
            try
            {
                var count = await _messageService.GetUnreadMessageCount(_userContextService.UserId);
                return Ok(new { count });
            }
            catch (Exception)
            {
                return BadRequest("Lỗi khi lấy số tin nhắn chưa đọc.");
            }
        }

        [HttpPost("MarkAsRead/{otherUserId}")]
        public async Task<ActionResult> MarkAsRead(string otherUserId)
        {
            try
            {
                await _messageService.MarkMessagesAsRead(_userContextService.UserId, otherUserId);
                return Ok(new { message = "Đã đánh dấu đã đọc." });
            }
            catch (Exception)
            {
                return BadRequest("Lỗi khi đánh dấu đã đọc.");
            }
        }
    }

    public class SendMessageRequest
    {
        public string ToUserId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}