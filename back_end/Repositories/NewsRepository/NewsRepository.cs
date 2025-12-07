using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class NewsRepository : INewsRepository
    {
        private readonly ESCEContext _context;

        public NewsRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<News>> GetAllAsync()
        {
            return await _context.News
                .Include(n => n.Account)
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();
        }

        public async Task<News?> GetByIdAsync(int id)
        {
            return await _context.News
                .Include(n => n.Account)
                .FirstOrDefaultAsync(n => n.NewsId == id);
        }

        public async Task<IEnumerable<News>> GetByAccountIdAsync(int accountId)
        {
            return await _context.News
                .Include(n => n.Account)
                .Where(n => n.AccountId == accountId)
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();
        }

        public async Task CreateAsync(News news)
        {
            _context.News.Add(news);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(News news)
        {
            _context.News.Update(news);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var news = await _context.News.FindAsync(id);
            if (news != null)
            {
                _context.News.Remove(news);
                await _context.SaveChangesAsync();
            }
        }
    }
}