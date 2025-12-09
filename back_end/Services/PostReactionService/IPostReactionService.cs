using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IPostReactionService
    {
        Task LikePost(int postId);
        Task UnlikePost(int postReactionId);
        Task<int> GetLikeCount(int postId);
    }
}