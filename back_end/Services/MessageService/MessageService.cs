using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ESCE_SYSTEM.DTOs.Message;
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.MessageService
{
    public class MessageService : IMessageService
    {
        private readonly ESCEContext _dbContext;

        public MessageService(ESCEContext dbContext)
        {
            _dbContext = dbContext;
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

        // 🎯 PHƯƠNG THỨC ĐƯỢC TỐI ƯU HÓA:
        // 1. Khắc phục lỗi NRE bằng cách Include(a => a.Role).
        // 2. Sử dụng Projection (Select) để chỉ lấy dữ liệu cần thiết từ DB (tối ưu).
        public async Task<IEnumerable<ChatUserDto>> GetAllUserForChat(string userId)
        {
            var currentUserId = ParseUserId(userId);

            // Lấy tất cả user (trừ Admin và chính mình) và join với Role
            // RoleId = 1 là Admin (từ SeedData cũ)
            return await _dbContext.Accounts
                // 💡 BỔ SUNG .Include() để đảm bảo Role được tải
                .Include(a => a.Role)
                .Where(a => a.Id != currentUserId && a.RoleId != 1)
                // 🟢 Sử dụng Projection để ánh xạ trực tiếp sang DTO (Tối ưu nhất)
                .Select(u => new ChatUserDto
                {
                    UserId = u.Id.ToString(),
                    FullName = u.Name,
                    Role = u.Role.Name, // ✅ Đã khắc phục lỗi NullReferenceException
                    RoleId = u.RoleId,
                    Email = u.Email
                })
                .ToListAsync();
        }

        // 🎯 PHƯƠNG THỨC ĐƯỢC TỐI ƯU HÓA:
        // 1. Khắc phục lỗi NRE bằng cách Include(a => a.Role).
        // 2. Sử dụng Projection (Select) để chỉ lấy dữ liệu cần thiết từ DB (tối ưu).
        public async Task<IEnumerable<ChatUserDto>> GetChattedUsers(string userId)
        {
            var currentUserId = ParseUserId(userId);

            // 1. Tìm tất cả các ID đã chat với user hiện tại (Sử dụng subquery để tránh ToList() sớm)
            var chattedIds = _dbContext.Messages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .Select(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Distinct();

            // 2. Lấy thông tin Account, Role và ánh xạ sang DTO
            return await _dbContext.Accounts
                .Where(a => chattedIds.Contains(a.Id))
                // 💡 BỔ SUNG .Include() để đảm bảo Role được tải
                .Include(a => a.Role)
                // 🟢 Sử dụng Projection để ánh xạ trực tiếp sang DTO (Tối ưu nhất)
                .Select(u => new ChatUserDto
                {
                    UserId = u.Id.ToString(),
                    FullName = u.Name,
                    Role = u.Role.Name, // ✅ Đã khắc phục lỗi NullReferenceException
                    RoleId = u.RoleId,
                    Email = u.Email
                })
                .ToListAsync();
        }
    }
}