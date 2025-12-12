
namespace ESCE_SYSTEM.DTOs
{
    public class BookingDto
    {
        public int Id { get; set; }
        public string BookingNumber { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime BookingDate { get; set; }
        public DateTime? ConfirmedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string ItemType { get; set; } = string.Empty;
        
        // ServiceCombo details
        public ServiceComboInfoDto? ServiceCombo { get; set; }
        
        // Service details (nếu đặt service riêng)
        public ServiceInfoDto? Service { get; set; }
    }

    public class ServiceComboInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Image { get; set; }
    }

    public class ServiceInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Images { get; set; }
    }
}
