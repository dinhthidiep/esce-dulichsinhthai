// File: ESCE_SYSTEM.Repositories/IServiceComboDetailRepository.cs

using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface IServiceComboDetailRepository
    {
        Task<IEnumerable<ServiceComboDetail>> GetAllAsync();
        Task<ServiceComboDetail?> GetByIdAsync(int id);

        // THÊM: Định nghĩa cho GetByIdWithDetailsAsync
        Task<ServiceComboDetail?> GetByIdWithDetailsAsync(int id);

        Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId);

        // Giữ nguyên: Repository làm việc với Model
        Task CreateAsync(ServiceComboDetail serviceComboDetail);
        Task UpdateAsync(ServiceComboDetail serviceComboDetail);

        Task DeleteAsync(int id);
        Task DeleteByServiceComboIdAsync(int serviceComboId);
    }
}