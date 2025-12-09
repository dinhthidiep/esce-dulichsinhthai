using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface IPostReactionRepository
    {
        Task<Postreaction> GetByIdAsync(int id);
        Task<IEnumerable<Postreaction>> GetByPostIdAsync(int postId);
        Task<IEnumerable<Postreaction>> GetByUserIdAsync(int userId);
        Task<Postreaction> GetByUserAndPostAsync(int userId, int postId);
        Task<Postreaction> AddAsync(Postreaction postReaction);
        Task<bool> DeleteAsync(int id);
        Task<int> GetCountByPostIdAsync(int postId);
    }
}