
namespace ESCE_SYSTEM.DTOs
{
    public class BookingDto
    {
        public int Id { get; set; }
        public string BookingNumber { get; set; }
        public int UserId { get; set; }
        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime BookingDate { get; set; }
    }
}
