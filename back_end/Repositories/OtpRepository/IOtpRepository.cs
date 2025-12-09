using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories.OtpRepository
{
    public interface IOtpRepository
    {
        Task<Otp> GetLatestOtpCodeByEmail(string email);
        Task AddAsync(Otp otp);
        Task<Otp> GetByIdAsync(int id);
    }
}
