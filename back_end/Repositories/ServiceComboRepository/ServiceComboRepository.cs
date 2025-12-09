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
            return await _context.ServiceCombos.ToListAsync();
        }
        public async Task<ServiceCombo?> GetByIdAsync(int id)
        {
            return await _context.ServiceCombos.FindAsync(id);
        }

        public async Task<ServiceCombo?> GetByNameAsync(string name)
        {
            return _context.ServiceCombos.FirstOrDefault(sc => sc.Name == name);

        }
        public async Task CreateAsync(ServiceCombo serviceCombo)
        {
            _context.ServiceCombos.Add(serviceCombo);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(ServiceCombo serviceCombo)
        {
            _context.ServiceCombos.Update(serviceCombo);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAsync(int id)
        {
            var serviceCombo = await _context.ServiceCombos.FindAsync(id);
            if (serviceCombo != null)
            {
                _context.ServiceCombos.Remove(serviceCombo);
                await _context.SaveChangesAsync();
            }
        }


    }
}

