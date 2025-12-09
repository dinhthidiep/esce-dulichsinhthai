using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class ReactionType
    {
        public ReactionType()
        {
            Commentreactions = new HashSet<Commentreaction>();
            Postreactions = new HashSet<Postreaction>();
        }

        public byte Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<Commentreaction> Commentreactions { get; set; }
        public virtual ICollection<Postreaction> Postreactions { get; set; }
    }
}
