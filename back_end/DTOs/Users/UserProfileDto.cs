namespace ESCE_SYSTEM.DTOs.Users
{
    public class UserProfileDto
    {
        public int Id { get; set; }

        public string Email { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Avatar { get; set; }

        public string? Phone { get; set; }

        public DateTime? Dob { get; set; }

        public string? Gender { get; set; }

        public string? Address { get; set; }

        public int RoleId { get; set; }

        public bool? IsActive { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int Level { get; set; }

        public decimal TotalSpent { get; set; }
    }
}