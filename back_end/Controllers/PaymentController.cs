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
                Console.WriteLine($"[Webhook] ========== WEBHOOK RECEIVED ==========");
                Console.WriteLine($"[Webhook] Timestamp: {DateTime.UtcNow}");
                
                // Bypass ngrok warning page - PayOS sẽ gọi với header này
                // Nếu không có, vẫn xử lý bình thường
                Response.Headers.Add("ngrok-skip-browser-warning", "true");

                var ok = await _paymentService.HandleWebhookAsync(Request);

                Console.WriteLine($"[Webhook] HandleWebhookAsync returned: {ok}");

                // Luôn trả về 200 OK để PayOS biết endpoint hoạt động
                // (kể cả khi không tìm thấy payment - có thể là test request)
                if (ok)
                {
                    Console.WriteLine($"[Webhook] ========== WEBHOOK PROCESSED SUCCESSFULLY ==========");
                    return Ok(new { message = "Webhook processed successfully" });
                }
                else
                {
                    Console.WriteLine($"[Webhook] ========== WEBHOOK VALIDATION FAILED ==========");
                    // Nếu checksum không hợp lệ và có orderCode → có thể là fake request
                    // Nhưng vẫn trả về 200 để PayOS test có thể pass
                    return Ok(new { message = "Webhook received (validation failed but endpoint is active)" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Webhook] ========== WEBHOOK EXCEPTION ==========");
                Console.WriteLine($"[Webhook] Exception: {ex.Message}");
                Console.WriteLine($"[Webhook] StackTrace: {ex.StackTrace}");
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

                // Kiểm tra đã có payment success cho upgrade này chưa (đã thanh toán rồi)
                var successPayment = await _db.Payments
                    .Where(p => p.UserId == req.UserId
                        && p.PaymentType == $"Upgrade{req.UpgradeType}"
                        && p.Status == "success")
                    .FirstOrDefaultAsync();

                if (successPayment != null)
                    return BadRequest("You have already completed payment for this upgrade. Please wait for admin approval.");

                // Kiểm tra đã có payment pending cho upgrade này chưa
                var pendingPayment = await _db.Payments
                    .Where(p => p.UserId == req.UserId
                        && p.PaymentType == $"Upgrade{req.UpgradeType}"
                        && p.Status == "success")
                    .FirstOrDefaultAsync();

                if (pendingPayment != null)
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

        // Endpoint xử lý callback từ PayOS khi thanh toán thành công (cả /return và /result)
        [HttpGet("return")]
        [HttpGet("result")]
        public async Task<IActionResult> HandleReturn(
            [FromQuery] long? orderCode, 
            [FromQuery] string? status,
            [FromQuery] string? code,  // PayOS có thể gửi code=00 để báo thành công
            [FromQuery] string? id,    // Transaction ID từ PayOS
            [FromQuery] bool? cancel)  // PayOS có thể gửi cancel=false
        {
            try
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                
                // Log tất cả query parameters để debug
                Console.WriteLine($"[HandleReturn] ========== CALLBACK RECEIVED ==========");
                Console.WriteLine($"[HandleReturn] orderCode: {orderCode}");
                Console.WriteLine($"[HandleReturn] status: {status}");
                Console.WriteLine($"[HandleReturn] code: {code}");
                Console.WriteLine($"[HandleReturn] id: {id}");
                Console.WriteLine($"[HandleReturn] cancel: {cancel}");
                Console.WriteLine($"[HandleReturn] All query params: {Request.QueryString}");
                
                // PayOS có thể gửi code=00 để báo thành công, hoặc status=PAID
                // Nếu có code=00 hoặc status=PAID thì coi như thành công
                // QUAN TRỌNG: Luôn cập nhật payment khi có dấu hiệu thanh toán thành công
                bool isPaid = (code == "00" || status?.ToUpper() == "PAID") && (cancel != true);
                
                Console.WriteLine($"[HandleReturn] Payment status check - code: '{code}', status: '{status}', cancel: {cancel}, isPaid: {isPaid}");
                
                if (!orderCode.HasValue)
                {
                    Console.WriteLine($"[HandleReturn] Missing orderCode");
                    return Redirect($"{frontendUrl}/payment/failure/0?error=missing_order_code");
                }

                Console.WriteLine($"[HandleReturn] Processing payment - orderCode: {orderCode}, isPaid: {isPaid}");

                // Extract id từ orderCode
                // orderCode = id * 1_000_000L + (timestamp % 1_000_000)
                int extractedId = (int)(orderCode.Value / 1_000_000L);

                // Tìm payment theo orderCode - phân biệt upgrade vs booking giống như webhook
                Payment? payment = null;
                
                // Logic phân biệt Upgrade vs Booking dựa trên quy ước orderCode
                // Tìm payment mới nhất được tạo trong vòng 1 giờ gần đây (để đảm bảo tìm đúng payment vừa tạo)
                var recentTime = DateTime.UtcNow.AddHours(-1);
                
                if ((orderCode.Value % 1_000_000) >= 500_000)
                {
                    // Upgrade payment logic
                    int userId = (int)(orderCode.Value / 1_000_000);
                    
                    // Tìm payment mới nhất được tạo gần đây (không cần check status)
                    var allPayments = await _db.Payments
                        .Where(p => p.UserId == userId 
                            && p.BookingId == null
                            && p.UpdatedAt.HasValue 
                            && p.UpdatedAt.Value >= recentTime)
                        .OrderByDescending(p => p.Id)  // Payment mới nhất (ID lớn nhất)
                        .ToListAsync();
                    
                    Console.WriteLine($"[HandleReturn] Looking for upgrade payment with userId: {userId}, found {allPayments.Count} recent payments");
                    foreach (var p in allPayments)
                    {
                        Console.WriteLine($"[HandleReturn] Payment ID: {p.Id}, Status: {p.Status}, PaymentType: {p.PaymentType}, UpdatedAt: {p.UpdatedAt}");
                    }
                    
                    // Lấy payment mới nhất (ID lớn nhất = payment vừa tạo)
                    payment = allPayments.FirstOrDefault();
                }
                else
                {
                    // Booking payment logic
                    int bookingIdForSearch = (int)(orderCode.Value / 1_000_000);
                    
                    // Tìm payment mới nhất được tạo gần đây (không cần check status)
                    var allPayments = await _db.Payments
                        .Where(p => p.BookingId == bookingIdForSearch
                            && p.UpdatedAt.HasValue 
                            && p.UpdatedAt.Value >= recentTime)
                        .OrderByDescending(p => p.Id)  // Payment mới nhất (ID lớn nhất)
                        .ToListAsync();
                    
                    Console.WriteLine($"[HandleReturn] Looking for booking payment with bookingId: {bookingIdForSearch}, found {allPayments.Count} recent payments");
                    foreach (var p in allPayments)
                    {
                        Console.WriteLine($"[HandleReturn] Payment ID: {p.Id}, Status: {p.Status}, BookingId: {p.BookingId}, UpdatedAt: {p.UpdatedAt}");
                    }
                    
                    // Lấy payment mới nhất (ID lớn nhất = payment vừa tạo)
                    payment = allPayments.FirstOrDefault();
                }

                // Kiểm tra nếu là upgrade payment (không có BookingId)
                if (payment == null)
                {
                    Console.WriteLine($"[HandleReturn] ERROR: Payment not found for orderCode: {orderCode}");
                    return Redirect($"{frontendUrl}/payment/failure/0?error=payment_not_found");
                }

                Console.WriteLine($"[HandleReturn] Found payment ID: {payment.Id}, Status: {payment.Status}, BookingId: {payment.BookingId}, PaymentType: {payment.PaymentType}, UserId: {payment.UserId}");
                Console.WriteLine($"[HandleReturn] Received status from PayOS: '{status}', Payment current status: '{payment.Status}'");

                if (payment.BookingId == null && payment.PaymentType?.StartsWith("Upgrade") == true)
                {
                    // Đây là upgrade payment
                    var upgradeType = payment.PaymentType.Replace("Upgrade", ""); // "UpgradeAgency" -> "Agency"
                    var upgradeTypeLower = upgradeType.ToLower(); // "agency"
                    
                    // QUAN TRỌNG: Cập nhật payment status ngay khi PayOS báo thành công
                    if (isPaid)
                    {
                        // LUÔN cập nhật payment status khi thanh toán thành công (không cần check status cũ)
                        Console.WriteLine($"[HandleReturn] ✅ Updating upgrade payment {payment.Id} from '{payment.Status}' to 'success'");
                        payment.Status = "success";
                        payment.PaymentDate = DateTime.UtcNow;
                        payment.UpdatedAt = DateTime.UtcNow;
                        
                        // Lưu transaction ID nếu có
                        if (!string.IsNullOrEmpty(id))
                        {
                            payment.TransactionId = id;
                            Console.WriteLine($"[HandleReturn] Saved transaction ID: {id}");
                        }

                        // Cập nhật trạng thái Certificate thành "PaidPending" (đã thanh toán, chờ admin duyệt)
                        if (upgradeType == "Agency" && payment.UserId.HasValue)
                        {
                            var certificate = await _db.AgencieCertificates
                                .Where(c => c.AccountId == payment.UserId.Value && c.Status == "Pending")
                                .OrderByDescending(c => c.CreatedAt)
                                .FirstOrDefaultAsync();
                            
                            if (certificate != null)
                            {
                                certificate.Status = "PaidPending";
                                certificate.UpdatedAt = DateTime.UtcNow;
                            }
                        }

                        // QUAN TRỌNG: Lưu database ngay lập tức
                        try
                        {
                            var savedCount = await _db.SaveChangesAsync();
                            Console.WriteLine($"[HandleReturn] ✅ Successfully saved {savedCount} changes for upgrade payment {payment.Id}");
                            
                            // Verify payment was saved - đọc lại từ database để chắc chắn
                            await _db.Entry(payment).ReloadAsync();
                            Console.WriteLine($"[HandleReturn] ✅ Verified payment {payment.Id} status after save: {payment.Status}");
                            
                            if (payment.Status?.ToLower() != "success")
                            {
                                Console.WriteLine($"[HandleReturn] ⚠️ WARNING: Payment status was not updated correctly! Expected 'success', got '{payment.Status}'");
                                // Thử cập nhật lại
                                payment.Status = "success";
                                await _db.SaveChangesAsync();
                                Console.WriteLine($"[HandleReturn] ✅ Retried updating payment status");
                            }
                        }
                        catch (Exception saveEx)
                        {
                            Console.WriteLine($"[HandleReturn] ❌ Error saving upgrade payment: {saveEx.Message}");
                            Console.WriteLine($"[HandleReturn] StackTrace: {saveEx.StackTrace}");
                            // Vẫn redirect để user biết thanh toán thành công, nhưng log lỗi
                        }
                        return Redirect($"{frontendUrl}/upgrade-payment-success?type={upgradeTypeLower}&userId={payment.UserId}");
                    }
                    else
                    {
                        Console.WriteLine($"[HandleReturn] ⚠️ Payment not successful. code: '{code}', status: '{status}', cancel: '{cancel}', Payment status: '{payment.Status}'");
                    }
                    return Redirect($"{frontendUrl}/upgrade-payment-failure?type={upgradeTypeLower}&userId={payment.UserId}");
                }

                // Đây là booking payment
                int bookingId = extractedId;
                var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
                if (booking == null)
                {
                    return Redirect($"{frontendUrl}/payment/failure/{bookingId}?error=booking_not_found");
                }

                // Sử dụng payment đã tìm được từ orderCode (chính xác hơn)
                // Nếu không tìm thấy, thử tìm lại theo bookingId
                var bookingPayment = payment;
                if (bookingPayment == null || bookingPayment.BookingId != bookingId)
                {
                    bookingPayment = await _db.Payments
                        .Where(p => p.BookingId == bookingId)
                        .OrderByDescending(p => p.Id)
                        .FirstOrDefaultAsync();
                }

                // Nếu PayOS báo thành công (code=00 hoặc status=PAID), cập nhật payment và booking status
                if (isPaid)
                {
                    if (bookingPayment != null)
                    {
                        // QUAN TRỌNG: LUÔN cập nhật payment status khi thanh toán thành công
                        Console.WriteLine($"[HandleReturn] ✅ Updating booking payment {bookingPayment.Id} from '{bookingPayment.Status}' to 'success'");
                        bookingPayment.Status = "success";
                        bookingPayment.PaymentDate = DateTime.UtcNow;
                        bookingPayment.UpdatedAt = DateTime.UtcNow;
                        
                        // Lưu transaction ID nếu có
                        if (!string.IsNullOrEmpty(id))
                        {
                            bookingPayment.TransactionId = id;
                            Console.WriteLine($"[HandleReturn] Saved transaction ID: {id}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[HandleReturn] WARNING: Payment not found for bookingId {bookingId}, orderCode {orderCode}");
                    }
                    
                    // Cập nhật booking status thành "Confirmed" hoặc "Paid"
                    if (booking.Status?.ToLower() != "confirmed" && booking.Status?.ToLower() != "paid")
                    {
                        booking.Status = "Confirmed";
                        booking.UpdatedAt = DateTime.UtcNow;
                        Console.WriteLine($"[HandleReturn] Updating booking {bookingId} status to Confirmed");
                    }
                    
                    // QUAN TRỌNG: Lưu database ngay lập tức
                    try
                    {
                        var savedCount = await _db.SaveChangesAsync();
                        Console.WriteLine($"[HandleReturn] ✅ Successfully saved {savedCount} changes for booking {bookingId}");
                        
                        // Verify payment was saved - đọc lại từ database để chắc chắn
                        await _db.Entry(bookingPayment).ReloadAsync();
                        Console.WriteLine($"[HandleReturn] ✅ Verified booking payment {bookingPayment.Id} status after save: {bookingPayment.Status}");
                        
                        if (bookingPayment.Status?.ToLower() != "success")
                        {
                            Console.WriteLine($"[HandleReturn] ⚠️ WARNING: Payment status was not updated correctly! Expected 'success', got '{bookingPayment.Status}'");
                            // Thử cập nhật lại
                            bookingPayment.Status = "success";
                            await _db.SaveChangesAsync();
                            Console.WriteLine($"[HandleReturn] ✅ Retried updating payment status");
                        }
                    }
                    catch (Exception saveEx)
                    {
                        Console.WriteLine($"[HandleReturn] ❌ Error saving changes: {saveEx.Message}");
                        Console.WriteLine($"[HandleReturn] StackTrace: {saveEx.StackTrace}");
                    }
                    
                    return Redirect($"{frontendUrl}/payment/success/{bookingId}");
                }

                // Nếu payment đã success hoặc completed trước đó (tương thích ngược)
                if (bookingPayment != null && 
                    (bookingPayment.Status?.ToLower() == "success" || bookingPayment.Status?.ToLower() == "completed"))
                {
                    Console.WriteLine($"[HandleReturn] Payment {bookingPayment.Id} already completed, redirecting to success");
                    return Redirect($"{frontendUrl}/payment/success/{bookingId}");
                }
                
                // Nếu status không phải PAID và payment chưa success, log để debug
                Console.WriteLine($"[HandleReturn] Payment status: {bookingPayment?.Status}, PayOS status: {status}, redirecting to failure");

                return Redirect($"{frontendUrl}/payment/failure/{bookingId}");
            }
            catch (Exception ex)
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                Console.WriteLine($"[HandleReturn] Error: {ex.Message}");
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

                // Tìm payment theo orderCode
                var payment = await FindPaymentByOrderCode(orderCode.Value);

                // Kiểm tra nếu là upgrade payment
                if (payment != null && payment.BookingId == null && payment.PaymentType?.StartsWith("Upgrade") == true)
                {
                    var upgradeType = payment.PaymentType.Replace("Upgrade", "").ToLower();
                    
                    // Cập nhật payment status thành cancelled
                    if (payment.Status?.ToLower() == "pending")
                    {
                        payment.Status = "cancelled";
                        payment.UpdatedAt = DateTime.UtcNow;
                        await _db.SaveChangesAsync();
                    }
                    
                    return Redirect($"{frontendUrl}/upgrade-payment-failure?type={upgradeType}&userId={payment.UserId}&reason=cancelled");
                }

                // Đây là booking payment
                int bookingId = (int)(orderCode.Value / 1_000_000L);
                
                // Cập nhật payment status thành cancelled
                var bookingPayment = await _db.Payments
                    .Where(p => p.BookingId == bookingId)
                    .OrderByDescending(p => p.UpdatedAt)
                    .FirstOrDefaultAsync();
                    
                if (bookingPayment != null && bookingPayment.Status?.ToLower() == "pending")
                {
                    bookingPayment.Status = "cancelled";
                    bookingPayment.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }
                
                return Redirect($"{frontendUrl}/payment/failure/{bookingId}?reason=cancelled");
            }
            catch (Exception ex)
            {
                var frontendUrl = _payOSOptions.FrontendUrl.TrimEnd('/');
                Console.WriteLine($"[HandleCancel] Error: {ex.Message}");
                return Redirect($"{frontendUrl}/payment/failure/0?error=server_error");
            }
        }


        private async Task<Payment?> FindPaymentByOrderCode(long orderCode)
        {
            int id = (int)(orderCode / 1_000_000);

            return await _db.Payments
                .OrderByDescending(p => p.Id)
                .FirstOrDefaultAsync(p =>
                    p.BookingId == id || p.UserId == id);
        }

        // Endpoint để manually update payment status (dùng để test/debug)
        [HttpPost("manual-update-status/{paymentId}")]
        public async Task<IActionResult> ManualUpdatePaymentStatus(int paymentId, [FromQuery] string status)
        {
            try
            {
                var payment = await _db.Payments.FirstOrDefaultAsync(p => p.Id == paymentId);
                if (payment == null)
                {
                    return NotFound($"Payment with ID {paymentId} not found");
                }

                var oldStatus = payment.Status;
                Console.WriteLine($"[ManualUpdate] Payment {paymentId} current status: {oldStatus}, updating to: {status}");
                
                payment.Status = status;
                payment.UpdatedAt = DateTime.UtcNow;
                
                if (status?.ToLower() == "success")
                {
                    payment.PaymentDate = DateTime.UtcNow;
                }

                var savedCount = await _db.SaveChangesAsync();
                Console.WriteLine($"[ManualUpdate] Successfully saved {savedCount} changes for payment {paymentId}");

                // Verify
                var verifyPayment = await _db.Payments.FirstOrDefaultAsync(p => p.Id == paymentId);
                return Ok(new 
                { 
                    message = "Payment status updated successfully",
                    paymentId = paymentId,
                    oldStatus = oldStatus,
                    newStatus = verifyPayment?.Status,
                    savedCount = savedCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ManualUpdate] Error: {ex.Message}");
                Console.WriteLine($"[ManualUpdate] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error updating payment status", error = ex.Message });
            }
        }

        // Endpoint để kiểm tra payment theo orderCode (dùng để test/debug)
        [HttpGet("check-payment-by-ordercode")]
        public async Task<IActionResult> CheckPaymentByOrderCode([FromQuery] long orderCode)
        {
            try
            {
                Console.WriteLine($"[CheckPayment] Checking payment for orderCode: {orderCode}");
                
                Payment? payment = null;
                
                // Logic phân biệt Upgrade vs Booking
                if ((orderCode % 1_000_000) >= 500_000)
                {
                    int userId = (int)(orderCode / 1_000_000);
                    var allPayments = await _db.Payments
                        .Where(p => p.UserId == userId && p.BookingId == null)
                        .OrderByDescending(p => p.Id)
                        .ToListAsync();
                    
                    payment = allPayments.FirstOrDefault();
                    
                    return Ok(new
                    {
                        orderCode = orderCode,
                        type = "upgrade",
                        userId = userId,
                        foundPayments = allPayments.Count,
                        payments = allPayments.Select(p => new
                        {
                            id = p.Id,
                            status = p.Status,
                            paymentType = p.PaymentType,
                            userId = p.UserId,
                            bookingId = p.BookingId,
                            amount = p.Amount,
                            updatedAt = p.UpdatedAt
                        }).ToList(),
                        selectedPayment = payment != null ? new
                        {
                            id = payment.Id,
                            status = payment.Status,
                            paymentType = payment.PaymentType,
                            userId = payment.UserId,
                            bookingId = payment.BookingId,
                            amount = payment.Amount,
                            updatedAt = payment.UpdatedAt
                        } : null
                    });
                }
                else
                {
                    int bookingId = (int)(orderCode / 1_000_000);
                    var allPayments = await _db.Payments
                        .Where(p => p.BookingId == bookingId)
                        .OrderByDescending(p => p.Id)
                        .ToListAsync();
                    
                    payment = allPayments.FirstOrDefault();
                    
                    return Ok(new
                    {
                        orderCode = orderCode,
                        type = "booking",
                        bookingId = bookingId,
                        foundPayments = allPayments.Count,
                        payments = allPayments.Select(p => new
                        {
                            id = p.Id,
                            status = p.Status,
                            paymentType = p.PaymentType,
                            userId = p.UserId,
                            bookingId = p.BookingId,
                            amount = p.Amount,
                            updatedAt = p.UpdatedAt
                        }).ToList(),
                        selectedPayment = payment != null ? new
                        {
                            id = payment.Id,
                            status = payment.Status,
                            paymentType = payment.PaymentType,
                            userId = payment.UserId,
                            bookingId = payment.BookingId,
                            amount = payment.Amount,
                            updatedAt = payment.UpdatedAt
                        } : null
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CheckPayment] Error: {ex.Message}");
                Console.WriteLine($"[CheckPayment] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error checking payment", error = ex.Message });
            }
        }

    }
}
