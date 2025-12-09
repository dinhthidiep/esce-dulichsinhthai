using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface ICommentReactionRepository
    {
        Task<Commentreaction> GetByIdAsync(int id);
        Task<IEnumerable<Commentreaction>> GetByCommentIdAsync(int commentId);
        Task<IEnumerable<Commentreaction>> GetByUserIdAsync(int userId);
        Task<Commentreaction> GetByUserAndCommentAsync(int userId, int commentId);
        Task<Commentreaction> AddAsync(Commentreaction commentReaction);
        Task<bool> DeleteAsync(int id);
        Task<int> GetCountByCommentIdAsync(int commentId);
    }
}