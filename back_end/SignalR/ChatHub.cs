using ESCE_SYSTEM.Services.MessageService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ESCE_SYSTEM.SignalR
{
    [Authorize]
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

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(toUserId))
                return;

            var message = new
            {
                senderId = userId,
                receiverId = toUserId,
                content = content,
                timestamp = DateTime.UtcNow
            };

            // 🟢 Lưu DB (Service sẽ chuyển đổi ID string -> int)
            await _chatService.AddNewChatMessage(message.senderId, message.receiverId, message.content);

            // Gửi tới người nhận và người gửi
            await Clients.User(toUserId).SendAsync("ReceiveMessage", message);
            await Clients.Caller.SendAsync("ReceiveMessage", message);
        }
    }
}