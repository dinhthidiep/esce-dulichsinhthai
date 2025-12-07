using ESCE_SYSTEM.DTOs.Coupon;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
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

        [HttpGet("combo/{serviceComboId}")]
        public async Task<IActionResult> GetByServiceComboId(int serviceComboId)
        {
            var result = await _service.GetByServiceComboIdAsync(serviceComboId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateCouponDto couponDto)
        {
            var result = await _service.CreateAsync(couponDto);
            return Ok(result);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateCouponDto couponDto)
        {
            var result = await _service.UpdateAsync(id, couponDto);
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
            var isValid = await _service.ValidateCouponAsync(request.Code, request.ServiceComboId);
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
        public int? ServiceComboId { get; set; }
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