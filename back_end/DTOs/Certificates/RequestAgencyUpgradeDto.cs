namespace ESCE_SYSTEM.DTOs.Users
{
    public class RequestAgencyUpgradeDto
    {
        public string CompanyName { get; set; } 
        public string LicenseFile { get; set; }  // URL/Path tới file Giấy phép
        public string Phone { get; set; } 
        public string Email { get; set; } 
        public string? Website { get; set; }
       
    }
}