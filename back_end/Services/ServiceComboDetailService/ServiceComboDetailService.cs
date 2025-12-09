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

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int ServicecomboId)
        {
            return await _repository.GetByServiceComboIdAsync(ServicecomboId);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId)
        {
            return await _repository.GetByServiceIdAsync(serviceId);
        }

        public async Task<ServiceComboDetail> CreateAsync(ServiceComboDetail ServicecomboDetail)
        {
            await _repository.CreateAsync(ServicecomboDetail);
            return ServicecomboDetail;
        }

        public async Task<ServiceComboDetail?> UpdateAsync(int id, ServiceComboDetail ServicecomboDetail)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.ServicecomboId = ServicecomboDetail.ServicecomboId;
            existing.ServiceId = ServicecomboDetail.ServiceId;
            existing.Quantity = ServicecomboDetail.Quantity;

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

        public async Task<bool> DeleteByServiceComboIdAsync(int ServicecomboId)
        {
            var existing = await _repository.GetByServiceComboIdAsync(ServicecomboId);
            if (!existing.Any()) return false;

            await _repository.DeleteByServiceComboIdAsync(ServicecomboId);
            return true;
        }
    }
}
