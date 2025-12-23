using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboDetailService
    {
        Task<IEnumerable<ServiceComboDetail>> GetAllAsync();
        Task<ServiceComboDetail?> GetByIdAsync(int id);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int ServicecomboId);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId);
        Task<ServiceComboDetail> CreateAsync(ServiceComboDetail ServicecomboDetail);
        Task<ServiceComboDetail?> UpdateAsync(int id, ServiceComboDetail ServicecomboDetail);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByServiceComboIdAsync(int ServicecomboId);
    }
}
