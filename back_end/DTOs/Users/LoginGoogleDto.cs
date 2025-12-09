namespace ESCE_SYSTEM.DTOs.Users
{
    public class LoginGoogleDto
    {
        public string IdToken { get; set; }
        public int? RoleId { get; set; }
        public string? PhoneNumber { get; set; }
    }
}