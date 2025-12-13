using System.Text;
using System.Text.Json;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace ESCE_SYSTEM.Services.PaymentService
{
    public class PayOSPaymentService : IPaymentService
    {
        private readonly PayOSOptions _options;
        private readonly ESCEContext _db;
        private readonly HttpClient _httpClient;

        public PayOSPaymentService(IOptions<PayOSOptions> options, ESCEContext db, HttpClient httpClient)
        {
            _options = options.Value;
            _db = db;
            _httpClient = httpClient;

            // Validate PayOS configuration
            if (string.IsNullOrEmpty(_options.ClientId))
                throw new InvalidOperationException("PayOS ClientId is not configured in appsettings.json");
            if (string.IsNullOrEmpty(_options.ApiKey))
                throw new InvalidOperationException("PayOS ApiKey is not configured in appsettings.json");
            if (string.IsNullOrEmpty(_options.ChecksumKey))
                throw new InvalidOperationException("PayOS ChecksumKey is not configured in appsettings.json");

            // Cấu hình headers cho PayOS API
            // Note: HttpClient từ AddHttpClient đã được configure trong Program.cs
            // Nhưng để đảm bảo, chúng ta set lại ở đây
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-client-id", _options.ClientId);
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _options.ApiKey);
            
            // BaseAddress đã được set trong Program.cs, nhưng set lại để đảm bảo
            if (_httpClient.BaseAddress == null)
            {
                _httpClient.BaseAddress = new Uri("https://api-merchant.payos.vn/");
            }
        }

        // Tạo signature cho PayOS
        // PayOS yêu cầu: sắp xếp keys alphabetically, tạo string "key=value&key=value", dùng HMAC SHA256
        private string CreateSignature(Dictionary<string, object> data)
        {
            // Sắp xếp theo key alphabetically (case-sensitive)
            var sortedData = data.OrderBy(x => x.Key, StringComparer.Ordinal).ToList();

            // Tạo data string theo format: key=value&key=value
            var dataParts = new List<string>();
            foreach (var kvp in sortedData)
            {
                string value;
                if (kvp.Value == null)
                {
                    value = "";
                }
                else if (kvp.Value is long || kvp.Value is int || kvp.Value is decimal)
                {
                    // Số nguyên - convert trực tiếp
                    value = kvp.Value.ToString() ?? "";
                }
                else
                {
                    // String - giữ nguyên, không URL encode
                    value = kvp.Value.ToString() ?? "";
                }
                dataParts.Add($"{kvp.Key}={value}");
            }

            var dataStr = string.Join("&", dataParts);

            // Debug: Uncomment để xem data string
            // Console.WriteLine($"[SIGNATURE DEBUG] Data string: {dataStr}");

            // Tạo HMAC SHA256 với checksum key
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.ChecksumKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataStr));
            var signature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            // Debug: Uncomment để xem signature
            // Console.WriteLine($"[SIGNATURE DEBUG] Signature: {signature}");

            return signature;
        }

        // --------------------------------------
        // 1. TẠO THANH TOÁN CHO BOOKING
        // --------------------------------------
        public async Task<CreatePaymentResponse> CreatePaymentAsync(Booking booking, decimal amount, string description)
        {
            // PayOS chỉ cho phép description tối đa 25 ký tự
            if (string.IsNullOrEmpty(description))
            {
                description = $"TT DV #{booking.Id}";
            }
            else if (description.Length > 25)
            {
                description = description.Substring(0, 25);
            }

            long amountVND = (long)amount;

            long orderCode = booking.Id * 1_000_000L +
                             (DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1_000_000);

            // Tạo data để tính signature (CHỈ 5 field theo tài liệu PayOS)
            // Format: amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
            // LƯU Ý: KHÔNG bao gồm webhookUrl trong signature!
            var signatureData = new Dictionary<string, object>
            {
                { "amount", amountVND },
                { "cancelUrl", _options.CancelUrl },
                { "description", description },
                { "orderCode", orderCode },
                { "returnUrl", _options.ReturnUrl }
            };

            // Tạo signature (CHỈ với 5 field trên)
            var signature = CreateSignature(signatureData);

            // Tạo request body (KHÔNG bao gồm webhookUrl - PayOS không chấp nhận trong request body)
            // webhookUrl phải được cấu hình trong PayOS Dashboard: https://pay.payos.vn/web/dashboard
            var requestData = new Dictionary<string, object>(signatureData);

            // Thêm signature vào request
            requestData["signature"] = signature;

            // Gọi PayOS API - PayOS yêu cầu camelCase
            var jsonContent = JsonSerializer.Serialize(requestData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("v2/payment-requests", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"PayOS API error ({response.StatusCode}): {errorBody}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<JsonElement>(responseBody);

            // PayOS trả về code "00" là thành công
            if (responseData.TryGetProperty("code", out var code))
            {
                var codeValue = code.GetString();
                if (codeValue != "00")
                {
                    var message = responseData.TryGetProperty("desc", out var desc)
                        ? desc.GetString()
                        : "Unknown error";
                    throw new Exception($"PayOS API error (code: {codeValue}): {message}");
                }
            }

            // Lấy checkoutUrl từ response
            if (!responseData.TryGetProperty("data", out var dataElement))
            {
                throw new Exception($"PayOS API error: Response không có data field. Response: {responseBody}");
            }

            if (!dataElement.TryGetProperty("checkoutUrl", out var checkoutUrlElement))
            {
                throw new Exception($"PayOS API error: Response không có checkoutUrl. Response: {responseBody}");
            }

            var checkoutUrl = checkoutUrlElement.GetString() ?? "";

            // Lưu DB
            var payment = new Payment
            {
                BookingId = booking.Id,
                Amount = amount,
                Method = "PAYOS",
                Status = "pending",
                UpdatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return new CreatePaymentResponse
            {
                CheckoutUrl = checkoutUrl,
                OrderCode = orderCode.ToString()
            };
        }


        // --------------------------------------
        // 2. XỬ LÝ WEBHOOK PAYOS
        // --------------------------------------
        // --------------------------------------
        // 2. XỬ LÝ WEBHOOK PAYOS (ĐÃ SỬA)
        // --------------------------------------
        public async Task<bool> HandleWebhookAsync(HttpRequest request)
        {
            request.EnableBuffering();

            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            request.Body.Position = 0;

            Console.WriteLine($"[Webhook] Received webhook body: {body}");

            if (string.IsNullOrWhiteSpace(body))
            {
                Console.WriteLine($"[Webhook] Empty body, returning true");
                return true;
            }

            try
            {
                var webhookData = JsonSerializer.Deserialize<JsonElement>(body);
                Console.WriteLine($"[Webhook] Parsed webhook data successfully");

                // --- VERIFY SIGNATURE (GIỮ NGUYÊN) ---
                var receivedSignature = webhookData.GetProperty("signature").GetString();
                var dataToVerify = new Dictionary<string, object>();

                foreach (var prop in webhookData.EnumerateObject())
                {
                    if (prop.Name != "signature")
                    {
                        if (prop.Value.ValueKind == JsonValueKind.Number)
                            dataToVerify[prop.Name] = prop.Value.GetInt64();
                        else if (prop.Value.ValueKind == JsonValueKind.String)
                            dataToVerify[prop.Name] = prop.Value.GetString() ?? "";
                        else
                            dataToVerify[prop.Name] = prop.Value.GetRawText();
                    }
                }

                var calculatedSignature = CreateSignature(dataToVerify);
                if (receivedSignature != calculatedSignature) return false;

                // --- LẤY DATA TỪ WEBHOOK ---
                long orderCode = webhookData.GetProperty("orderCode").GetInt64();
                string status = webhookData.GetProperty("status").GetString() ?? "";
                string? transactionId = webhookData.TryGetProperty("transactionId", out var transId)
                    ? transId.GetString() : null;

                Payment? payment;

                // --- TÌM PAYMENT TRONG DB ---
                // Logic phân biệt Upgrade vs Booking dựa trên quy ước orderCode của bạn
                if ((orderCode % 1_000_000) >= 500_000)
                {
                    // Upgrade payment logic
                    int userId = (int)(orderCode / 1_000_000);
                    Console.WriteLine($"[Webhook] Looking for upgrade payment - userId: {userId}, orderCode: {orderCode}");
                    
                    var allPayments = await _db.Payments
                        .Where(p => p.UserId == userId && p.BookingId == null)
                        .OrderByDescending(p => p.Id)
                        .ToListAsync();
                    
                    Console.WriteLine($"[Webhook] Found {allPayments.Count} upgrade payments for userId {userId}");
                    foreach (var p in allPayments)
                    {
                        Console.WriteLine($"[Webhook] Payment ID: {p.Id}, Status: {p.Status}, PaymentType: {p.PaymentType}, Created: {p.UpdatedAt}");
                    }
                    
                    payment = allPayments.FirstOrDefault();
                }
                else
                {
                    // Booking payment logic
                    int bookingId = (int)(orderCode / 1_000_000);
                    Console.WriteLine($"[Webhook] Looking for booking payment - bookingId: {bookingId}, orderCode: {orderCode}");
                    
                    var allPayments = await _db.Payments
                        .Where(p => p.BookingId == bookingId)
                        .OrderByDescending(p => p.Id)
                        .ToListAsync();
                    
                    Console.WriteLine($"[Webhook] Found {allPayments.Count} booking payments for bookingId {bookingId}");
                    foreach (var p in allPayments)
                    {
                        Console.WriteLine($"[Webhook] Payment ID: {p.Id}, Status: {p.Status}, BookingId: {p.BookingId}, Created: {p.UpdatedAt}");
                    }
                    
                    payment = allPayments.FirstOrDefault();
                }

                if (payment == null)
                {
                    // Log để debug - không tìm thấy payment
                    Console.WriteLine($"[Webhook] Payment not found for orderCode: {orderCode}, status: {status}");
                    return true; // Không tìm thấy payment thì bỏ qua (có thể là test request)
                }

                // --- CẬP NHẬT TRẠNG THÁI PAYMENT ---
                // Chỉ cập nhật nếu trạng thái thay đổi để tránh ghi đè ngày giờ
                string newStatus = status == "PAID" ? "success" : status == "CANCELED" ? "cancelled" : "pending";

                // Log để debug
                Console.WriteLine($"[Webhook] Found payment ID: {payment.Id}, Current status: {payment.Status}, New status: {newStatus}, OrderCode: {orderCode}");

                if (payment.Status == newStatus)
                {
                    Console.WriteLine($"[Webhook] Payment status already {newStatus}, skipping update");
                    return true; // Trạng thái chưa đổi thì thôi
                }

                payment.Status = newStatus;
                payment.TransactionId = transactionId;
                payment.UpdatedAt = DateTime.UtcNow;

                if (payment.Status == "success")
                {
                    payment.PaymentDate = DateTime.UtcNow;
                    Console.WriteLine($"[Webhook] Payment {payment.Id} updated to success, PaymentDate set to {payment.PaymentDate}");
                }

                // --- [QUAN TRỌNG] LOGIC XỬ LÝ NGHIỆP VỤ SAU KHI THANH TOÁN ---

                // 1. Nếu là Booking Payment (Giữ nguyên logic cũ của bạn)
                if (payment.BookingId.HasValue)
                {
                    var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == payment.BookingId.Value);
                    if (booking != null)
                    {
                        if (payment.Status == "success")
                        {
                            booking.Status = "completed"; // Hoặc "Confirmed" tùy logic của bạn
                            booking.CompletedDate = DateTime.UtcNow;
                            booking.UpdatedAt = DateTime.UtcNow;
                        }
                        else if (payment.Status == "cancelled")
                        {
                            booking.Status = "cancelled";
                            booking.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
                // 2. [MỚI THÊM] Nếu là Upgrade Payment (Agency/Host)
                else if (payment.Status == "success" && !string.IsNullOrEmpty(payment.PaymentType) && payment.PaymentType.StartsWith("Upgrade"))
                {
                    var upgradeType = payment.PaymentType.Replace("Upgrade", ""); // Ví dụ: "Agency"

                    if (upgradeType == "Agency" && payment.UserId.HasValue)
                    {
                        // Tìm Certificate đang Pending của User đó
                        var certificate = await _db.AgencieCertificates
                            .Where(c => c.AccountId == payment.UserId.Value && c.Status == "Pending")
                            .OrderByDescending(c => c.CreatedAt)
                            .FirstOrDefaultAsync();

                        if (certificate != null)
                        {
                            // Cập nhật sang PaidPending (Đã thanh toán, chờ admin duyệt)
                            certificate.Status = "PaidPending";
                            certificate.UpdatedAt = DateTime.UtcNow;
                            Console.WriteLine($"[Webhook] Certificate {certificate.AgencyId} updated to PaidPending for user {payment.UserId}");
                        }
                    }
                    // Nếu có logic cho Host thì thêm else if vào đây
                }

                // QUAN TRỌNG: Đảm bảo SaveChangesAsync được gọi
                try
                {
                    var savedCount = await _db.SaveChangesAsync();
                    Console.WriteLine($"[Webhook] Successfully saved {savedCount} changes for payment {payment.Id}");
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Webhook] Error saving changes: {ex.Message}");
                    Console.WriteLine($"[Webhook] StackTrace: {ex.StackTrace}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Webhook] Exception: {ex.Message}");
                Console.WriteLine($"[Webhook] StackTrace: {ex.StackTrace}");
                return false;
            }
        }


        // --------------------------------------
        // 3. TẠO THANH TOÁN UPGRADE
        // --------------------------------------
        public async Task<CreatePaymentResponse> CreateUpgradePaymentAsync(int userId, string upgradeType, decimal amount, string description)
        {
            // PayOS chỉ cho phép description tối đa 25 ký tự
            if (string.IsNullOrEmpty(description))
            {
                description = $"Nâng cấp {upgradeType}";
            }
            else if (description.Length > 25)
            {
                description = description.Substring(0, 25);
            }

            // TODO: Đổi lại thành (long)amount khi deploy production
            // Hiện tại để 500 VND để test
            long amountVND = 5000; // Test với 500 VND

            long orderCode = userId * 1_000_000L +
                             500_000L +
                             (DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100_000);

            // Tạo data để tính signature (CHỈ 5 field theo tài liệu PayOS)
            // Format: amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
            // LƯU Ý: KHÔNG bao gồm webhookUrl trong signature!
            var signatureData = new Dictionary<string, object>
            {
                { "amount", amountVND },
                { "cancelUrl", _options.CancelUrl },
                { "description", description },
                { "orderCode", orderCode },
                { "returnUrl", _options.ReturnUrl }
            };

            // Tạo signature (CHỈ với 5 field trên)
            var signature = CreateSignature(signatureData);

            // Tạo request body (KHÔNG bao gồm webhookUrl - PayOS không chấp nhận trong request body)
            // webhookUrl phải được cấu hình trong PayOS Dashboard: https://pay.payos.vn/web/dashboard
            var requestData = new Dictionary<string, object>(signatureData);

            // Thêm signature vào request
            requestData["signature"] = signature;

            // Gọi PayOS API - PayOS yêu cầu camelCase
            var jsonContent = JsonSerializer.Serialize(requestData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("v2/payment-requests", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"PayOS API error ({response.StatusCode}): {errorBody}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<JsonElement>(responseBody);

            if (responseData.TryGetProperty("code", out var code) && code.GetString() != "00")
            {
                var message = responseData.TryGetProperty("desc", out var desc)
                    ? desc.GetString()
                    : "Unknown error";
                throw new Exception($"PayOS API error: {message}");
            }

            var checkoutUrl = responseData.GetProperty("data").GetProperty("checkoutUrl").GetString() ?? "";

            var payment = new Payment
            {
                UserId = userId,
                Amount = amount,
                Method = "PAYOS",
                Status = "pending",
                PaymentType = "Upgrade" + upgradeType,
                UpgradeType = upgradeType,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return new CreatePaymentResponse
            {
                CheckoutUrl = checkoutUrl,
                OrderCode = orderCode.ToString()
            };
        }  
        
    }
}
