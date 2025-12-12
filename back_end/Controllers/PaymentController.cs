using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Services.PaymentService;
using ESCE_SYSTEM.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ESCEContext _db;
        private readonly IPaymentService _paymentService;
        private readonly PayOSOptions _payOSOptions;

        public PaymentController(ESCEContext db, IPaymentService paymentService, IOptions<PayOSOptions> payOSOptions)
        {
            _db = db;
            _paymentService = paymentService;
            _payOSOptions = payOSOptions.Value;
        }

        [HttpPost("create-intent")]
        public async Task<IActionResult> CreateIntent([FromBody] PaymentDto req)
        {
            try
            {
                if (req.Amount <= 0)
                    return BadRequest("Amount must be greater than 0");

                var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == req.BookingId);
                if (booking == null)
                    return NotFound("Booking not found");

                var response = await _paymentService.CreatePaymentAsync(booking, req.Amount, req.Description);

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating payment intent", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPost("payos-webhook")]
        public async Task<IActionResult> PayOSWebhook()
        {
            try
            {
                // Bypass ngrok warning page - PayOS sẽ gọi với header này
                // Nếu không có, vẫn xử lý bình thường
                Response.Headers.Add("ngrok-skip-browser-warning", "true");

                var ok = await _paymentService.HandleWebhookAsync(Request);

                // Luôn trả về 200 OK để PayOS biết endpoint hoạt động
                // (kể cả khi không tìm thấy payment - có thể là test request)
                if (ok)
                {
                    return Ok(new { message = "Webhook processed successfully" });
                }
                else
                {
                    // Nếu checksum không hợp lệ và có orderCode → có thể là fake request
                    // Nhưng vẫn trả về 200 để PayOS test có thể pass
                    return Ok(new { message = "Webhook received (validation failed but endpoint is active)" });
                }
            }
            catch (Exception ex)
            {
                // Ngay cả khi có exception, vẫn trả về 200 để PayOS biết endpoint hoạt động
                // (có thể là test request với format không đúng)
                return Ok(new { message = "Webhook endpoint is active", error = ex.Message });
            }
        }

        [HttpGet("status/{bookingId}")]
        public async Task<IActionResult> GetStatus(int bookingId)
        {
            var payment = await _db.Payments
                .Where(p => p.BookingId == bookingId)
                .OrderByDescending(p => p.UpdatedAt)
                .FirstOrDefaultAsync();

            if (payment == null)
                return NotFound("Payment not found");

            return Ok(payment);
        }

        [HttpPost("create-upgrade-payment")]
        public async Task<IActionResult> CreateUpgradePayment([FromBody] UpgradePaymentDto req)
        {
            try
            {
                if (req.Amount <= 0)
                    return BadRequest("Amount must be greater than 0");

                if (string.IsNullOrEmpty(req.UpgradeType) || (req.UpgradeType != "Host" && req.UpgradeType != "Agency"))
                    return BadRequest("UpgradeType must be 'Host' or 'Agency'");

                // Kiểm tra user có tồn tại không
                var user = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == req.UserId);
                if (user == null)
                    return NotFound("User not found");

                // Upgrade Host miễn phí, chỉ Agency cần thanh toán
                if (req.UpgradeType == "Host")
                    return BadRequest("Host upgrade is free, no payment required");

                // Kiểm tra đã có payment pending cho upgrade này chưa
                var existingPayment = await _db.Payments
                    .Where(p => p.UserId == req.UserId
                        && p.PaymentType == $"Upgrade{req.UpgradeType}"
                        && p.Status == "pending")
                    .FirstOrDefaultAsync();

                if (existingPayment != null)
                    return BadRequest("You already have a pending payment for this upgrade");

                var response = await _paymentService.CreateUpgradePaymentAsync(
                    req.UserId,
                    req.UpgradeType,
                    req.Amount,
                    req.Description
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating upgrade payment", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("upgrade-status/{userId}")]
        public async Task<IActionResult> GetUpgradePaymentStatus(int userId, [FromQuery] string upgradeType)
        {
            var payment = await _db.Payments
                .Where(p => p.UserId == userId
                    && p.PaymentType == $"Upgrade{upgradeType}"
                    && p.BookingId == null)
                .OrderByDescending(p => p.UpdatedAt)
                .FirstOrDefaultAsync();

            if (payment == null)
                return NotFound("Payment not found");

            return Ok(payment);
        }

        // Endpoint xử lý callback từ PayOS khi thanh toán thành công
        [HttpGet("return")]
        public async Task<IActionResult> HandleReturn([FromQuery] long? orderCode, [FromQuery] string? status)
        {
            try
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                
                if (!orderCode.HasValue)
                {
                    // Redirect đến trang lỗi nếu không có orderCode
                    return Redirect($"{frontendUrl}/payment/failure/0?error=missing_order_code");
                }

                // Extract bookingId từ orderCode
                // orderCode = bookingId * 1_000_000L + (timestamp % 1_000_000)
                int bookingId = (int)(orderCode.Value / 1_000_000L);

                // Kiểm tra booking có tồn tại không
                var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
                if (booking == null)
                {
                    return Redirect($"{frontendUrl}/payment/failure/{bookingId}?error=booking_not_found");
                }

                // Kiểm tra payment status
                var payment = await _db.Payments
                    .Where(p => p.BookingId == bookingId)
                    .OrderByDescending(p => p.UpdatedAt)
                    .FirstOrDefaultAsync();

                // Nếu status từ PayOS là "PAID" hoặc payment status là "completed", redirect đến success
                if (status?.ToUpper() == "PAID" || payment?.Status?.ToLower() == "completed")
                {
                    return Redirect($"{frontendUrl}/payment/success/{bookingId}");
                }

                // Ngược lại, redirect đến failure
                return Redirect($"{frontendUrl}/payment/failure/{bookingId}");
            }
            catch (Exception ex)
            {
                // Log error và redirect đến failure
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                return Redirect($"{frontendUrl}/payment/failure/0?error=server_error");
            }
        }

        // Endpoint xử lý callback từ PayOS khi người dùng hủy thanh toán
        [HttpGet("cancel")]
        public async Task<IActionResult> HandleCancel([FromQuery] long? orderCode)
        {
            try
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                
                if (!orderCode.HasValue)
                {
                    return Redirect($"{frontendUrl}/payment/failure/0?error=missing_order_code");
                }

                // Extract bookingId từ orderCode
                int bookingId = (int)(orderCode.Value / 1_000_000L);

                // Kiểm tra booking có tồn tại không
                var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
                if (booking == null)
                {
                    return Redirect($"{frontendUrl}/payment/failure/{bookingId}?error=booking_not_found");
                }

                // Redirect đến trang failure với thông báo hủy
                return Redirect($"{frontendUrl}/payment/failure/{bookingId}?reason=cancelled");
            }
            catch (Exception ex)
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                return Redirect($"{frontendUrl}/payment/failure/0?error=server_error");
            }
        }
    }
}
