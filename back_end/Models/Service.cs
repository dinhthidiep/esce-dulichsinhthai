// File: Models/Service.cs (Đã chỉnh sửa)
using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Service
    {
        public Service()
        {
            ServiceComboDetails = new HashSet<ServiceComboDetail>();
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int HostId { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Images { get; set; }
        // --- BỔ SUNG TRƯỜNG QUẢN LÝ TRẠNG THÁI ---
        public string? Status { get; set; } // Ví dụ: Pending, Approved, Rejected, Review
        public string? RejectComment { get; set; }
        public string? ReviewComments { get; set; } // Dùng JSON string để lưu trữ danh sách các bình luận Review

        public virtual Account Host { get; set; } = null!;
        public virtual ICollection<ServiceComboDetail> ServiceComboDetails { get; set; }
    }
}