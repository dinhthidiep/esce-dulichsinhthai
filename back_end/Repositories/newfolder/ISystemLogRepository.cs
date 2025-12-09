using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface ISystemLogRepository
    {
        Task<IEnumerable<SystemLog>> GetAllAsync();
        Task<IEnumerable<SystemLog>> GetByLogLevelAsync(string logLevel);
        Task<IEnumerable<SystemLog>> GetByUserIdAsync(int? userId);
        Task<IEnumerable<SystemLog>> GetByModuleAsync(string? module);
        Task CreateAsync(SystemLog log);
        Task DeleteAsync(int id);
        Task DeleteOldLogsAsync(int daysToKeep);
    }
}