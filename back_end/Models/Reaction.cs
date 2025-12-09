using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Reaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TargetType { get; set; } = null!;
        public int TargetId { get; set; }
        public string ReactionType { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }

        public virtual Account User { get; set; } = null!;
    }
}
