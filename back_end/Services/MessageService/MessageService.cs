// Đặt file này tại ESCE_SYSTEM.Services.MessageService/MessageService.cs

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ESCE_SYSTEM.DTOs.Message;
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.MessageService // 👈 Đã thêm namespace
{
    public class MessageService : IMessageService
    {
        private readonly ESCEContext _dbContext;

        // ⚠️ Nếu bạn cần thêm dependencies khác như IUserRepository hay IRoleService, 
        // hãy thêm vào constructor và khởi tạo chúng ở đây.
        public MessageService(ESCEContext dbContext /*, ...*/)
        {
            _dbContext = dbContext;
            // ...
        }

        // 🟢 HÀM HỖ TRỢ CHUYỂN ĐỔI STRING -> INT
        private int ParseUserId(string userId)
        {
            if (int.TryParse(userId, out int id)) return id;
            // Đây là lỗi nghiêm trọng nếu ID từ token không phải là số
            throw new ArgumentException($"ID người dùng '{userId}' không hợp lệ.");
        }

        public async Task AddNewChatMessage(string senderId, string receiverId, string content)
        {
            var senderIntId = ParseUserId(senderId);
            var receiverIntId = ParseUserId(receiverId);

            await _dbContext.Messages.AddAsync(new Message
            {
                SenderId = senderIntId,
                ReceiverId = receiverIntId,
                Content = content,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });
            await _dbContext.SaveChangesAsync();
        }

        public async Task<IEnumerable<Message>> GetChatHistory(string userAId, string userBId)
        {
            var userAIntId = ParseUserId(userAId);
            var userBIntId = ParseUserId(userBId);

            return await _dbContext.Messages
                .Where(m => (m.SenderId == userAIntId && m.ReceiverId == userBIntId) ||
                            (m.SenderId == userBIntId && m.ReceiverId == userAIntId))
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChatUserDto>> GetAllUserForChat(string userId)
        {
            var currentUserId = ParseUserId(userId);

            // Lấy tất cả user (trừ chính mình) và join với Role
            // Bao gồm cả Admin để user có thể chat với Admin
            var users = await _dbContext.Accounts
                .Where(a => a.Id != currentUserId)
                .Include(a => a.Role) // Cần Include Role để lấy tên Role
                .ToListAsync();

            return users.Select(u => new ChatUserDto
            {
                UserId = u.Id.ToString(), // Vẫn trả về string ID cho frontend
                FullName = u.Name,
                Role = u.Role?.Name ?? "Unknown", // Lấy tên Role từ navigation property
                RoleId = u.RoleId,
                Email = u.Email
            });
        }

        public async Task<IEnumerable<ChatUserDto>> GetChattedUsers(string userId)
        {
            var currentUserId = ParseUserId(userId);

            // 1. Tìm tất cả các ID đã chat với user hiện tại
            var chattedIds = await _dbContext.Messages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .Select(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToListAsync();

            // 2. Lấy thông tin Account và Role
            var users = await _dbContext.Accounts
                .Where(a => chattedIds.Contains(a.Id))
                .Include(a => a.Role)
                .ToListAsync();

            // 3. Lấy tin nhắn cuối cùng cho mỗi user
            var result = new List<ChatUserDto>();
            foreach (var u in users)
            {
                var lastMessage = await _dbContext.Messages
                    .Where(m => (m.SenderId == currentUserId && m.ReceiverId == u.Id) ||
                                (m.SenderId == u.Id && m.ReceiverId == currentUserId))
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                result.Add(new ChatUserDto
                {
                    UserId = u.Id.ToString(),
                    FullName = u.Name,
                    Role = u.Role?.Name ?? "Unknown",
                    RoleId = u.RoleId,
                    Email = u.Email,
                    LastMessage = lastMessage?.Content,
                    LastMessageTime = lastMessage?.CreatedAt
                });
            }

            // Sắp xếp theo thời gian tin nhắn cuối (mới nhất lên đầu)
            return result.OrderByDescending(u => u.LastMessageTime);
        }

        public async Task<bool> DeleteConversation(string currentUserId, string otherUserId)
        {
            var currentUserIntId = ParseUserId(currentUserId);
            var otherUserIntId = ParseUserId(otherUserId);

            // Xóa tất cả tin nhắn giữa 2 user
            var messagesToDelete = await _dbContext.Messages
                .Where(m => (m.SenderId == currentUserIntId && m.ReceiverId == otherUserIntId) ||
                            (m.SenderId == otherUserIntId && m.ReceiverId == currentUserIntId))
                .ToListAsync();

            if (messagesToDelete.Count == 0)
            {
                return false; // Không có tin nhắn nào để xóa
            }

            _dbContext.Messages.RemoveRange(messagesToDelete);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadMessageCount(string userId)
        {
            var userIntId = ParseUserId(userId);

            // Đếm số tin nhắn chưa đọc (tin nhắn gửi đến user hiện tại và chưa đọc)
            return await _dbContext.Messages
                .Where(m => m.ReceiverId == userIntId && m.IsRead == false)
                .CountAsync();
        }

        public async Task MarkMessagesAsRead(string currentUserId, string otherUserId)
        {
            var currentUserIntId = ParseUserId(currentUserId);
            var otherUserIntId = ParseUserId(otherUserId);

            // Đánh dấu tất cả tin nhắn từ otherUser gửi đến currentUser là đã đọc
            var unreadMessages = await _dbContext.Messages
                .Where(m => m.SenderId == otherUserIntId && m.ReceiverId == currentUserIntId && m.IsRead == false)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
            }

            await _dbContext.SaveChangesAsync();
        }
    }
}