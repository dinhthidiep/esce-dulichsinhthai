using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface IServiceComboRepository
    {
        Task<IEnumerable<ServiceCombo>> GetAllAsync();
        Task<ServiceCombo?> GetByIdAsync(int id);
        Task<ServiceCombo?> GetByNameAsync(string name);
        Task CreateAsync(ServiceCombo ServiceCombo);
        Task UpdateAsync(ServiceCombo ServiceCombo);
        Task DeleteAsync(int id);
    }
}
