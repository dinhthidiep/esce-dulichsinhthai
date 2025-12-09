using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Services
{
    public interface IReviewService
    {
        Task<IEnumerable<Review>> GetAllAsync();
        Task<Review?> GetByIdAsync(int id);
        Task<IEnumerable<Review>> GetByBookingIdAsync(int bookingId);
        Task<IEnumerable<Review>> GetByUserIdAsync(int userId);
        Task<Review?> GetByBookingIdAndUserIdAsync(int bookingId, int userId);
        Task<decimal> GetAverageRatingByServiceComboAsync(int serviceComboId);
        Task<decimal> GetAverageRatingByServiceAsync(int serviceId);
        Task<Review> CreateAsync(Review review);
        Task<Review?> UpdateAsync(int id, Review review);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<bool> CanUserReviewAsync(int bookingId, int userId);
    }
}