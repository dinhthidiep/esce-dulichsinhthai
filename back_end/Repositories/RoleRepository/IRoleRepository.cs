using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories.RoleRepository
{
    public interface IRoleRepository
    {
        Task<List<Role>> GetAllAsync();
        Task<Role> GetByIdAsync(int roleId);
        Task AddAsync(Role role); // Thêm phương thức này
    }
}