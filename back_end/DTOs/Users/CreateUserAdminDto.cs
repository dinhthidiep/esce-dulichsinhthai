using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs.Users
{
    public class CreateUserAdminDto
    {
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string UserEmail { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        public string Password { get; set; } = null!;

        [MinLength(2, ErrorMessage = "Họ và tên phải có ít nhất 2 ký tự.")]
        [MaxLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự.")]
        public string FullName { get; set; } = null!;

        [RegularExpression(@"^[0-9]{10,11}$", ErrorMessage = "Số điện thoại phải có 10 hoặc 11 chữ số.")]
        public string? Phone { get; set; }

        /// <summary>
        /// Hỗ trợ cả các giá trị được frontend gửi như: Tourist, Host, TravelAgency.
        /// </summary>
        public string Role { get; set; } = "Customer";

        public bool IsActive { get; set; } = true;

        public bool IsBanned { get; set; } = false;
    }
}