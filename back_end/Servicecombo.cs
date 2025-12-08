using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System; // Cần thêm System cho DateTime

namespace ESCE_SYSTEM.Models
{
    public class ServiceCombo
    {
        public ServiceCombo()
        {
            ServiceComboDetails = new List<ServiceComboDetail>();
            // BỔ SUNG: Khởi tạo các Collections thiếu
            Bookings = new List<Booking>();
            Coupons = new List<Coupon>();
            RequestSupports = new List<RequestSupport>();
        }

        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int AvailableSlots { get; set; }

        [MaxLength(255)]
        public string? Image { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "open"; // open / closed / canceled

        [MaxLength(1000)]
        public string? CancellationPolicy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Foreign Key to Account (Host who created this combo)
        public int HostId { get; set; }

        // Navigation properties
        [ForeignKey("HostId")]
        public virtual Account Host { get; set; } = null!;

        public virtual ICollection<ServiceComboDetail> ServiceComboDetails { get; set; }

        // BỔ SUNG để khắc phục lỗi CS1061 trong DbContext
        public virtual ICollection<Coupon> Coupons { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; }
        public virtual ICollection<RequestSupport> RequestSupports { get; set; }
    }
}