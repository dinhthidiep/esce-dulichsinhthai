namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class ApproveCertificateDto
    {
        public int CertificateId { get; set; }
        public CertificateType Type { get; set; } // Agency hoặc Host
    }
}
