using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;

namespace ESCE_SYSTEM.Services
{
    public class CouponService : ICouponService
    {
        private readonly ICouponRepository _repository;
        private readonly IBookingRepository _bookingRepository;

        public CouponService(ICouponRepository repository, IBookingRepository bookingRepository)
        {
            _repository = repository;
            _bookingRepository = bookingRepository;
        }

        public async Task<IEnumerable<Coupon>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Coupon?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<Coupon?> GetByCodeAsync(string code)
        {
            return await _repository.GetByCodeAsync(code);
        }

        public async Task<IEnumerable<Coupon>> GetByHostIdAsync(int hostId)
        {
            return await _repository.GetByHostIdAsync(hostId);
        }

        public async Task<IEnumerable<Coupon>> GetByServiceComboIdAsync(int ServicecomboId)
        {
            return await _repository.GetByServiceComboIdAsync(ServicecomboId);
        }

        public async Task<IEnumerable<Coupon>> GetActiveCouponsAsync()
        {
            return await _repository.GetActiveCouponsAsync();
        }

        public async Task<Coupon> CreateAsync(Coupon coupon)
        {
            await _repository.CreateAsync(coupon);
            return coupon;
        }

        public async Task<Coupon?> UpdateAsync(int id, Coupon coupon)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Code = coupon.Code;
            existing.Description = coupon.Description;
            existing.DiscountPercent = coupon.DiscountPercent;
            existing.DiscountAmount = coupon.DiscountAmount;
            existing.UsageLimit = coupon.UsageLimit;
            existing.ServiceComboId = coupon.ServiceComboId;
            existing.IsActive = coupon.IsActive;
            existing.ExpiryDate = coupon.ExpiryDate;
            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> ValidateCouponAsync(string code, int? ServicecomboId = null)
        {
            var coupon = await _repository.GetByCodeAsync(code);
            if (coupon == null) return false;

            // Ki?m tra coupon có active không
            if (!coupon.IsActive.HasValue || !coupon.IsActive.Value) return false;

            // Ki?m tra h?n s? d?ng
            if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate < DateTime.Now) return false;

            // Ki?m tra gi?i h?n s? d?ng
            if (coupon.UsageCount >= coupon.UsageLimit) return false;

            // Ki?m tra coupon có áp d?ng cho combo c? th? không
            if (coupon.ServiceComboId.HasValue && coupon.ServiceComboId != ServicecomboId) return false;

            return true;
        }

        public async Task<decimal> CalculateDiscountAsync(string code, decimal originalAmount)
        {
            var coupon = await _repository.GetByCodeAsync(code);
            if (coupon == null) return 0;

            if (!await ValidateCouponAsync(code)) return 0;

            decimal discount = 0;

            if (coupon.DiscountPercent.HasValue)
            {
                discount = originalAmount * (coupon.DiscountPercent.Value / 100);
            }
            else if (coupon.DiscountAmount.HasValue)
            {
                discount = coupon.DiscountAmount.Value;
            }

            // Ð?m b?o discount không vu?t quá original amount
            return Math.Min(discount, originalAmount);
        }

        public async Task<bool> ApplyCouponAsync(int bookingId, string couponCode)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            var coupon = await _repository.GetByCodeAsync(couponCode);
            if (coupon == null) return false;

            // Ki?m tra coupon dã du?c áp d?ng chua
            var existingBookingCoupon = booking.BookingCoupons.FirstOrDefault(bc => bc.CouponId == coupon.Id);
            if (existingBookingCoupon != null) return false;

            // Validate coupon
            if (!await ValidateCouponAsync(couponCode, booking.ServiceComboId)) return false;

            // T?o BookingCoupon
            var bookingCoupon = new BookingCoupon
            {
                BookingId = bookingId,
                CouponId = coupon.Id,
                AppliedAt = DateTime.Now
            };

            // C?p nh?t usage count
            coupon.UsageCount++;
            await _repository.UpdateAsync(coupon);

            // Thêm vào booking (c?n c?p nh?t context)
            booking.BookingCoupons.Add(bookingCoupon);
            await _bookingRepository.UpdateAsync(booking);

            return true;
        }

        public async Task<bool> RemoveCouponAsync(int bookingId, string couponCode)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            var coupon = await _repository.GetByCodeAsync(couponCode);
            if (coupon == null) return false;

            var bookingCoupon = booking.BookingCoupons.FirstOrDefault(bc => bc.CouponId == coupon.Id);
            if (bookingCoupon == null) return false;

            // Gi?m usage count
            coupon.UsageCount--;
            await _repository.UpdateAsync(coupon);

            // Xóa BookingCoupon
            booking.BookingCoupons.Remove(bookingCoupon);
            await _bookingRepository.UpdateAsync(booking);

            return true;
        }
    }
}
