using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class RequestSupport
    {
        public RequestSupport()
        {
            SupportResponses = new HashSet<SupportResponse>();
        }

        public int Id { get; set; }
        public int UserId { get; set; }
        public int? ComboId { get; set; }
        public string? SupportType { get; set; }
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual ServiceCombo? ServiceCombo { get; set; }
        public virtual Account User { get; set; } = null!;
        public virtual ICollection<SupportResponse> SupportResponses { get; set; }
    }
}
