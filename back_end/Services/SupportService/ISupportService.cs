using ESCE_SYSTEM.DTOs.Support;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface ISupportService
    {
        Task<List<SupportRequestResponseDto>> GetAllAsync(string? status = null);
        Task<SupportRequestResponseDto> GetByIdAsync(int id);
        Task<List<SupportRequestResponseDto>> GetByUserIdAsync(int userId);
        Task<SupportRequestResponseDto> CreateAsync(CreateSupportRequestDto dto);
        Task<SupportRequestResponseDto> UpdateAsync(int id, CreateSupportRequestDto dto);
        Task<bool> DeleteAsync(int id);
        Task ApproveAsync(ApproveSupportDto dto);
        Task RejectAsync(RejectSupportDto dto);
        Task<SupportResponseDetailDto> CreateResponseAsync(CreateSupportResponseDto dto);
        Task<List<SupportResponseDetailDto>> GetResponsesAsync(int supportId);
        Task<bool> DeleteResponseAsync(int id);
    }
}


