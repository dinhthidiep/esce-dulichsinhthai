using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CouponResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int UsageLimit { get; set; }
        public int UsageCount { get; set; }
        public int HostId { get; set; }
        public int ServicecomboId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}