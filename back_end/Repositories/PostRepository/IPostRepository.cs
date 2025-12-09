using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface IPostRepository
    {
        Task<Post> GetByIdAsync(int id);
        Task<IEnumerable<Post>> GetAllAsync();
        Task<IEnumerable<Post>> GetApprovedPostsAsync();
        Task<IEnumerable<Post>> GetPendingPostsAsync();
        Task<IEnumerable<Post>> GetByAuthorIdAsync(int authorId);
        Task<Post> AddAsync(Post post);
        Task<Post> UpdateAsync(Post post);
        Task<bool> DeleteAsync(int id);
        Task<bool> SoftDeleteAsync(int id);
        Task<int> GetCommentsCountAsync(int postId);
        Task<int> GetReactionsCountAsync(int postId);
        Task<int> GetSavesCountAsync(int postId);
    }
}