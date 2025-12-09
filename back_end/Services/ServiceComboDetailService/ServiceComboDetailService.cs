using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;

namespace ESCE_SYSTEM.Services
{
    public class ServiceComboDetailService : IServiceComboDetailService
    {
        private readonly IServiceComboDetailRepository _repository;

        public ServiceComboDetailService(IServiceComboDetailRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<ServiceComboDetail?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId)
        {
            return await _repository.GetByServiceComboIdAsync(serviceComboId);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId)
        {
            return await _repository.GetByServiceIdAsync(serviceId);
        }

        public async Task<ServiceComboDetail> CreateAsync(ServiceComboDetail serviceComboDetail)
        {
            await _repository.CreateAsync(serviceComboDetail);
            return serviceComboDetail;
        }

        public async Task<ServiceComboDetail?> UpdateAsync(int id, ServiceComboDetail serviceComboDetail)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.ServiceComboId = serviceComboDetail.ServiceComboId;
            existing.ServiceId = serviceComboDetail.ServiceId;
            existing.Quantity = serviceComboDetail.Quantity;

            await _repository.UpdateAsync(existing);
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> DeleteByServiceComboIdAsync(int serviceComboId)
        {
            var existing = await _repository.GetByServiceComboIdAsync(serviceComboId);
            if (!existing.Any()) return false;

            await _repository.DeleteByServiceComboIdAsync(serviceComboId);
            return true;
        }
    }
}