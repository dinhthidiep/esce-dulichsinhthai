namespace ESCE_SYSTEM.DTOs.Users
{
    public class AgencyCertificate
    {
        public string CompanyName { get; set; }
        public string LicenseFile { get; set; }  // URL/Path tới file Giấy phép
        public string Phone { get; set; }
        public string Email { get; set; }
        public string? Website { get; set; }
        public string Image { get; set; }
        public string RejectComment { get; set; }
        public List<AgencyCertificateReViewComment> ReviewComments { get; set; }
    }
    public class AgencyCertificateReViewComment
    {
        public DateTime CreatedDate { get; set; }
        public string Content { get; set; }
    }
}