using System.Data;
using System.Data.Common;
using System.Text.Json;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ESCE_SYSTEM.Models;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

public class ChatbotService
{
    private readonly HttpClient _httpClient;
    private readonly ESCEContext _context;

    // Cấu hình Ollama - ĐẢM BẢO OLLAMA ĐANG CHẠY CỤC BỘ TẠI ĐỊA CHỈ NÀY
    private const string OllamaApiUrl = "http://localhost:11434/api/generate";
    private const string ModelName = "mistral";

    // [SCHEMA DDL] - CHUỖI MÔ TẢ CSDL CHO AI
    private const string DatabaseSchema = @"
        -- Bảng: ACCOUNTS (Tài khoản người dùng)
        CREATE TABLE ACCOUNTS (ID INT PRIMARY KEY, NAME NVARCHAR(100), ROLE_ID INT, LEVEL INT, TotalSpent DECIMAL(18, 2));
        -- Bảng: SERVICECOMBO (Combo Dịch vụ)
        CREATE TABLE SERVICECOMBO (ID INT PRIMARY KEY, NAME NVARCHAR(255), PRICE DECIMAL(18, 2), ADDRESS NVARCHAR(255), HOST_ID INT, STATUS NVARCHAR(50));
        -- Bảng: BOOKINGS (Đặt dịch vụ)
        CREATE TABLE BOOKINGS (ID INT PRIMARY KEY, USER_ID INT, TOTAL_AMOUNT DECIMAL(18, 2), STATUS NVARCHAR(50), BOOKING_DATE DATETIME, COMBO_ID INT);
        -- Bảng: REVIEWS (Đánh giá)
        CREATE TABLE REVIEWS (ID INT PRIMARY KEY, BOOKING_ID INT, RATING INT, USER_ID INT);
        -- Bảng: COUPONS (Mã ưu đãi)
        CREATE TABLE COUPONS (ID INT PRIMARY KEY, CODE NVARCHAR(50), DISCOUNT_PERCENT DECIMAL(5, 2), EXPIRY_DATE DATETIME, SERVICECOMBO_ID INT, IS_ACTIVE BIT);
        -- Hướng dẫn quan trọng: Dùng N'...' cho giá trị Tiếng Việt.
    ";

    // [FAQ DATA] - Dữ liệu Câu hỏi Thường gặp (Static Knowledge)
    private readonly Dictionary<string, string> FaqData = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        {"khu du lịch tên gì", "Khu du lịch sinh thái của chúng tôi có tên gọi chính thức là [Tên Khu Du Lịch Của Bạn] (Ví dụ: Công viên Sinh thái Bà Nà)."},
        {"địa điểm chính xác", "Khu du lịch nằm tại [Địa chỉ/Tọa độ Chính xác], thuộc Quận [Tên Quận] của thành phố Đà Nẵng."},
        {"làm sao để đến", "Bạn có thể đến khu du lịch bằng taxi, xe bus hoặc xe máy cá nhân. Từ trung tâm thành phố, đi theo đường [Tên Đường Gợi Ý]."},
        {"khoảng cách từ trung tâm", "Khoảng cách từ trung tâm thành phố Đà Nẵng là khoảng 25km, thời gian di chuyển ước tính là 45 phút."},
        {"giá vé vào cổng", "Giá vé vào cổng cho người lớn là 150.000 VNĐ, trẻ em là 80.000 VNĐ (không bao gồm các hoạt động riêng lẻ)."},
        {"giờ mở cửa", "Khu du lịch mở cửa đón khách từ 7:30 sáng đến 5:30 chiều tất cả các ngày trong tuần."},
        {"hoạt động sinh thái nào", "Các hoạt động chính bao gồm: Trekking đường rừng, chèo thuyền kayak trên suối, tham quan vườn bách thảo, và trải nghiệm ẩm thực địa phương."},
        {"có bãi đỗ xe", "Chúng tôi có bãi đỗ xe rộng rãi miễn phí cho cả ô tô và xe máy."},
        {"thời điểm lý tưởng", "Thời điểm lý tưởng nhất để tham quan là mùa khô (tháng 3 đến tháng 8) khi thời tiết nắng đẹp, ít mưa."}
        // Thêm các cặp key/value khác dựa trên danh sách câu hỏi FAQ bạn đã liệt kê
    };

    public ChatbotService(ESCEContext context, IConfiguration configuration)
    {
        _context = context;
        _httpClient = new HttpClient();
    }

    // --- [Hàm Phân loại Ý định] ---
    private bool IsRecommendationQuestion(string question)
    {
        string lowerQuestion = question.ToLowerInvariant();
        return lowerQuestion.Contains("nên làm gì") ||
               lowerQuestion.Contains("cải thiện") ||
               lowerQuestion.Contains("phát triển") ||
               lowerQuestion.Contains("chiến lược");
    }

    // --- [Hàm Phân tích FAQ] ---
    private async Task<string> GetFAQResponse(string question)
    {
        string lowerQuestion = question.ToLowerInvariant();
        // Tìm kiếm câu hỏi trong Static Data
        foreach (var kvp in FaqData)
        {
            // Sử dụng StartsWith hoặc Contains (Contains linh hoạt hơn)
            if (lowerQuestion.Contains(kvp.Key.ToLowerInvariant()))
            {
                return kvp.Value;
            }
        }
        return string.Empty;
    }

    // --- [Hàm Phân tích Chiến lược (Dùng LINQ/EF Core)] ---
    private async Task<string> GenerateBusinessRecommendation(string question)
    {
        var recommendations = new StringBuilder("Dựa trên các chỉ số hoạt động (KPIs), đây là một số đề xuất chiến lược:\n\n");

        // Lấy dữ liệu KPI 1: Rating trung bình thấp nhất
        var lowRatedCombos = await _context.Reviews
            .Include(r => r.Booking)
            .ThenInclude(b => b.ServiceCombo)
            .Where(r => r.Booking != null && r.Booking.ServiceCombo != null && r.Booking.ServiceCombo.Status == "open")
            .GroupBy(r => r.Booking.ServiceCombo.Name)
            .Select(g => new {
                Name = g.Key,
                // SỬA LỖI: Chuyển đổi kết quả Average (thường là double) sang decimal
                AvgRating = (decimal)g.Average(r => r.Rating)
            })
            // SỬA LỖI: So sánh decimal với decimal (sử dụng 3.5M)
            .Where(x => x.AvgRating < 3.5M)
            .OrderBy(x => x.AvgRating)
            .Take(2)
            .ToListAsync();

        if (lowRatedCombos.Any())
        {
            recommendations.AppendLine("## ⚠️ Chất lượng Dịch vụ Cần Cải thiện:");
            foreach (var combo in lowRatedCombos)
            {
                recommendations.AppendLine($"* **{combo.Name}** có điểm trung bình thấp ({combo.AvgRating:F2} sao). **Đề xuất:** Xem xét nâng cấp chất lượng dịch vụ hoặc đào tạo lại Host/Nhân viên.");
            }
            recommendations.AppendLine();
        }
        else
        {
            recommendations.AppendLine("## ✅ Chất lượng Dịch vụ:");
            recommendations.AppendLine("* Tất cả các dịch vụ đang hoạt động đều có điểm đánh giá tốt (trên 3.5 sao).");
        }

        // Lấy dữ liệu KPI 2: Số lượng Coupon/Ưu đãi sắp hết hạn
        // Đảm bảo cột IsActive tồn tại trong Coupon Model của bạn
        var activeCoupons = _context.Coupons.Where(c => c.IsActive == true);
        var expiredCoupons = await activeCoupons
            // SỬA LỖI: So sánh ExpiryDate (DateTime?) với DateTime.Now.AddDays(30)
            .CountAsync(c => c.ExpiryDate.HasValue && c.ExpiryDate.Value < DateTime.Now.AddDays(30));

        recommendations.AppendLine("## 🎯 Chiến lược Ưu đãi & Khuyến mãi:");
        if (expiredCoupons > 5)
        {
            recommendations.AppendLine($"* Có **{expiredCoupons}** Coupon sắp hết hạn trong 30 ngày tới. **Đề xuất:** Tổ chức chiến dịch 'Sử dụng ngay' để tận dụng ưu đãi sắp kết thúc, kích cầu doanh thu ngắn hạn.");
        }
        else
        {
            recommendations.AppendLine("* **Đề xuất:** Cân nhắc tạo thêm **ưu đãi mới** hoặc **gói Combo** để thu hút khách hàng vào tháng tới.");
        }

        return recommendations.ToString();
    }

    // --- [Hàm Gọi AI sinh SQL và Thực thi] ---
    private async Task<string> GenerateSql(string question)
    {
        // Đã sửa đổi Prompt để nhấn mạnh SQL DUY NHẤT và TOP 1
        string systemPrompt = $@"
            Bạn là chuyên gia sinh SQL Server, tên bảng là chữ HOA. Nhiệm vụ của bạn là chuyển đổi câu hỏi Tiếng Việt thành truy vấn SQL Server hợp lệ, chỉ trả về CÂU LỆNH SQL DUY NHẤT.
            CHÚ Ý: Với các câu hỏi 'rẻ nhất' hoặc 'đắt nhất', phải sử dụng 'ORDER BY PRICE ASC/DESC' và 'SELECT TOP 1'.
            Sử dụng N'...' cho các giá trị Tiếng Việt.
            
            Schema: {DatabaseSchema}
            
            Câu hỏi: {question}
        ";

        var ollamaRequest = new { model = ModelName, prompt = systemPrompt, stream = false };

        try
        {
            var jsonContent = JsonSerializer.Serialize(ollamaRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(OllamaApiUrl, content);
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync();
            using (JsonDocument doc = JsonDocument.Parse(responseString))
            {
                var responseText = doc.RootElement.GetProperty("response").GetString();
                // LÀM SẠCH CHUỖI TRIỆT ĐỂ
                return responseText?
                    .Trim()
                    .Replace("```sql", "")
                    .Replace("```", "")
                    .Replace("\n", " ") // Thay thế ký tự dòng mới
                    .Trim() ?? "";
            }
        }
        catch (Exception ex)
        {
            return $"Lỗi kết nối AI: {ex.Message}";
        }
    }

    private async Task<List<Dictionary<string, object>>> ExecuteSqlQuery(string sqlQuery)
    {
        var dataList = new List<Dictionary<string, object>>();

        using (var connection = _context.Database.GetDbConnection())
        {
            await connection.OpenAsync();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = sqlQuery;
                command.CommandType = CommandType.Text;

                using (var reader = await command.ExecuteReaderAsync())
                {
                    var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToList();

                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < columns.Count; i++)
                        {
                            row.Add(columns[i], reader.IsDBNull(i) ? null : reader.GetValue(i));
                        }
                        dataList.Add(row);
                    }
                }
            }
        }
        return dataList;
    }


    // --- [Hàm E] Xử lý Yêu cầu Chatbot chính (Phân luồng) ---
    public async Task<string> GetChatResponse(string question)
    {
        // 1. Phân loại Ý định Chiến lược (Cho Admin)
        if (IsRecommendationQuestion(question))
        {
            return await GenerateBusinessRecommendation(question);
        }

        // 2. Kiểm tra Câu hỏi Thường gặp (FAQ)
        string faqAnswer = await GetFAQResponse(question);
        if (!string.IsNullOrEmpty(faqAnswer))
        {
            return faqAnswer;
        }

        // 3. Xử lý Truy vấn Dữ liệu (AI -> SQL)
        string generatedSql = await GenerateSql(question);

        // 4. Kiểm tra An toàn và Format SQL
        if (string.IsNullOrWhiteSpace(generatedSql) || !generatedSql.ToUpper().TrimStart().StartsWith("SELECT"))
        {
            // Fix: Trả lời rõ ràng hơn khi AI không sinh được SQL
            return "Tôi không thể tạo truy vấn SQL từ câu hỏi của bạn. Vui lòng hỏi lại về giá cả, đánh giá, hoặc thống kê.";
        }

        // 5. Thực thi SQL
        try
        {
            var sqlResult = await ExecuteSqlQuery(generatedSql);

            if (sqlResult.Count == 0) return "Không tìm thấy dữ liệu nào phù hợp với câu hỏi của bạn.";

            // 6. Định dạng Trả lời (Cho các câu hỏi đơn: rẻ nhất, đắt nhất, cao nhất)
            if (sqlResult.Count == 1)
            {
                var row = sqlResult[0];
                if (row.ContainsKey("NAME") && row.ContainsKey("PRICE"))
                {
                    return $"Dịch vụ rẻ nhất tìm được là **{row["NAME"]}** với giá **{row["PRICE"]:N0} VNĐ**.";
                }
                // Logic cho rating
                if (row.ContainsKey("NAME") && row.Keys.Any(k => k.Contains("RATING") || k.Contains("AVG")))
                {
                    var avgKey = row.Keys.First(k => k.Contains("RATING") || k.Contains("AVG"));
                    return $"Dịch vụ được đánh giá cao nhất là **{row["NAME"]}** với điểm trung bình là **{row[avgKey]}**.";
                }
            }

            // Trả về JSON cho danh sách kết quả (phù hợp với thống kê)
            var formattedResult = JsonSerializer.Serialize(sqlResult, new JsonSerializerOptions { WriteIndented = true });
            return $"Tôi đã tìm thấy {sqlResult.Count} kết quả. Chi tiết:\n```json\n{formattedResult}\n```";
        }
        catch (DbException ex)
        {
            return $"Lỗi CSDL khi thực thi. Vui lòng kiểm tra lại câu hỏi. Lỗi: {ex.Message}";
        }
        catch (Exception ex)
        {
            return $"Lỗi hệ thống: {ex.Message}";
        }
    }
}
