using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _service;

        public ReviewController(IReviewService service)
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
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetByBookingId(int bookingId)
        {
            var result = await _service.GetByBookingIdAsync(bookingId);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var result = await _service.GetByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpGet("booking/{bookingId}/user/{userId}")]
        public async Task<IActionResult> GetByBookingIdAndUserId(int bookingId, int userId)
        {
            var result = await _service.GetByBookingIdAndUserIdAsync(bookingId, userId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("ServiceCombo/{ServiceComboId}/average-rating")]
        public async Task<IActionResult> GetAverageRatingByServiceCombo(int ServiceComboId)
        {
            var rating = await _service.GetAverageRatingByServicecomboAsync(ServiceComboId);
            return Ok(new { ServiceComboId = ServiceComboId, AverageRating = rating });
        }

        [HttpGet("service/{serviceId}/average-rating")]
        public async Task<IActionResult> GetAverageRatingByService(int serviceId)
        {
            var rating = await _service.GetAverageRatingByServiceAsync(serviceId);
            return Ok(new { ServiceId = serviceId, AverageRating = rating });
        }

        [HttpGet("booking/{bookingId}/user/{userId}/can-review")]
        public async Task<IActionResult> CanUserReview(int bookingId, int userId)
        {
            var canReview = await _service.CanUserReviewAsync(bookingId, userId);
            return Ok(new { CanReview = canReview });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Review review)
        {
            try
            {
                var result = await _service.CreateAsync(review);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Review review)
        {
            try
            {
                var result = await _service.UpdateAsync(id, review);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted successfully");
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReviewStatusRequest request)
        {
            var updated = await _service.UpdateStatusAsync(id, request.Status);
            if (!updated) return NotFound();
            return Ok($"Review status updated to {request.Status}");
        }
    }

    public class UpdateReviewStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
