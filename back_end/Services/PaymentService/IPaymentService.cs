using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services.PaymentService
{
    public class CreatePaymentResponse
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
    }

    public interface IPaymentService
    {
        Task<CreatePaymentResponse> CreatePaymentAsync(Booking booking, decimal amount, string description);
        Task<bool> HandleWebhookAsync(HttpRequest request);
    }
}