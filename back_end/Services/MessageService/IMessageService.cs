
using System.Collections.Generic;
using System.Threading.Tasks;
using ESCE_SYSTEM.DTOs.Message;
using ESCE_SYSTEM.Models;
public interface IMessageService
{
    // Giữ string ID để khớp với SignalR Context
    Task<IEnumerable<ChatUserDto>> GetChattedUsers(string userId);
    Task<IEnumerable<ChatUserDto>> GetAllUserForChat(string userId);
    Task<IEnumerable<Message>> GetChatHistory(string userAId, string userBId);
    Task AddNewChatMessage(string senderId, string receiverId, string content);
    Task<bool> DeleteConversation(string currentUserId, string otherUserId);
    Task<int> GetUnreadMessageCount(string userId);
    Task MarkMessagesAsRead(string currentUserId, string otherUserId);
}