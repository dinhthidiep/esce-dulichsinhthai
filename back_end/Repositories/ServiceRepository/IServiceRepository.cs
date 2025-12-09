using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface IServiceRepository
    {
        Task<IEnumerable<Service>> GetAllAsync();
        Task<Service?> GetByIdAsync(int id);
        Task CreateAsync(Service service);
        Task UpdateAsync(Service service);
        Task DeleteAsync(int id);
    }
}