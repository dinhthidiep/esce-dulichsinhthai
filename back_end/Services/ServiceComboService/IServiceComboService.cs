using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IServiceComboService
    {
        Task<IEnumerable<ServiceCombo>> GetAllAsync(int? currentUserId = null);
        Task<ServiceCombo?> GetByIdAsync(int id, int? currentUserId = null);
        Task<ServiceCombo?> GetByNameAsync(string name);
        Task<IEnumerable<ServiceCombo>> GetByHostIdAsync(int hostId);
        Task<IEnumerable<ServiceCombo>> GetApprovedByHostIdAsync(int hostId);
        Task<IEnumerable<ServiceCombo>> GetMyServiceCombosAsync(int hostId);
        Task<ServiceCombo> CreateAsync(ServiceCombo ServiceCombo);
        Task<ServiceCombo?> UpdateAsync(int id, ServiceCombo ServiceCombo);
        Task<ServiceCombo?> DeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status, string? comment = null); // Admin duyệt ServiceCombo
        Task<IEnumerable<ServiceCombo>> GetAllForAdminAsync(); // Admin xem tất cả (kể cả chưa duyệt)
        Task<IEnumerable<ServiceCombo>> GetAllPendingAsync(); // Admin xem tất cả ServiceCombo đang pending
    }
}
