using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services.NotificationService
{
    public interface INotificationService
    {
        // Lấy tất cả thông báo chưa đọc của user
        Task<IEnumerable<NotificationDto>> GetNotificationUnReadByUserIdAsyc(string userId);

        // Lấy tất cả thông báo của user (cả đã đọc và chưa đọc)
        Task<IEnumerable<NotificationDto>> GetAllByUserIdAsync(int userId);

        // Thêm thông báo mới
        Task AddNotificationAsync(NotificationDto notificationDto);

        // Đánh dấu thông báo đã đọc
        Task IsRead(int notificationId);

        // Đánh dấu tất cả thông báo đã đọc
        Task MarkAllAsReadAsync(int userId);

        // Xóa thông báo
        Task Delete(int notificationId);
    }
}