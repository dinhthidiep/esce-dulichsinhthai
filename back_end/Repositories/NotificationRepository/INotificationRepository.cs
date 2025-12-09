using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories.NotificationRepository
{
    public interface INotificationRepository
    {
        // Thêm mới
        Task AddAsync(Notification notification);

        // Lấy theo ID (để IsRead/Delete)
        Task<Notification> GetByIdAsync(int notificationId);

        // Lấy tất cả thông báo chưa xóa của một người dùng
        Task<List<Notification>> GetByUserIdAndStatusAsync(int userId, bool isDeleted = false, bool isRead = false);

        // Cập nhật
        Task UpdateAsync(Notification notification);
    }
}