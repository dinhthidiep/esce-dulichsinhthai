using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface IPostSaveRepository
    {
        Task<Postsave> GetByIdAsync(int id);
        Task<IEnumerable<Postsave>> GetByUserIdAsync(int userId);
        Task<Postsave> GetByUserAndPostAsync(int userId, int postId);
        Task<Postsave> AddAsync(Postsave postSave);
        Task<bool> DeleteAsync(int id);
        Task<int> GetCountByPostIdAsync(int postId);
    }
}