using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.Coupon
{
    public class CreateCouponDto
    {
        [Required]
        public string Code { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int UsageLimit { get; set; }
        [Required]
        public int HostId { get; set; }
        public int? ServiceComboId { get; set; }
        public bool? IsActive { get; set; } = true;
        public DateTime? ExpiryDate { get; set; }
    }
}
