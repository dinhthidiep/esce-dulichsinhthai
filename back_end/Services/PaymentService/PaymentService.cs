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
            // Load User với Role để kiểm tra role Agency
            var user = await _db.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user == null)
            {
                throw new Exception($"Không tìm thấy user với ID: {booking.UserId}");
            }

            // Kiểm tra nếu user là Agency
            bool isAgency = user.Role?.Name?.ToLower() == "agency";
            
            decimal originalAmount = amount;
            decimal discountAmount = 0;
            decimal finalAmount;

            // Logic thanh toán:
            // 1. Tất cả user đều chỉ thanh toán 10% số tiền
            // 2. Agency được giảm thêm 3% trước khi tính 10%
            
            if (isAgency)
            {
                // Agency: Giảm 3% trước, rồi thanh toán 10% của số tiền đã giảm
                discountAmount = amount * 0.03m;
                decimal amountAfterDiscount = amount - discountAmount;
                finalAmount = amountAfterDiscount * 0.10m;
                
                Console.WriteLine($"[PaymentService] Agency payment calculation for User {user.Id}:");
                Console.WriteLine($"  - Original Amount: {originalAmount:N0} VND");
                Console.WriteLine($"  - Agency Discount (3%): {discountAmount:N0} VND");
                Console.WriteLine($"  - Amount after discount: {amountAfterDiscount:N0} VND");
                Console.WriteLine($"  - Final payment (10% of discounted amount): {finalAmount:N0} VND");
            }
            else
            {
                // User thường: Chỉ thanh toán 10% số tiền gốc
                finalAmount = amount * 0.10m;
                
                Console.WriteLine($"[PaymentService] Regular user payment calculation for User {user.Id}:");
                Console.WriteLine($"  - Original Amount: {originalAmount:N0} VND");
                Console.WriteLine($"  - Final payment (10%): {finalAmount:N0} VND");
            }

            // PayOS chỉ cho phép description tối đa 25 ký tự
            if (string.IsNullOrEmpty(description))
            {
                description = $"TT DV #{booking.Id}";
            }
            else if (description.Length > 25)
            {
                description = description.Substring(0, 25);
            }

            // Sử dụng finalAmount (đã áp dụng discount nếu là Agency) để thanh toán
            long amountVND = (long)finalAmount;

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
            // Lưu originalAmount vào Amount để theo dõi số tiền gốc
            // finalAmount là số tiền thực tế thanh toán qua PayOS
            var payment = new Payment
            {
                BookingId = booking.Id,
                Amount = originalAmount, // Lưu số tiền gốc (trước khi giảm giá)
                Method = "PAYOS",
                Status = "pending",
                UpdatedAt = DateTime.UtcNow,
                OrderCode = orderCode, // Lưu OrderCode để tìm payment chính xác
                PaymentType = "Booking"
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
            
            Console.WriteLine($"[PaymentService] Payment created: ID={payment.Id}, OriginalAmount={originalAmount:N0} VND, FinalAmount={finalAmount:N0} VND, IsAgency={isAgency}");
            if (isAgency)
            {
                Console.WriteLine($"[PaymentService] Agency payment details: Discount 3% = {discountAmount:N0} VND, Payment 10% = {finalAmount:N0} VND");
            }

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

                // --- TÌM PAYMENT TRONG DB BẰNG ORDERCODE (CHÍNH XÁC NHẤT) ---
                Payment? payment = await _db.Payments
                    .FirstOrDefaultAsync(p => p.OrderCode == orderCode);
                
                if (payment == null)
                {
                    // Fallback: Nếu không tìm thấy bằng OrderCode, thử tìm bằng cách extract id (cho các payment cũ chưa có OrderCode)
                    Console.WriteLine($"[Webhook] ⚠️ Payment not found by OrderCode {orderCode}, trying fallback method...");
                    
                    // Logic phân biệt Upgrade vs Booking dựa trên quy ước orderCode
                    if ((orderCode % 1_000_000) >= 500_000)
                    {
                        // Upgrade payment logic
                        int userId = (int)(orderCode / 1_000_000);
                        Console.WriteLine($"[Webhook] Looking for upgrade payment - userId: {userId}, orderCode: {orderCode}");
                        
                        payment = await _db.Payments
                            .Where(p => p.UserId == userId && p.BookingId == null)
                            .OrderByDescending(p => p.Id)
                            .FirstOrDefaultAsync();
                    }
                    else
                    {
                        // Booking payment logic
                        int bookingId = (int)(orderCode / 1_000_000);
                        Console.WriteLine($"[Webhook] Looking for booking payment - bookingId: {bookingId}, orderCode: {orderCode}");
                        
                        payment = await _db.Payments
                            .Where(p => p.BookingId == bookingId)
                            .OrderByDescending(p => p.Id)
                            .FirstOrDefaultAsync();
                    }
                }
                else
                {
                    Console.WriteLine($"[Webhook] ✅ Found payment by OrderCode: ID={payment.Id}, Status={payment.Status}, BookingId={payment.BookingId}, UserId={payment.UserId}");
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
                UpdatedAt = DateTime.UtcNow,
                OrderCode = orderCode // Lưu OrderCode để tìm payment chính xác
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
