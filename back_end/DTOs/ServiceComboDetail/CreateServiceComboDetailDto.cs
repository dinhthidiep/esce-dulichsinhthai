using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.ServiceComboDetail
{
    public class CreateServiceComboDetailDto
    {
        [Required]
        public int ServiceComboId { get; set; }
        [Required]
        public int ServiceId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
