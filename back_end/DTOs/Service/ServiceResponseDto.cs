// File: DTOs/Service/ServiceResponseDto.cs (Hoàn chỉnh)

using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs.Service
{
    public class ServiceResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int HostId { get; set; }

        // --- TRƯỜNG QUẢN LÝ TRẠNG THÁI (FIX CS0117) ---
        public string? Status { get; set; }
        public string? RejectComment { get; set; }
        public string? ReviewComments { get; set; }
        public string? Images { get; set; }
        public string? HostName { get; set; }
        public DateTime? CreatedAt { get; set; } // <--- BỔ SUNG
        public DateTime? UpdatedAt { get; set; } // <--- BỔ SUNG
    }
}