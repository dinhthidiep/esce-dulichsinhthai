using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs;

namespace ESCE_SYSTEM.Services
{
    public interface IBookingService
    {
        Task<IEnumerable<Booking>> GetAllAsync();
        Task<Booking?> GetByIdAsync(int id);
        Task<IEnumerable<Booking>> GetByUserIdAsync(int userId);
        // Optimized projection-based fetch for user bookings (reduced includes)
        Task<IEnumerable<Booking>> GetByUserIdOptimizedAsync(int userId);
        Task<IEnumerable<Booking>> GetByServiceComboIdAsync(int ServicecomboId);
        Task<IEnumerable<Booking>> GetByServiceIdAsync(int serviceId);
        Task<Booking> CreateAsync(Booking booking);
        Task<Booking> CreateFromDtoAsync(CreateBookingDto dto);
        Task<Booking?> UpdateAsync(int id, Booking booking);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<decimal> CalculateTotalAmountAsync(int ServicecomboId, int serviceId, int quantity, string itemType);
        Task<decimal> CalculateTotalAmountWithCouponsAsync(int bookingId);
    }
}
