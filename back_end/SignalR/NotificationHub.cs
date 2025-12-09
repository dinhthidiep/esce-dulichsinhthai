using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Services.NotificationService;
using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ESCE_SYSTEM.SignalR;

[Authorize]
public class NotificationHub : Hub
{
    private readonly INotificationService _notificationService;

    public NotificationHub(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    //  Phương thức này hiện không cần thiết vì ta dùng SendToUser để gửi notification
    /*public async Task SendNotification(NotificationDto notification)
    {
        await Clients.All.SendAsync("ReceiveNotification", notification);
    }*/

    public async Task SendToUser(string userId, NotificationDto notification)
    {
        // Gửi thông báo đến một người dùng cụ thể
        await Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }

    public override async Task OnConnectedAsync()
    {
        // Lấy ID người dùng hiện tại (string)
        var userId = Context.GetHttpContext()?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            //  Tải thông báo chưa đọc (Service sẽ chuyển đổi ID string -> int)
            var unReadNotifications = await _notificationService.GetNotificationUnReadByUserIdAsyc(userId);

            // Gửi thông báo cũ tới người dùng
            await Clients.Caller.SendAsync("LoadOldNotifications", unReadNotifications.OrderByDescending(x => x.CreatedAt).Adapt<List<NotificationDto>>());
        }

        await base.OnConnectedAsync();
    }
}