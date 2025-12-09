using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class CouponRepository : ICouponRepository
    {
        private readonly ESCEContext _context;

        public CouponRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Coupon>> GetAllAsync()
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .ToListAsync();
        }

        public async Task<Coupon?> GetByIdAsync(int id)
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Coupon?> GetByCodeAsync(string code)
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .FirstOrDefaultAsync(c => c.Code == code);
        }

        public async Task<IEnumerable<Coupon>> GetByHostIdAsync(int hostId)
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .Where(c => c.HostId == hostId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Coupon>> GetByServiceComboIdAsync(int serviceComboId)
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .Where(c => c.ServiceComboId == serviceComboId || c.ServiceComboId == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Coupon>> GetActiveCouponsAsync()
        {
            return await _context.Coupons
                .Include(c => c.Host)
                .Include(c => c.ServiceCombo)
                .Where(c => c.IsActive.HasValue && c.IsActive.Value && (c.ExpiryDate == null || c.ExpiryDate > DateTime.Now))
                .ToListAsync();
        }

        public async Task CreateAsync(Coupon coupon)
        {
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Coupon coupon)
        {
            _context.Coupons.Update(coupon);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon != null)
            {
                _context.Coupons.Remove(coupon);
                await _context.SaveChangesAsync();
            }
        }
    }





}