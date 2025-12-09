using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Otp
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Code { get; set; } = null!;
        public string? Email { get; set; }
        public DateTime ExpirationTime { get; set; }
        public bool? IsVerified { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual Account? User { get; set; }
    }
}
