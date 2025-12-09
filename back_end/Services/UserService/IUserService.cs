using ESCE_SYSTEM.DTOs.Certificates;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Models;
using Google.Apis.Auth;

namespace ESCE_SYSTEM.Services.UserService
{
    public interface IUserService
    {
        // Authentication & Basic User Management
        Task<Account> GetUserByUsernameAsync(string userEmail);
        Task CreateUserAsync(RegisterUserDto account, bool verifyOtp, bool isGoogleAccount, int roleId = 4);
        bool VerifyPassword(string enteredPassword, string storedHash);
        Task RequestOtp(RequestOtpDto requestOtpDto);
        Task<bool> VerifyOtp(VerifyOtpDto verifyOtpDto);
        Task ChangePassword(ChangePasswordDto changePassword);
        Task RequestOtpForgetPassword(RequestOtpDto requestOtpDto);
        Task ResetPassword(ResetPasswordDto resetPassword);
        Task<GoogleJsonWebSignature.Payload> VerifyGoogleTokenAsync(string idToken);

        // Role Upgrade Requests
        Task RequestUpgradeToAgencyAsync(int userId, RequestAgencyUpgradeDto requestDto);
        Task RequestUpgradeToHostAsync(int userId, RequestHostUpgradeDto requestDto);

        // Certificate Management
        Task<List<AgencyCertificateResponseDto>> GetAllAgencyCertificatesAsync(string status = null);
        Task<List<HostCertificateResponseDto>> GetAllHostCertificatesAsync(string status = null);
        Task ApproveUpgradeCertificateAsync(ApproveCertificateDto dto);
        Task RejectUpgradeCertificateAsync(RejectCertificateDto dto);
        Task ReviewUpgradeCertificateAsync(ReviewCertificateDto dto);

        // User Management
        Task<List<Account>> GetAllUsersAsync();
        Task<Account> UpdateProfileAsync(int userId, UpdateProfileDto updateDto); // Đã sửa lỗi CS0246
        Task BanAccount(string accountId, string reason);
        Task UnbanAccount(string accountId);
        Task<Account> GetAccountById(int accountId);
        Task<Account> GetAccountByIdAsync(int accountId);
        // **BỔ SUNG: Phương thức lấy ID của tất cả Admin và Host**
        Task<List<int>> GetAllAdminAndHostId();
        Task<List<int>> GetAllAdminAndAgencyId();
        Task<List<int>> GetAllAdminAndCustomerId();

    }
}