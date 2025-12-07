using ESCE_SYSTEM.DTOs.ServiceCombo;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq; // Bắt buộc cho Select()

namespace ESCE_SYSTEM.Services
{
    // LỚP DUY NHẤT: KHÔNG CÓ BẤT KỲ ĐỊNH NGHĨA LỚP ServiceComboService NÀO KHÁC TRONG DỰ ÁN
    public class ServiceComboService : IServiceComboService
    {
        // FIX: Đảm bảo tên trường private không bị trùng lặp trong dự án
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

        private ServiceComboResponseDto MapToResponseDto(ServiceCombo serviceCombo)
        {
            var detailDtos = serviceCombo.ServiceComboDetails?
                .Select(d => new ServiceComboDetailDto
                {
                    Id = d.Id,
                    ServiceId = d.ServiceId,
                    Quantity = d.Quantity,
                    ServiceName = d.Service?.Name ?? "N/A",
                    ServicePrice = d.Service?.Price ?? 0
                }).ToList() ?? new List<ServiceComboDetailDto>();

            var dto = new ServiceComboResponseDto
            {
                Id = serviceCombo.Id,
                Name = serviceCombo.Name,
                Address = serviceCombo.Address,
                Description = serviceCombo.Description,
                Price = serviceCombo.Price,
                AvailableSlots = serviceCombo.AvailableSlots,
                Image = serviceCombo.Image,
                Status = serviceCombo.Status,
                CancellationPolicy = serviceCombo.CancellationPolicy,
                HostId = serviceCombo.HostId,
                CreatedAt = serviceCombo.CreatedAt,
                UpdatedAt = serviceCombo.UpdatedAt,
                ServiceComboDetails = detailDtos,
                HostName = serviceCombo.Host?.Name
            };

            return dto;
        }

        public async Task<ServiceComboResponseDto> CreateAsync(CreateServiceComboDto comboDto)
        {
            var serviceCombo = new ServiceCombo
            {
                Name = comboDto.Name,
                Address = comboDto.Address,
                Description = comboDto.Description,
                Price = comboDto.Price,
                AvailableSlots = comboDto.AvailableSlots,
                Image = comboDto.Image,
                Status = comboDto.Status,
                CancellationPolicy = comboDto.CancellationPolicy,
                HostId = comboDto.HostId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _repository.CreateAsync(serviceCombo);
            return MapToResponseDto(serviceCombo);
        }

        public async Task<ServiceComboResponseDto?> UpdateAsync(int id, UpdateServiceComboDto comboDto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = comboDto.Name ?? existing.Name;
            existing.Address = comboDto.Address ?? existing.Address;
            existing.Description = comboDto.Description ?? existing.Description;

            if (comboDto.Price.HasValue) existing.Price = comboDto.Price.Value;
            if (comboDto.AvailableSlots.HasValue) existing.AvailableSlots = comboDto.AvailableSlots.Value;
            if (comboDto.HostId.HasValue) existing.HostId = comboDto.HostId.Value;

            existing.Image = comboDto.Image ?? existing.Image;
            existing.Status = comboDto.Status ?? existing.Status;
            existing.CancellationPolicy = comboDto.CancellationPolicy ?? existing.CancellationPolicy;

            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return MapToResponseDto(existing);
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