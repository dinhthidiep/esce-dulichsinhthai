// File: ESCE_SYSTEM.Repositories.MessageRepository/IMessageRepository.cs

using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories.MessageRepository
{
    public interface IMessageRepository
    {
        // Thêm tin nhắn mới
        Task AddAsync(Message message);

        // Lấy lịch sử chat giữa hai người dùng
        Task<List<Message>> GetConversationHistoryAsync(int userAId, int userBId);

        // Lấy các User ID đã chat với người dùng hiện tại
        Task<List<int>> GetChattedUserIdsAsync(int currentUserId);
    }
}