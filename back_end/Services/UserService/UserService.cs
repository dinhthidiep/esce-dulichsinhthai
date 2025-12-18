
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Helper;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Options;
using ESCE_SYSTEM.Services.UserContextService;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ESCE_SYSTEM.Repositories.OtpRepository;
using ESCE_SYSTEM.DTOs.Certificates;
using Microsoft.AspNetCore.Hosting;
using ESCE_SYSTEM.DTOs.Notifications;
using Microsoft.AspNetCore.SignalR;
using ESCE_SYSTEM.SignalR;
using System.IO;
using System.Text.Json;
using System.Globalization;
using System.Collections.Generic;
using System.Threading.Tasks;


namespace ESCE_SYSTEM.Services.UserService
{
    public class UserService : IUserService
    {
        private readonly ESCEContext _dbContext;
        private readonly EmailHelper _emailHelper;
        private readonly JwtSetting _jwtSetting;
        private readonly IUserContextService _userContextService;
        private readonly IOtpRepository _otpRepository;
        private readonly IWebHostEnvironment _env;
        private readonly EmailConfig _emailConfig;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;

        public UserService(
          ESCEContext dbContext,
          EmailHelper emailHelper,
          IUserContextService userContextService,
          IOptions<JwtSetting> jwtSettings,
          IOtpRepository otpRepository,
          IWebHostEnvironment env,
          IOptions<EmailConfig> emailConfigOptions,
          IHubContext<NotificationHub> hubContext)
        {
            _dbContext = dbContext;
            _emailHelper = emailHelper;
            _jwtSetting = jwtSettings.Value;
            _userContextService = userContextService;
            _otpRepository = otpRepository;
            _env = env;
            _emailConfig = emailConfigOptions.Value;
            _hubNotificationContext = hubContext;
        }

        #region User Management
        public async Task<Account> GetUserByUsernameAsync(string userEmail)
        {
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                throw new ArgumentException("Email cannot be null or empty");
            }

            return await _dbContext.Accounts
              .Include(account => account.Role) //  THÊM INCLUDE ROLE
                      .FirstOrDefaultAsync(account => account.Email.ToLower() == userEmail.ToLower());
        }

        public async Task CreateUserAsync(RegisterUserDto user, bool verifyOtp, bool isGoogleAccount, int roleId = 4)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user), "User data cannot be null");
            }

            if (string.IsNullOrWhiteSpace(user.UserEmail))
            {
                throw new ArgumentException("UserEmail cannot be null or empty");
            }

            if (string.IsNullOrWhiteSpace(user.FullName))
            {
                throw new ArgumentException("FullName cannot be null or empty");
            }

            if (!isGoogleAccount && string.IsNullOrWhiteSpace(user.Password))
            {
                throw new ArgumentException("Password cannot be null or empty for non-Google accounts");
            }

            // OTP verification
            if (verifyOtp)
            {
                var otp = await _dbContext.Otps
                  .Where(otpRecord => otpRecord.Email == user.UserEmail)
                  .OrderByDescending(otpRecord => otpRecord.CreatedAt)
                  .FirstOrDefaultAsync();

                if (otp == null || otp.IsVerified != true)
                {
                    throw new InvalidOperationException("OTP has not been verified");
                }

                if (otp.ExpirationTime < DateTime.UtcNow)
                {
                    throw new InvalidOperationException("OTP has expired");
                }
            }

            // Check duplicate email
            if (await _dbContext.Accounts.AnyAsync(account => account.Email.ToLower() == user.UserEmail.ToLower()))
            {
                throw new InvalidOperationException("Email already exists in the system");
            }

            // Create password hash
            string passwordHash = isGoogleAccount
        ? BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString())
        : HashPassword(user.Password);

            // Create new account

            var account = new Account
            {
                Email = user.UserEmail.ToLower().Trim(),
                PasswordHash = passwordHash,
                Name = user.FullName.Trim(),
                Phone = string.IsNullOrEmpty(user.Phone) ? null : user.Phone.Trim(),
                RoleId = roleId,
                IsActive = isGoogleAccount || !verifyOtp,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Level = 0,
                TotalSpent = 0.00M

            };

            try
            {
                _dbContext.Accounts.Add(account);
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException exception)
            {
                throw new Exception($"Error creating account: {exception.InnerException?.Message ?? exception.Message}", exception);
            }
        }

        public async Task ChangePassword(ChangePasswordDto changePassword)
        {
            if (changePassword == null)
            {
                throw new ArgumentNullException(nameof(changePassword));
            }

            var email = _userContextService.UserEmail;
            if (string.IsNullOrEmpty(email))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            var user = await GetUserByUsernameAsync(email);
            if (user == null)
            {
                throw new InvalidOperationException("User does not exist");
            }

            if (!VerifyPassword(changePassword.OldPassword, user.PasswordHash))
            {
                throw new InvalidOperationException("Old password is incorrect");
            }

            user.PasswordHash = HashPassword(changePassword.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
        }

        public async Task ResetPassword(ResetPasswordDto resetPassword)
        {
            if (resetPassword == null)
            {
                throw new ArgumentNullException(nameof(resetPassword));
            }

            var latestOtp = await _dbContext.Otps
              .Where(otp => otp.User.Email.ToLower() == resetPassword.Email.ToLower())
              .OrderByDescending(otp => otp.CreatedAt)
              .FirstOrDefaultAsync();

            if (latestOtp == null)
            {
                throw new InvalidOperationException("No OTP found for this email");
            }
            if (latestOtp.Code != resetPassword.Otp)
            {
                throw new InvalidOperationException("OTP is incorrect");
            }
            if (latestOtp.ExpirationTime < DateTime.UtcNow)
            {
                throw new InvalidOperationException("OTP has expired");
            }

            var user = await GetUserByUsernameAsync(resetPassword.Email);
            if (user == null)
            {
                throw new InvalidOperationException("User does not exist");
            }

            // Check if new password is same as old password
            if (VerifyPassword(resetPassword.NewPassword, user.PasswordHash))
            {
                throw new InvalidOperationException("Mật khẩu mới không được trùng với mật khẩu cũ");
            }

            // Ensure entity is tracked by DbContext
            if (_dbContext.Entry(user).State == EntityState.Detached)
            {
                _dbContext.Accounts.Attach(user);
            }

            // Update password
            user.PasswordHash = HashPassword(resetPassword.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            // Mark entity as modified to ensure changes are saved
            _dbContext.Entry(user).State = EntityState.Modified;

            // Save changes to database
            var rowsAffected = await _dbContext.SaveChangesAsync();

            if (rowsAffected == 0)
            {
                throw new InvalidOperationException("Failed to save password changes to database");
            }
        }

        public async Task<List<UserResponseDto>> GetAllUsersAsync()
        {
            // Đảm bảo Include(account => account.Role) để truy cập Role.Name
            return await _dbContext.Accounts
        .Include(account => account.Role)
        .OrderByDescending(account => account.CreatedAt)
        .Select(account => new UserResponseDto // Ánh xạ sang DTO
        {
            Id = account.Id,
            Name = account.Name,
            Email = account.Email,
            Avatar = account.Avatar,
            Phone = account.Phone,
            Dob = account.Dob,
            Gender = account.Gender,
            Address = account.Address,
            RoleId = account.RoleId,
            // Lấy Tên Role từ đối tượng Role đã được Include
            RoleName = account.Role.Name,
            IsActive = account.IsActive,
            IS_BANNED = account.IS_BANNED,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        })
        .ToListAsync();
        }

        public async Task<Account> UpdateProfileAsync(int userId, UpdateProfileDto updateDto)
        {
            if (updateDto == null)
            {
                throw new ArgumentNullException(nameof(updateDto));
            }

            var user = await _dbContext.Accounts
              .FirstOrDefaultAsync(account => account.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Validate and update fields
            if (!string.IsNullOrEmpty(updateDto.Name))
            {
                user.Name = updateDto.Name.Trim();
            }

            if (!string.IsNullOrEmpty(updateDto.Phone))
            {
                user.Phone = updateDto.Phone.Trim();
            }

            if (!string.IsNullOrEmpty(updateDto.Avatar))
            {
                user.Avatar = updateDto.Avatar;
            }

            if (!string.IsNullOrEmpty(updateDto.Gender))
            {
                user.Gender = updateDto.Gender.Trim();
            }

            if (!string.IsNullOrEmpty(updateDto.Address))
            {
                user.Address = updateDto.Address.Trim();
            }

            // Handle DateTime for DOB 
            if (!string.IsNullOrEmpty(updateDto.DOB))
            {
                DateTime dateOfBirth;
                bool parseSuccess = false;

                // Thử parse với định dạng ISO (yyyy-MM-dd) trước - phổ biến nhất
                if (DateTime.TryParseExact(updateDto.DOB, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dateOfBirth))
                {
                    parseSuccess = true;
                }
                // Thử các định dạng khác
                else if (DateTime.TryParseExact(updateDto.DOB, new[]
        {
      "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "MM-dd-yyyy",
      "yyyy/MM/dd", "dd MMM yyyy", "dd MMMM yyyy"
    }, CultureInfo.InvariantCulture, DateTimeStyles.None, out dateOfBirth))
                {
                    parseSuccess = true;
                }
                // Thử parse với culture hiện tại
                else if (DateTime.TryParse(updateDto.DOB, CultureInfo.CurrentCulture, DateTimeStyles.None, out dateOfBirth))
                {
                    parseSuccess = true;
                }

                if (parseSuccess)
                {
                    // Kiểm tra ngày hợp lệ (không trong tương lai)
                    if (dateOfBirth > DateTime.Now)
                    {
                        throw new ArgumentException("Date of Birth cannot be in the future.");
                    }

                    user.Dob = dateOfBirth;
                }
                else
                {
                    throw new ArgumentException(
                      $"Invalid date format for Date of Birth: '{updateDto.DOB}'. " +
                      "Please use one of these formats: yyyy-MM-dd, dd/MM/yyyy, MM/dd/yyyy, dd-MM-yyyy"
                    );
                }
            }
            else
            {
                // Nếu DOB là null hoặc empty, set thành null
                user.Dob = null;
            }

            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _dbContext.SaveChangesAsync();
                return user;
            }
            catch (DbUpdateException exception)
            {
                throw new Exception($"Error updating profile: {exception.InnerException?.Message ?? exception.Message}", exception);
            }
        }

        public async Task BanAccount(string accountId, string reason)
        {
            if (!int.TryParse(accountId, out int id))
            {
                throw new ArgumentException($"Invalid account ID: {accountId}");
            }

            var account = await GetAccountByIdAsync(id);

            if (account.IS_BANNED)
            {
                throw new InvalidOperationException("Account is already banned");
            }

            account.IsActive = false;
            account.IS_BANNED = true;
            account.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            await SendUserEmailAsync(account, "BanAccount.html",
              "THÔNG BÁO: Tài khoản của bạn đã bị khóa", reason);

            await SendWebNotificationAsync(account, "Ban", "Account",
              accountId, $"Tài khoản của bạn đã bị khóa. Lý do: {reason}");
        }

        public async Task UnbanAccount(string accountId)
        {
            if (!int.TryParse(accountId, out int id))
            {
                throw new ArgumentException($"ID tài khoản không hợp lệ: {accountId}");
            }

            var account = await GetAccountByIdAsync(id);

            if (!account.IS_BANNED)
            {
                throw new InvalidOperationException("Tài khoản không bị khóa");
            }

            account.IsActive = true;
            account.IS_BANNED = false;
            account.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            await SendUserEmailAsync(account, "UnbanAccount.html",
              "THÔNG BÁO: Tài khoản của bạn đã được khôi phục");

            await SendWebNotificationAsync(account, "Unban", "Account",
              accountId, "Tài khoản của bạn đã được mở khóa");
        }

        // KHÔI PHỤC: Phương thức GetAccountByIdAsync trả về Entity Model
        // (Đã fix lỗi CS0029, CS1503 trong Ban/UnbanAccount)
        public async Task<Account> GetAccountByIdAsync(int accountId)
        {
            var account = await _dbContext.Accounts
              .Include(account => account.Role)
              .FirstOrDefaultAsync(account => account.Id == accountId);

            if (account == null)
            {
                throw new InvalidOperationException($"Account not found with ID: {accountId}");
            }

            return account;
        }

        // TRIỂN KHAI: Phương thức DTO mới cho Controller
        // (Đã fix lỗi CS0535, CS0103 trong Controller GetUserById)
        public async Task<UserResponseDto> GetUserDtoByIdAsync(int accountId)
        {
            // Sử dụng Projection (Select) để trả về DTO với đầy đủ thông tin
            var userDto = await _dbContext.Accounts
        .Where(account => account.Id == accountId)
        .Include(account => account.Role)
        .Select(account => new UserResponseDto
        {
            Id = account.Id,
            Name = account.Name,
            Email = account.Email,
            Avatar = account.Avatar,
            Phone = account.Phone,
            Dob = account.Dob,
            Gender = account.Gender,
            Address = account.Address,
            RoleId = account.RoleId,
            RoleName = account.Role.Name,
            IsActive = account.IsActive,
            IS_BANNED = account.IS_BANNED,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        })
        .FirstOrDefaultAsync();

            if (userDto == null)
            {
                throw new InvalidOperationException($"Account not found with ID: {accountId}");
            }

            return userDto;
        }


        #endregion

        #region OTP Management
        public async Task RequestOtp(RequestOtpDto requestOtpDto)
        {
            if (requestOtpDto == null || string.IsNullOrWhiteSpace(requestOtpDto.Email))
            {
                throw new ArgumentException("Email cannot be null or empty");
            }

            var otp = new Otp
            {
                Email = requestOtpDto.Email.Trim(),
                Code = OTPGenerator.GenerateOTP(),
                ExpirationTime = DateTime.UtcNow.AddMinutes(5),
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            await _otpRepository.AddAsync(otp);

            string subject = "OTP Verification Code";
            string content = $"Your OTP verification code for account registration is: {otp.Code}";
            await _emailHelper.SendEmailAsync(subject, content, new List<string> { otp.Email });
        }

        public async Task RequestOtpForgetPassword(RequestOtpDto requestOtpDto)
        {
            if (requestOtpDto == null || string.IsNullOrWhiteSpace(requestOtpDto.Email))
            {
                throw new ArgumentException("Email cannot be null or empty");
            }

            var user = await GetUserByUsernameAsync(requestOtpDto.Email);
            if (user == null)
            {
                throw new InvalidOperationException("Email does not exist in the system");
            }

            var otpCode = new Otp
            {
                UserId = user.Id,
                Email = requestOtpDto.Email.Trim().ToLower(),
                Code = OTPGenerator.GenerateOTP(),
                ExpirationTime = DateTime.UtcNow.AddMinutes(5),
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Otps.Add(otpCode);
            await _dbContext.SaveChangesAsync();

            try
            {
                string subject = "Password Reset OTP";
                string content = $"Your password reset OTP code is: {otpCode.Code}";
                await _emailHelper.SendEmailAsync(subject, content, new List<string> { requestOtpDto.Email });
                Console.WriteLine($"OTP code {otpCode.Code} has been sent to {requestOtpDto.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email to {requestOtpDto.Email}: {ex.Message}");
                throw new InvalidOperationException($"Failed to send OTP email. Please try again later. Error: {ex.Message}", ex);
            }
        }

        public async Task<bool> VerifyOtp(VerifyOtpDto verifyOtpDto)
        {
            if (verifyOtpDto == null)
            {
                throw new ArgumentNullException(nameof(verifyOtpDto));
            }

            var latestOtp = await _dbContext.Otps
              .Where(otp => otp.Email != null && otp.Email.ToLower() == verifyOtpDto.Email.ToLower())
              .OrderByDescending(otp => otp.CreatedAt)
              .FirstOrDefaultAsync();

            // Fallback: nếu OTP quên mật khẩu trước đây không lưu Email, tìm theo UserId
            if (latestOtp == null)
            {
                var user = await GetUserByUsernameAsync(verifyOtpDto.Email);
                if (user != null)
                {
                    latestOtp = await _dbContext.Otps
                      .Where(otp => otp.UserId == user.Id)
                      .OrderByDescending(otp => otp.CreatedAt)
                      .FirstOrDefaultAsync();
                }
            }

            if (latestOtp == null)
            {
                throw new InvalidOperationException("No OTP found for this email");
            }
            if (latestOtp.Code != verifyOtpDto.Otp)
            {
                throw new InvalidOperationException("OTP is incorrect");
            }
            if (latestOtp.ExpirationTime < DateTime.UtcNow)
            {
                throw new InvalidOperationException("OTP has expired");
            }

            latestOtp.IsVerified = true;
            await _dbContext.SaveChangesAsync();

            return true;
        }
        #endregion

        #region Certificate Management
        public async Task<List<AgencyCertificateResponseDto>> GetAllAgencyCertificatesAsync(string status = null)
        {
            var query = _dbContext.AgencieCertificates
              .Include(agencyCertificate => agencyCertificate.Account)
              .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                query = query.Where(agencyCertificate => agencyCertificate.Status == status);
            }

            var certificates = await query
              .OrderByDescending(agencyCertificate => agencyCertificate.CreatedAt)
              .ToListAsync();

            return certificates.Select(agencyCertificate => new AgencyCertificateResponseDto
            {
                AgencyId = agencyCertificate.AgencyId,
                AccountId = agencyCertificate.AccountId,
                CompanyName = agencyCertificate.Companyname,
                LicenseFile = agencyCertificate.LicenseFile,
                Phone = agencyCertificate.Phone,
                Email = agencyCertificate.Email,
                Website = agencyCertificate.Website,
                Status = agencyCertificate.Status,
                RejectComment = agencyCertificate.RejectComment,

                // --- FIX: Xử lý ReviewComments an toàn ---
                ReviewComments = ParseReviewComments<ESCE_SYSTEM.DTOs.Users.AgencyCertificateReViewComment>(agencyCertificate.ReviewComments),

                CreatedAt = agencyCertificate.CreatedAt,
                UpdatedAt = agencyCertificate.UpdatedAt,
                UserName = agencyCertificate.Account?.Name ?? string.Empty,
                UserEmail = agencyCertificate.Account?.Email ?? string.Empty
            }).ToList();
        }

        public async Task<List<HostCertificateResponseDto>> GetAllHostCertificatesAsync(string status = null)
        {
            var query = _dbContext.HostCertificates
              .Include(hostCertificate => hostCertificate.Host)
              .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                query = query.Where(hostCertificate => hostCertificate.Status == status);
            }

            var certificates = await query
              .OrderByDescending(hostCertificate => hostCertificate.CreatedAt)
              .ToListAsync();

            return certificates.Select(hostCertificate => new HostCertificateResponseDto
            {
                CertificateId = hostCertificate.CertificateId,
                HostId = hostCertificate.HostId,
                BusinessLicenseFile = hostCertificate.BusinessLicenseFile,
                BusinessName = hostCertificate.BusinessName,
                Phone = hostCertificate.Phone,
                Email = hostCertificate.Email,
                Status = hostCertificate.Status,
                RejectComment = hostCertificate.RejectComment,

                // --- FIX: Xử lý ReviewComments an toàn ---
                ReviewComments = ParseReviewComments<HostCertificateReViewComment>(hostCertificate.ReviewComments),

                CreatedAt = hostCertificate.CreatedAt,
                UpdatedAt = hostCertificate.UpdatedAt,
                HostName = hostCertificate.Host?.Name ?? string.Empty,
                HostEmail = hostCertificate.Host?.Email ?? string.Empty
            }).ToList();
        }

        public async Task RequestUpgradeToAgencyAsync(int userId, RequestAgencyUpgradeDto requestDto)
        {
            if (requestDto == null)
            {
                throw new ArgumentNullException(nameof(requestDto));
            }

            // Validate required fields
            if (string.IsNullOrWhiteSpace(requestDto.CompanyName))
            {
                throw new ArgumentException("Tên công ty không được để trống");
            }
            if (string.IsNullOrWhiteSpace(requestDto.Phone))
            {
                throw new ArgumentException("Số điện thoại không được để trống");
            }
            if (string.IsNullOrWhiteSpace(requestDto.Email))
            {
                throw new ArgumentException("Email không được để trống");
            }

            var user = await _dbContext.Accounts.FirstOrDefaultAsync(account => account.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User does not exist");
            }

            // Kiểm tra user đã là Agency chưa
            if (user.RoleId == 3) // Assuming RoleId 3 is Agency
            {
                throw new InvalidOperationException("Bạn đã là Agency rồi");
            }

            // Kiểm tra đã có certificate pending chưa
            var existingCertificate = await _dbContext.AgencieCertificates
                .FirstOrDefaultAsync(c => c.AccountId == userId && (c.Status == "Pending" || c.Status == "Review"));
            
            if (existingCertificate != null)
            {
                throw new InvalidOperationException("Bạn đã có yêu cầu nâng cấp đang chờ xử lý. Vui lòng đợi Admin xét duyệt.");
            }

            // Xử lý file license - lưu base64 thành file thực
            var licenseFilePath = await SaveBase64FileAsync(requestDto.LicenseFile, "certificates/agency", $"agency_{userId}");

            var agencyCertificate = new Models.AgencieCertificate
            {
                AccountId = userId,
                Status = "Pending",
                Companyname = requestDto.CompanyName.Trim(),
                LicenseFile = licenseFilePath,
                Phone = requestDto.Phone.Trim(),
                Email = requestDto.Email.Trim(),
                Website = requestDto.Website?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                _dbContext.AgencieCertificates.Add(agencyCertificate);
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"[RequestUpgradeToAgencyAsync] DbUpdateException: {ex.InnerException?.Message ?? ex.Message}");
                throw new InvalidOperationException($"Không thể tạo yêu cầu nâng cấp: {ex.InnerException?.Message ?? ex.Message}");
            }

            await SendWebNotificationAsync(user, "Pending", "Agency Certificate", agencyCertificate.AgencyId.ToString(),
              $"Người dùng {user.Name} đã gửi yêu cầu nâng cấp lên Agency.");
        }

        public async Task RequestUpgradeToHostAsync(int userId, RequestHostUpgradeDto requestDto)
        {
            if (requestDto == null)
            {
                throw new ArgumentNullException(nameof(requestDto));
            }

            // Validate required fields
            if (string.IsNullOrWhiteSpace(requestDto.BusinessName))
            {
                throw new ArgumentException("Tên doanh nghiệp không được để trống");
            }
            if (string.IsNullOrWhiteSpace(requestDto.Phone))
            {
                throw new ArgumentException("Số điện thoại không được để trống");
            }
            if (string.IsNullOrWhiteSpace(requestDto.Email))
            {
                throw new ArgumentException("Email không được để trống");
            }

            var user = await _dbContext.Accounts.FirstOrDefaultAsync(account => account.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User does not exist");
            }

            // Kiểm tra user đã là Host chưa
            if (user.RoleId == 2) // Assuming RoleId 2 is Host
            {
                throw new InvalidOperationException("Bạn đã là Host rồi");
            }

            // Kiểm tra đã có certificate pending chưa
            var existingCertificate = await _dbContext.HostCertificates
                .FirstOrDefaultAsync(c => c.HostId == userId && (c.Status == "Pending" || c.Status == "Review"));
            
            if (existingCertificate != null)
            {
                throw new InvalidOperationException("Bạn đã có yêu cầu nâng cấp đang chờ xử lý. Vui lòng đợi Admin xét duyệt.");
            }

            // Xử lý file license - lưu base64 thành file thực
            var licenseFilePath = await SaveBase64FileAsync(requestDto.BusinessLicenseFile, "certificates/host", $"host_{userId}");

            var hostCertificate = new Models.HostCertificate
            {
                HostId = userId,
                Status = "Pending",
                BusinessLicenseFile = licenseFilePath,
                Phone = requestDto.Phone.Trim(),
                Email = requestDto.Email.Trim(),
                BusinessName = requestDto.BusinessName.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                _dbContext.HostCertificates.Add(hostCertificate);
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"[RequestUpgradeToHostAsync] DbUpdateException: {ex.InnerException?.Message ?? ex.Message}");
                throw new InvalidOperationException($"Không thể tạo yêu cầu nâng cấp: {ex.InnerException?.Message ?? ex.Message}");
            }

            await SendWebNotificationAsync(user, "Pending", "Host Certificate", hostCertificate.CertificateId.ToString(),
              $"Người dùng {user.Name} đã gửi yêu cầu nâng cấp lên Host.");
        }

        /// <summary>
        /// Lưu file base64 thành file thực trong wwwroot/uploads
        /// </summary>
        private async Task<string> SaveBase64FileAsync(string base64Data, string subFolder, string filePrefix)
        {
            // Nếu không có data hoặc không phải base64, trả về placeholder
            if (string.IsNullOrWhiteSpace(base64Data) || base64Data == "pending_upload")
            {
                return "pending_upload";
            }

            // Nếu không phải base64 (có thể là URL), trả về nguyên
            if (!base64Data.StartsWith("data:"))
            {
                return base64Data;
            }

            try
            {
                // Parse base64 data
                // Format: data:image/jpeg;base64,/9j/4AAQ...
                var parts = base64Data.Split(',');
                if (parts.Length != 2)
                {
                    return "pending_upload";
                }

                var header = parts[0]; // data:image/jpeg;base64
                var data = parts[1];   // actual base64 data

                // Xác định extension từ MIME type
                var extension = ".jpg"; // default
                if (header.Contains("image/png"))
                    extension = ".png";
                else if (header.Contains("image/jpeg") || header.Contains("image/jpg"))
                    extension = ".jpg";
                else if (header.Contains("application/pdf"))
                    extension = ".pdf";

                // Tạo tên file unique
                var fileName = $"{filePrefix}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";

                // Tạo đường dẫn thư mục
                var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", subFolder);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Lưu file
                var filePath = Path.Combine(uploadsFolder, fileName);
                var fileBytes = Convert.FromBase64String(data);
                await File.WriteAllBytesAsync(filePath, fileBytes);

                // Trả về đường dẫn relative để lưu vào database
                return $"/uploads/{subFolder}/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SaveBase64FileAsync] Error saving file: {ex.Message}");
                return "pending_upload";
            }
        }

        public async Task ApproveUpgradeCertificateAsync(ApproveCertificateDto dto)
        {
            var (certificate, user, newRoleId, objectType) = await GetCertificateAndUserForProcessing(dto.CertificateId, dto.Type);

            // Kiểm tra payment cho Agency upgrade (Host upgrade miễn phí)
            if (dto.Type == CertificateType.Agency)
            {
                var payment = await _dbContext.Payments
                    .Where(p => p.UserId == user.Id 
                        && p.PaymentType == "UpgradeAgency" 
                        && p.Status == "success")
                    .OrderByDescending(p => p.PaymentDate)
                    .FirstOrDefaultAsync();

                if (payment == null)
                {
                    throw new InvalidOperationException("Cannot approve Agency upgrade. Payment not completed. User must complete payment first.");
                }
            }

            certificate.Status = "Approved";
            certificate.UpdatedAt = DateTime.UtcNow;

            user.RoleId = newRoleId;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Chuyển objectType sang tiếng Việt cho thông báo
            var objectTypeVi = objectType switch
            {
                "HostCertificate" => "nâng cấp Host",
                "AgencyCertificate" => "nâng cấp Agency",
                _ => objectType
            };

            await SendUserEmailAsync(user, "ApproveCertificate.html",
              "THÔNG BÁO: Yêu cầu nâng cấp vai trò đã được duyệt");

            await SendWebNotificationAsync(user, "Approved", objectType,
              dto.CertificateId.ToString(),
              $"Yêu cầu {objectTypeVi} của bạn đã được duyệt thành công.");
        }

        public async Task RejectUpgradeCertificateAsync(RejectCertificateDto dto)
        {
            var (certificate, user, _, objectType) = await GetCertificateAndUserForProcessing(dto.CertificateId, dto.Type);

            certificate.Status = "Rejected";
            certificate.RejectComment = dto.Comment;
            certificate.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Chuyển objectType sang tiếng Việt cho thông báo
            var objectTypeVi = objectType switch
            {
                "HostCertificate" => "nâng cấp Host",
                "AgencyCertificate" => "nâng cấp Agency",
                _ => objectType
            };

            await SendUserEmailAsync(user, "RejectCertificate.html",
              "THÔNG BÁO: Yêu cầu nâng cấp vai trò đã bị từ chối", dto.Comment);

            await SendWebNotificationAsync(user, "Rejected", objectType,
              dto.CertificateId.ToString(),
              $"Yêu cầu {objectTypeVi} của bạn đã bị từ chối. Lý do: {dto.Comment}");
        }

        public async Task ReviewUpgradeCertificateAsync(ReviewCertificateDto dto)
        {
            var (certificate, user, _, objectType) = await GetCertificateAndUserForProcessing(dto.CertificateId, dto.Type);

            certificate.Status = "Review";

            // Handle ReviewComments - add new comment to the list
            var reviewComments = new List<ReviewComment>();
            if (!string.IsNullOrEmpty(certificate.ReviewComments))
            {
                reviewComments = JsonSerializer.Deserialize<List<ReviewComment>>(certificate.ReviewComments) ?? new List<ReviewComment>();
            }

            reviewComments.Add(new ReviewComment
            {
                CreatedDate = DateTime.UtcNow,
                Content = dto.Comment
            });

            certificate.ReviewComments = JsonSerializer.Serialize(reviewComments);
            certificate.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Chuyển objectType sang tiếng Việt cho thông báo
            var objectTypeVi = objectType switch
            {
                "HostCertificate" => "nâng cấp Host",
                "AgencyCertificate" => "nâng cấp Agency",
                _ => objectType
            };

            await SendUserEmailAsync(user, "AddCertificateReviewComment.html",
              "THÔNG BÁO: Yêu cầu bổ sung thông tin cho nâng cấp vai trò", dto.Comment);

            await SendWebNotificationAsync(user, "Review", objectType,
              dto.CertificateId.ToString(),
              $"Yêu cầu {objectTypeVi} của bạn cần bổ sung thông tin. Nội dung: {dto.Comment}");
        }

        private async Task<(dynamic Certificate, Account User, int SuccessRoleId, string ObjectType)>
          GetCertificateAndUserForProcessing(int certificateId, CertificateType type)
        {
            dynamic certificate = null;
            Account user = null;
            int successRoleId = 0;
            string objectType = string.Empty;

            switch (type)
            {
                case CertificateType.Agency:
                    certificate = await _dbContext.AgencieCertificates
                      .Include(agencyCertificate => agencyCertificate.Account)
                      .FirstOrDefaultAsync(agencyCertificate => agencyCertificate.AgencyId == certificateId);
                    if (certificate != null)
                    {
                        user = certificate.Account;
                        successRoleId = 3; // Role ID for Agency
                        objectType = "Agency Certificate";
                    }
                    break;

                case CertificateType.Host:
                    certificate = await _dbContext.HostCertificates
                      .Include(hostCertificate => hostCertificate.Host)
                      .FirstOrDefaultAsync(hostCertificate => hostCertificate.CertificateId == certificateId);
                    if (certificate != null)
                    {
                        user = certificate.Host;
                        successRoleId = 2; // Role ID for Host
                    }
                    break;

                default:
                    throw new ArgumentException("Invalid certificate type");
            }

            if (certificate == null)
            {
                throw new InvalidOperationException($"Certificate not found for ID: {certificateId}");
            }

            if (user == null)
            {
                throw new InvalidOperationException("User not found for this certificate");
            }

            return (certificate, user, successRoleId, objectType);
        }

        // Helper class for review comments
        private class ReviewComment
        {
            public DateTime CreatedDate { get; set; }
            public string Content { get; set; } = string.Empty;
        }

        // Helper method để parse ReviewComments an toàn
        private List<T> ParseReviewComments<T>(string reviewCommentsJson)
        {
            if (string.IsNullOrWhiteSpace(reviewCommentsJson))
            {
                return new List<T>();
            }

            try
            {
                // Thử deserialize JSON
                var result = JsonSerializer.Deserialize<List<T>>(reviewCommentsJson);
                return result ?? new List<T>();
            }
            catch (JsonException)
            {
                // Nếu không phải JSON, trả về empty list
                // (Vì frontend không cần hiển thị ReviewComments dạng text cũ)
                return new List<T>();
            }
        }
        #endregion

        public async Task<List<int>> GetAllAdminAndHostId()
        {
            // Giả định Role Admin có RoleId = 1 và Role Host có RoleId = 2
            // Nếu bạn có nhiều Role cần nhận thông báo, hãy thêm RoleId vào điều kiện Where
            var adminHostIds = await _dbContext.Accounts
        .Where(a => a.RoleId == 1 || a.RoleId == 2) // Lọc Admin (1) và Host (2)
                .Select(a => a.Id)
        .ToListAsync();

            return adminHostIds;
        }

        public async Task<List<int>> GetAllAdminAndAgencyId()
        {
            // Giả định Role Admin có RoleId = 1 và Role Host có RoleId = 2
            // Nếu bạn có nhiều Role cần nhận thông báo, hãy thêm RoleId vào điều kiện Where
            var adminHostIds = await _dbContext.Accounts
        .Where(a => a.RoleId == 1 || a.RoleId == 3) // Lọc Admin (1) và Host (2)
                .Select(a => a.Id)
        .ToListAsync();

            return adminHostIds;
        }

        public async Task<List<int>> GetAllAdminAndCustomerId()
        {
            // Giả định Role Admin có RoleId = 1 và Role Host có RoleId = 2
            // Nếu bạn có nhiều Role cần nhận thông báo, hãy thêm RoleId vào điều kiện Where
            var adminHostIds = await _dbContext.Accounts
        .Where(a => a.RoleId == 1 || a.RoleId == 4) // Lọc Admin (1) và Host (2)
                .Select(a => a.Id)
        .ToListAsync();

            return adminHostIds;
        }

        public async Task UpdateTotalSpentAndLevelAsync(int userId, decimal amountSpent)
        {
            var user = await GetAccountByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("User not found.");

            // Chỉ áp dụng Level cho Customer (4) và Agency (3)
            if (user.RoleId == 4 || user.RoleId == 3)
            {
                // Cập nhật tổng chi tiêu
                user.TotalSpent += amountSpent;

                // Tính toán Level mới
                user.Level = CalculateLevel(user.TotalSpent, user.RoleId);

                user.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }
            // Các role khác (Admin/Host) không cần Level

        }

        private int CalculateLevel(decimal totalSpent, int roleId)
        {
            // Nếu không phải Customer (4) hoặc Agency (3), giữ Level 0
            if (roleId != 4 && roleId != 3)
            {
                return 0;
            }

            if (totalSpent >= 5000000) // 5 triệu trở lên là Level 3
            {
                return 3;
            }
            else if (totalSpent >= 1000000) // Từ 1 triệu đến dưới 5 triệu là Level 2
            {
                return 2;
            }
            else if (totalSpent > 0) // Tiêu > 0 đến dưới 1 triệu là Level 1
            {
                return 1;
            }
            else // Chi tiêu 0
            {
                return 0;
            }
        }

        #region Helper Methods
        private static string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                throw new ArgumentException("Password cannot be null or empty");
            }

            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string enteredPassword, string storedHash)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(enteredPassword) || string.IsNullOrWhiteSpace(storedHash))
                {
                    return false;
                }

                // BCrypt.Verify có thể throw exception nếu hash không hợp lệ
                // Đảm bảo luôn return false trong trường hợp có lỗi
                return BCrypt.Net.BCrypt.Verify(enteredPassword, storedHash);
            }
            catch (Exception)
            {
                // Nếu có bất kỳ exception nào (hash không hợp lệ, format sai, etc.)
                // Luôn trả về false để từ chối đăng nhập
                return false;
            }
        }

        public async Task<GoogleJsonWebSignature.Payload> VerifyGoogleTokenAsync(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken))
            {
                throw new ArgumentException("ID token cannot be null or empty");
            }

            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new List<string> { _jwtSetting.GoogleClientID }
                };
                return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            }
            catch (InvalidJwtException exception)
            {
                throw new InvalidOperationException("Google token validation failed", exception);
            }
        }

        public async Task SendUserEmailAsync(Account user, string templateName, string subject, string comment = null)
        {
            try
            {
                string filePath = Path.Combine(_env.ContentRootPath, "EmailTemplates", templateName);
                if (!File.Exists(filePath))
                {
                    throw new FileNotFoundException($"Email template not found: {templateName}", filePath);
                }

                string htmlBody = await File.ReadAllTextAsync(filePath);
                string body = htmlBody
                .Replace("{{UserName}}", user.Name)
                .Replace("{{Hompage}}", _emailConfig.HomePage ?? "https://your-website.com")
                .Replace("{{Comment}}", comment ?? "")
                .Replace("{{Reason}}", comment ?? "");

                await _emailHelper.SendEmailAsync(subject, body, new List<string> { user.Email }, true);
            }
            catch (Exception exception)
            {
                // Log email error but don't break the main operation
                Console.WriteLine($"Email sending failed: {exception.Message}");
            }
        }

        // CHUYỂN TỪ PRIVATE SANG PUBLIC (FIX CS0737)
        public async Task SendWebNotificationAsync(Account user, string status, string objectType, string objectId, string content)
        {
            try
            {
                // Chuyển status sang tiếng Việt
                var statusVi = status switch
                {
                    "approved" => "đã được duyệt",
                    "rejected" => "đã bị từ chối",
                    "pending" => "đang chờ duyệt",
                    "review" => "cần xem xét lại",
                    _ => status
                };

                // Chuyển objectType sang tiếng Việt
                var objectTypeVi = objectType switch
                {
                    "Certificate" => "Chứng chỉ",
                    "HostCertificate" => "Yêu cầu nâng cấp Host",
                    "AgencyCertificate" => "Yêu cầu nâng cấp Agency",
                    _ => objectType
                };

                // Create notification for the user
                var userNotification = new Notification
                {
                    UserId = user.Id,
                    Message = content,
                    Title = $"Cập nhật trạng thái: {statusVi}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Notifications.Add(userNotification);

                var adminNotifications = new List<Notification>();

                // Notify admins for certificate-related actions
                if (objectType.Contains("Certificate"))
                {
                    var adminContent = $"{objectTypeVi} từ {user.Name} đã được cập nhật thành: {statusVi}.";
                    var admins = await _dbContext.Accounts
                    .Where(admin => admin.RoleId == 1) // Role 1 = Admin
                                                      .ToListAsync();

                    foreach (var admin in admins)
                    {
                        adminNotifications.Add(new Notification
                        {
                            UserId = admin.Id,
                            Message = adminContent,
                            Title = $"Cập nhật hệ thống: {statusVi}",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                if (adminNotifications.Any())
                {
                    _dbContext.Notifications.AddRange(adminNotifications);
                }

                await _dbContext.SaveChangesAsync();

                // Send signalR message to user
                var userNotificationDto = new NotificationDto
                {
                    Id = userNotification.Id,
                    UserId = userNotification.UserId,
                    Message = userNotification.Message,
                    Title = userNotification.Title,
                    IsRead = userNotification.IsRead,
                    CreatedAt = userNotification.CreatedAt
                };

                await _hubNotificationContext.Clients.User(user.Id.ToString())
                .SendAsync("ReceiveNotification", userNotificationDto);

                // Send signalR message to each admin
                foreach (var adminNotification in adminNotifications)
                {
                    try
                    {
                        var adminNotificationDto = new NotificationDto
                        {
                            Id = adminNotification.Id,
                            UserId = adminNotification.UserId,
                            Message = adminNotification.Message,
                            Title = adminNotification.Title,
                            IsRead = adminNotification.IsRead,
                            CreatedAt = adminNotification.CreatedAt
                        };

                        await _hubNotificationContext.Clients.User(adminNotification.UserId.ToString())
                        .SendAsync("ReceiveNotification", adminNotificationDto);
                    }
                    catch (Exception exception)
                    {
                        Console.WriteLine($"Failed to send notification to admin {adminNotification.UserId}: {exception.Message}");
                    }
                }
            }
            catch (Exception exception)
            {
                // Log notification error but don't break the main operation
                Console.WriteLine($"Notification sending failed: {exception.Message}");
            }
        }
        #endregion
    }
}


