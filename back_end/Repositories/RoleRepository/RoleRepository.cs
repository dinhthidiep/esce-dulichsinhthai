
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories.RoleRepository
{
    public class RoleRepository : IRoleRepository
    {
        private readonly ESCEContext _dbContext;

        public RoleRepository(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Role>> GetAllAsync()
        {
            return await _dbContext.Roles.ToListAsync();
        }

        public async Task<Role> GetByIdAsync(int roleId)
        {
            return await _dbContext.Roles
                .FirstOrDefaultAsync(x => x.Id == roleId);
        }

        public async Task AddAsync(Role role)
        {
            Console.WriteLine("Dữ liệu của role: " + role);

            _dbContext.Roles.Add(role);
            await _dbContext.SaveChangesAsync();
        }
    }
}