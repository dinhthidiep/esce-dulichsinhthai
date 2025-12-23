using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services
{
    public class ServiceComboService : IServiceComboService
    {
        private readonly IServiceComboRepository _repository;
        private readonly ESCEContext _context;
        
        public ServiceComboService(IServiceComboRepository repository, ESCEContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<IEnumerable<ServiceCombo>> GetAllAsync(int? currentUserId = null)
        {
            // Nếu có currentUserId, hiển thị tất cả combo của host đó + các combo đã approved
            if (currentUserId.HasValue && currentUserId.Value > 0)
            {
                return await _context.Servicecombos
                    .Where(sc => sc.Status == "approved" || sc.HostId == currentUserId.Value)
                    .ToListAsync();
            }
            
            // Nếu không có currentUserId, chỉ hiển thị các combo đã approved
            return await _context.Servicecombos
                .Where(sc => sc.Status == "approved")
                .ToListAsync();
        }
        public async Task<ServiceCombo?> GetByIdAsync(int id, int? currentUserId = null)
        {
            var combo = await _repository.GetByIdAsync(id);
            if (combo == null) return null;

            // Nếu là host của combo này, cho phép xem (kể cả chưa approved)
            if (currentUserId.HasValue && combo.HostId == currentUserId.Value)
            {
                return combo;
            }

            // Nếu không phải host, chỉ cho xem nếu đã approved
            if (combo.Status == "approved")
            {
                return combo;
            }

            // Không cho xem nếu chưa approved và không phải host
            return null;
        }

        public async Task<ServiceCombo?> GetByNameAsync(string name)
        {
            return await _repository.GetByNameAsync(name);
        }

        public async Task<IEnumerable<ServiceCombo>> GetByHostIdAsync(int hostId)
        {
            return await _repository.GetByHostIdAsync(hostId);
        }

        public async Task<IEnumerable<ServiceCombo>> GetApprovedByHostIdAsync(int hostId)
        {
            return await _repository.GetApprovedByHostIdAsync(hostId);
        }

        public async Task<IEnumerable<ServiceCombo>> GetMyServiceCombosAsync(int hostId)
        {
            // Host có thể xem tất cả combo của mình (kể cả chưa được duyệt)
            return await _repository.GetByHostIdAsync(hostId);
        }

        public async Task<ServiceCombo> CreateAsync(ServiceCombo Servicecombo)
        {
            // ServiceCombo luôn bắt đầu với status "pending" để Admin duyệt
            Servicecombo.Status = "pending";
            Servicecombo.CreatedAt = DateTime.Now;
            
            await _repository.CreateAsync(Servicecombo);
            return Servicecombo;
        }
        public async Task<ServiceCombo?> UpdateAsync(int id, ServiceCombo Servicecombo)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = Servicecombo.Name;
            existing.Address = Servicecombo.Address;
            existing.Description = Servicecombo.Description;
            existing.Price = Servicecombo.Price;
            existing.AvailableSlots = Servicecombo.AvailableSlots;
            existing.Image = Servicecombo.Image;
            existing.Status = Servicecombo.Status;
            existing.CancellationPolicy = Servicecombo.CancellationPolicy;
            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return existing;
        }

        public async Task<ServiceCombo?> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            await _repository.DeleteAsync(id);
            return existing;
        }

        // Admin duyệt ServiceCombo (thay đổi status)
        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            // Validate status: chỉ cho phép các giá trị hợp lệ
            var validStatuses = new[] { "pending", "approved", "rejected" };
            if (!validStatuses.Contains(status.ToLower()))
            {
                return false;
            }

            existing.Status = status.ToLower();
            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return true;
        }

        // Admin xem tất cả ServiceCombo (kể cả chưa duyệt)
        public async Task<IEnumerable<ServiceCombo>> GetAllForAdminAsync()
        {
            return await _context.Servicecombos
                .Include(s => s.Host)
                .ToListAsync();
        }
    }
}
