using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Role
    {
        public Role()
        {
            Accounts = new HashSet<Account>();
        }

        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int Id { get; set; }

        public virtual ICollection<Account> Accounts { get; set; }
    }
}
