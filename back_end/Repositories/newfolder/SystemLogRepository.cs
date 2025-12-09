using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class SystemLogRepository : ISystemLogRepository
    {
        private readonly ESCEContext _context;

        public SystemLogRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SystemLog>> GetAllAsync()
        {
            return await _context.SystemLogs
                .Include(log => log.User)
                .OrderByDescending(log => log.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SystemLog>> GetByLogLevelAsync(string logLevel)
        {
            return await _context.SystemLogs
                .Include(log => log.User)
                .Where(log => log.LogLevel == logLevel)
                .OrderByDescending(log => log.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SystemLog>> GetByUserIdAsync(int? userId)
        {
            return await _context.SystemLogs
                .Include(log => log.User)
                .Where(log => log.UserId == userId)
                .OrderByDescending(log => log.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SystemLog>> GetByModuleAsync(string? module)
        {
            return await _context.SystemLogs
                .Include(log => log.User)
                .Where(log => log.Module == module)
                .OrderByDescending(log => log.CreatedAt)
                .ToListAsync();
        }

        public async Task CreateAsync(SystemLog log)
        {
            _context.SystemLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var log = await _context.SystemLogs.FindAsync(id);
            if (log != null)
            {
                _context.SystemLogs.Remove(log);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteOldLogsAsync(int daysToKeep)
        {
            var cutoffDate = DateTime.Now.AddDays(-daysToKeep);
            var oldLogs = await _context.SystemLogs
                .Where(log => log.CreatedAt < cutoffDate)
                .ToListAsync();

            _context.SystemLogs.RemoveRange(oldLogs);
            await _context.SaveChangesAsync();
        }
    }
}