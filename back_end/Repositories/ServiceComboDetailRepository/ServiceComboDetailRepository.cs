using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class ServiceComboDetailRepository : IServiceComboDetailRepository
    {
        private readonly ESCEContext _context;

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
            return await _context.ServiceComboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
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