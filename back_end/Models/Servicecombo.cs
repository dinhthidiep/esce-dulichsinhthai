using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace ESCE_SYSTEM.Models
{
    public class ServiceCombo
    {
        public ServiceCombo()
        {
            ServiceComboDetails = new List<ServiceComboDetail>();
            // Khởi tạo các Collections để tránh lỗi null
            Bookings = new List<Booking>();
            Coupons = new List<Coupon>();
            RequestSupports = new List<RequestSupport>();
        }

        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        // Khởi tạo non-null để tránh CS8618
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        // Khởi tạo non-null để tránh CS8618
        public string Address { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int AvailableSlots { get; set; }

        [MaxLength(255)]
        public string? Image { get; set; }

        [MaxLength(50)]
        // Khởi tạo non-null
        public string Status { get; set; } = "open";

        [MaxLength(1000)]
        public string? CancellationPolicy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public int HostId { get; set; }

        // Navigation properties
        [ForeignKey("HostId")]
        // Khởi tạo non-null để tránh CS8618
        public virtual Account Host { get; set; } = null!;

        public virtual ICollection<ServiceComboDetail> ServiceComboDetails { get; set; }

        // Bổ sung các Navigation Properties (Nếu cần dùng trong DbContext hoặc truy vấn)
        public virtual ICollection<Coupon> Coupons { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; }
        public virtual ICollection<RequestSupport> RequestSupports { get; set; }
    }
}