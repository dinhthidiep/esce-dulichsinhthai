using ESCE_SYSTEM.DTOs;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface ICommentReactionService
    {
        Task LikeComment(PostCommentLikeDto postCommentLike);
        Task UnlikeComment(int commentReactionId);
        Task<int> GetLikeCount(int commentId);
    }
}