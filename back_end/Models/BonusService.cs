using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace ESCE_SYSTEM.Models
{
    public partial class BonusService
    {
        public BonusService()
        {
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; } // Giá gốc (chỉ để hiển thị, không tính vào tổng tiền)
        public int HostId { get; set; }
        public int? ServiceId { get; set; } // Nếu có ServiceId: dùng Service đã có, nếu null: dịch vụ tự tạo
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Image { get; set; }
        public string? Status { get; set; } = "active";
        
        // Target audience - JSON string lưu thông tin hạng người dùng được sử dụng
        // Format: {"forAgency":true,"agencyLevels":{"level1":true,"level2":false,"level3":false},"forTourist":true,"touristLevels":{"level1":true,"level2":false,"level3":false}}
        [Column("TARGET_AUDIENCE")]
        public string? TargetAudience { get; set; }

        public virtual Account Host { get; set; } = null!;
        public virtual Service? Service { get; set; }
    }
}

