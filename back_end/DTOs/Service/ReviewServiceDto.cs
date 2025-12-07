// File: DTOs/Service/ReviewServiceDto.cs

namespace ESCE_SYSTEM.DTOs.Service
{
    public class ReviewServiceDto
    {
        // ServiceId được lấy từ URL route (ví dụ: api/service/review/{id})
        // public int ServiceId { get; set; } // Tùy chọn, thường dùng từ Route

        public string Comment { get; set; } = null!; // Nội dung yêu cầu xem xét
    }
}