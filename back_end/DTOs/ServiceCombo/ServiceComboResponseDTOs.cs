// File: ESCE_SYSTEM.DTOs/ServiceCombo/ServiceComboResponseDto.cs
using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs.ServiceCombo
{
    public class ServiceComboResponseDto
    {
        public int Id { get; set; }

        // FIX LỖI: Đảm bảo Name và Address luôn được trả về
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;

        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableSlots { get; set; }
        public string? Image { get; set; }
        public string Status { get; set; } = null!;
        public string? CancellationPolicy { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Thông tin Host
        public int HostId { get; set; }
        public string? HostName { get; set; } // Thêm thông tin Host nếu cần hiển thị

        // Sử dụng DTO con cho chi tiết dịch vụ
        public ICollection<ServiceComboDetailDto> ServiceComboDetails { get; set; } = new List<ServiceComboDetailDto>();

        // Có thể loại bỏ các Navigation Properties phức tạp khác (Bookings, Coupons, RequestSupports) 
        // để tránh lỗi tham chiếu vòng lặp và làm sạch Response.
    }
}