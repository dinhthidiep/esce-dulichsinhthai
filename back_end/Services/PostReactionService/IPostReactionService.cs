using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IPostReactionService
    {
        // Đã đổi tên thành ReactToPost và thêm reactionTypeId
        Task ReactToPost(int postId, byte reactionTypeId);
        Task UnlikePost(int postReactionId);
        Task<int> GetLikeCount(int postId);
    }
}