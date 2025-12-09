using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface IServiceComboRepository
    {
        Task<IEnumerable<ServiceCombo>> GetAllAsync();
        Task<ServiceCombo?> GetByIdAsync(int id);
        Task<ServiceCombo?> GetByNameAsync(string name);
        Task CreateAsync(ServiceCombo serviceCombo);
        Task UpdateAsync(ServiceCombo serviceCombo);
        Task DeleteAsync(int id);
    }
}