using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public class ServiceComboService : IServiceComboService
    {
        private readonly IServiceComboRepository _repository;
        public ServiceComboService(IServiceComboRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ServiceCombo>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }
        public async Task<ServiceCombo?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<ServiceCombo?> GetByNameAsync(string name)
        {
            return await _repository.GetByNameAsync(name);
        }
        public async Task<ServiceCombo> CreateAsync(ServiceCombo Servicecombo)
        {
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



    }
}
