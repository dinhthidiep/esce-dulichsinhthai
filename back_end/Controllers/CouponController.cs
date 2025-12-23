using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.DTOs.Post;
using Microsoft.AspNetCore.Mvc;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _service;

        public CouponController(ICouponService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveCoupons()
        {
            var result = await _service.GetActiveCouponsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("code/{code}")]
        public async Task<ActionResult> GetByCode(string code)
        {
            var result = await _service.GetByCodeAsync(code);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("host/{hostId}")]
        public async Task<IActionResult> GetByHostId(int hostId)
        {
            var result = await _service.GetByHostIdAsync(hostId);
            return Ok(result);
        }

        [HttpGet("combo/{ServicecomboId}")]
        public async Task<IActionResult> GetByServiceComboId(int ServicecomboId)
        {
            var result = await _service.GetByServiceComboIdAsync(ServicecomboId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCouponDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Dữ liệu coupon không hợp lệ");
                }
                
                // Validate required fields
                if (string.IsNullOrWhiteSpace(dto.Code))
                {
                    return BadRequest("Mã coupon không được để trống");
                }
                
                if (!dto.HostId.HasValue || dto.HostId <= 0)
                {
                    return BadRequest("HostId không hợp lệ");
                }
                
                // Map DTO to Coupon entity
                var coupon = new Coupon
                {
                    Code = dto.Code ?? string.Empty,
                    Description = dto.Description,
                    DiscountPercent = dto.DiscountPercent,
                    DiscountAmount = dto.DiscountAmount,
                    UsageLimit = dto.UsageLimit ?? 1,
                    UsageCount = dto.UsageCount ?? 0,
                    HostId = dto.HostId ?? 0,
                    ServiceComboId = dto.ServiceComboId,
                    IsActive = dto.IsActive ?? true,
                    StartDate = dto.StartDate,
                    ExpiryDate = dto.ExpiryDate,
                    RequiredLevel = dto.RequiredLevel ?? 0,
                    TargetAudience = dto.TargetAudience,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                
                var result = await _service.CreateAsync(coupon);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Lỗi khi tạo coupon: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCouponDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Dữ liệu coupon không hợp lệ");
            }
            
            // Map DTO to Coupon entity for update
            var coupon = new Coupon
            {
                Code = dto.Code ?? string.Empty,
                Description = dto.Description,
                DiscountPercent = dto.DiscountPercent,
                DiscountAmount = dto.DiscountAmount,
                UsageLimit = dto.UsageLimit ?? 1,
                ServiceComboId = dto.ServiceComboId,
                IsActive = dto.IsActive,
                StartDate = dto.StartDate,
                ExpiryDate = dto.ExpiryDate,
                RequiredLevel = dto.RequiredLevel ?? 0,
                TargetAudience = dto.TargetAudience
            };
            
            var result = await _service.UpdateAsync(id, coupon);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted");
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            var isValid = await _service.ValidateCouponAsync(request.Code, request.ServicecomboId);
            return Ok(new { IsValid = isValid });
        }

        [HttpPost("calculate-discount")]
        public async Task<IActionResult> CalculateDiscount([FromBody] CalculateDiscountRequest request)
        {
            var discount = await _service.CalculateDiscountAsync(request.Code, request.OriginalAmount);
            return Ok(new { Discount = discount });
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponRequest request)
        {
            var applied = await _service.ApplyCouponAsync(request.BookingId, request.CouponCode);
            if (!applied) return BadRequest("Cannot apply coupon");
            return Ok("Coupon applied successfully");
        }

        [HttpPost("remove")]
        public async Task<IActionResult> RemoveCoupon([FromBody] RemoveCouponRequest request)
        {
            var removed = await _service.RemoveCouponAsync(request.BookingId, request.CouponCode);
            if (!removed) return BadRequest("Cannot remove coupon");
            return Ok("Coupon removed successfully");
        }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public int? ServicecomboId { get; set; }
    }

    public class CalculateDiscountRequest
    {
        public string Code { get; set; } = string.Empty;
        public decimal OriginalAmount { get; set; }
    }

    public class ApplyCouponRequest
    {
        public int BookingId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
    }

    public class RemoveCouponRequest
    {
        public int BookingId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
    }
}
