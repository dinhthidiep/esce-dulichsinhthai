using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ESCE_SYSTEM.Models
{
    public class Booking
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string BookingNumber { get; set; } = string.Empty;

        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }

        [Required]
        public int Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(50)]
        public string ItemType { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Status { get; set; } = "pending";

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public DateTime BookingDate { get; set; } = DateTime.Now;
        public DateTime? ConfirmedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public virtual Account User { get; set; } = null!;

        [ForeignKey("ServiceComboId")]
        public virtual ServiceCombo? ServiceCombo { get; set; }

        [ForeignKey("ServiceId")]
        public virtual Service? Service { get; set; }

        public virtual ICollection<BookingCoupon> BookingCoupons { get; set; } = new List<BookingCoupon>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
