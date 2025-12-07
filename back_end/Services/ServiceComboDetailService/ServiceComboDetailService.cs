// File: ESCE_SYSTEM.Services/ServiceComboDetailService.cs

using ESCE_SYSTEM.DTOs.ServiceComboDetail;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

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
            // Dùng GetByIdWithDetailsAsync để trả về kết quả có chi tiết đầy đủ
            return await _repository.GetByIdWithDetailsAsync(id);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId)
        {
            return await _repository.GetByServiceComboIdAsync(serviceComboId);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId)
        {
            return await _repository.GetByServiceIdAsync(serviceId);
        }

        // TRIỂN KHAI CREATE (Sửa lỗi CS0535)
        public async Task<ServiceComboDetail> CreateAsync(CreateServiceComboDetailDto detailDto)
        {
            var detail = new ServiceComboDetail
            {
                ServiceComboId = detailDto.ServiceComboId,
                ServiceId = detailDto.ServiceId,
                Quantity = detailDto.Quantity
            };

            await _repository.CreateAsync(detail);

            // Tải lại đối tượng đã tạo với chi tiết đầy đủ
            var createdDetailWithNavProps = await _repository.GetByIdWithDetailsAsync(detail.Id);

            return createdDetailWithNavProps ?? detail;
        }

        // TRIỂN KHAI UPDATE (Sửa lỗi CS0535)
        public async Task<ServiceComboDetail?> UpdateAsync(int id, UpdateServiceComboDetailDto detailDto)
        {
            // Dùng GetByIdAsync cơ bản (không kèm chi tiết) để kiểm tra và cập nhật
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            if (detailDto.ServiceComboId.HasValue)
            {
                existing.ServiceComboId = detailDto.ServiceComboId.Value;
            }

            if (detailDto.ServiceId.HasValue)
            {
                existing.ServiceId = detailDto.ServiceId.Value;
            }

            if (detailDto.Quantity.HasValue)
            {
                existing.Quantity = detailDto.Quantity.Value;
            }

            await _repository.UpdateAsync(existing);

            // Tải lại đối tượng đã cập nhật với chi tiết đầy đủ để trả về
            var updatedDetailWithNavProps = await _repository.GetByIdWithDetailsAsync(existing.Id);

            return updatedDetailWithNavProps;
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