using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; 

namespace ESCE_SYSTEM.Models
{
    public partial class Payment
    {
        public int Id { get; set; }

        public  int? BookingId { get; set; } 
        public int? UserId { get; set; } 

        [Column(TypeName = "decimal(18,2)")] 
        public decimal Amount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Method { get; set; }
        public string? Status { get; set; }
        public string? TransactionId { get; set; }
        public string? PaymentType { get; set; }
        public  string? UpgradeType { get; set; }
        public long? OrderCode { get; set; } // OrderCode từ PayOS để tìm payment chính xác

        public virtual Booking? Booking { get; set; } 
        public virtual Account? User { get; set; } 
    }
}
