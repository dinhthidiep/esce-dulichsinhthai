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
        private readonly PayOSOption _options;
        private readonly ESCEContext _db;
        private readonly HttpClient _httpClient;

        public PayOSPaymentService(IOptions<PayOSOption> options, ESCEContext db, HttpClient httpClient)
        {
            _options = options.Value;
            _db = db;
            _httpClient = httpClient;

            // Cấu hình headers cho PayOS API
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-client-id", _options.ClientId);
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _options.ApiKey);
            _httpClient.BaseAddress = new Uri("https://api-merchant.payos.vn/");
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
        public async Task<bool> HandleWebhookAsync(HttpRequest request)
        {
            request.EnableBuffering();

            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(body))
                return true;

            try
            {
                var webhookData = JsonSerializer.Deserialize<JsonElement>(body);

                // Verify signature
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

                if (receivedSignature != calculatedSignature)
                {
                    // WRONG signature = reject
                    return false;
                }

                long orderCode = webhookData.GetProperty("orderCode").GetInt64();
                string status = webhookData.GetProperty("status").GetString() ?? "";
                string? transactionId = webhookData.TryGetProperty("transactionId", out var transId)
                    ? transId.GetString()
                    : null;

                Payment? payment;

                if ((orderCode % 1_000_000) >= 500_000)
                {
                    // Upgrade payment
                    int userId = (int)(orderCode / 1_000_000);

                    payment = await _db.Payments
                        .Where(p => p.UserId == userId && p.BookingId == null && p.Status == "pending")
                        .OrderByDescending(p => p.Id)
                        .FirstOrDefaultAsync();
                }
                else
                {
                    // Booking payment
                    int bookingId = (int)(orderCode / 1_000_000);

                    payment = await _db.Payments
                        .Where(p => p.BookingId == bookingId && p.Status == "pending")
                        .OrderByDescending(p => p.Id)
                        .FirstOrDefaultAsync();
                }

                if (payment == null)
                    return true;

                payment.Status = status == "PAID" ? "success"
                                : status == "CANCELED" ? "canceled"
                                : "pending";

                if (payment.Status == "success")
                    payment.PaymentDate = DateTime.UtcNow;

                payment.TransactionId = transactionId;
                payment.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return true;
            }
            catch
            {
                // WRONG format = reject
                return false;
            }
        }


        // --------------------------------------
        // 3. TẠO THANH TOÁN UPGRADE
        // --------------------------------------
        public async Task<CreatePaymentResponse> CreateUpgradePaymentAsync(int userId, string upgradeType, decimal amount, string description)
        {
            long amountVND = (long)amount;

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
