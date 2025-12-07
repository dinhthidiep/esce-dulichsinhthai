// File: ESCE_SYSTEM.Services/IServiceComboDetailService.cs

using ESCE_SYSTEM.DTOs.ServiceComboDetail;
using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboDetailService
    {
        Task<IEnumerable<ServiceComboDetail>> GetAllAsync();
        Task<ServiceComboDetail?> GetByIdAsync(int id);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId);

        // Sửa: Nhận DTO, Trả về Model
        Task<ServiceComboDetail> CreateAsync(CreateServiceComboDetailDto detailDto);

        // Sửa: Nhận ID và DTO, Trả về Model?
        Task<ServiceComboDetail?> UpdateAsync(int id, UpdateServiceComboDetailDto detailDto);

        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByServiceComboIdAsync(int serviceComboId);
    }
}