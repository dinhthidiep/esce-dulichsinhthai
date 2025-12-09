using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services.PaymentService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ESCEContext _db;
        private readonly IPaymentService _paymentService;

        public PaymentController(ESCEContext db, IPaymentService paymentService)
        {
            _db = db;
            _paymentService = paymentService;
        }

        public class CreatePaymentRequest
        {
            public int BookingId { get; set; }
            public decimal Amount { get; set; }
            public string Description { get; set; } = string.Empty;
        }

        [HttpPost("create-intent")]
        public async Task<IActionResult> CreateIntent([FromBody] CreatePaymentRequest req)
        {
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == req.BookingId);
            if (booking == null) return NotFound("Booking not found");

            var res = await _paymentService.CreatePaymentAsync(booking, req.Amount, req.Description);
            return Ok(res);
        }

        [HttpPost("payos-webhook")]
        public async Task<IActionResult> PayOSWebhook()
        {
            var ok = await _paymentService.HandleWebhookAsync(Request);
            if (!ok) return BadRequest();
            return Ok();
        }

        [HttpGet("status/{bookingId}")]
        public async Task<IActionResult> GetStatus([FromRoute] int bookingId)
        {
            var payment = await _db.Payments.Where(p => p.BookingId == bookingId)
                .OrderByDescending(p => p.PaymentDate)
                .FirstOrDefaultAsync();
            if (payment == null) return NotFound();
            return Ok(new { payment.Status, payment.Method, payment.Amount });
        }
    }
}