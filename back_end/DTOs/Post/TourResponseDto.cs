using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class TourResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public int HostId { get; set; }
    }
}