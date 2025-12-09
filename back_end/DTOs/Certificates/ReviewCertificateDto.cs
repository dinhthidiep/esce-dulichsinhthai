namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class ReviewCertificateDto
    {
        public int CertificateId { get; set; }
        public CertificateType Type { get; set; }
        public string Comment { get; set; } = null!;
    }
}
