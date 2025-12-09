namespace ESCE_SYSTEM.DTOs.Certificates
{
    public class HostCertificate
    {
        public string BusinessLicenseFile { get; set; }
        public string BusinessName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Image { get; set; }
        public string RejectComment { get; set; }
        public List<HostCertificateReViewComment> ReviewComments { get; set; }
    }
    public class HostCertificateReViewComment
    {
        public DateTime CreatedDate { get; set; }
        public string Content { get; set; }
    }
}

