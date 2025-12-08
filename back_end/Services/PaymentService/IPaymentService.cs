using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services.PaymentService
{
    public interface IPaymentService
    {
        Task<CreatePaymentResponse> CreatePaymentAsync(Booking booking, decimal amount, string description);
        Task<CreatePaymentResponse> CreateUpgradePaymentAsync(int userId, string upgradeType, decimal amount, string description);
        Task<bool> HandleWebhookAsync(HttpRequest request);
    }
}