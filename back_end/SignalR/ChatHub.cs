using ESCE_SYSTEM.Services.MessageService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ESCE_SYSTEM.SignalR
{
    [Authorize] // Cho phép tất cả authenticated users (Admin và non-Admin)
    public class ChatHub : Hub
    {
        private readonly IMessageService _chatService;

        public ChatHub(IMessageService chatService)
        {
            _chatService = chatService;
        }

        public async Task SendMessage(string toUserId, string content)
        {
            // Lấy ID người gửi (string) từ Claims
            var userId = Context.GetHttpContext()?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = Context.GetHttpContext()?.User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(toUserId))
                return;

            // Validation: Non-Admin users chỉ được gửi tin nhắn cho Admin
            // Logic này được xử lý trong MessageService.AddNewChatMessage
            // Nếu không hợp lệ, sẽ throw exception và không gửi tin nhắn

            try
            {
                // 🟢 Lưu DB (Service sẽ validate và chuyển đổi ID string -> int)
                await _chatService.AddNewChatMessage(userId, toUserId, content);

                var message = new
                {
                    senderId = userId,
                    receiverId = toUserId,
                    content = content,
                    timestamp = DateTime.UtcNow
                };

                // Gửi tới người nhận và người gửi
                await Clients.User(toUserId).SendAsync("ReceiveMessage", message);
                await Clients.Caller.SendAsync("ReceiveMessage", message);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Gửi lỗi về cho người gửi
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
            catch (Exception ex)
            {
                // Gửi lỗi chung về cho người gửi
                await Clients.Caller.SendAsync("Error", $"Lỗi khi gửi tin nhắn: {ex.Message}");
            }
        }
    }
}