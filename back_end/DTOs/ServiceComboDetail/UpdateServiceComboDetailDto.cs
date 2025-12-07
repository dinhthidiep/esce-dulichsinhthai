using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.ServiceComboDetail
{
    public class UpdateServiceComboDetailDto
    {
        [Required]
        public int? ServiceComboId { get; set; }
        public int? ServiceId { get; set; }
        public int? Quantity { get; set; }
    }
}
