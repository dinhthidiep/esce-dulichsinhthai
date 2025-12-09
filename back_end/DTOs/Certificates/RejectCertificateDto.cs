namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class RejectCertificateDto
    {
        public int CertificateId { get; set; }
        public CertificateType Type { get; set; }
        public string Comment { get; set; } = null!; // Lý do từ chối
    }
}
