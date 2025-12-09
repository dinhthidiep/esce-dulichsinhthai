namespace ESCE_SYSTEM.DTOs.Message
{
    public class ChatUserDto
    {
        public string UserId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public int RoleId { get; set; }
        public string Email { get; set; } = null!;
    }
}
