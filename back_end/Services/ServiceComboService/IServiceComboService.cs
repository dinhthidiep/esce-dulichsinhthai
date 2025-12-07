// File: IServiceComboService.cs
using ESCE_SYSTEM.DTOs.ServiceCombo;
using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboService
    {
        Task<IEnumerable<ServiceCombo>> GetAllAsync();
        Task<ServiceCombo?> GetByIdAsync(int id);
        Task<ServiceCombo?> GetByNameAsync(string name);

        // FIX CS0738: Thay đổi kiểu trả về sang DTO
        Task<ServiceComboResponseDto> CreateAsync(CreateServiceComboDto comboDto);
        Task<ServiceComboResponseDto?> UpdateAsync(int id, UpdateServiceComboDto comboDto);

        Task<ServiceCombo?> DeleteAsync(int id);
    }
}