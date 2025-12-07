namespace ESCE_SYSTEM.DTOs
{
    public class PaymentDto
    {
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class UpgradePaymentDto
    {
        public int UserId { get; set; }
        public string UpgradeType { get; set; } = string.Empty; // "Host" hoặc "Agency"
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}