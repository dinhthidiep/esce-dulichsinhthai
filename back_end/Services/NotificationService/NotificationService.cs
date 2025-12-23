using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Models;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.NotificationService
{
    public class NotificationService : INotificationService
    {
        private readonly ESCEContext _dbContext;

        public NotificationService(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        private int ParseUserId(string userId)
        {
            if (int.TryParse(userId, out int id)) return id;
            throw new ArgumentException($"ID người dùng '{userId}' không hợp lệ.");
        }

        public async Task AddNotificationAsync(NotificationDto notificationDto)
        {
            var notification = new Notification
            {
                UserId = notificationDto.UserId,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.Notifications.AddAsync(notification);
            await _dbContext.SaveChangesAsync();
        }

        public async Task Delete(int notificationId)
        {
            var notification = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId);

            if (notification == null)
            {
                throw new Exception("Không tìm thấy thông báo");
            }

            _dbContext.Notifications.Remove(notification);
            await _dbContext.SaveChangesAsync();
        }

        // Lấy tất cả thông báo của user (cả đã đọc và chưa đọc)
        // Để hiển thị trong dropdown, sau đó frontend sẽ filter/highlight chưa đọc
        public async Task<IEnumerable<NotificationDto>> GetNotificationUnReadByUserIdAsyc(string userId)
        {
            var userIntId = ParseUserId(userId);

            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userIntId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Giới hạn 50 thông báo gần nhất
                .ToListAsync();

            return notifications.Adapt<List<NotificationDto>>();
        }

        // Lấy tất cả thông báo của user (cả đã đọc và chưa đọc)
        public async Task<IEnumerable<NotificationDto>> GetAllByUserIdAsync(int userId)
        {
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Giới hạn 50 thông báo gần nhất
                .ToListAsync();

            return notifications.Adapt<List<NotificationDto>>();
        }

        public async Task IsRead(int notificationId)
        {
            var notification = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId);

            if (notification == null)
            {
                throw new Exception("Không tìm thấy thông báo");
            }

            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();
        }

        // Đánh dấu tất cả thông báo đã đọc
        public async Task MarkAllAsReadAsync(int userId)
        {
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && n.IsRead == false)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _dbContext.SaveChangesAsync();
        }
    }
}