using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs;

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

        // Lấy tất cả booking
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var bookings = await _service.GetAllAsync();
            var result = bookings.Select(b => MapToDto(b));
            return Ok(result);
        }

        // Lấy booking theo id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var booking = await _service.GetByIdAsync(id);
            if (booking == null) return NotFound();
            return Ok(MapToDto(booking));
        }

        // Lấy booking theo userId
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var bookings = await _service.GetByUserIdAsync(userId);
            if (bookings == null || !bookings.Any()) return NotFound();
            return Ok(bookings.Select(b => MapToDto(b)));
        }

        // Lấy booking theo serviceComboId
        [HttpGet("combo/{serviceComboId}")]
        public async Task<IActionResult> GetByServiceComboId(int serviceComboId)
        {
            var bookings = await _service.GetByServiceComboIdAsync(serviceComboId);
            if (bookings == null || !bookings.Any()) return NotFound();
            return Ok(bookings.Select(b => MapToDto(b)));
        }

        // Lấy booking theo serviceId
        [HttpGet("service/{serviceId}")]
        public async Task<IActionResult> GetByServiceId(int serviceId)
        {
            var bookings = await _service.GetByServiceIdAsync(serviceId);
            if (bookings == null || !bookings.Any()) return NotFound();
            return Ok(bookings.Select(b => MapToDto(b)));
        }

        // Tạo booking mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Booking booking)
        {
            if (booking == null || booking.UserId <= 0 || string.IsNullOrEmpty(booking.Status))
                return BadRequest("Invalid booking data.");

            var created = await _service.CreateAsync(booking);
            return Ok(MapToDto(created));
        }

        // Cập nhật booking
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Booking booking)
        {
            if (booking == null) return BadRequest("Invalid booking data.");

            var updated = await _service.UpdateAsync(id, booking);
            if (updated == null) return NotFound();
            return Ok(MapToDto(updated));
        }

        // Xóa booking
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted");
        }

        // Cập nhật status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            if (string.IsNullOrEmpty(status)) return BadRequest("Status cannot be empty.");

            var updated = await _service.UpdateStatusAsync(id, status);
            if (!updated) return NotFound();
            return Ok($"Status updated to {status}");
        }

        // Tính tổng tiền
        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateTotalAmount([FromBody] CalculateAmountRequest request)
        {
            var total = await _service.CalculateTotalAmountAsync(
                request.ServiceComboId,
                request.ServiceId,
                request.Quantity,
                request.ItemType
            );
            return Ok(new { TotalAmount = total });
        }

        // Tính tổng tiền với coupon
        [HttpGet("{id}/total-with-coupons")]
        public async Task<IActionResult> CalculateTotalAmountWithCoupons(int id)
        {
            var total = await _service.CalculateTotalAmountWithCouponsAsync(id);
            return Ok(new { TotalAmount = total });
        }

        // ----------------- Helper -----------------
        private BookingDto MapToDto(Booking b)
        {
            return new BookingDto
            {
                Id = b.Id,
                BookingNumber = b.BookingNumber,
                UserId = b.UserId,
                ServiceComboId = b.ServiceComboId,
                ServiceId = b.ServiceId,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                BookingDate = b.BookingDate
            };
        }
    }

    // Request cho tính tổng
    public class CalculateAmountRequest
    {
        public int ServiceComboId { get; set; }
        public int ServiceId { get; set; }
        public int Quantity { get; set; }
        public string ItemType { get; set; } = string.Empty;
    }
}
