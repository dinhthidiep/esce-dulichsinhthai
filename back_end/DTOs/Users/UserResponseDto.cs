

using System;

namespace ESCE_SYSTEM.DTOs.Users
{
    public class UserResponseDto
    {
        // Thông tin nhận dạng cơ bản
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }

        // Thông tin liên hệ & hồ sơ
        public string? Phone { get; set; }
        public DateTime? Dob { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }

        // Trạng thái tài khoản & Vai trò
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty; // Thuộc tính này được lấy từ Account.Role.Name
        public bool? IsActive { get; set; } // Trạng thái kích hoạt (Active/Inactive)
        public bool IS_BANNED { get; set; } // Trạng thái bị cấm

        // Dấu thời gian
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
