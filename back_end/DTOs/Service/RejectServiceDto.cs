// File: DTOs/Service/RejectServiceDto.cs

namespace ESCE_SYSTEM.DTOs.Service
{
    public class RejectServiceDto
    {
        // ServiceId được lấy từ URL route (ví dụ: api/service/reject/{id})
        // Thay vì sử dụng CertificateId, chúng ta dùng Id của Service
        // public int ServiceId { get; set; } // Tùy chọn, thường dùng từ Route

        public string Comment { get; set; } = null!; // Lý do từ chối
    }
}