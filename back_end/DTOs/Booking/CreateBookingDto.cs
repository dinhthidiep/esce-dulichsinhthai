// File: ESCE_SYSTEM.DTOs/CreateBookingDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs
{
    public class CreateBookingDto
    {
        // Chỉ cần ID của người dùng (UserId)
        [Required]
        public int UserId { get; set; }

        // Chỉ cần ID của Service/Combo
        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; } = 1;

        [Required]
        [MaxLength(50)]
        // Dùng ItemType để xác định Booking là Service hay Combo
        public string ItemType { get; set; } = string.Empty;

        public string? Notes { get; set; }

        [Required]
        public DateTime BookingDate { get; set; } = DateTime.Now;

        // Bỏ qua: BookingNumber, UnitPrice, TotalAmount, Status, CreatedAt/UpdatedAt, và các Navigation Properties
    }
}