using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ESCEContext _context;

        public ReviewService(
            IReviewRepository repository,
            IBookingRepository bookingRepository,
            ESCEContext context)
        {
            _repository = repository;
            _bookingRepository = bookingRepository;
            _context = context;
        }

        public async Task<IEnumerable<Review>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Review?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Review>> GetByBookingIdAsync(int bookingId)
        {
            return await _repository.GetByBookingIdAsync(bookingId);
        }

        public async Task<IEnumerable<Review>> GetByUserIdAsync(int userId)
        {
            return await _repository.GetByUserIdAsync(userId);
        }

        public async Task<Review?> GetByBookingIdAndUserIdAsync(int bookingId, int userId)
        {
            return await _repository.GetByBookingIdAndUserIdAsync(bookingId, userId);
        }

        public async Task<decimal> GetAverageRatingByServiceComboAsync(int serviceComboId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Booking)
                .Where(r => r.Booking.ServiceComboId == serviceComboId && r.Status == "approved")
                .Select(r => r.Rating)
                .ToListAsync();

            if (!reviews.Any()) return 0;

            return (decimal)reviews.Average();
        }

        public async Task<decimal> GetAverageRatingByServiceAsync(int serviceId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Booking)
                .Where(r => r.Booking.ServiceId == serviceId && r.Status == "approved")
                .Select(r => r.Rating)
                .ToListAsync();

            if (!reviews.Any()) return 0;

            return (decimal)reviews.Average();
        }

        public async Task<Review> CreateAsync(Review review)
        {
            // Kiểm tra xem booking có tồn tại không
            var booking = await _bookingRepository.GetByIdAsync(review.BookingId);
            if (booking == null)
            {
                throw new Exception("Booking not found");
            }

            // Kiểm tra xem user có quyền review booking này không
            if (booking.UserId != review.UserId)
            {
                throw new Exception("User can only review their own bookings");
            }

            // Kiểm tra xem booking đã thanh toán và được confirmed chưa
            if (booking.Status != "confirmed" && booking.Status != "completed")
            {
                throw new Exception("Can only review bookings that have been paid (confirmed or completed)");
            }

            // Kiểm tra xem user đã review booking này chưa
            var existingReview = await GetByBookingIdAndUserIdAsync(review.BookingId, review.UserId);
            if (existingReview != null)
            {
                throw new Exception("You have already reviewed this booking");
            }

            review.CreatedDate = DateTime.Now;
            await _repository.CreateAsync(review);
            return review;
        }

        public async Task<Review?> UpdateAsync(int id, Review review)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            // Cho phép sửa bất cứ lúc nào
            existing.Rating = review.Rating;
            existing.Comment = review.Comment;

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

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            existing.Status = status;
            await _repository.UpdateAsync(existing);
            return true;
        }

        public async Task<bool> CanUserReviewAsync(int bookingId, int userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            // Kiểm tra booking thuộc về user
            if (booking.UserId != userId) return false;

            // Kiểm tra booking đã thanh toán chưa (confirmed hoặc completed)
            if (booking.Status != "confirmed" && booking.Status != "completed") return false;

            // Kiểm tra user đã review chưa
            var existingReview = await GetByBookingIdAndUserIdAsync(bookingId, userId);
            if (existingReview != null) return false;

            return true;
        }
    }
}