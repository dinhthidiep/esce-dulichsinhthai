using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Servicecombo
    {
        public Servicecombo()
        {
            Bookings = new HashSet<Booking>();
            Coupons = new HashSet<Coupon>();
            RequestSupports = new HashSet<RequestSupport>();
            Reviews = new HashSet<Review>();
            ServicecomboDetails = new HashSet<ServiceComboDetail>();
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableSlots { get; set; }
        public string? Image { get; set; }
        public string? Status { get; set; }
        public string? CancellationPolicy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int HostId { get; set; }

        public virtual Account Host { get; set; } = null!;
        public virtual ICollection<Booking> Bookings { get; set; }
        public virtual ICollection<Coupon> Coupons { get; set; }
        public virtual ICollection<RequestSupport> RequestSupports { get; set; }
        public virtual ICollection<Review> Reviews { get; set; }
        public virtual ICollection<ServiceComboDetail> ServicecomboDetails { get; set; }
    }
}
