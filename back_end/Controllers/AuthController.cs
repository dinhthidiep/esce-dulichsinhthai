using ESCE_SYSTEM.Services.RoleService;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.Helper;
using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using ESCE_SYSTEM.Helpers;
using System.Linq;


namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRoleService _roleService;
        private readonly JwtHelper _jwtHelper;

        public AuthController(IUserService userService, IRoleService roleService, JwtHelper jwtHelper)
        {
            _userService = userService;
            _roleService = roleService;
            _jwtHelper = jwtHelper;
        }

        /// <summary>
        /// Health check endpoint để kiểm tra backend có đang chạy không
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto loginRequest)
        {
            try
            {
                // Validation đầu vào - kiểm tra ModelState (tự động từ Data Annotations)
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (loginRequest == null)
                {
                    return BadRequest(new { message = "Thông tin đăng nhập không được để trống." });
                }

                // Tìm user theo email
                var user = await _userService.GetUserByUsernameAsync(loginRequest.UserEmail);
                if (user == null)
                {
                    return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
                }

                // Kiểm tra xem user có password hash hợp lệ không
                if (string.IsNullOrWhiteSpace(user.PasswordHash))
                {
                    return Unauthorized(new { message = "Tài khoản chưa được thiết lập mật khẩu." });
                }

                // Kiểm tra mật khẩu - QUAN TRỌNG: Phải kiểm tra trước khi tiếp tục
                bool isPasswordValid = _userService.VerifyPassword(loginRequest.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
                }

                // Kiểm tra trạng thái tài khoản - QUAN TRỌNG
                if (user.IS_BANNED == true)
                {
                    return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
                }

              

                // Lấy thông tin role
                var role = await _roleService.GetRoleById(user.RoleId);
                if (role == null)
                {
                    return StatusCode(500, new { message = "Không thể lấy thông tin quyền của tài khoản." });
                }

                // Tạo JWT token
                var token = _jwtHelper.GenerateToken(new UserTokenDto
                {
                    Id = user.Id.ToString(),
                    UserEmail = user.Email,
                    Role = role.Name
                });

                // Trả về response với format nhất quán
                return Ok(new LoginResponseDto 
                { 
                    Token = token, 
                    UserInfo = user.Adapt<UserProfileDto>() 
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình đăng nhập.", error = ex.Message });
            }
        }

        [HttpPost("logingoogle")]
        public async Task<IActionResult> LoginGoogle([FromBody] LoginGoogleDto loginGoogleRequest)
        {
            try
            {
                var payload = await _userService.VerifyGoogleTokenAsync(loginGoogleRequest.IdToken);
                if (payload == null || string.IsNullOrEmpty(payload.Email))
                    return Unauthorized("Invalid credentials.");

                var user = await _userService.GetUserByUsernameAsync(payload.Email);
                if (user == null)
                {
                    // 🟢 Logic: Đăng ký Google mới luôn là Role 4
                    var registerUserDto = new RegisterUserDto
                    {
                        FullName = payload.Name ?? payload.Email,
                        UserEmail = payload.Email,
                        Password = Guid.NewGuid().ToString(),
                        Phone = loginGoogleRequest.PhoneNumber ?? ""
                    };
                    await _userService.CreateUserAsync(registerUserDto, false, true);
                    user = await _userService.GetUserByUsernameAsync(payload.Email);
                }

                //  QUAN TRỌNG: THÊM KIỂM TRA TRẠNG THÁI TÀI KHOẢN CHO GOOGLE LOGIN
                if (user.IS_BANNED == true)
                {
                    return Unauthorized("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
                }

             

                var role = await _roleService.GetRoleById(user.RoleId);
                var token = _jwtHelper.GenerateToken(new UserTokenDto
                {
                    Id = user.Id.ToString(),
                    UserEmail = user.Email,
                    Role = role.Name
                });

                return Ok(new LoginResponseDto { Token = token, UserInfo = user.Adapt<UserProfileDto>() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto registerRequest)
        {
            try
            {
                // Validation đầu vào - kiểm tra ModelState (tự động từ Data Annotations)
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (registerRequest == null)
                {
                    return BadRequest(new { message = "Thông tin đăng ký không được để trống." });
                }

                // Kiểm tra email đã tồn tại chưa
                var existingUser = await _userService.GetUserByUsernameAsync(registerRequest.UserEmail);
                if (existingUser != null)
                {
                    return Conflict(new { message = "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập." });
                }

                // Tạo user mới với Role 4 (Customer) và yêu cầu verify OTP
                // verifyOtp = true: yêu cầu verify OTP trước khi đăng ký
                // isGoogleAccount = false: đây là đăng ký thường
                // roleId = 4: Customer role (mặc định)
                await _userService.CreateUserAsync(registerRequest, verifyOtp: true, isGoogleAccount: false, roleId: 4);

                // Sau khi đăng ký thành công, lấy user vừa tạo
                var newUser = await _userService.GetUserByUsernameAsync(registerRequest.UserEmail);
                if (newUser == null)
                {
                    return StatusCode(500, new { message = "Đăng ký thành công nhưng không thể lấy thông tin tài khoản." });
                }

                // Lấy thông tin role
                var role = await _roleService.GetRoleById(newUser.RoleId);
                if (role == null)
                {
                    return StatusCode(500, new { message = "Không thể lấy thông tin quyền của tài khoản." });
                }

                // Tạo JWT token để tự động đăng nhập sau khi đăng ký
                var token = _jwtHelper.GenerateToken(new UserTokenDto
                {
                    Id = newUser.Id.ToString(),
                    UserEmail = newUser.Email,
                    Role = role.Name
                });

                // Trả về response với format nhất quán (giống Login)
                return Ok(new LoginResponseDto
                {
                    Token = token,
                    UserInfo = newUser.Adapt<UserProfileDto>()
                });
            }
            catch (InvalidOperationException ex)
            {
                // Xử lý lỗi từ CreateUserAsync (OTP chưa verify, email đã tồn tại, etc.)
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình đăng ký.", error = ex.Message });
            }
        }

        [HttpPost("RequestOtp")]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpDto requestOtpDto)
        {
            try
            {
                await _userService.RequestOtp(requestOtpDto);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("VerifyOtp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto user)
        {
            try
            {
                var result = await _userService.VerifyOtp(user);
                return Ok("Verify successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("CheckEmail/{email}")]
        public async Task<IActionResult> CheckEmail(string email)
        {
            try
            {
                var existingUser = await _userService.GetUserByUsernameAsync(email);
                return Ok(new CheckExistingEmailDto { IsExisting = existingUser != null });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("ChangePassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePassword)
        {
            try
            {
                await _userService.ChangePassword(changePassword);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("RequestOtpForgetPassword")]
        public async Task<IActionResult> RequestOtpForgetPassword([FromBody] RequestOtpDto requestOtpDto)
        {
            try
            {
                if (requestOtpDto == null || string.IsNullOrWhiteSpace(requestOtpDto.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                await _userService.RequestOtpForgetPassword(requestOtpDto);
                return Ok(new { message = "OTP code has been sent to your email" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while sending OTP", error = ex.Message });
            }
        }

        // Đồng bộ với frontend: POST /api/Auth/VerifyOtpForgetPassword
        [HttpPost("VerifyOtpForgetPassword")]
        public async Task<IActionResult> VerifyOtpForgetPassword([FromBody] VerifyOtpDto verifyOtpDto)
        {
            try
            {
                var result = await _userService.VerifyOtp(verifyOtpDto);
                return Ok(new { message = "OTP verified successfully", verified = result });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPassword)
        {
            try
            {
                if (resetPassword == null || string.IsNullOrWhiteSpace(resetPassword.Email) || 
                    string.IsNullOrWhiteSpace(resetPassword.NewPassword) || 
                    string.IsNullOrWhiteSpace(resetPassword.Otp))
                {
                    return BadRequest(new { message = "Email, NewPassword, and Otp are required" });
                }

                await _userService.ResetPassword(resetPassword);
                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}