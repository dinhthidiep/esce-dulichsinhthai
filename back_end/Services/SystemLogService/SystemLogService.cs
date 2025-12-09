using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;

namespace ESCE_SYSTEM.Services
{
    public class SystemLogService : ISystemLogService
    {
        private readonly ISystemLogRepository _repository;

        public SystemLogService(ISystemLogRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<SystemLog>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<IEnumerable<SystemLog>> GetByLogLevelAsync(string logLevel)
        {
            return await _repository.GetByLogLevelAsync(logLevel);
        }

        public async Task<IEnumerable<SystemLog>> GetByUserIdAsync(int? userId)
        {
            return await _repository.GetByUserIdAsync(userId);
        }

        public async Task<IEnumerable<SystemLog>> GetByModuleAsync(string? module)
        {
            return await _repository.GetByModuleAsync(module);
        }

        public async Task LogAsync(string logLevel, string message, string? stackTrace = null, int? userId = null, string? module = null)
        {
            var log = new SystemLog
            {
                LogLevel = logLevel,
                Message = message,
                StackTrace = stackTrace,
                UserId = userId,
                Module = module,
                CreatedAt = DateTime.Now
            };

            await _repository.CreateAsync(log);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                await _repository.DeleteAsync(id);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task CleanOldLogsAsync(int daysToKeep = 30)
        {
            await _repository.DeleteOldLogsAsync(daysToKeep);
        }
    }
}