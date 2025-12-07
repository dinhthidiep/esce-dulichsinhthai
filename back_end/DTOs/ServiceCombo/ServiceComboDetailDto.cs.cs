// File: ESCE_SYSTEM.DTOs/ServiceCombo/ServiceComboDetailDto.cs
using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs.ServiceCombo
{
    public class ServiceComboDetailDto
    {
        public int Id { get; set; }

        // Thông tin dịch vụ con (chỉ cần các trường cơ bản)
        public int ServiceId { get; set; }
        public string ServiceName { get; set; } = null!;
        public decimal ServicePrice { get; set; }
        public string? ServiceDescription { get; set; }

        public int Quantity { get; set; }
    }
}