using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboDetailService
    {
        Task<IEnumerable<ServiceComboDetail>> GetAllAsync();
        Task<ServiceComboDetail?> GetByIdAsync(int id);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId);
        Task<ServiceComboDetail> CreateAsync(ServiceComboDetail serviceComboDetail);
        Task<ServiceComboDetail?> UpdateAsync(int id, ServiceComboDetail serviceComboDetail);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByServiceComboIdAsync(int serviceComboId);
    }
}