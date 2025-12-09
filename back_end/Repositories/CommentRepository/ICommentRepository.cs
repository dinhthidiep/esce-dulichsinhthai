using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface ICommentRepository
    {
        Task<Comment> GetByIdAsync(int id);
        Task<IEnumerable<Comment>> GetByPostIdAsync(int postId);
        Task<IEnumerable<Comment>> GetByAuthorIdAsync(int authorId);
        Task<Comment> AddAsync(Comment comment);
        Task<Comment> UpdateAsync(Comment comment);
        Task<bool> DeleteAsync(int id);
        Task<bool> SoftDeleteAsync(int id);
        Task<int> GetReactionsCountAsync(int commentId);
    }
}