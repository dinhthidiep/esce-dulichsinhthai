using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Coupon
    {
        public Coupon()
        {
            BookingCoupons = new HashSet<BookingCoupon>();
        }

        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int UsageLimit { get; set; }
        public int? UsageCount { get; set; }
        public int HostId { get; set; }
        public int? ServiceComboId { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual Account Host { get; set; } = null!;
        public virtual ServiceCombo? ServiceCombo { get; set; }
        public virtual ICollection<BookingCoupon> BookingCoupons { get; set; }
    }
}