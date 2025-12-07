
using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Models;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services.RoleService
{
    public class RoleService : IRoleService
    {
        private readonly ESCEContext _dbContext;

        public RoleService(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<RoleDto>> GetPublicRole()
        {
            var roles = await _dbContext.Roles
                .Where(x => x.Name == "Tourist" || x.Name == "Host")
                .ToListAsync();
            return roles.Adapt<List<RoleDto>>();
        }

        public async Task<Role> GetRoleById(int roleId)
        {
            return await _dbContext.Roles
                .FirstOrDefaultAsync(x => x.Id == roleId);
        }
    }
}