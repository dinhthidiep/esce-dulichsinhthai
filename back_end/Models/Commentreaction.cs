using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Commentreaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int CommentId { get; set; }
        public byte ReactionTypeId { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual Comment Comment { get; set; } = null!;
        public virtual ReactionType ReactionType { get; set; } = null!;
        public virtual Account User { get; set; } = null!;
    }
}
