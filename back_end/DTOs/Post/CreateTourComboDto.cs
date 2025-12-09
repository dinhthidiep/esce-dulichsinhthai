using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateTourComboDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableSlots { get; set; }
        public string? Image { get; set; }
        public string? Status { get; set; } = "open";
        public string? CancellationPolicy { get; set; }
        public List<TourComboDetailDto> TourDetails { get; set; } = new List<TourComboDetailDto>();
    }

    public class TourComboDetailDto
    {
        public int ServiceId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}