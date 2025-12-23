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
            return await _context.ServicecomboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .ToListAsync();
        }

        public async Task<ServiceComboDetail?> GetByIdAsync(int id)
        {
            return await _context.ServicecomboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .FirstOrDefaultAsync(scd => scd.Id == id);
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceComboIdAsync(int ServicecomboId)
        {
            return await _context.ServicecomboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .Where(scd => scd.ServicecomboId == ServicecomboId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ServiceComboDetail>> GetByServiceIdAsync(int serviceId)
        {
            return await _context.ServicecomboDetails
                .Include(scd => scd.ServiceCombo)
                .Include(scd => scd.Service)
                .Where(scd => scd.ServiceId == serviceId)
                .ToListAsync();
        }

        public async Task CreateAsync(ServiceComboDetail ServicecomboDetail)
        {
            _context.ServicecomboDetails.Add(ServicecomboDetail);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ServiceComboDetail ServicecomboDetail)
        {
            _context.ServicecomboDetails.Update(ServicecomboDetail);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var ServicecomboDetail = await _context.ServicecomboDetails.FindAsync(id);
            if (ServicecomboDetail != null)
            {
                _context.ServicecomboDetails.Remove(ServicecomboDetail);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteByServiceComboIdAsync(int ServicecomboId)
        {
            var ServicecomboDetails = await _context.ServicecomboDetails
                .Where(scd => scd.ServicecomboId == ServicecomboId)
                .ToListAsync();

            if (ServicecomboDetails.Any())
            {
                _context.ServicecomboDetails.RemoveRange(ServicecomboDetails);
                await _context.SaveChangesAsync();
            }
        }
    }
}
