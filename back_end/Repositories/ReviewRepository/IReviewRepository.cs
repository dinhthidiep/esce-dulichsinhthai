using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Repositories
{
    public interface IReviewRepository
    {
        Task<IEnumerable<Review>> GetAllAsync();
        Task<Review?> GetByIdAsync(int id);
        Task<IEnumerable<Review>> GetByBookingIdAsync(int bookingId);
        Task<IEnumerable<Review>> GetByUserIdAsync(int userId);
        Task<Review?> GetByBookingIdAndUserIdAsync(int bookingId, int userId);
        Task<IEnumerable<Review>> GetByRatingAsync(int rating);
        Task<IEnumerable<Review>> GetByStatusAsync(string status);
        Task CreateAsync(Review review);
        Task UpdateAsync(Review review);
        Task DeleteAsync(int id);
    }
}