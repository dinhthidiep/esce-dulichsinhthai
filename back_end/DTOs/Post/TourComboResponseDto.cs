using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class TourComboResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableSlots { get; set; }
        public string? Image { get; set; }
        public string? Status { get; set; }
        public string? CancellationPolicy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int HostId { get; set; }
        public List<TourComboDetailDto> TourDetails { get; set; } = new List<TourComboDetailDto>();
    }
}