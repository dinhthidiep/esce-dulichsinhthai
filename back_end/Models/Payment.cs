using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Payment
    {
        public int Id { get; set; }
        public int? BookingId { get; set; }  // Nullable để hỗ trợ upgrade payment
        public int? UserId { get; set; }      // User thanh toán (cho upgrade)
        public decimal Amount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? Method { get; set; }
        public string? Status { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? PaymentType { get; set; }  // "Booking", "UpgradeHost", "UpgradeAgency"
        public string? UpgradeType { get; set; }  // "Host" hoặc "Agency" (nếu PaymentType là Upgrade)

        public virtual Booking? Booking { get; set; }
        public virtual Account? User { get; set; }
    }
}
