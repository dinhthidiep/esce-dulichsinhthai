using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs
{
    public class CreateBookingDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc.")]
        public int UserId { get; set; }

        public int? ServiceComboId { get; set; }
        
        public int? ServiceId { get; set; }

        [Required(ErrorMessage = "Quantity là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0.")]
        public int Quantity { get; set; } = 1;

        [Required(ErrorMessage = "ItemType là bắt buộc.")]
        public string ItemType { get; set; } = string.Empty; // "combo" hoặc "service"

        [MaxLength(1000, ErrorMessage = "Notes không được vượt quá 1000 ký tự.")]
        public string? Notes { get; set; }

        public DateTime? BookingDate { get; set; }
    }
}

