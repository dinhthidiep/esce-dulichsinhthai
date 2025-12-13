using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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
        
        [Column("START_DATE")]
        public DateTime? StartDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int RequiredLevel { get; set; } = 0;
        
        [Column("TARGET_AUDIENCE")]
        [NotMapped] // Tạm thời bỏ qua cho đến khi chạy SQL script thêm cột
        public string? TargetAudience { get; set; }

        [JsonIgnore]
        public virtual Account? Host { get; set; }
        [JsonIgnore]
        public virtual ServiceCombo? ServiceCombo { get; set; }
        [JsonIgnore]
        public virtual ICollection<BookingCoupon> BookingCoupons { get; set; }
    }
}
