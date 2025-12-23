using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateCouponDto
    {
        public string? Code { get; set; }
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int? UsageCount { get; set; }
        public int? HostId { get; set; }
        public int? ServiceComboId { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? RequiredLevel { get; set; }
        public string? TargetAudience { get; set; }
    }
}
