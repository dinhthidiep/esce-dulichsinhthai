using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface ICouponRepository
    {
        Task<IEnumerable<Coupon>> GetAllAsync();
        Task<Coupon?> GetByIdAsync(int id);
        Task<Coupon?> GetByCodeAsync(string code);
        Task<IEnumerable<Coupon>> GetByHostIdAsync(int hostId);
        Task<IEnumerable<Coupon>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<Coupon>> GetActiveCouponsAsync();
        Task CreateAsync(Coupon coupon);
        Task UpdateAsync(Coupon coupon);
        Task DeleteAsync(int id);
    }
}