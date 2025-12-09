namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class HostCertificateResponseDto
    {
        public int CertificateId { get; set; }
        public int HostId { get; set; }
        public string BusinessLicenseFile { get; set; }
        public string BusinessName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string? Status { get; set; }
        public string RejectComment { get; set; }
        // Sử dụng ReviewComment DTO đã được định nghĩa
        public List<HostCertificateReViewComment> ReviewComments { get; set; } = new List<HostCertificateReViewComment>();
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string HostName { get; set; }
        public string HostEmail { get; set; }
    }
}