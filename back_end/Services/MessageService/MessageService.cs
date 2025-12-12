// Đặt file này tại ESCE_SYSTEM.Services.MessageService/MessageService.cs

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ESCE_SYSTEM.DTOs.Message;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.MessageService // 👈 Đã thêm namespace
{
    public class MessageService : IMessageService
    {
        private readonly ESCEContext _dbContext;
        private readonly IUserContextService _userContextService;

        public MessageService(ESCEContext dbContext, IUserContextService userContextService)
        {
            _dbContext = dbContext;
            _userContextService = userContextService;
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

            // Kiểm tra quyền gửi tin nhắn
            var sender = await _dbContext.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == senderIntId);
            
            var receiver = await _dbContext.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == receiverIntId);

            if (sender == null || receiver == null)
            {
                throw new ArgumentException("Người gửi hoặc người nhận không tồn tại.");
            }

            bool isSenderAdmin = sender.Role?.Name?.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true;
            bool isReceiverAdmin = receiver.RoleId == 1; // RoleId = 1 là Admin

            // Non-Admin users chỉ được gửi tin nhắn cho Admin
            if (!isSenderAdmin && !isReceiverAdmin)
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể nhắn tin cho Admin.");
            }

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
                .Include(m => m.Sender) // Include Sender để lấy thông tin người gửi
                .Include(m => m.Receiver) // Include Receiver để lấy thông tin người nhận
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChatUserDto>> GetAllUserForChat(string userId)
        {
            var currentUserId = ParseUserId(userId);
            
            // Kiểm tra role của user hiện tại
            var currentUser = await _dbContext.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == currentUserId);
            
            bool isAdmin = currentUser?.Role?.Name?.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true;

            IQueryable<Account> usersQuery;
            
            if (isAdmin)
            {
                // Admin có thể chat với tất cả users (trừ chính mình)
                usersQuery = _dbContext.Accounts
                    .Where(a => a.Id != currentUserId);
            }
            else
            {
                // Non-Admin users chỉ có thể chat với Admin
                usersQuery = _dbContext.Accounts
                    .Where(a => a.Id != currentUserId && a.RoleId == 1); // RoleId = 1 là Admin
            }

            var users = await usersQuery
                .Include(a => a.Role) // Include Role để lấy tên Role
                .OrderBy(a => a.Name) // Sắp xếp theo tên
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
            
            // Kiểm tra role của user hiện tại
            var currentUser = await _dbContext.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == currentUserId);
            
            bool isAdmin = currentUser?.Role?.Name?.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true;

            // 1. Tìm tất cả các ID đã chat với user hiện tại
            var chattedIds = await _dbContext.Messages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .Select(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToListAsync();

            // 2. Lấy thông tin Account và Role, lọc theo role nếu không phải Admin
            IQueryable<Account> usersQuery = _dbContext.Accounts
                .Where(a => chattedIds.Contains(a.Id));
            
            if (!isAdmin)
            {
                // Non-Admin users chỉ thấy Admin users đã chat
                usersQuery = usersQuery.Where(a => a.RoleId == 1); // RoleId = 1 là Admin
            }

            var users = await usersQuery
                .Include(a => a.Role) // Include Role để lấy tên Role
                .OrderByDescending(a => 
                    _dbContext.Messages
                        .Where(m => (m.SenderId == currentUserId && m.ReceiverId == a.Id) || 
                                   (m.SenderId == a.Id && m.ReceiverId == currentUserId))
                        .OrderByDescending(m => m.CreatedAt)
                        .Select(m => m.CreatedAt)
                        .FirstOrDefault()) // Sắp xếp theo tin nhắn mới nhất
                .ToListAsync();

            return users.Select(u => new ChatUserDto
            {
                UserId = u.Id.ToString(),
                FullName = u.Name,
                Role = u.Role?.Name ?? "Unknown",
                RoleId = u.RoleId,
                Email = u.Email
            });
        }
    }
}