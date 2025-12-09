using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace ESCE_SYSTEM.Repositories.MessageRepository
{
    public class MessageRepository : IMessageRepository
    {
        private readonly ESCEContext _dbContext;

        public MessageRepository(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task AddAsync(Message message)
        {
            await _dbContext.Messages.AddAsync(message);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<List<Message>> GetConversationHistoryAsync(int userAId, int userBId)
        {
            return await _dbContext.Messages
                .Where(m => (m.SenderId == userAId && m.ReceiverId == userBId) ||
                            (m.SenderId == userBId && m.ReceiverId == userAId))
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<int>> GetChattedUserIdsAsync(int currentUserId)
        {
            // Lấy tất cả các ID (Sender hoặc Receiver) đã tương tác với currentUserId
            var chattedIds = await _dbContext.Messages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .Select(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToListAsync();

            return chattedIds;
        }
    }
}