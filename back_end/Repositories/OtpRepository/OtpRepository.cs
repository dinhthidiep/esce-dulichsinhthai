using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories.OtpRepository
{
    public class OtpRepository : IOtpRepository
    {
        private readonly ESCEContext _dbContext;

        public OtpRepository(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        // Lấy OTP mới nhất theo email
        public async Task<Otp> GetLatestOtpCodeByEmail(string email)
        {
            return await _dbContext.Otps
                .Where(o => o.Email == email)
                .OrderByDescending(o => o.ExpirationTime)
                .FirstOrDefaultAsync();
        }

        // Thêm OTP mới
        public async Task AddAsync(Otp otp)
        {
            otp.CreatedAt = DateTime.UtcNow;
            _dbContext.Otps.Add(otp);
            await _dbContext.SaveChangesAsync();
        }

        // Lấy OTP theo Id
        public async Task<Otp> GetByIdAsync(int id)
        {
            return await _dbContext.Otps
                .Include(o => o.User) // Nếu muốn lấy thêm thông tin User
                .FirstOrDefaultAsync(o => o.Id == id);
        }
    }
}
