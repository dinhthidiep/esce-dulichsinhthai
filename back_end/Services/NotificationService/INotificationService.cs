using ESCE_SYSTEM.DTOs.Notifications; // Sử dụng DTO mới
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services.NotificationService
{
    public interface INotificationService
    {
        // Nhận string userId từ Claims, trả về DTO
        Task<IEnumerable<NotificationDto>> GetNotificationUnReadByUserIdAsyc(string userId);

        // Nhận DTO để thêm
        Task AddNotificationAsync(NotificationDto notificationDto);

        // Nhận int notificationId
        Task IsRead(int notificationId);

        // Nhận int notificationId (sử dụng logic IsRead/Delete trong Service)
        Task Delete(int notificationId);
    }
}