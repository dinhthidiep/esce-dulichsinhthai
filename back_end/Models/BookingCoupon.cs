using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class BookingCoupon
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int CouponId { get; set; }
        public DateTime? AppliedAt { get; set; }

        public virtual Booking Booking { get; set; } = null!;
        public virtual Coupon Coupon { get; set; } = null!;
    }
}
