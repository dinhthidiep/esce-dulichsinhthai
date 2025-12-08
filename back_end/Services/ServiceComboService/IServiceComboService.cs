using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboService
    {
        Task<IEnumerable<ServiceCombo>> GetAllAsync();
        Task<ServiceCombo?> GetByIdAsync(int id);
        Task<ServiceCombo?> GetByNameAsync(string name);
        Task<ServiceCombo> CreateAsync(ServiceCombo ServiceCombo);
        Task<ServiceCombo?> UpdateAsync(int id, ServiceCombo ServiceCombo);
        Task<ServiceCombo?> DeleteAsync(int id);
    }
}
