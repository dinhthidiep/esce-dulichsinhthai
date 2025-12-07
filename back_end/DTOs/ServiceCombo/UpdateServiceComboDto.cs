using System;
using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs.ServiceCombo
{
    public class UpdateServiceComboDto
    {
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; } // Sửa lỗi CS0266 khi gán
        public int? AvailableSlots { get; set; } // Sửa lỗi CS0266 khi gán
        public string? Image { get; set; }
        public string? Status { get; set; }
        public string? CancellationPolicy { get; set; }
        public int? HostId { get; set; } // Bổ sung để cho phép cập nhật HostId
    }
}