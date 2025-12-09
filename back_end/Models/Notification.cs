using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Message { get; set; }
        public bool? IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Title { get; set; }

        public virtual Account User { get; set; } = null!;
    }
}
