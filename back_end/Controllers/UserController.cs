using ESCE_SYSTEM.DTOs.BanUnbanUser;
using ESCE_SYSTEM.DTOs.Certificates;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.Services.PaymentService;
using ESCE_SYSTEM.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserContextService _userContextService;
        private readonly IPaymentService _paymentService;

        public UserController(IUserService userService, IUserContextService userContextService, IPaymentService paymentService)
        {
            _userService = userService;
            _userContextService = userContextService;
            _paymentService = paymentService;
        }

        #region Certificate Endpoints
        [HttpGet("agency-certificates")]
/*        [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> GetAgencyCertificates([FromQuery] string status = null)
        {
            try
            {
                var certificates = await _userService.GetAllAgencyCertificatesAsync(status);
                return Ok(certificates);
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet("host-certificates")]
/*        [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> GetHostCertificates([FromQuery] string status = null)
        {
            try
            {
                var certificates = await _userService.GetAllHostCertificatesAsync(status);
                return Ok(certificates);
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("request-upgrade-to-agency")]
       /* [Authorize(Roles = "Tourist,Customer")]*/
        public async Task<IActionResult> RequestUpgradeToAgency([FromBody] RequestAgencyUpgradeDto requestDto)
        {
            try
            {
                Console.WriteLine($"[RequestUpgradeToAgency] Received request: CompanyName={requestDto?.CompanyName}, Phone={requestDto?.Phone}, Email={requestDto?.Email}");
                
                var userIdString = _userContextService.UserId;
                Console.WriteLine($"[RequestUpgradeToAgency] UserId from context: {userIdString}");
                
                if (!int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid user information");
                }

                // Tạo certificate request
                Console.WriteLine($"[RequestUpgradeToAgency] Creating certificate for userId: {userId}");
                await _userService.RequestUpgradeToAgencyAsync(userId, requestDto);
                Console.WriteLine($"[RequestUpgradeToAgency] Certificate created successfully");

                // Trả về thông tin để frontend chuyển đến trang thanh toán
                // Payment sẽ được tạo ở trang thanh toán
                return Ok(new
                {
                    message = "Agency upgrade request has been submitted. Please proceed to payment.",
                    requiresPayment = true,
                    amount = 5000,
                    companyName = requestDto.CompanyName
                });
            }
            catch (Exception exception)
            {
                Console.WriteLine($"[RequestUpgradeToAgency] ERROR: {exception.Message}");
                Console.WriteLine($"[RequestUpgradeToAgency] StackTrace: {exception.StackTrace}");
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("request-upgrade-to-host")]
     /*   [Authorize(Roles = "Tourist,Customer")]*/
        public async Task<IActionResult> RequestUpgradeToHost([FromBody] RequestHostUpgradeDto requestDto)
        {
            try
            {
                // Debug: Log role từ token
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                Console.WriteLine($"[RequestUpgradeToHost] User role from token: {userRole}");
                Console.WriteLine($"[RequestUpgradeToHost] Received request: BusinessName={requestDto?.BusinessName}, Phone={requestDto?.Phone}, Email={requestDto?.Email}");
                
                var userIdString = _userContextService.UserId;
                Console.WriteLine($"[RequestUpgradeToHost] UserId from context: {userIdString}");
                
                if (!int.TryParse(userIdString, out int userId))
                {
                    Console.WriteLine($"[RequestUpgradeToHost] ERROR: Invalid userId");
                    return Unauthorized("Invalid user information");
                }

                Console.WriteLine($"[RequestUpgradeToHost] Creating certificate for userId: {userId}");
                await _userService.RequestUpgradeToHostAsync(userId, requestDto);
                Console.WriteLine($"[RequestUpgradeToHost] Certificate created successfully");
                
                return Ok(new { message = "Host upgrade request has been submitted successfully. Please wait for admin approval." });
            }
            catch (Exception exception)
            {
                Console.WriteLine($"[RequestUpgradeToHost] ERROR: {exception.Message}");
                Console.WriteLine($"[RequestUpgradeToHost] StackTrace: {exception.StackTrace}");
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("approve-certificate")]
       /* [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> ApproveCertificate([FromBody] ApproveCertificateDto dto)
        {
            try
            {
                await _userService.ApproveUpgradeCertificateAsync(dto);
                return Ok("Certificate has been approved successfully.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("reject-certificate")]
/*        [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> RejectCertificate([FromBody] RejectCertificateDto dto)
        {
            try
            {
                await _userService.RejectUpgradeCertificateAsync(dto);
                return Ok("Certificate has been rejected.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("review-certificate")]
/*        [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> ReviewCertificate([FromBody] ReviewCertificateDto dto)
        {
            try
            {
                await _userService.ReviewUpgradeCertificateAsync(dto);
                return Ok("Additional information request has been sent.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }
        #endregion

        #region User Management Endpoints
        [HttpGet("users")]
        [Authorize]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet("{id}")] // Đổi lại thành {id} chuẩn RESTful. Route cũ [HttpGet("{getuserbyid}")] không chuẩn.
        [Authorize]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                // Gọi phương thức DTO để tránh lỗi chu kỳ
                var user = await _userService.GetUserDtoByIdAsync(id);
                return Ok(user);
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
        {
            try
            {
                var userIdString = _userContextService.UserId;
                if (!int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid user information");
                }

                // Update profile
                await _userService.UpdateProfileAsync(userId, updateDto);
                
                // Reload user với đầy đủ thông tin (bao gồm Role) để trả về
                var updatedUserDto = await _userService.GetUserDtoByIdAsync(userId);
                return Ok(new { message = "Profile updated successfully", user = updatedUserDto });
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("ban-account")]
     /*   [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> BanAccount([FromBody] BanAccountDto banAccountDto)
        {
            try
            {
                await _userService.BanAccount(banAccountDto.AccountId, banAccountDto.Reason);
                return Ok("Account has been banned.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("unban-account")]
 /*       [Authorize(Roles = "Admin")]*/
        public async Task<IActionResult> UnbanAccount([FromBody] UnbanAccountDto unbanAccountDto)
        {
            try
            {
                await _userService.UnbanAccount(unbanAccountDto.AccountId);
                return Ok("Account has been unbanned.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }
        #endregion

        #region Authentication Endpoints
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePassword)
        {
            try
            {
                await _userService.ChangePassword(changePassword);
                return Ok("Password has been changed successfully.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPassword)
        {
            try
            {
                await _userService.ResetPassword(resetPassword);
                return Ok("Password has been reset successfully.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("request-otp")]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpDto requestOtpDto)
        {
            try
            {
                await _userService.RequestOtp(requestOtpDto);
                return Ok("OTP has been sent to your email.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto verifyOtpDto)
        {
            try
            {
                var result = await _userService.VerifyOtp(verifyOtpDto);
                return Ok(new { message = "OTP verified successfully", verified = result });
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("request-otp-forget-password")]
        public async Task<IActionResult> RequestOtpForgetPassword([FromBody] RequestOtpDto requestOtpDto)
        {
            try
            {
                await _userService.RequestOtpForgetPassword(requestOtpDto);
                return Ok("Password reset OTP has been sent to your email.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }
        #endregion


        [HttpPut("update-spent/{userId}")]
  /*      [Authorize(Roles = "Admin")] // Giả định chỉ Admin hoặc System có thể gọi trực tiếp*/
        public async Task<IActionResult> UpdateTotalSpent(int userId, [FromQuery] decimal amountSpent)
        {
            try
            {
                if (amountSpent <= 0)
                {
                    return BadRequest(new { message = "Amount spent must be greater than zero." });
                }

                // Gọi Service để thực hiện logic cập nhật
                await _userService.UpdateTotalSpentAndLevelAsync(userId, amountSpent);

                return Ok($"Total spent and level for user {userId} updated successfully.");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception exception)
            {
                return StatusCode(500, new { message = "Error updating user spent data", error = exception.Message });
            }
        }
    }
}

