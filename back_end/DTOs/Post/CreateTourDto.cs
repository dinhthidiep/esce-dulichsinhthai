using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateTourDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Image { get; set; }
    }
}