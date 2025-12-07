using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IBookingService
    {
        Task<IEnumerable<Booking>> GetAllAsync();
        Task<Booking?> GetByIdAsync(int id);
        Task<IEnumerable<Booking>> GetByUserIdAsync(int userId);
        Task<IEnumerable<Booking>> GetByServiceComboIdAsync(int serviceComboId);
        Task<IEnumerable<Booking>> GetByServiceIdAsync(int serviceId);
        Task<Booking> CreateAsync(CreateBookingDto bookingDto);
        Task<Booking> UpdateAsync(int bookingId, UpdateBookingDto bookingDto);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<decimal> CalculateTotalAmountAsync(int serviceComboId, int serviceId, int quantity, string itemType);
        Task<decimal> CalculateTotalAmountWithCouponsAsync(int bookingId);
    }
}