using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class News
    {
        public int NewsId { get; set; }
        public int AccountId { get; set; }
        public string NewsTitle { get; set; } = null!;
        public DateTime? CreatedDate { get; set; }
        public string? Image { get; set; }
        public string? SocialMediaLink { get; set; }

        public virtual Account Account { get; set; } = null!;
    }
}
