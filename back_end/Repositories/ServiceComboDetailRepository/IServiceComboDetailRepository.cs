using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface IServiceComboDetailRepository
    {
        Task<IEnumerable<ServiceComboDetail>> GetAllAsync();
        Task<ServiceComboDetail?> GetByIdAsync(int id);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int ServiceComboId);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId);
        Task CreateAsync(ServiceComboDetail ServiceComboDetail);
        Task UpdateAsync(ServiceComboDetail ServiceComboDetail);
        Task DeleteAsync(int id);
        Task DeleteByServiceComboIdAsync(int ServiceComboId);
    }
}
