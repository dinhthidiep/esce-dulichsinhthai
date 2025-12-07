using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface INewsRepository
    {
        Task<IEnumerable<News>> GetAllAsync();
        Task<News?> GetByIdAsync(int id);
        Task<IEnumerable<News>> GetByAccountIdAsync(int accountId);
        Task CreateAsync(News news);
        Task UpdateAsync(News news);
        Task DeleteAsync(int id);
    }
}