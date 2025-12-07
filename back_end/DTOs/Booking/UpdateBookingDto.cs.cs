// File: ESCE_SYSTEM.DTOs/UpdateBookingDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs
{
    public class UpdateBookingDto
    {
        // Số lượng (Nếu muốn thay đổi)
        [Range(1, int.MaxValue)]
        public int? Quantity { get; set; }

        // Cập nhật Service/Combo (Nếu muốn thay đổi)
        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }

        // Loại Item (Nếu thay đổi ServiceComboId/ServiceId)
        [MaxLength(50)]
        public string? ItemType { get; set; }

        // Ghi chú
        [MaxLength(1000)]
        public string? Notes { get; set; }

        // Ngày Booking mới
        public DateTime? BookingDate { get; set; }

        // Trạng thái (Ví dụ: từ pending sang canceled/confirmed)
        [MaxLength(50)]
        public string? Status { get; set; }
    }
}