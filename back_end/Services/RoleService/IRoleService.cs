using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services.RoleService
{
    public interface IRoleService
    {
        Task<List<RoleDto>> GetPublicRole();
        Task<Role> GetRoleById(int roleId);
    }
}