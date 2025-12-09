namespace ESCE_SYSTEM.Services.PaymentService
{
    public class CreatePaymentResponse
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
    }
}