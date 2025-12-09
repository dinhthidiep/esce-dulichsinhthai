using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class SupportResponse
    {
        public int Id { get; set; }
        public int SupportId { get; set; }
        public int ResponderId { get; set; }
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual Account Responder { get; set; } = null!;
        public virtual RequestSupport Support { get; set; } = null!;
    }
}
