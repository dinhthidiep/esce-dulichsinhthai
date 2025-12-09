namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class AgencyCertificateResponseDto
    {
        public int AgencyId { get; set; }
        public int AccountId { get; set; }
        public string CompanyName { get; set; }
        public string LicenseFile { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string? Website { get; set; }
        public string? Status { get; set; }
        public string RejectComment { get; set; }
        // Sử dụng ReviewComment DTO đã được định nghĩa
        public List<ESCE_SYSTEM.DTOs.Users.AgencyCertificateReViewComment> ReviewComments { get; set; } = new List<ESCE_SYSTEM.DTOs.Users.AgencyCertificateReViewComment>();
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
    }

}