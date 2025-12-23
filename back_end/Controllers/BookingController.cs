using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs;
using System.Linq;
using System;

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
            try
            {
                var startTime = DateTime.UtcNow;
                
                // Sử dụng method tối ưu với projection thay vì Include
                var bookings = await _service.GetByUserIdOptimizedAsync(userId);
                
                var elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds;
                
                // Log thời gian query để debug
                Console.WriteLine($"[BookingController] GetByUserId({userId}) took {elapsed}ms, found {bookings?.Count() ?? 0} bookings");
                
                if (bookings == null || !bookings.Any()) 
                {
                    return Ok(new List<BookingDto>()); // Trả về mảng rỗng thay vì NotFound
                }
                return Ok(bookings.Select(b => MapToDto(b)));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BookingController] Error in GetByUserId({userId}): {ex.Message}");
                Console.WriteLine($"[BookingController] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách booking", error = ex.Message });
            }
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
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            // Kiểm tra ModelState trước để xem có lỗi validation nào không
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray()
                    );
                
                return BadRequest(new { 
                    message = "Validation failed", 
                    errors = errors
                });
            }

            if (dto == null)
            {
                return BadRequest(new { message = "Invalid booking data. DTO is null." });
            }

            // Validate DTO manually
            if (dto.UserId <= 0)
            {
                return BadRequest(new { message = "UserId phải lớn hơn 0." });
            }

            if (string.IsNullOrWhiteSpace(dto.ItemType))
            {
                return BadRequest(new { message = "ItemType là bắt buộc." });
            }

            if (dto.ItemType != "combo" && dto.ItemType != "service")
            {
                return BadRequest(new { message = "ItemType phải là 'combo' hoặc 'service'." });
            }

            if (dto.Quantity <= 0)
            {
                return BadRequest(new { message = "Quantity phải lớn hơn 0." });
            }

            try
            {
                var created = await _service.CreateFromDtoAsync(dto);
                return Ok(MapToDto(created));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo booking", error = ex.Message });
            }
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
            var dto = new BookingDto
            {
                Id = b.Id,
                BookingNumber = b.BookingNumber ?? string.Empty,
                UserId = b.UserId,
                ServiceComboId = b.ServiceComboId,
                ServiceId = b.ServiceId,
                Quantity = b.Quantity,
                UnitPrice = b.UnitPrice,
                TotalAmount = b.TotalAmount,
                Status = b.Status ?? "pending",
                Notes = b.Notes,
                BookingDate = b.BookingDate,
                ConfirmedDate = b.ConfirmedDate,
                CompletedDate = b.CompletedDate,
                ItemType = b.ItemType ?? string.Empty
            };

            // Map User details (người đặt)
            if (b.User != null)
            {
                dto.User = new BookingUserInfoDto
                {
                    Id = b.User.Id,
                    Name = b.User.Name ?? string.Empty,
                    Email = b.User.Email,
                    Phone = b.User.Phone,
                    Avatar = b.User.Avatar
                };
            }

            // Map ServiceCombo details
            if (b.ServiceCombo != null)
            {
                dto.ServiceCombo = new ServiceComboInfoDto
                {
                    Id = b.ServiceCombo.Id,
                    Name = b.ServiceCombo.Name ?? string.Empty,
                    Address = b.ServiceCombo.Address ?? string.Empty,
                    Description = b.ServiceCombo.Description,
                    Price = b.ServiceCombo.Price,
                    Image = b.ServiceCombo.Image
                };
            }

            // Map Service details
            if (b.Service != null)
            {
                dto.Service = new ServiceInfoDto
                {
                    Id = b.Service.Id,
                    Name = b.Service.Name ?? string.Empty,
                    Description = b.Service.Description,
                    Price = b.Service.Price,
                    Images = b.Service.Images
                };
            }

            return dto;
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
