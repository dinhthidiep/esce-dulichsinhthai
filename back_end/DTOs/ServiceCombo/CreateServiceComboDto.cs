// File: ESCE_SYSTEM.DTOs.ServiceCombo/CreateServiceComboDto.cs
using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.ServiceCombo
{
    public class CreateServiceComboDto
    {
        [Required]
        public string Name { get; set; } = null!; // Bắt buộc
        [Required]
        public string Address { get; set; } = null!; // Bắt buộc
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableSlots { get; set; }
        public string Status { get; set; } = "open";
        public int HostId { get; set; }
        public string? Image { get; set; }
        public string? CancellationPolicy { get; set; }
    }
}