using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _service;

        public BookingController(IBookingService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var result = await _service.GetByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpGet("combo/{serviceComboId}")]
        public async Task<IActionResult> GetByServiceComboId(int serviceComboId)
        {
            var result = await _service.GetByServiceComboIdAsync(serviceComboId);
            return Ok(result);
        }

        [HttpGet("service/{serviceId}")]
        public async Task<IActionResult> GetByServiceId(int serviceId)
        {
            var result = await _service.GetByServiceIdAsync(serviceId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Booking booking)
        {
            var result = await _service.CreateAsync(booking);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Booking booking)
        {
            var result = await _service.UpdateAsync(id, booking);
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

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var updated = await _service.UpdateStatusAsync(id, status);
            if (!updated) return NotFound();
            return Ok($"Status updated to {status}");
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateTotalAmount([FromBody] CalculateAmountRequest request)
        {
            var totalAmount = await _service.CalculateTotalAmountAsync(
                request.ServiceComboId,
                request.ServiceId,
                request.Quantity,
                request.ItemType);

            return Ok(new { TotalAmount = totalAmount });
        }

        [HttpGet("{id}/total-with-coupons")]
        public async Task<IActionResult> CalculateTotalAmountWithCoupons(int id)
        {
            var totalAmount = await _service.CalculateTotalAmountWithCouponsAsync(id);
            return Ok(new { TotalAmount = totalAmount });
        }
    }

    public class CalculateAmountRequest
    {
        public int ServiceComboId { get; set; }
        public int ServiceId { get; set; }
        public int Quantity { get; set; }
        public string ItemType { get; set; } = string.Empty;
    }
}