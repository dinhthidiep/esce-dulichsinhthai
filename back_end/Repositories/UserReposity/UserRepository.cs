
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories.UserRepository
{
    public class UserRepository : IUserRepository
    {
        private readonly ESCEContext _dbContext;

        public UserRepository(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Account> GetByEmailAsync(string email)
        {
            return await _dbContext.Accounts
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower());
        }

        public async Task AddAsync(Account account)
        {
            _dbContext.Accounts.Add(account);
            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateAsync(Account account)
        {
            _dbContext.Accounts.Update(account);
            await _dbContext.SaveChangesAsync();
        }
    }
}