using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;


namespace ESCE_SYSTEM.Repositories
{
    public class ServiceComboRepository : IServiceComboRepository
    {
        private readonly ESCEContext _context;
        public ServiceComboRepository(ESCEContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<ServiceCombo>> GetAllAsync()
        {
            return await _context.Servicecombos.ToListAsync();
        }
        public async Task<ServiceCombo?> GetByIdAsync(int id)
        {
            return await _context.Servicecombos.FindAsync(id);
        }

        public async Task<ServiceCombo?> GetByNameAsync(string name)
        {
            return _context.Servicecombos.FirstOrDefault(sc => sc.Name == name);

        }

        public async Task<IEnumerable<ServiceCombo>> GetByHostIdAsync(int hostId)
        {
            return await _context.Servicecombos
                .Where(sc => sc.HostId == hostId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ServiceCombo>> GetApprovedByHostIdAsync(int hostId)
        {
            return await _context.Servicecombos
                .Where(sc => sc.HostId == hostId && sc.Status == "approved")
                .ToListAsync();
        }

        public async Task CreateAsync(ServiceCombo ServiceCombo)
        {
            _context.Servicecombos.Add(ServiceCombo);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(ServiceCombo ServiceCombo)
        {
            _context.Servicecombos.Update(ServiceCombo);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAsync(int id)
        {
            var ServiceCombo = await _context.Servicecombos.FindAsync(id);
            if (ServiceCombo != null)
            {
                _context.Servicecombos.Remove(ServiceCombo);
                await _context.SaveChangesAsync();
            }
        }


    }
}

