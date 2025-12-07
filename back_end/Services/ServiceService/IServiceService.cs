// File: IServiceService.cs (Đã xóa các phương thức Helper thừa)
using ESCE_SYSTEM.DTOs.Service;
using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceService
    {
        Task<IEnumerable<ServiceResponseDto>> GetAllAsync(string status = null);
        Task<ServiceResponseDto?> GetByIdAsync(int id);
        Task<ServiceResponseDto> CreateAsync(CreateServiceDto serviceDto);
        Task<Service?> UpdateAsync(int id, UpdateServiceDto serviceDto);
        Task<bool> DeleteAsync(int id);

        // PHƯƠNG THỨC QUẢN LÝ TRẠNG THÁI
        Task ApproveServiceAsync(int serviceId);
        Task RejectServiceAsync(int serviceId, string comment);
        Task ReviewServiceAsync(int serviceId, string comment);
    }
}