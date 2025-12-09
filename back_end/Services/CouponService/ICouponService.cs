using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface ICouponService
    {
        Task<IEnumerable<Coupon>> GetAllAsync();
        Task<Coupon?> GetByIdAsync(int id);
        Task<Coupon?> GetByCodeAsync(string code);
        Task<IEnumerable<Coupon>> GetByHostIdAsync(int hostId);
        Task<IEnumerable<Coupon>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<Coupon>> GetActiveCouponsAsync();
        Task<Coupon> CreateAsync(Coupon coupon);
        Task<Coupon?> UpdateAsync(int id, Coupon coupon);
        Task<bool> DeleteAsync(int id);
        Task<bool> ValidateCouponAsync(string code, int? serviceComboId = null);
        Task<decimal> CalculateDiscountAsync(string code, decimal originalAmount);
        Task<bool> ApplyCouponAsync(int bookingId, string couponCode);
        Task<bool> RemoveCouponAsync(int bookingId, string couponCode);
    }

}