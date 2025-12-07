// File: Models/Payment.cs

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // Thêm dòng này

namespace ESCE_SYSTEM.Models
{
    public partial class Payment
    {
        public int Id { get; set; }

        public  int? BookingId { get; set; } // Đã sửa: Cho phép null để dùng cho Upgrade payment
        public int? UserId { get; set; } // Đã thêm: Cho Upgrade payment

        [Column(TypeName = "decimal(18,2)")] // BỔ SUNG: Khai báo kiểu cho DB
        public decimal Amount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Method { get; set; }
        public string? Status { get; set; }
        public string? TransactionId { get; set; }
        public  string? PaymentType { get; set; } // Đã thêm: Ví dụ "Booking", "UpgradeHost", "UpgradeAgency"
        public  string? UpgradeType { get; set; } // Đã thêm: Lưu "Host" hoặc "Agency" cho Upgrade

        // Foreign Key (chỉnh sửa theo nullable)
        public virtual Booking? Booking { get; set; } // Đã sửa: Cho phép null
        public virtual Account? User { get; set; } // Đã thêm (cần đảm bảo ESCEContext có DbSet<Account>)
    }
}