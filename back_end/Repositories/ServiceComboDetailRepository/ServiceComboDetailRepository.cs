// File: ESCE_SYSTEM.Repositories/ServiceComboDetailRepository.cs

using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class ServiceComboDetailRepository : IServiceComboDetailRepository
    {
        private readonly ESCEContext _context; // Giả định tên DbContext là ESCEContext

        public ServiceComboDetailRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetAllAsync()
        {
            return await _context.ServiceComboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .ToListAsync();
        }

        public async Task<ServiceComboDetail?> GetByIdAsync(int id)
        {
            // Tải không kèm chi tiết (chỉ để kiểm tra tồn tại nhanh)
            return await _context.ServiceComboDetails.FirstOrDefaultAsync(scd => scd.Id == id);
        }

        // TRIỂN KHAI PHƯƠNG THỨC MỚI (Sửa lỗi CS0535)
        public async Task<ServiceComboDetail?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.ServiceComboDetails
                .Include(scd => scd.ServiceCombo) // Tải chi tiết ServiceCombo
                .Include(scd => scd.Service)      // Tải chi tiết Service
                .FirstOrDefaultAsync(scd => scd.Id == id);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int serviceComboId)
        {
            return await _context.ServiceComboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .Where(scd => scd.ServiceComboId == serviceComboId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId)
        {
            return await _context.ServiceComboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .Where(scd => scd.ServiceId == serviceId)
                .ToListAsync();
        }

        public async Task CreateAsync(ServiceComboDetail serviceComboDetail)
        {
            _context.ServiceComboDetails.Add(serviceComboDetail);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ServiceComboDetail serviceComboDetail)
        {
            _context.ServiceComboDetails.Update(serviceComboDetail);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var serviceComboDetail = await _context.ServiceComboDetails.FindAsync(id);
            if (serviceComboDetail != null)
            {
                _context.ServiceComboDetails.Remove(serviceComboDetail);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteByServiceComboIdAsync(int serviceComboId)
        {
            var serviceComboDetails = await _context.ServiceComboDetails
                .Where(scd => scd.ServiceComboId == serviceComboId)
                .ToListAsync();

            if (serviceComboDetails.Any())
            {
                _context.ServiceComboDetails.RemoveRange(serviceComboDetails);
                await _context.SaveChangesAsync();
            }
        }
    }
}