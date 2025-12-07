using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface ISystemLogService
    {
        Task<IEnumerable<SystemLog>> GetAllAsync();
        Task<IEnumerable<SystemLog>> GetByLogLevelAsync(string logLevel);
        Task<IEnumerable<SystemLog>> GetByUserIdAsync(int? userId);
        Task<IEnumerable<SystemLog>> GetByModuleAsync(string? module);
        Task LogAsync(string logLevel, string message, string? stackTrace = null, int? userId = null, string? module = null);
        Task<bool> DeleteAsync(int id);
        Task CleanOldLogsAsync(int daysToKeep = 30);
    }
}