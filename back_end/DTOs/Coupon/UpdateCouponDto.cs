using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.Coupon
{
    public class UpdateCouponDto
    {
        public string? Code { get; set; }
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int? ServiceComboId { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
