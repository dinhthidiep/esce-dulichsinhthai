using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Repositories.NotificationRepository
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ESCEContext _dbContext;

        public NotificationRepository(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task AddAsync(Notification notification)
        {
            await _dbContext.Notifications.AddAsync(notification);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<Notification> GetByIdAsync(int notificationId)
        {
            return await _dbContext.Notifications.FindAsync(notificationId);
        }

        public async Task<List<Notification>> GetByUserIdAndStatusAsync(int userId, bool isDeleted = false, bool isRead = false)
        {
            // Giả định Model Notification của bạn có trường IsDelete, nếu không, hãy bỏ qua điều kiện này.
            // Dựa trên Model bạn cung cấp: chỉ có IsRead.
            return await _dbContext.Notifications
                .Where(n => n.UserId == userId && n.IsRead == isRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task UpdateAsync(Notification notification)
        {
            _dbContext.Notifications.Update(notification);
            await _dbContext.SaveChangesAsync();
        }
    }
}