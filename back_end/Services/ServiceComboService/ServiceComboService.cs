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
        public async Task<ServiceCombo> CreateAsync(ServiceCombo serviceCombo)
        {
            await _repository.CreateAsync(serviceCombo);
            return serviceCombo;
        }
        public async Task<ServiceCombo?> UpdateAsync(int id, ServiceCombo serviceCombo)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = serviceCombo.Name;
            existing.Address = serviceCombo.Address;
            existing.Description = serviceCombo.Description;
            existing.Price = serviceCombo.Price;
            existing.AvailableSlots = serviceCombo.AvailableSlots;
            existing.Image = serviceCombo.Image;
            existing.Status = serviceCombo.Status;
            existing.CancellationPolicy = serviceCombo.CancellationPolicy;
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