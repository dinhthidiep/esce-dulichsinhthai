using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int UsageLimit { get; set; }
        public int ServicecomboId { get; set; }
    }
}