using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class AgencieCertificate
    {
        public int AgencyId { get; set; }
        public int AccountId { get; set; }
        public string Companyname { get; set; } = null!;
        public string LicenseFile { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Website { get; set; }
        public string? Status { get; set; }
        public string? RejectComment { get; set; }
        public string? ReviewComments { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual Account Account { get; set; } = null!;
    }
}
