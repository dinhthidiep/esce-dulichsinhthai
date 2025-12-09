using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class HostCertificate
    {
        public int CertificateId { get; set; }
        public int HostId { get; set; }
        public string BusinessLicenseFile { get; set; } = null!;
        public string BusinessName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Status { get; set; }
        public string? RejectComment { get; set; }
        public string? ReviewComments { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual Account Host { get; set; } = null!;
    }
}
