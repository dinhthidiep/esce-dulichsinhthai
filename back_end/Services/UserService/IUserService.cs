using System.Collections.Generic;
using System.Threading.Tasks;
using ESCE_SYSTEM.DTOs.Certificates;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Models;
using Google.Apis.Auth;

namespace ESCE_SYSTEM.Services.UserService
{
    public interface IUserService
    {
        // =======================================================================================
        // PHƯƠNG THỨC NỘI BỘ/NGHIỆP VỤ (Trả về Entity Model: Account)
        // =======================================================================================

        Task<Account> GetUserByUsernameAsync(string userEmail);
        Task<Account> GetAccountByIdAsync(int accountId); // Khôi phục Entity Model
        Task BanAccount(string accountId, string reason);
        Task UnbanAccount(string accountId);
        Task<Account> UpdateProfileAsync(int userId, UpdateProfileDto updateDto); // Cần Entity để Update

        // =======================================================================================
        // PHƯƠNG THỨC HIỂN THỊ (Trả về DTO)
        // =======================================================================================

        // Phương thức mới trả về DTO cho Controller GetUserById
        Task<UserResponseDto> GetUserDtoByIdAsync(int accountId);
        Task<List<UserResponseDto>> GetAllUsersAsync();

        // =======================================================================================
        // PHƯƠNG THỨC KHÁC (Giữ nguyên)
        // =======================================================================================

        Task CreateUserAsync(RegisterUserDto account, bool verifyOtp, bool isGoogleAccount, int roleId = 4);
        bool VerifyPassword(string enteredPassword, string storedHash);
        Task RequestOtp(RequestOtpDto requestOtpDto);
        Task<bool> VerifyOtp(VerifyOtpDto verifyOtpDto);
        Task ChangePassword(ChangePasswordDto changePassword);
        Task RequestOtpForgetPassword(RequestOtpDto requestOtpDto);
        Task ResetPassword(ResetPasswordDto resetPassword);
        Task<GoogleJsonWebSignature.Payload> VerifyGoogleTokenAsync(string idToken);

        Task RequestUpgradeToAgencyAsync(int userId, RequestAgencyUpgradeDto requestDto);
        Task RequestUpgradeToHostAsync(int userId, RequestHostUpgradeDto requestDto);

        // Certificate Management
        Task<List<AgencyCertificateResponseDto>> GetAllAgencyCertificatesAsync(string status = null);
        Task<List<HostCertificateResponseDto>> GetAllHostCertificatesAsync(string status = null);
        Task ApproveUpgradeCertificateAsync(ApproveCertificateDto dto);
        Task RejectUpgradeCertificateAsync(RejectCertificateDto dto);
        Task ReviewUpgradeCertificateAsync(ReviewCertificateDto dto);

        // Helper Get Admin/Role IDs
        Task<List<int>> GetAllAdminAndHostId();
        Task<List<int>> GetAllAdminAndAgencyId();
        Task<List<int>> GetAllAdminAndCustomerId();
        Task SendUserEmailAsync(Account user, string templateName, string subject, string comment = null);
        Task SendWebNotificationAsync(Account user, string status, string objectType, string objectId, string content);
        Task UpdateTotalSpentAndLevelAsync(int userId, decimal amountSpent);

    }
}


