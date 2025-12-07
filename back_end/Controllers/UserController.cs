// File: UserController.cs (Đã sửa hoàn chỉnh)
using ESCE_SYSTEM.DTOs.BanUnbanUser;
using ESCE_SYSTEM.DTOs.Certificates;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Services.UserContextService;
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

        public UserController(IUserService userService, IUserContextService userContextService)
        {
            _userService = userService;
            _userContextService = userContextService;
        }

        #region Certificate Endpoints
        [HttpGet("agency-certificates")]
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RequestUpgradeToAgency([FromBody] RequestAgencyUpgradeDto requestDto)
        {
            try
            {
                var userIdString = _userContextService.UserId;
                if (!int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid user information");
                }

                await _userService.RequestUpgradeToAgencyAsync(userId, requestDto);
                return Ok("Agency upgrade request has been submitted successfully. Please wait for admin approval.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPost("request-upgrade-to-host")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RequestUpgradeToHost([FromBody] RequestHostUpgradeDto requestDto)
        {
            try
            {
                var userIdString = _userContextService.UserId;
                if (!int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid user information");
                }

                await _userService.RequestUpgradeToHostAsync(userId, requestDto);
                return Ok("Host upgrade request has been submitted successfully. Please wait for admin approval.");
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("approve-certificate")]
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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

                var updatedUser = await _userService.UpdateProfileAsync(userId, updateDto);
                return Ok(new { message = "Profile updated successfully", user = updatedUser });
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut("ban-account")]
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")] // Giả định chỉ Admin hoặc System có thể gọi trực tiếp
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