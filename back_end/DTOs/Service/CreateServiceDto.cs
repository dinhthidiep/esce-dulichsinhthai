using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.Service
{
    public class CreateServiceDto
    {
        [Required]
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Images { get; set; }
        [Required]
        public int HostId { get; set; }
    }
}
